// Panel de administración: GET /admin sirve la página (admin.html + js/admin.js,
// mismo patrón que point-demo.html + js/point-demo.js) y GET /admin/api/sales-today
// expone el reporte de ventas del día. Todo lo que cuelga de /admin ya llega
// protegido por middleware/adminAuth.js (montado en server.js antes de este
// router) — este archivo no vuelve a chequear credenciales.
const express = require('express');
const path = require('path');
const mpClient = require('../lib/mercadopago');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

router.get('/api/sales-today', async (req, res) => {
  try {
    const now = new Date();
    // "Hoy" en la zona horaria del servidor — no hace falta manejar
    // timezones del cliente (ver AGENTS.md, alcance actual).
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const orders = await mpClient.searchOrders({
      beginDate: startOfDay.toISOString(),
      endDate: now.toISOString()
    });

    const processedOrders = (orders || []).filter(order => order.status === 'processed');

    const salesOrders = processedOrders.map(order => {
      const payment = order.transactions && order.transactions.payments && order.transactions.payments[0];
      const amount = payment ? Number(payment.amount) : 0;
      return {
        id: order.id,
        external_reference: order.external_reference || order.id,
        amount,
        date_created: order.date_created || null
      };
    });

    const total = salesOrders.reduce((sum, order) => sum + (Number.isFinite(order.amount) ? order.amount : 0), 0);

    res.json({
      total,
      count: salesOrders.length,
      orders: salesOrders
    });
  } catch (error) {
    console.error('Error al generar el reporte de ventas del día:', error);
    res.status(502).json({ error: 'No se pudo generar el reporte de ventas: ' + error.message });
  }
});

module.exports = router;
