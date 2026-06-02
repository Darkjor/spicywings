const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

// 1. Configurar Cabeceras de Seguridad Básica (Helmet)
// Configuramos CSP personalizada para que no bloquee los recursos externos de Stripe y Google Fonts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      imgSrc: ["'self'", "data:", "https://*.stripe.com"]
    }
  }
}));

// 2. Configurar Limitador de Peticiones (Rate Limit) para evitar abusos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 peticiones por IP cada 15 minutos
  message: { error: 'Demasiadas solicitudes de pago desde esta IP. Por favor intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend desde la raíz del proyecto con cabecera UTF-8 forzada
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.html') {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    } else if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
  }
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Aplicar el limitador solo a la creación de sesiones de pago
app.post('/api/create-checkout-session', apiLimiter, async (req, res) => {
  try {
    const { items } = req.body;
    
    // 3. Validación estricta de datos de entrada (Seguridad de Datos)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío o el formato es inválido' });
    }

    // Validar rigurosamente cada campo del artículo enviado
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return res.status(400).json({ error: 'ID de artículo inválido' });
      }
      if (!item.name || typeof item.name !== 'string') {
        return res.status(400).json({ error: 'Nombre de artículo inválido' });
      }
      if (typeof item.price !== 'number' || item.price <= 0 || item.price > 5000) {
        return res.status(400).json({ error: 'Precio de artículo fuera del rango de seguridad' });
      }
      if (typeof item.qty !== 'number' || !Number.isInteger(item.qty) || item.qty <= 0 || item.qty > 50) {
        return res.status(400).json({ error: 'Cantidad de artículo inválida o excesiva' });
      }
      if (item.option && typeof item.option !== 'string') {
        return res.status(400).json({ error: 'Opción de salsa inválida' });
      }
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

    // Crear la sesión de checkout de Stripe con URLs dinámicas basadas en DOMAIN
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${DOMAIN}/index.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/index.html?cancel=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error al crear sesión de Stripe Checkout:', error);
    res.status(500).json({ error: 'No se pudo crear la sesión de pago: ' + error.message });
  }
});

// Arrancar localmente si no estamos ejecutándonos en Vercel como función serverless
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Spicy Wings corriendo en http://localhost:${PORT}`);
  });
}

// Exportamos la app para compatibilidad nativa con Vercel Serverless
module.exports = app;
