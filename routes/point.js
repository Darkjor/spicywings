// Endpoints del punto de venta en tablet: crear el cobro (lo manda a la
// terminal Point automáticamente), consultar su estado (para el polling del
// frontend) y simularlo en modo dev/mock. Ver lib/mercadopago.js para el
// detalle de cómo se decide entre API real y modo simulado.
const express = require('express');
const rateLimit = require('express-rate-limit');
const mpClient = require('../lib/mercadopago');
const pointOrdersStore = require('../store/pointOrders');

const router = express.Router();

const pointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Demasiadas solicitudes de cobro desde esta IP. Por favor intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

const ALLOWED_SIMULATE_STATUSES = ['processed', 'failed', 'canceled', 'refunded', 'action_required'];

router.post('/orders', pointLimiter, async (req, res) => {
  try {
    const { amount, description, externalReference } = req.body;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 50000) {
      return res.status(400).json({ error: 'Monto inválido' });
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Descripción inválida' });
    }
    if (!externalReference || typeof externalReference !== 'string') {
      return res.status(400).json({ error: 'Referencia externa inválida' });
    }

    const mpOrder = await mpClient.createPointOrder({
      amount: numericAmount,
      description: description || 'Pedido',
      externalReference
    });

    // Guardamos un registro local solo como bitácora — el id que manda el
    // cliente para consultar/simular es directamente el de Mercado Pago,
    // así el estado no depende de memoria compartida entre invocaciones
    // serverless (Vercel no garantiza que el mismo proceso atienda el GET).
    pointOrdersStore.createOrder({
      mpOrderId: mpOrder.id,
      externalReference,
      amount: numericAmount,
      description: description || '',
      status: mpOrder.status || 'created'
    });

    res.status(201).json({
      id: mpOrder.id,
      mp_order_id: mpOrder.id,
      external_reference: externalReference,
      amount: numericAmount,
      description: description || '',
      status: mpOrder.status || 'created',
      simulate_available: !mpClient.isConfigured()
    });
  } catch (error) {
    console.error('Error al crear orden Point:', error);
    res.status(502).json({ error: 'No se pudo crear el cobro en Mercado Pago: ' + error.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const mpOrder = await mpClient.getOrder(req.params.id);

    const record = pointOrdersStore.findByMpOrderId(req.params.id);
    if (record && mpOrder.status && mpOrder.status !== record.status) {
      pointOrdersStore.updateOrderStatus(record.id, mpOrder.status);
    }

    const payment = mpOrder.transactions && mpOrder.transactions.payments && mpOrder.transactions.payments[0];

    res.json({
      id: mpOrder.id,
      mp_order_id: mpOrder.id,
      external_reference: mpOrder.external_reference,
      amount: payment ? Number(payment.amount) : (record ? record.amount : null),
      description: mpOrder.description || (record ? record.description : ''),
      status: mpOrder.status,
      simulate_available: !mpClient.isConfigured()
    });
  } catch (error) {
    console.error('Error al consultar orden Point:', error);
    res.status(404).json({ error: 'No se pudo consultar el estado del cobro: ' + error.message });
  }
});

// Solo disponible en modo mock (sin credenciales reales de Mercado Pago
// configuradas): fuerza el estado final de la orden para poder ver la demo
// completa sin terminal física. En cuanto hay credenciales reales, se asume
// que hay una terminal física real esperando el cobro y esto se bloquea.
router.post('/orders/:id/simulate', async (req, res) => {
  if (process.env.NODE_ENV === 'production' || mpClient.isConfigured()) {
    return res.status(403).json({ error: 'La simulación no está disponible: hay una terminal Point real configurada' });
  }

  try {
    const { status, paymentMethodId } = req.body;
    if (!ALLOWED_SIMULATE_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Usa uno de: ${ALLOWED_SIMULATE_STATUSES.join(', ')}` });
    }

    await mpClient.simulateOrderEvent(req.params.id, {
      status,
      paymentMethodId: paymentMethodId || 'visa'
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Error al simular evento Point:', error);
    res.status(502).json({ error: 'No se pudo simular el evento: ' + error.message });
  }
});

module.exports = router;
