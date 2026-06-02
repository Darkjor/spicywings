const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend desde la raíz del proyecto
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // Convertir elementos del carrito al formato de Stripe Line Items
    const lineItems = items.map(item => {
      const sauceSuffix = item.option ? ` (Salsa: ${item.option})` : '';
      return {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `${item.name}${sauceSuffix}`,
          },
          unit_amount: Math.round(item.price * 100), // Stripe requiere centavos
        },
        quantity: item.qty,
      };
    });

    // Crear la sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:${PORT}/index.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:${PORT}/index.html?cancel=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error al crear sesión de Stripe Checkout:', error);
    res.status(500).json({ error: 'No se pudo crear la sesión de pago: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Spicy Wings corriendo en http://localhost:${PORT}`);
});
