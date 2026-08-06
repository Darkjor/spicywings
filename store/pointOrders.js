const crypto = require('crypto');

// Persistencia in-memory para la tabla `point_orders` de la demo.
// id interno | mp_order_id | external_reference | amount | status | created_at
//
// LIMITACIÓN IMPORTANTE: en Vercel (serverless) cada invocación puede caer
// en una instancia distinta, y este Map se reinicia vacío en cada una — no
// hay garantía de que un GET posterior vea lo que escribió el POST que creó
// la order. Por eso routes/point.js y routes/receipt.js NUNCA dependen de
// este store para leer el estado real: siempre consultan directo la API de
// Mercado Pago (fuente de verdad). Este store es solo un best-effort/bitácora
// que funciona bien en local (un solo proceso) y a veces en Vercel si la
// misma instancia atiende varias requests seguidas. Si en algún momento se
// necesita persistencia real (reportes, historial confiable), hay que
// reemplazar esto por una base de datos de verdad (Postgres, Supabase, etc.).
const orders = new Map();

function createOrder({ mpOrderId, externalReference, amount, description, status }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = {
    id,
    mp_order_id: mpOrderId,
    external_reference: externalReference,
    amount,
    description: description || '',
    status,
    created_at: now,
    updated_at: now
  };
  orders.set(id, record);
  return record;
}

function getOrder(id) {
  return orders.get(id) || null;
}

function updateOrderStatus(id, status) {
  const record = orders.get(id);
  if (!record) return null;
  record.status = status;
  record.updated_at = new Date().toISOString();
  return record;
}

function findByMpOrderId(mpOrderId) {
  for (const record of orders.values()) {
    if (record.mp_order_id === mpOrderId) {
      return record;
    }
  }
  return null;
}

module.exports = { createOrder, getOrder, updateOrderStatus, findByMpOrderId };
