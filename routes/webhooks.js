const express = require('express');
const mpClient = require('../lib/mercadopago');
const pointOrdersStore = require('../store/pointOrders');

const router = express.Router();

router.post('/mercadopago', async (req, res) => {
  try {
    const xSignature = req.header('x-signature');
    const xRequestId = req.header('x-request-id');
    const dataId = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);

    if (!xSignature || !xRequestId || !dataId) {
      return res.status(400).json({ error: 'Encabezados o datos de notificación incompletos' });
    }

    const isValid = mpClient.verifyWebhookSignature({
      xSignature,
      xRequestId,
      dataId: String(dataId)
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    const record = pointOrdersStore.findByMpOrderId(String(dataId));
    if (record) {
      const mpOrder = await mpClient.getOrder(record.mp_order_id);
      if (mpOrder && mpOrder.status) {
        pointOrdersStore.updateOrderStatus(record.id, mpOrder.status);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error);
    res.status(500).json({ error: 'Error interno procesando la notificación' });
  }
});

module.exports = router;
