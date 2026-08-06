# Tablet + Point POS

Sitio de pedidos por WhatsApp más un punto de venta en tablet que cobra con
tarjeta usando una terminal física **Mercado Pago Point** (Orders API).
Pensado como plantilla: la marca, las sucursales y el menú viven en dos
archivos JSON, no hardcodeados en el código.

## Qué incluye

- **`/` (o `/index.html`)** — sitio de pedidos: el cliente arma su carrito y
  el pedido se manda por WhatsApp (`whatsapp://` en móvil, WhatsApp Web en
  escritorio). No depende de backend, es 100% client-side.
- **`/point-demo`** — vista tipo tablet para tomar pedidos en mesa/mostrador
  y cobrar con tarjeta. Al pagar, crea una *order* en Mercado Pago que la
  terminal Point recibe automáticamente por su propia conexión (no hay
  pareo Bluetooth/NFC con la tablet).
- **`/receipt/:id`** — ticket digital: la terminal Point no imprime, así que
  al confirmarse el pago aparece un QR en la tablet que el cliente escanea
  para ver su ticket.

## Arrancar en local

```bash
npm install
cp .env.example .env   # opcional, ver variables abajo
npm start               # http://localhost:3000
```

Sin nada configurado en `.env`, el módulo de Point arranca en **modo mock**:
simula el ciclo de vida completo de un cobro (`created → at_terminal →
processed`) sin necesitar cuenta ni terminal real — así se puede probar y
enseñar la demo completa desde el día uno.

## Personalizar para tu negocio

Dos archivos, nada de buscar-y-reemplazar en el código:

- **`data/business.json`** — nombre del negocio, logo (texto), sucursales
  (nombre/teléfono/dirección) y el título del mensaje de WhatsApp.
- **`data/menu.json`** — categorías y productos, con precio y variantes
  opcionales (ej. salsas, tamaños).

`index.html` y `/point-demo` leen ambos archivos en tiempo de carga — un
cambio ahí se refleja en todo el sitio, incluido el ticket digital.

Cosas que si quieres cambiar sí tocan código (con su propio comentario
marcándolas):
- El formato del mensaje de WhatsApp (`index.html`, función
  `sendOrderToWhatsApp`) — el contenido/orden de los campos es tuyo.
- Colores y tipografía: centralizados en `css/variables.css`.
- Ícono de la PWA (`img/icon-*.png`, `img/apple-touch-icon.png`) — hay que
  regenerarlos como imagen, no son texto.

## Variables de entorno

Ver `.env.example`. Todas son opcionales — sin configurar, el módulo de
Point corre en modo mock.

| Variable | Para qué |
|---|---|
| `MP_ACCESS_TOKEN` | Access token de Mercado Pago (test o producción). Sin esto, modo mock. |
| `MP_TERMINAL_ID` | ID de la terminal Point que va a recibir los cobros. Se obtiene con `GET /terminals/v1/list` de la API de Mercado Pago. |
| `MP_WEBHOOK_SECRET` | Secreto para validar la firma de los webhooks (panel de Mercado Pago → tu app → Webhooks). |
| `STRIPE_SECRET_KEY` | Ya no se usa (Stripe se quitó del checkout). Se puede eliminar si no queda ninguna integración pendiente. |

## Arquitectura — decisiones que vale la pena conocer

- **Mock vs. real es transparente para el resto del código.** `lib/mercadopago.js`
  decide internamente si llama a la API real o simula localmente
  (`isConfigured()`), según si `MP_ACCESS_TOKEN`/`MP_TERMINAL_ID` están
  configurados. Las rutas nunca necesitan saber en qué modo están.

- **El estado del cobro nunca depende de memoria compartida.** `store/pointOrders.js`
  es solo una bitácora *best-effort* — en Vercel (serverless), cada
  invocación puede caer en una instancia distinta con memoria vacía, así que
  no hay garantía de que persista entre requests. Tanto el polling del
  frontend (`GET /api/point/orders/:id`) como el ticket digital
  (`/receipt/:id`) consultan **siempre** directo la API de Mercado Pago, que
  es la única fuente de verdad real.

- **La simulación de pago (botón "Simular pago exitoso") se autodesactiva**
  en cuanto hay credenciales reales configuradas — evita confundir un cobro
  de mentiras con uno real cuando ya hay una terminal física conectada.

## Deploy

Pensado para Vercel (`vercel.json` ya incluido: server.js como función
serverless + resto como estático). Cualquier host que corra Node 18+ debería
funcionar igual — el único requisito real es `fetch` global (usado en
`lib/mercadopago.js` para llamar a la API de Mercado Pago sin dependencias
extra).

## Limitaciones conocidas / siguientes pasos

- No hay pruebas automatizadas (unit/integration tests).
- No hay base de datos real — para reportes o historial confiable de
  ventas, `store/pointOrders.js` habría que reemplazarlo por Postgres,
  Supabase, etc.
- Un solo idioma (español) y una sola moneda (MXN) asumidos en varios
  textos.
