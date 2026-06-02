# Stripe Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement secure Stripe card payments on the Spicy Wings ordering platform using a lightweight Node.js/Express backend server, while preserving the final WhatsApp confirmation flow.

**Architecture:** A lightweight Express.js server will serve the static website files and expose a single secure `POST /api/create-checkout-session` endpoint. The frontend will capture order details in `localStorage`, redirect to Stripe Checkout for secure payment, and then automatically process the WhatsApp redirection upon successful return.

**Tech Stack:** Node.js, Express, Stripe Node SDK, Dotenv, Cors, HTML5, Vanilla JavaScript, Stripe.js.

---

## File Structure Map
- **`package.json`** [NEW]: Server configuration, scripts, and npm dependencies.
- **`.env`** [NEW]: Environment variables for Stripe secret keys and port.
- **`server.js`** [NEW]: Express server implementation. Exposes static server and checkout API.
- **`index.html`** [MODIFY]: HTML modifications for loading Stripe.js and updated modal.
- **`index.html` `<script>`** [MODIFY]: Javascript flow updates for form submission, localStorage caching, Stripe fetch, and success/cancel callback handlers.

---

### Task 1: Project Setup and Server Boilerplate

**Files:**
- Create: `package.json`
- Create: `.env`
- Create: `server.js`

- [ ] **Step 1: Create the `package.json` file**
  Create the npm package configuration file in the project root:
  ```json
  {
    "name": "spicywings-backend",
    "version": "1.0.0",
    "description": "Backend para procesamiento de pagos de Stripe en Spicy Wings",
    "main": "server.js",
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js"
    },
    "dependencies": {
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "express": "^4.19.2",
      "stripe": "^15.12.0"
    },
    "devDependencies": {
      "nodemon": "^3.1.0"
    }
  }
  ```

- [ ] **Step 2: Create the `.env` template file**
  Create `.env` in the project root with the following key templates (the user will fill these in with real test keys):
  ```env
  PORT=3000
  STRIPE_SECRET_KEY=sk_test_51AFqIEHc6HkCTxfAVK... # Inserte clave secreta de prueba
  ```

- [ ] **Step 3: Create the basic static server in `server.js`**
  Implement the boilerplate Express server to serve files from the root directory:
  ```javascript
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

  app.listen(PORT, () => {
    console.log(`Servidor Spicy Wings corriendo en http://localhost:${PORT}`);
  });
  ```

- [ ] **Step 4: Install dependencies**
  Run command: `npm install`
  Expected: Successful node_modules installation without errors.

- [ ] **Step 5: Verify static server health**
  Run command: `node server.js` (Keep running in background or stop after verify)
  Test URL: `http://localhost:3000/api/health`
  Expected output: `{ "status": "ok", ... }`

- [ ] **Step 6: Commit changes**
  ```bash
  git add package.json .env server.js
  git commit -m "chore: setup express server boilerplate and dependencies"
  ```

---

### Task 2: Implement Stripe Checkout API

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Implement Checkout Session endpoint in `server.js`**
  Modify `server.js` to initialize the Stripe client and define the `/api/create-checkout-session` endpoint:
  ```javascript
  // Reemplazar el bloque de código final en server.js para incluir Stripe
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
  ```

- [ ] **Step 2: Test API endpoint directly**
  Run the server: `node server.js`
  Using a curl command in PowerShell:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/create-checkout-session" -Method Post -ContentType "application/json" -Body '{"items": [{"name": "Alitas 10 pzs", "price": 130.00, "qty": 1, "option": "Buffalo"}]}'
  ```
  Expected output: A JSON response containing a Stripe Checkout URL `{ "url": "https://checkout.stripe.com/..." }`.

- [ ] **Step 3: Commit changes**
  ```bash
  git add server.js
  git commit -m "feat: implement /api/create-checkout-session secure endpoint"
  ```

---

### Task 3: Load Stripe.js on the Frontend

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Load Stripe.js library in `index.html`**
  Insert the official Stripe.js script tag inside the `<head>` of [index.html](file:///c:/Users/Perez/OneDrive/Escritorio/Projects/spicywings/index.html) around lines 20-22:
  ```html
      <link rel="stylesheet" href="css/responsive.css">
      <!-- Stripe.js SDK -->
      <script src="https://js.stripe.com/v3/"></script>
  </head>
  ```

- [ ] **Step 2: Verify library loaded**
  Open the app in browser `http://localhost:3000` and check console:
  Run in browser console: `typeof Stripe`
  Expected: `"function"`

- [ ] **Step 3: Commit changes**
  ```bash
  git add index.html
  git commit -m "feat: load Stripe.js in index.html head"
  ```

---

### Task 4: Add Payment Method Selection to Checkout Modal

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update Checkout Form in `index.html`**
  Modify `#checkout-modal` form around line 215 to include a "Método de Pago" option selection:
  ```html
                  <!-- Buscar el form-group de notas o dirección y colocar esto arriba o abajo -->
                  <div class="form-group" id="address-group" style="display: none;">
                      <label for="customer-address">Dirección de Entrega:</label>
                      <input type="text" id="customer-address" placeholder="Calle, Número, Colonia">
                  </div>
  
                  <div class="form-group">
                      <label>Método de Pago:</label>
                      <div class="delivery-methods" style="display: flex; gap: 15px; margin-top: 5px;">
                          <label class="radio-label" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                              <input type="radio" name="payment-method" value="stripe" checked>
                              <span>💳 Tarjeta (Stripe)</span>
                          </label>
                          <label class="radio-label" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                              <input type="radio" name="payment-method" value="efectivo">
                              <span>💵 Efectivo al recibir</span>
                          </label>
                      </div>
                  </div>
  
                  <div class="form-group">
                      <label for="customer-notes">Notas / Instrucciones adicionales:</label>
  ```

- [ ] **Step 2: Update submit button text dynamically**
  Find the submit button in `#checkout-modal` and change its text to be more descriptive based on payment selection:
  ```html
                  <button type="submit" class="submit-order-btn" id="submit-order-btn">Pagar con Stripe 💳</button>
  ```

- [ ] **Step 3: Add event listener to toggle button text based on payment method**
  Insert Javascript inside DOMContentLoaded event block in the inline script of `index.html` around line 520:
  ```javascript
              // Cambiar texto del botón según método de pago
              const paymentMethodRadios = document.getElementsByName("payment-method");
              const submitOrderBtn = document.getElementById("submit-order-btn");
              
              paymentMethodRadios.forEach(radio => {
                  radio.addEventListener("change", (e) => {
                      if (e.target.value === "stripe") {
                          submitOrderBtn.textContent = "Pagar con Stripe 💳";
                      } else {
                          submitOrderBtn.textContent = "Confirmar y Enviar a WhatsApp 🍗";
                      }
                  });
              });
  ```

- [ ] **Step 4: Commit changes**
  ```bash
  git add index.html
  git commit -m "feat: add payment method selection to checkout modal"
  ```

---

### Task 5: Implement Stripe Payment Redirection Flow

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Intercept form submit and handle Stripe checkout**
  Replace the checkoutForm `"submit"` event listener in the `index.html` inline script around lines 525-535 with the following logic:
  ```javascript
              // Submit form
              checkoutForm.addEventListener("submit", async (e) => {
                  e.preventDefault();
                  const name = document.getElementById("customer-name").value;
                  const method = document.querySelector('input[name="delivery-method"]:checked').value;
                  const address = customerAddress.value;
                  const notes = document.getElementById("customer-notes").value;
                  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

                  if (paymentMethod === "efectivo") {
                      sendOrderToWhatsApp(name, method, address, notes);
                      checkoutModal.classList.remove("open");
                  } else {
                      // Flujo Stripe
                      submitOrderBtn.disabled = true;
                      submitOrderBtn.textContent = "Procesando...";

                      // Guardar detalles del pedido en localStorage
                      const orderDetails = { name, method, address, notes, timestamp: Date.now() };
                      localStorage.setItem('spicywings_pending_checkout', JSON.stringify(orderDetails));
                      localStorage.setItem('spicywings_pending_cart', JSON.stringify(getCart()));

                      try {
                          const response = await fetch('/api/create-checkout-session', {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ items: getCart() })
                          });

                          if (!response.ok) {
                              const errData = await response.json();
                              throw new Error(errData.error || 'Error al conectar con el servidor');
                          }

                          const data = await response.json();
                          if (data.url) {
                              // Redirigir a Stripe Checkout
                              window.location.href = data.url;
                          } else {
                              throw new Error('No se recibió la URL de pago');
                          }
                      } catch (error) {
                          alert('Error al iniciar el pago con Stripe: ' + error.message);
                          submitOrderBtn.disabled = false;
                          submitOrderBtn.textContent = "Pagar con Stripe 💳";
                      }
                  }
              });
  ```

- [ ] **Step 2: Commit changes**
  ```bash
  git add index.html
  git commit -m "feat: intercept checkout form submit and redirect to Stripe Checkout"
  ```

---

### Task 6: Implement Callback Success/Cancel Handling on Page Load

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add callback handler on DOMContentLoaded**
  At the end of the `DOMContentLoaded` listener block in the inline script of `index.html` (just before `updateCartUI()`), add the URL parameter check logic:
  ```javascript
              // --- STRIPE CALLBACK HANDLING ---
              const checkStripeCallback = () => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const isSuccess = urlParams.get('success') === 'true';
                  const isCancel = urlParams.get('cancel') === 'true';
                  const sessionId = urlParams.get('session_id');

                  if (isSuccess && sessionId) {
                      // Recuperar orden pendiente de localStorage
                      const savedOrderStr = localStorage.getItem('spicywings_pending_checkout');
                      const savedCartStr = localStorage.getItem('spicywings_pending_cart');

                      if (savedOrderStr && savedCartStr) {
                          const savedOrder = JSON.parse(savedOrderStr);
                          const savedCart = JSON.parse(savedCartStr);

                          // Restaurar carrito temporalmente para ejecutar la función de WhatsApp
                          cart = savedCart;
                          
                          // Modificar temporalmente sendOrderToWhatsApp para incluir confirmación de Stripe
                          const originalSendOrder = sendOrderToWhatsApp;
                          sendOrderToWhatsApp = (customerName, method, address, notes) => {
                              if (address === undefined) address = "";
                              if (notes === undefined) notes = "";

                              var activeBranch = getActiveBranch();
                              if (!activeBranch) {
                                  alert("Por favor, selecciona una sucursal primero.");
                                  return;
                              }

                              var total = getCartTotal();

                              var chicken = String.fromCodePoint(0x1F357);  // 🍗
                              var person  = String.fromCodePoint(0x1F464);  // 👤
                              var pin     = String.fromCodePoint(0x1F4CD);  // 📍
                              var house   = String.fromCodePoint(0x1F3E0);  // 🏠
                              var notepad = String.fromCodePoint(0x1F4CB);  // 📋
                              var money   = String.fromCodePoint(0x1F4B0);  // 💰
                              var bubble  = String.fromCodePoint(0x1F4AC);  // 💬
                              var shield  = String.fromCodePoint(0x1F6E1);  // 🛡️

                              var msg = chicken + " *\u00A1NUEVO PEDIDO - SPICY WINGS!* " + chicken + "\n";
                              msg += "--------------------------------------\n";
                              msg += shield + " *Estado:* PAGO CONFIRMADO VÍA STRIPE 💳\n";
                              msg += "ID Transacción: " + sessionId.substring(0, 15) + "...\n";
                              msg += "--------------------------------------\n";
                              msg += person + " *Cliente:* " + customerName + "\n";
                              msg += pin + " *Método:* " + (method === "recoger" ? "Para Recoger (" + activeBranch.name + ")" : "Envío a Domicilio") + "\n";
                              if (method === "domicilio" && address) {
                                  msg += house + " *Dirección:* " + address + "\n";
                              }
                              msg += "\n" + notepad + " *Detalle del Pedido:*\n";

                              cart.forEach(function(item) {
                                  var sauceText = item.option ? " (Salsa: " + item.option + ")" : "";
                                  msg += "\u2022 " + item.qty + "x " + item.name + sauceText + " - $" + (item.price * item.qty).toFixed(2) + " MXN\n";
                              });

                              msg += "\n" + money + " *Total Pagado:* $" + total.toFixed(2) + " MXN\n";
                              msg += "--------------------------------------\n";
                              if (notes) {
                                  msg += bubble + " *Notas:* " + notes + "\n";
                              }
                              msg += "\n¡Espero su confirmación de preparación!";

                              var encodedMsg = encodeURIComponent(msg);
                              window.location.href = "whatsapp://send?phone=" + activeBranch.phone + "&text=" + encodedMsg;
                          };

                          // Lanzar confirmación
                          alert("¡Pago con Stripe realizado con éxito! Redirigiendo a WhatsApp para confirmar los detalles de entrega...");
                          sendOrderToWhatsApp(savedOrder.name, savedOrder.method, savedOrder.address, savedOrder.notes);

                          // Restaurar función original
                          sendOrderToWhatsApp = originalSendOrder;

                          // Limpiar todo
                          localStorage.removeItem('spicywings_pending_checkout');
                          localStorage.removeItem('spicywings_pending_cart');
                          cart = [];
                          updateCartUI();
                      } else {
                          alert("Pago de Stripe recibido, pero no se encontraron los detalles de la orden en el navegador local.");
                      }
                      
                      // Limpiar parámetros de la URL
                      window.history.replaceState({}, document.title, window.location.pathname);
                  }

                  if (isCancel) {
                      alert("El proceso de pago con Stripe fue cancelado o rechazado. Tu carrito sigue guardado por si deseas intentar de nuevo.");
                      window.history.replaceState({}, document.title, window.location.pathname);
                  }
              };

              // Ejecutar revisión de Stripe
              checkStripeCallback();
  ```

- [ ] **Step 2: Apply the exact same changes to `js/app.js` and modular JS files (Optional/Consistency)**
  Since the codebase has duplicates in `js/` folder but `index.html` inline script is the active one, let's keep them completely in sync. Update `js/app.js` with the corresponding event submit interceptor and callback check, and check health.

- [ ] **Step 3: Test entire checkout flow**
  1. Add products to cart.
  2. Enter details, choose "Tarjeta (Stripe)" and submit.
  3. You will be redirected to Stripe Checkout page.
  4. Perform payment with Test card, verify success callback redirects to `index.html?success=true`.
  5. Verify alert and successful deep link execution to WhatsApp with Stripe ID.

- [ ] **Step 4: Commit changes**
  ```bash
  git add index.html js/app.js
  git commit -m "feat: implement success and cancel callback handlers in frontend"
  ```
