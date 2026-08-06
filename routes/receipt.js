const express = require('express');
const path = require('path');
const fs = require('fs');
const mpClient = require('../lib/mercadopago');

const router = express.Router();

function loadBusinessConfig() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'business.json'), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return { name: 'Tu Negocio', logoAccent: 'TU', logoRest: 'NEGOCIO', currency: 'MXN', locale: 'es-MX' };
  }
}

// Formato de moneda: usa el Intl nativo de Node (sin dependencias) con el
// currency/locale de data/business.json. Esto SOLO controla cómo se
// muestra el número (símbolo, separadores, decimales) — NO es traducción
// de textos de la interfaz, que siguen fijos en español.
function formatCurrency(amount, business) {
  const currency = (business && business.currency) || 'MXN';
  const locale = (business && business.locale) || 'es-MX';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STATUS_LABELS = {
  processed: 'Pagado',
  failed: 'Pago fallido',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
  action_required: 'Acción requerida',
  at_terminal: 'En terminal',
  created: 'Creado'
};

function formatDate(isoString) {
  if (!isoString) return new Date().toLocaleString('es-MX');
  try {
    return new Date(isoString).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch (error) {
    return isoString;
  }
}

router.get('/:id', async (req, res) => {
  try {
    const business = loadBusinessConfig();
    const mpOrder = await mpClient.getOrder(req.params.id);
    const payment = mpOrder.transactions && mpOrder.transactions.payments && mpOrder.transactions.payments[0];
    const amount = payment ? formatCurrency(Number(payment.amount), business) : '—';
    const items = (mpOrder.description || `Pedido ${business.name}`)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket - ${escapeHtml(business.name)}</title>
  <link rel="stylesheet" href="/css/variables.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--color-bg);
      color: var(--color-text-primary);
      font-family: var(--font-body);
      display: flex;
      justify-content: center;
      padding: 32px 16px;
    }
    .ticket {
      width: 100%;
      max-width: 380px;
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-md);
      border-radius: var(--radius-md);
      padding: 28px 24px;
    }
    .ticket h1 {
      font-family: var(--font-titles);
      font-size: 20px;
      text-align: center;
      margin-bottom: 4px;
    }
    .ticket h1 span { color: var(--color-primary); }
    .ticket .sub {
      text-align: center;
      color: var(--color-text-secondary);
      font-size: 12px;
      margin-bottom: 20px;
    }
    .ticket .status {
      display: inline-block;
      background-color: rgba(76, 175, 80, 0.15);
      color: #4caf50;
      font-size: 12px;
      font-weight: bold;
      padding: 4px 10px;
      border-radius: 20px;
      margin: 0 auto 20px;
      display: block;
      width: fit-content;
    }
    .divider {
      border-top: 1px dashed var(--color-border);
      margin: 16px 0;
    }
    .items { font-size: 14px; color: var(--color-text-primary); line-height: 1.8; }
    .row { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }
    .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 16px; }
    .total-row span:last-child { color: var(--color-primary); }
    .footer { text-align: center; color: var(--color-text-muted); font-size: 11px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="ticket">
    <h1><span>${escapeHtml(business.logoAccent || business.name)}</span>${escapeHtml(business.logoRest || '')}</h1>
    <div class="sub">Ticket de compra</div>
    <div class="status">${escapeHtml(STATUS_LABELS[mpOrder.status] || mpOrder.status || 'Pagado')}</div>

    <div class="items">${items.map(escapeHtml).join('<br>')}</div>

    <div class="divider"></div>
    <div class="row"><span>Folio</span><span>${escapeHtml(mpOrder.external_reference || mpOrder.id)}</span></div>
    <div class="row"><span>Fecha</span><span>${escapeHtml(formatDate(mpOrder.date_created))}</span></div>
    <div class="total-row"><span>Total</span><span>${amount === '—' ? amount : escapeHtml(amount)}</span></div>

    <div class="footer">Gracias por tu compra en ${escapeHtml(business.name)}</div>
  </div>
</body>
</html>`);
  } catch (error) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket no encontrado</title></head>
<body style="background:#FFFFFF;color:#0A0A0A;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;">
<div>No se encontró el ticket para esta orden.</div>
</body></html>`);
  }
});

module.exports = router;
