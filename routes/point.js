const express = require('express');
const rateLimit = require('express-rate-limit');
const mpClient = require('../lib/mercadopago');
const pointOrdersStore = require('../store/pointOrders');

const router = express.Router();

// Limitador propio para no compartir el contador con /api/create-checkout-session (Stripe)
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
      description: description || 'Pedido Spicy Wings',
      externalReference
    });

    const record = pointOrdersStore.createOrder({
      mpOrderId: mpOrder.id,
      externalReference,
      amount: numericAmount,
      description: description || '',
      status: mpOrder.status || 'created'
    });

    res.status(201).json({ ...record, simulate_available: !mpClient.isConfigured() });
  } catch (error) {
    console.error('Error al crear orden Point:', error);
    res.status(502).json({ error: 'No se pudo crear el cobro en Mercado Pago: ' + error.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const record = pointOrdersStore.getOrder(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const mpOrder = await mpClient.getOrder(record.mp_order_id);
    if (mpOrder && mpOrder.status && mpOrder.status !== record.status) {
      pointOrdersStore.updateOrderStatus(record.id, mpOrder.status);
    }

    res.json({ ...pointOrdersStore.getOrder(req.params.id), simulate_available: !mpClient.isConfigured() });
  } catch (error) {
    console.error('Error al consultar orden Point:', error);
    res.status(502).json({ error: 'No se pudo consultar el estado del cobro: ' + error.message });
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
    const record = pointOrdersStore.getOrder(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const { status, paymentMethodId } = req.body;
    if (!ALLOWED_SIMULATE_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Usa uno de: ${ALLOWED_SIMULATE_STATUSES.join(', ')}` });
    }

    await mpClient.simulateOrderEvent(record.mp_order_id, {
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
