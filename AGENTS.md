# Contexto para agentes de IA

Este archivo es para el próximo agente (orquestador u otro) que retome este
proyecto en frío, incluyendo en Antigravity. Es una auditoría técnica
completa del estado actual — no repitas esta investigación, léela primero.

No contiene secretos. Ningún token, teléfono real ni credencial va en este
archivo porque se commitea al repo.

## 1. Qué es esto, en una frase

Un sitio de pedidos por WhatsApp (estático, sin backend) más un punto de
venta en tablet que cobra con tarjeta usando una terminal física Mercado
Pago Point (Orders API), más un panel de administración con reporte de
ventas del día, diseñado como plantilla reutilizable: la marca, las
sucursales y el menú viven en JSON, no hardcodeados. Diseño visual: Swiss
minimalista blanco/monocromático con un solo color de acento (naranja).

## 2. Los dos flujos, independientes entre sí

### 2.1 Sitio de pedidos por WhatsApp (`index.html`)
100% client-side. No llama a ningún endpoint del backend. Carga
`data/business.json` y `data/menu.json` por `fetch()`, renderiza marca +
menú + sucursales, arma un carrito en memoria, y al hacer checkout genera un
link `whatsapp://send` (móvil) o `https://api.whatsapp.com/send`
(escritorio) con el pedido formateado como mensaje de texto. No hay pago
integrado en este flujo — el pago se acuerda por WhatsApp directamente entre
cliente y negocio.

### 2.2 Punto de venta en tablet (`point-demo.html` + backend)
Vista tipo tablet para tomar pedidos en mesa/mostrador y cobrar con tarjeta
vía terminal física. Flujo:

1. `point-demo.html` carga `data/menu.json` y `data/business.json` por
   `fetch()` (mismo patrón que el sitio de WhatsApp, código independiente
   en `js/point-demo.js`).
2. Al armar el carrito y dar "Pagar con tarjeta": `POST /api/point/orders`
   → `routes/point.js` → `lib/mercadopago.js` → `POST /v1/orders` de
   Mercado Pago con `type: "point"`. La terminal física recibe el cobro
   automáticamente por su propia conexión (4G/WiFi) — no hay pareo
   Bluetooth/NFC entre la tablet y la terminal, todo pasa por la cuenta de
   Mercado Pago vía internet.
3. El frontend hace polling cada 2s a `GET /api/point/orders/:id` hasta que
   el estado llega a un estado final (`processed`, `failed`, `canceled`,
   `refunded`).
4. Al confirmarse (`processed`), se genera un QR en pantalla (librería
   vendorizada `js/vendor/qrcode.js`, 100% client-side) apuntando a
   `/receipt/:id` — porque **la terminal Point no imprime ticket**. El
   cliente escanea con su celular y ve su ticket ahí.
5. `/receipt/:id` (`routes/receipt.js`) consulta la order directo en
   Mercado Pago y renderiza un ticket HTML con folio, artículos, fecha y
   total. El monto se formatea con `Intl.NumberFormat` usando
   `currency`/`locale` de `data/business.json`. Si el pedido incluyó propina
   (ver abajo), aparece como una línea aparte en el ticket.

Antes de "Pagar con tarjeta", el usuario puede elegir una propina opcional
(0/10/15/20% sobre el subtotal) — se suma al `amount` que se manda a
Mercado Pago, y se agrega como línea extra al final del `description` de la
order (`+ Propina 15% ($19.50)`), separada por coma igual que los artículos
del carrito — así `routes/receipt.js` la muestra automáticamente sin lógica
extra (ese archivo solo separa `description` por comas).

### 2.3 Panel de administración (`/admin`)

Protegido con HTTP Basic Auth (`middleware/adminAuth.js`, usuario/password
via `ADMIN_USER`/`ADMIN_PASSWORD`). Muestra:
- **Reporte de ventas de hoy** (`GET /admin/api/sales-today`): llama a
  `mpClient.searchOrders({ beginDate, endDate })` (nuevo en
  `lib/mercadopago.js`, mismo patrón mock/real que el resto del cliente) con
  el rango de "hoy" en la zona horaria del servidor, filtra `status ===
  'processed'`, y devuelve total + cantidad + lista de orders.
- **Configuración actual, SOLO LECTURA** de `data/business.json` y
  `data/menu.json`. A propósito NO tiene edición/guardado desde la UI: en
  Vercel serverless el filesystem es de solo lectura en producción, así que
  un botón "Guardar" ahí se vería como que funciona pero fallaría
  silenciosamente (o solo funcionaría en local) — se decidió no construir
  ese falso positivo. Para editar, sigue siendo: modificar los JSON en el
  repo y hacer commit.

## 3. Mapa de archivos

```
server.js                  Express app. Exporta `app` para Vercel serverless;
                            corre app.listen() solo en local (NODE_ENV != production).
                            Monta: /api/point, /webhooks, /receipt, /point-demo, /
                            (root → point-demo.html), estáticos desde la raíz.

routes/point.js             POST /api/point/orders           crea el cobro
                             GET  /api/point/orders/:id       consulta estado (polling)
                             POST /api/point/orders/:id/simulate  solo mock/dev

routes/webhooks.js          POST /webhooks/mercadopago  recibe notificaciones de MP,
                             valida firma HMAC. Ver limitación en §5.

routes/receipt.js           GET /receipt/:id  ticket HTML público (sin auth —
                             el id de Mercado Pago actúa como capacidad/token implícito).

lib/mercadopago.js          Cliente de la Orders API. isConfigured() decide entre
                             API real y modo mock (mockCreateOrder/mockGetOrder/
                             mockSimulateEvent/mockSearchOrders). Todo el resto del
                             código llama siempre a las mismas funciones exportadas
                             sin saber en qué modo está.

store/pointOrders.js        Bitácora in-memory. Ver limitación crítica en §5.

middleware/adminAuth.js     HTTP Basic Auth para /admin. Fail closed si no hay
                             ADMIN_PASSWORD configurado (503, no queda abierto).

routes/admin.js             GET /admin              sirve admin.html
                             GET /admin/api/sales-today  reporte de ventas de hoy

admin.html + js/admin.js + css/components/admin.css
                             Panel de administración. Mismo patrón fetch-JSON que
                             point-demo.html/js/point-demo.js.

data/business.json          Nombre, logo (texto), sucursales, título del mensaje
                             de WhatsApp, currency/locale (formato de moneda vía
                             Intl.NumberFormat — NO es traducción de textos, solo
                             cómo se muestran los números). Fuente única de verdad
                             para la marca.

data/menu.json              Categorías/productos con precio, variantes opcionales,
                             y "available" (boolean — false = "Agotado", no se
                             puede agregar al carrito; default true si falta el
                             campo). Consumido por index.html Y point-demo.js (dos
                             renderizadores independientes, mismo JSON).

index.html                  Sitio de WhatsApp. Script inline (no usa js/point-demo.js
                             ni viceversa — son dos apps separadas que comparten
                             solo los JSON de datos y las hojas de estilo).

point-demo.html + js/point-demo.js + css/components/point-demo.css
                             Tablet POS. PWA (manifest + meta tags) para
                             "Agregar a pantalla de inicio" sin barra de navegador.

js/vendor/qrcode.js         qrcode-generator de Kazuhiko Arase (MIT), vendorizado
                             tal cual — genera el QR del ticket 100% en el navegador.

css/variables.css           Única fuente de colores/tipografía — cambiar tema es
                             editar este archivo, no buscar-reemplazar en el resto.

vercel.json                 server.js como función serverless + resto estático.
                             Ver §6 sobre hosting dual con GitHub Pages.
```

Archivos que YA NO existen (se borraron por ser código muerto, no los
recrees): `js/app.js`, `js/main.js`, `js/cart.js`, `js/branches.js`,
`js/whatsapp.js` — eran una modularización ES6 duplicada, nunca referenciada
por ningún HTML, con datos reales hardcodeados (número de teléfono).

## 4. Cómo se personaliza (ya está diseñado para esto)

Editar **solo** `data/business.json` y `data/menu.json`. Ambos archivos se
leen dinámicamente por `fetch()` desde `index.html`, `js/point-demo.js` y
(server-side, con `fs.readFileSync`) `routes/receipt.js`. No hay ningún otro
lugar con nombre de negocio, sucursales o productos hardcodeados en el
código vivo (sí quedan menciones en `docs/superpowers/*.md`, que son specs
históricas de cuando el proyecto se llamaba "Spicy Wings" — no son código,
no hace falta tocarlas).

Excepción: `point-demo.webmanifest` es un manifest estático (los navegadores
lo leen directo, no puede hacer `fetch()` a otro JSON) — su `name`/
`short_name` hay que editarlos a mano si se rebrandea. Los íconos PWA
(`img/icon-*.png`, `img/apple-touch-icon.png`) también son imágenes, no
texto — regenerarlos si se cambia de marca.

## 5. Limitaciones y decisiones de arquitectura que hay que conocer

- **`store/pointOrders.js` NO es una base de datos real.** En Vercel
  (serverless), cada invocación puede caer en una instancia distinta con
  memoria vacía — no hay garantía de que persista entre requests. Por
  diseño, **ninguna ruta depende de él para leer el estado real**: tanto el
  polling (`GET /api/point/orders/:id`) como el ticket (`/receipt/:id`)
  consultan siempre directo la API de Mercado Pago, que es la única fuente
  de verdad. El store es solo una bitácora best-effort. Si se necesita
  historial/reportes confiables, hay que reemplazarlo por una DB real
  (Postgres, Supabase, etc.) — no hay nada más que migrar, el resto del
  código ya no depende de la forma de este store.

- **El botón "Simular pago exitoso" se autodesactiva** en cuanto
  `MP_ACCESS_TOKEN`/`MP_TERMINAL_ID` están configurados (`isConfigured()`
  en `lib/mercadopago.js`), para no confundir un cobro de mentiras con uno
  real cuando ya hay terminal física conectada. Esto es intencional, no lo
  quites sin razón.

- **Bloque `manual-confirm-box` / `manualConfirmBtn` en `js/point-demo.js`
  y `point-demo.html` está marcado `// TEMPORAL` en el código.** Se agregó
  para poder probar el flujo del QR/ticket sin generar un cobro real
  mientras se validaba esa feature. Fuerza la pantalla local a "procesado"
  **sin llamar a Mercado Pago** — es decir, si queda en el código y alguien
  lo usa en operación real, un cajero podría "confirmar" un pago que nunca
  ocurrió. **Hay que quitarlo antes de operar con clientes reales**; el
  usuario dijo que lo probaría y avisaría para removerlo. Si retomas este
  proyecto y no hay confirmación explícita de que ya se puede quitar,
  pregunta antes de borrarlo (podría seguir en uso para pruebas).

- **`GET /receipt/:id` no tiene autenticación** — cualquiera con el id de
  la order (que es largo y no-adivinable, tipo capability URL) puede ver
  ese ticket. Aceptable para el alcance actual (solo muestra
  artículos/monto/fecha, sin datos personales del cliente).

- **Moneda configurable, idioma NO.** `data/business.json` tiene
  `currency`/`locale` que controlan el formato de números vía
  `Intl.NumberFormat` (símbolo, separadores, decimales) en `index.html`,
  `js/point-demo.js` y `routes/receipt.js` — pero todos los textos de la
  interfaz (labels, botones, mensajes) siguen fijos en español. Traducir la
  interfaz a otro idioma es un proyecto aparte, no intentado todavía.

- **El panel `/admin` es de solo lectura para configuración** — a propósito
  no tiene edición/guardado (ver §2.3, es una limitación real del
  filesystem read-only de Vercel serverless, no un descuido). El reporte de
  ventas solo cubre "hoy" en la zona horaria del servidor — no hay
  selección de rango de fechas ni reportes históricos.

- **Los nombres de las variables CSS cambiaron** en el rediseño a tema
  blanco: ya NO existen `--bg-dark-pure/panel/card` ni `--border-color` —
  ahora son `--color-bg`, `--color-surface`, `--color-surface-2`,
  `--color-border`, más `--radius-sm/md` y `--shadow-sm/md` nuevos. Si ves
  código o memoria de una sesión anterior a esto que use los nombres viejos,
  está desactualizado — usa los nuevos.

## 6. Hosting: Vercel Y GitHub Pages están AMBOS activos

Detectado durante el desarrollo: este repo tiene GitHub Pages habilitado
(workflow automático `pages-build-deployment`) **además** de estar
desplegado en Vercel. Esto importa porque:

- GitHub Pages solo sirve archivos estáticos — no puede correr `server.js`.
  El sitio de WhatsApp (`index.html`) funciona ahí sin problema (no
  necesita backend). El punto de venta en tablet (`/point-demo`) **no
  funciona en GitHub Pages** — el HTML/menú carga, pero todas las llamadas
  a `/api/point/...` fallan (no hay backend).
- Si alguien reporta que "la tablet no funciona" hay que preguntar primero
  en qué URL están probando — si es la de GitHub Pages en vez de Vercel,
  ese es el motivo, no un bug.
- No se determinó en esta sesión si conviene desactivar GitHub Pages o
  dejar los dos hosts en paralelo (uno solo sirve el sitio estático de
  WhatsApp como respaldo). Es una decisión pendiente, no una limitación
  técnica a resolver con código.

## 7. Variables de entorno

Ver `.env.example` — todas opcionales, sin configurar el módulo Point corre
en modo mock. `MP_TERMINAL_ID` se obtiene con `GET /terminals/v1/list` de la
API de Mercado Pago (requiere que la terminal física ya haya iniciado sesión
con la cuenta correspondiente — cuentas de prueba/sandbox no heredan
terminales de la cuenta real, hay que emparejar cada una explícitamente).

`.env` está en `.gitignore` y NO está trackeado en git — no lo agregues de
vuelta al repo.

`ADMIN_USER`/`ADMIN_PASSWORD` protegen `/admin` (Basic Auth, fail-closed:
sin `ADMIN_PASSWORD` el panel responde 503). `ADMIN_USER` sí tiene default
(`"admin"`) porque no es secreto — lo que protege el acceso es la password.

## 8. Estado de pruebas

No hay pruebas automatizadas (unit/integration). Todo lo validado en esta
sesión fue manual: flujo mock completo (crear → simular → QR → ticket) y
**un cobro real de $5 MXN confirmado end-to-end en la terminal física**
(Newland N950, cuenta de producción). Vale la pena escribir tests antes de
seguir agregando features, especialmente para `lib/mercadopago.js` (mockeable
fácilmente) y la validación de firma de webhook.

## 9. Historial relevante (más detalle en `git log`)

1. Sitio de WhatsApp original + intento de Stripe checkout (Stripe se quitó
   después por completo — ver `docs/superpowers/` para las specs
   originales de esa integración, ahora obsoletas).
2. Se agregó el módulo de Point (modo mock, aditivo, sin tocar WhatsApp).
3. Se probó con credenciales reales y terminal física real — confirmado
   funcionando (cobro de $5 MXN real).
4. Se descubrió y corrigió el problema de memoria no persistente en
   serverless (commit `d17ffb6`).
5. Se agregó soporte PWA, el ticket QR, y el botón temporal de prueba.
6. Se genericizó todo el proyecto como plantilla (decisión explícita del
   dueño: "Spicy Wings era una idea de negocio que puede cambiar") —
   commit `5a7b349`. El sitio de WhatsApp en producción quedó con
   contenido de ejemplo hasta que se vuelva a personalizar con datos
   reales en `data/business.json`/`data/menu.json`.
7. README.md + este archivo.
8. Tres agentes en paralelo (git worktrees aislados, fusionados sin
   conflictos reales — el único archivo tocado por dos agentes a la vez,
   `routes/receipt.js`, se auto-mergeó limpio porque cada uno tocó una
   región distinta): rediseño visual completo a Swiss minimalista blanco,
   inventario/moneda-locale/propina, y panel de administración con reporte
   de ventas. Nota para la próxima vez que se orquesten agentes así: la
   primera corrida se interrumpió por un cierre del proceso de Claude Code
   con cero progreso rescatable (los tres apenas habían empezado) — la
   segunda corrida sí incluyó instrucción explícita de commitear seguido
   por sub-tarea, que evitó perder trabajo de nuevo.

## 10. Pendientes conocidos (no bloqueantes, pero sin resolver)

- Decidir si `MP_WEBHOOK_SECRET` se configura y se registra la URL del
  webhook en el panel de Mercado Pago (hoy el flujo funciona sin webhooks,
  vía polling directo a la API).
- Quitar el bloque TEMPORAL de confirmación manual (§5) cuando el dueño
  confirme que ya no lo necesita.
- Decidir sobre GitHub Pages vs. Vercel (§6).
- Repoblar `data/business.json`/`data/menu.json` con datos reales cuando
  se decida la marca definitiva, o crear un repo aparte por cliente (se
  discutió usar "Use this template" de GitHub para eso).
- Sin tests automatizados (§8).
- El panel `/admin` no tiene edición de configuración (§5) — si en algún
  momento se justifica (varios negocios usando esto, no solo uno), esa es
  la señal de que ya conviene la migración a base de datos real + admin
  editable, no antes (decisión explícita del dueño de posponer esa
  migración grande por ahora).
- Traducción de la interfaz a otro idioma (§5) — solo el formato de
  moneda/número es configurable hoy, no el texto.
