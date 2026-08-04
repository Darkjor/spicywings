const crypto = require('crypto');

// Persistencia in-memory para la tabla `point_orders` de la demo.
// id interno | mp_order_id | external_reference | amount | status | created_at
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
