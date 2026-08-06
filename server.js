const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Configurar Cabeceras de Seguridad Básica (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));

app.use(cors());
app.use(express.json());

// Prueba final de producción del punto de venta en tablet: la raíz del sitio
// sirve temporalmente /point-demo en vez del flujo de pedidos por WhatsApp.
// El sitio de WhatsApp sigue intacto y accesible directo en /index.html.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'point-demo.html'));
});

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

// --- Punto de venta en tablet vía Mercado Pago Point ---
// No toca ni depende del flujo de pedidos por WhatsApp.
const pointRoutes = require('./routes/point');
const mercadopagoWebhooks = require('./routes/webhooks');
const receiptRoutes = require('./routes/receipt');
app.use('/api/point', pointRoutes);
app.use('/webhooks', mercadopagoWebhooks);
app.use('/receipt', receiptRoutes);
app.get('/point-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'point-demo.html'));
});

// Arrancar localmente si no estamos ejecutándonos en Vercel como función serverless
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Exportamos la app para compatibilidad nativa con Vercel Serverless
module.exports = app;
