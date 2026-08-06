// Cliente de la Orders API de Mercado Pago para cobros con terminal Point.
// Cada función real (createPointOrder/getOrder/simulateOrderEvent) tiene su
// contraparte mock*, y decide cuál usar según isConfigured(). El resto del
// código (routes/point.js, routes/receipt.js) no necesita saber si está en
// modo real o simulado — siempre llama a las mismas funciones exportadas.
const crypto = require('crypto');

const MP_API_BASE = 'https://api.mercadopago.com';

// Modo mock: se activa automáticamente si no hay credenciales de Mercado Pago
// configuradas, para poder ver la demo funcionando de punta a punta sin
// depender de una cuenta/terminal real. Con MP_ACCESS_TOKEN y MP_TERMINAL_ID
// configurados (credenciales de prueba TEST-...), se usa la API real.
function isConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.MP_TERMINAL_ID);
}

const mockOrders = new Map();

function mockCreateOrder({ amount, description, externalReference }) {
  const id = `mock-${crypto.randomUUID()}`;
  const order = {
    id,
    type: 'point',
    status: 'created',
    external_reference: externalReference,
    description: description || '',
    date_created: new Date().toISOString(),
    transactions: { payments: [{ amount: Number(amount).toFixed(2) }] }
  };
  mockOrders.set(id, order);

  // Simula que la terminal virtual recibe el cobro tras un instante
  setTimeout(() => {
    const stored = mockOrders.get(id);
    if (stored && stored.status === 'created') {
      stored.status = 'at_terminal';
    }
  }, 1200);

  return Promise.resolve(order);
}

function mockGetOrder(id) {
  const order = mockOrders.get(id);
  if (!order) {
    return Promise.reject(new Error(`Orden simulada ${id} no encontrada`));
  }
  return Promise.resolve(order);
}

function mockSimulateEvent(id, { status }) {
  const order = mockOrders.get(id);
  if (!order) {
    return Promise.reject(new Error(`Orden simulada ${id} no encontrada`));
  }
  // Reproduce el paso por "at_terminal" antes del estado final, como la API real
  order.status = 'at_terminal';
  setTimeout(() => {
    order.status = status;
  }, 1500);
  return Promise.resolve({ ok: true });
}

// Usa el mismo Map `mockOrders` que ya llenan mockCreateOrder/mockSimulateEvent
// — no hay una "base de datos" separada para el reporte, es la misma bitácora
// en memoria del proceso mock. Filtra por fecha si se puede (date_created);
// si una order mock no la tiene por lo que sea, se incluye igual — esto es
// solo para ver la demo del panel de admin funcionando, no necesita ser
// perfecto (ver mismo criterio que el resto del modo mock del archivo).
function mockSearchOrders({ beginDate, endDate }) {
  const all = Array.from(mockOrders.values());

  const begin = beginDate ? new Date(beginDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (!begin || !end || Number.isNaN(begin.getTime()) || Number.isNaN(end.getTime())) {
    return Promise.resolve(all);
  }

  const filtered = all.filter(order => {
    if (!order.date_created) return true;
    const created = new Date(order.date_created);
    if (Number.isNaN(created.getTime())) return true;
    return created >= begin && created <= end;
  });
  return Promise.resolve(filtered);
}

async function createPointOrder({ amount, description, externalReference }) {
  if (!isConfigured()) {
    return mockCreateOrder({ amount, description, externalReference });
  }

  const response = await fetch(`${MP_API_BASE}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'X-Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({
      type: 'point',
      external_reference: externalReference,
      description,
      transactions: { payments: [{ amount: Number(amount).toFixed(2) }] },
      config: {
        point: {
          terminal_id: process.env.MP_TERMINAL_ID,
          print_on_terminal: 'no_ticket'
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Mercado Pago respondió ${response.status}`);
  }
  return data;
}

async function getOrder(orderId) {
  if (!isConfigured() || orderId.startsWith('mock-')) {
    return mockGetOrder(orderId);
  }

  const response = await fetch(`${MP_API_BASE}/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Mercado Pago respondió ${response.status}`);
  }
  return data;
}

async function simulateOrderEvent(orderId, { status, paymentMethodId }) {
  if (!isConfigured() || orderId.startsWith('mock-')) {
    return mockSimulateEvent(orderId, { status, paymentMethodId });
  }

  const response = await fetch(`${MP_API_BASE}/v1/orders/${orderId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      status,
      payment_method_id: paymentMethodId || 'visa'
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Mercado Pago respondió ${response.status}`);
  }
  return { ok: true };
}

// Busca orders del punto de venta (type=point) creadas dentro de un rango de
// fechas — usado por el panel de admin para el reporte de ventas del día.
// beginDate/endDate en formato RFC 3339 (ej. "2026-08-06T00:00:00.000Z").
//
// GET /v1/orders?begin_date={beginDate}&end_date={endDate}&type=point
//
// La documentación pública de este endpoint no deja 100% claro el nombre de
// la key del array paginado en la respuesta (los endpoints de Mercado Pago
// no son consistentes entre sí: unos usan "results", otros "elements"). No
// se pudo confirmar con una llamada real sin credenciales — por eso el
// parseo abajo acepta ambas variantes, más un fallback si la respuesta ya
// viniera como array plano, para que esto no rompa silenciosamente si la
// forma real difiere de lo asumido.
async function searchOrders({ beginDate, endDate }) {
  if (!isConfigured()) {
    return mockSearchOrders({ beginDate, endDate });
  }

  const params = new URLSearchParams({
    begin_date: beginDate,
    end_date: endDate,
    type: 'point'
  });

  const response = await fetch(`${MP_API_BASE}/v1/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Mercado Pago respondió ${response.status}`);
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.elements)) return data.elements;
  return [];
}

// Valida la firma del webhook de Mercado Pago.
// manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};"
// hash esperado = HMAC-SHA256(manifest, MP_WEBHOOK_SECRET) comparado contra v1
function verifyWebhookSignature({ xSignature, xRequestId, dataId }) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !xSignature || !xRequestId || !dataId) {
    return false;
  }

  const parts = {};
  xSignature.split(',').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      parts[key.trim()] = value.trim();
    }
  });

  const { ts, v1: receivedHash } = parts;
  if (!ts || !receivedHash) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const computedBuffer = Buffer.from(computedHash);
  const receivedBuffer = Buffer.from(receivedHash);
  if (computedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(computedBuffer, receivedBuffer);
}

module.exports = {
  isConfigured,
  createPointOrder,
  getOrder,
  simulateOrderEvent,
  searchOrders,
  verifyWebhookSignature
};
