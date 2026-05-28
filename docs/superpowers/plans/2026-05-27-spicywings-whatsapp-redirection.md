# Spicy Wings WhatsApp Redirection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a responsive, elegant dark theme web page for Spicy Wings allowing users to add wings to a cart and send their order directly to a specific branch's WhatsApp.

**Architecture:** Vanilla HTML, CSS (modular using variables), and modern JavaScript (ES6 Modules) to manage sucursal and cart states.

**Tech Stack:** Vanilla HTML5, CSS3, ES6 JavaScript.

---

### Task 1: Project Skeleton & Global Styles

**Files:**
- Create: `index.html`
- Create: `css/variables.css`
- Create: `css/main.css`

- [ ] **Step 1: Create index.html with base HTML5 structure**
  Create the main entry point referencing Google Fonts (Outfit and Inter), icons, variables, and main stylesheets.
  
  Code for `index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Spicy Wings - Dark Kitchen & Pedidos</title>
      <meta name="description" content="Pide las mejores alitas estilo Dark Kitchen para recoger en nuestras 3 sucursales.">
      
      <!-- Google Fonts -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
      
      <!-- Stylesheets -->
      <link rel="stylesheet" href="css/variables.css">
      <link rel="stylesheet" href="css/main.css">
      <link rel="stylesheet" href="css/components/menu.css">
      <link rel="stylesheet" href="css/components/cart.css">
      <link rel="stylesheet" href="css/components/modal.css">
      <link rel="stylesheet" href="css/responsive.css">
  </head>
  <body>
      <!-- Header -->
      <header class="main-header" id="main-header">
          <div class="header-container">
              <div class="logo">
                  <span class="logo-accent">SPICY</span>WINGS
              </div>
              <div class="branch-selector-indicator" id="active-branch-indicator">
                  📍 Seleccionar Sucursal
              </div>
              <button class="cart-toggle-btn" id="cart-toggle-btn" aria-label="Ver carrito">
                  🛒 <span class="cart-badge" id="cart-badge">0</span>
              </button>
          </div>
      </header>

      <!-- Main Layout -->
      <main class="menu-container">
          <section class="hero">
              <h1>DARK KITCHEN WINGS</h1>
              <p>Alitas premium listas para recoger en tu sucursal más cercana. Calientes, crujientes y con la salsa perfecta.</p>
          </section>

          <!-- Menu Categories and Products will be populated here -->
          <section class="menu-section" id="menu-section">
              <!-- Placeholder for products in Task 2 -->
          </section>
      </main>

      <script type="module" src="js/main.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Create css/variables.css**
  Define color tokens, typography, and transition variables.
  
  Code for `css/variables.css`:
  ```css
  :root {
      /* Colors */
      --bg-dark-pure: #0c0c0c;
      --bg-dark-panel: #1a1a1a;
      --bg-dark-card: #262626;
      --border-color: #333333;
      
      --color-primary: #ff6b00; /* Fire Orange */
      --color-secondary: #e63946; /* Hot Red */
      --color-text-primary: #ffffff;
      --color-text-secondary: #aaaaaa;
      --color-text-muted: #666666;
      
      /* Typography */
      --font-titles: 'Outfit', sans-serif;
      --font-body: 'Inter', sans-serif;
      
      /* Spacings */
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
      
      /* Transitions */
      --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  ```

- [ ] **Step 3: Create css/main.css**
  Write reset styles and base styling for layout/typography.
  
  Code for `css/main.css`:
  ```css
  * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
  }

  body {
      background-color: var(--bg-dark-pure);
      color: var(--color-text-primary);
      font-family: var(--font-body);
      line-height: 1.6;
      overflow-x: hidden;
  }

  h1, h2, h3, h4 {
      font-family: var(--font-titles);
      font-weight: 700;
  }

  .main-header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background-color: rgba(26, 26, 26, 0.95);
      border-bottom: 1px solid var(--border-color);
      z-index: 100;
      backdrop-filter: blur(10px);
  }

  .header-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
  }

  .logo {
      font-family: var(--font-titles);
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
  }

  .logo-accent {
      color: var(--color-primary);
  }

  .branch-selector-indicator {
      background-color: var(--bg-dark-card);
      border: 1px solid var(--border-color);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: 50px;
      font-size: 14px;
      cursor: pointer;
      transition: var(--transition-smooth);
  }

  .branch-selector-indicator:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
  }

  .cart-toggle-btn {
      background: none;
      border: none;
      color: var(--color-text-primary);
      font-size: 20px;
      cursor: pointer;
      position: relative;
      padding: var(--spacing-xs);
  }

  .cart-badge {
      position: absolute;
      top: -5px;
      right: -8px;
      background-color: var(--color-secondary);
      color: var(--color-text-primary);
      font-size: 11px;
      font-weight: bold;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
  }

  .menu-container {
      max-width: 1200px;
      margin: 100px auto var(--spacing-xl);
      padding: var(--spacing-md);
  }

  .hero {
      text-align: center;
      margin-bottom: var(--spacing-xl);
      padding: var(--spacing-xl) 0;
  }

  .hero h1 {
      font-size: 48px;
      letter-spacing: 2px;
      margin-bottom: var(--spacing-sm);
  }

  .hero p {
      color: var(--color-text-secondary);
      max-width: 600px;
      margin: 0 auto;
      font-size: 16px;
  }
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add index.html css/variables.css css/main.css
  git commit -m "feat: init project structure and setup base dark styles"
  ```

---

### Task 2: Menu Layout and Styling

**Files:**
- Modify: `index.html`
- Create: `css/components/menu.css`

- [ ] **Step 1: Populate index.html with food products and sauces selector**
  Update the main product layout with structured data attributes.
  
  Code snippet for the menu block inside `index.html` (inside the `menu-section` tag):
  ```html
  <div class="category-block">
      <h2 class="category-title">🍗 ALITAS CRUJIENTES</h2>
      <div class="products-grid">
          <!-- Alitas 10 pcs -->
          <div class="product-card" data-id="alitas-10" data-name="Alitas (10 piezas)" data-price="130.00">
              <div class="product-img-wrapper">
                  <div class="product-badge">Top Ventas</div>
                  <!-- Product Image placeholder or empty since simple static site -->
                  <div class="product-img-placeholder">🔥 10 PZS</div>
              </div>
              <div class="product-info">
                  <h3>Alitas (10 piezas)</h3>
                  <p class="product-desc">Alitas fritas al momento con el nivel de crujencia perfecto.</p>
                  
                  <div class="customization-wrapper">
                      <label>Elige Salsa:</label>
                      <select class="sauce-select">
                          <option value="Mango Habanero">Mango Habanero 🌶️🌶️</option>
                          <option value="Buffalo">Buffalo 🌶️</option>
                          <option value="BBQ Dulce">BBQ Dulce</option>
                          <option value="Lemon Pepper">Lemon Pepper</option>
                      </select>
                  </div>
                  
                  <div class="product-footer">
                      <span class="price">$130.00 MXN</span>
                      <button class="add-to-cart-btn">Agregar</button>
                  </div>
              </div>
          </div>

          <!-- Alitas 20 pcs -->
          <div class="product-card" data-id="alitas-20" data-name="Alitas (20 piezas)" data-price="240.00">
              <div class="product-img-wrapper">
                  <div class="product-img-placeholder">🔥🔥 20 PZS</div>
              </div>
              <div class="product-info">
                  <h3>Alitas (20 piezas)</h3>
                  <p class="product-desc">Doble ración para compartir con salsas a tu elección.</p>
                  
                  <div class="customization-wrapper">
                      <label>Elige Salsa:</label>
                      <select class="sauce-select">
                          <option value="Buffalo">Buffalo 🌶️</option>
                          <option value="Mango Habanero">Mango Habanero 🌶️🌶️</option>
                          <option value="BBQ Dulce">BBQ Dulce</option>
                          <option value="Lemon Pepper">Lemon Pepper</option>
                      </select>
                  </div>
                  
                  <div class="product-footer">
                      <span class="price">$240.00 MXN</span>
                      <button class="add-to-cart-btn">Agregar</button>
                  </div>
              </div>
          </div>
      </div>
  </div>

  <div class="category-block" style="margin-top: var(--spacing-xl);">
      <h2 class="category-title">🍟 GUARNICIONES Y BEBIDAS</h2>
      <div class="products-grid">
          <!-- Papas -->
          <div class="product-card" data-id="papas-gajo" data-name="Papas Gajo Sazonadas" data-price="60.00">
              <div class="product-img-wrapper">
                  <div class="product-img-placeholder">🥔 PAPAS</div>
              </div>
              <div class="product-info">
                  <h3>Papas Gajo Sazonadas</h3>
                  <p class="product-desc">Papas gajo crujientes con nuestro sazonador especial.</p>
                  <div class="product-footer">
                      <span class="price">$60.00 MXN</span>
                      <button class="add-to-cart-btn">Agregar</button>
                  </div>
              </div>
          </div>

          <!-- Bebida -->
          <div class="product-card" data-id="refresco-cola" data-name="Refresco Cola" data-price="25.00">
              <div class="product-img-wrapper">
                  <div class="product-img-placeholder">🥤 BEBIDA</div>
              </div>
              <div class="product-info">
                  <h3>Refresco Coca-Cola</h3>
                  <p class="product-desc">Lata de 355ml fría.</p>
                  <div class="product-footer">
                      <span class="price">$25.00 MXN</span>
                      <button class="add-to-cart-btn">Agregar</button>
                  </div>
              </div>
          </div>
      </div>
  </div>
  ```

- [ ] **Step 2: Create css/components/menu.css**
  Apply premium grids, animations, hover scales, and aesthetic custom forms.
  
  Code for `css/components/menu.css`:
  ```css
  .category-title {
      font-size: 24px;
      letter-spacing: 1px;
      margin-bottom: var(--spacing-md);
      border-bottom: 2px solid var(--color-primary);
      padding-bottom: var(--spacing-xs);
      display: inline-block;
  }

  .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-lg);
  }

  .product-card {
      background-color: var(--bg-dark-panel);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      transition: var(--transition-smooth);
      display: flex;
      flex-direction: column;
  }

  .product-card:hover {
      transform: translateY(-5px);
      border-color: var(--color-primary);
      box-shadow: 0 10px 20px rgba(255, 107, 0, 0.1);
  }

  .product-img-wrapper {
      height: 180px;
      background-color: var(--bg-dark-card);
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
  }

  .product-badge {
      position: absolute;
      top: var(--spacing-sm);
      left: var(--spacing-sm);
      background-color: var(--color-primary);
      color: var(--color-text-primary);
      font-size: 12px;
      font-weight: bold;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 4px;
  }

  .product-img-placeholder {
      font-size: 32px;
  }

  .product-info {
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      flex-grow: 1;
  }

  .product-info h3 {
      font-size: 20px;
      margin-bottom: var(--spacing-xs);
  }

  .product-desc {
      color: var(--color-text-secondary);
      font-size: 14px;
      margin-bottom: var(--spacing-md);
      flex-grow: 1;
  }

  .customization-wrapper {
      margin-bottom: var(--spacing-md);
      background-color: var(--bg-dark-card);
      padding: var(--spacing-sm);
      border-radius: 8px;
  }

  .customization-wrapper label {
      display: block;
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-xs);
  }

  .customization-wrapper select {
      width: 100%;
      background-color: var(--bg-dark-panel);
      border: 1px solid var(--border-color);
      color: var(--color-text-primary);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 4px;
      cursor: pointer;
  }

  .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
  }

  .price {
      font-family: var(--font-titles);
      font-size: 18px;
      font-weight: bold;
      color: var(--color-primary);
  }

  .add-to-cart-btn {
      background-color: var(--color-primary);
      border: none;
      color: var(--color-text-primary);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: var(--transition-smooth);
  }

  .add-to-cart-btn:hover {
      background-color: var(--color-secondary);
  }
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add index.html css/components/menu.css
  git commit -m "feat: design product catalog and cards with sauce customizations"
  ```

---

### Task 3: Cart Component and Modals Layout

**Files:**
- Modify: `index.html`
- Create: `css/components/cart.css`
- Create: `css/components/modal.css`
- Create: `css/responsive.css`

- [ ] **Step 1: Write HTML markup for Cart and Modals in index.html**
  Add the sliding cart container and active popups at the bottom of the body.
  
  Markup block to insert at the end of `body` in `index.html`:
  ```html
  <!-- Sliding Cart -->
  <div class="cart-sidebar" id="cart-sidebar">
      <div class="cart-header">
          <h2>Tu Pedido</h2>
          <button class="cart-close-btn" id="cart-close-btn">&times;</button>
      </div>
      
      <div class="cart-items-container" id="cart-items-container">
          <!-- Populated by JS -->
          <div class="cart-empty-message">Tu carrito está vacío 🍗</div>
      </div>
      
      <div class="cart-footer">
          <div class="cart-total-row">
              <span>Total:</span>
              <span class="cart-total-price" id="cart-total-price">$0.00 MXN</span>
          </div>
          <button class="checkout-btn" id="checkout-btn" disabled>Continuar Pedido</button>
      </div>
  </div>
  <div class="sidebar-overlay" id="sidebar-overlay"></div>

  <!-- Branch Selection Modal -->
  <div class="modal" id="branch-modal">
      <div class="modal-content">
          <h2>📍 SELECCIONA TU SUCURSAL</h2>
          <p>Para garantizar los tiempos de preparación y darte la mejor atención, elige tu sucursal más cercana:</p>
          <div class="branch-options">
              <button class="branch-option-btn" data-branch="centro">
                  <strong>Sucursal Centro</strong>
                  <span>Av. Juárez #105, Col. Centro</span>
              </button>
              <button class="branch-option-btn" data-branch="norte">
                  <strong>Sucursal Norte</strong>
                  <span>Blvd. Bernardo Quintana #450</span>
              </button>
              <button class="branch-option-btn" data-branch="sur">
                  <strong>Sucursal Sur</strong>
                  <span>Av. Constituyentes #209</span>
              </button>
          </div>
      </div>
  </div>

  <!-- Checkout Details Modal -->
  <div class="modal" id="checkout-modal">
      <div class="modal-content">
          <button class="modal-close-btn" id="checkout-close-btn">&times;</button>
          <h2>📋 CONFIRMA TU PEDIDO</h2>
          <form id="checkout-form">
              <div class="form-group">
                  <label for="customer-name">Tu Nombre:</label>
                  <input type="text" id="customer-name" required placeholder="Ej. Juan Pérez">
              </div>
              
              <div class="form-group">
                  <label>Método de Entrega:</label>
                  <div class="delivery-methods">
                      <label class="radio-label">
                          <input type="radio" name="delivery-method" value="recoger" checked>
                          <span>Recoger en Sucursal</span>
                      </label>
                      <label class="radio-label">
                          <input type="radio" name="delivery-method" value="domicilio">
                          <span>Envío a Domicilio</span>
                      </label>
                  </div>
              </div>

              <div class="form-group" id="address-group" style="display: none;">
                  <label for="customer-address">Dirección de Entrega:</label>
                  <input type="text" id="customer-address" placeholder="Calle, Número, Colonia">
              </div>

              <div class="form-group">
                  <label for="customer-notes">Notas / Instrucciones adicionales:</label>
                  <textarea id="customer-notes" placeholder="Ej. Aderezo extra, sin chile, etc."></textarea>
              </div>

              <div class="modal-info-box" id="modal-branch-info">
                  Sucursal de recogida: <strong id="modal-active-branch-name">-</strong>
              </div>

              <button type="submit" class="submit-order-btn">Enviar a WhatsApp 🍗</button>
          </form>
      </div>
  </div>
  ```

- [ ] **Step 2: Create css/components/cart.css**
  Code styles for sliding transitions, layout spacing, totals and quantities.
  
  Code for `css/components/cart.css`:
  ```css
  .cart-sidebar {
      position: fixed;
      top: 0;
      right: -400px;
      width: 100%;
      max-width: 400px;
      height: 100%;
      background-color: var(--bg-dark-panel);
      border-left: 1px solid var(--border-color);
      z-index: 200;
      display: flex;
      flex-direction: column;
      transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .cart-sidebar.open {
      right: 0;
  }

  .cart-header {
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
  }

  .cart-close-btn {
      background: none;
      border: none;
      color: var(--color-text-primary);
      font-size: 32px;
      cursor: pointer;
  }

  .cart-items-container {
      flex-grow: 1;
      padding: var(--spacing-md);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
  }

  .cart-empty-message {
      text-align: center;
      color: var(--color-text-secondary);
      margin-top: 100px;
  }

  .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--bg-dark-card);
      padding: var(--spacing-md);
      border-radius: 8px;
      border: 1px solid var(--border-color);
  }

  .cart-item-details h4 {
      font-size: 16px;
      margin-bottom: 2px;
  }

  .cart-item-option {
      font-size: 12px;
      color: var(--color-primary);
      margin-bottom: var(--spacing-xs);
  }

  .cart-item-price {
      font-weight: bold;
      color: var(--color-text-primary);
  }

  .cart-item-quantity-controls {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
  }

  .qty-btn {
      background-color: var(--bg-dark-panel);
      border: 1px solid var(--border-color);
      color: var(--color-text-primary);
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
  }

  .qty-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
  }

  .qty-val {
      font-size: 14px;
      width: 20px;
      text-align: center;
  }

  .cart-footer {
      padding: var(--spacing-md);
      border-top: 1px solid var(--border-color);
      background-color: var(--bg-dark-card);
  }

  .cart-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: var(--spacing-md);
  }

  .cart-total-price {
      color: var(--color-primary);
  }

  .checkout-btn {
      width: 100%;
      background-color: var(--color-primary);
      border: none;
      color: var(--color-text-primary);
      padding: var(--spacing-md);
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: var(--transition-smooth);
  }

  .checkout-btn:disabled {
      background-color: var(--bg-dark-card);
      border: 1px solid var(--border-color);
      color: var(--color-text-muted);
      cursor: not-allowed;
  }

  .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.6);
      z-index: 150;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
  }

  .sidebar-overlay.active {
      opacity: 1;
      pointer-events: auto;
  }
  ```

- [ ] **Step 3: Create css/components/modal.css**
  Layout properties for popups, forms inputs, radio switches and transitions.
  
  Code for `css/components/modal.css`:
  ```css
  .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      z-index: 300;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
  }

  .modal.open {
      opacity: 1;
      pointer-events: auto;
  }

  .modal-content {
      background-color: var(--bg-dark-panel);
      border: 1px solid var(--border-color);
      padding: var(--spacing-xl);
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      position: relative;
      animation: modalSlide 0.3s ease;
  }

  @keyframes modalSlide {
      from { transform: translateY(20px); }
      to { transform: translateY(0); }
  }

  .modal-close-btn {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: 28px;
      cursor: pointer;
  }

  .modal-content h2 {
      font-size: 22px;
      margin-bottom: var(--spacing-sm);
      color: var(--color-primary);
  }

  .modal-content p {
      color: var(--color-text-secondary);
      font-size: 14px;
      margin-bottom: var(--spacing-lg);
  }

  .branch-options {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
  }

  .branch-option-btn {
      background-color: var(--bg-dark-card);
      border: 1px solid var(--border-color);
      color: var(--color-text-primary);
      padding: var(--spacing-md);
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      display: flex;
      flex-direction: column;
      transition: var(--transition-smooth);
  }

  .branch-option-btn:hover {
      border-color: var(--color-primary);
      background-color: rgba(255, 107, 0, 0.05);
  }

  .branch-option-btn strong {
      font-size: 16px;
      margin-bottom: 4px;
  }

  .branch-option-btn span {
      font-size: 12px;
      color: var(--color-text-secondary);
  }

  /* Form layouts */
  .form-group {
      margin-bottom: var(--spacing-md);
  }

  .form-group label {
      display: block;
      font-size: 14px;
      margin-bottom: var(--spacing-xs);
      color: var(--color-text-secondary);
  }

  .form-group input, .form-group textarea {
      width: 100%;
      background-color: var(--bg-dark-card);
      border: 1px solid var(--border-color);
      color: var(--color-text-primary);
      padding: var(--spacing-md);
      border-radius: 8px;
      font-family: var(--font-body);
  }

  .form-group input:focus, .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
  }

  .delivery-methods {
      display: flex;
      gap: var(--spacing-lg);
      background-color: var(--bg-dark-card);
      padding: var(--spacing-md);
      border-radius: 8px;
      border: 1px solid var(--border-color);
  }

  .radio-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
  }

  .radio-label input {
      width: auto;
  }

  .modal-info-box {
      background-color: rgba(255, 107, 0, 0.1);
      border: 1px solid rgba(255, 107, 0, 0.2);
      color: var(--color-text-primary);
      padding: var(--spacing-md);
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: var(--spacing-lg);
      text-align: center;
  }

  .submit-order-btn {
      width: 100%;
      background-color: var(--color-primary);
      border: none;
      color: var(--color-text-primary);
      padding: var(--spacing-md);
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: var(--transition-smooth);
  }

  .submit-order-btn:hover {
      background-color: var(--color-secondary);
  }
  ```

- [ ] **Step 4: Create css/responsive.css**
  Mobile layout tweaks for columns, paddings and font scale.
  
  Code for `css/responsive.css`:
  ```css
  @media (max-width: 768px) {
      .hero h1 {
          font-size: 32px;
      }
      
      .hero p {
          font-size: 14px;
      }
      
      .cart-sidebar {
          max-width: 100%;
          right: -100%;
      }
      
      .products-grid {
          grid-template-columns: 1fr;
      }
      
      .modal-content {
          padding: var(--spacing-lg);
      }
  }
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add css/components/cart.css css/components/modal.css css/responsive.css
  git commit -m "feat: add styles for modular cart drawer, modal structures, and responsive layouts"
  ```

---

### Task 4: Branches State Module

**Files:**
- Create: `js/branches.js`

- [ ] **Step 1: Write branches.js logic**
  Model sucursal phone numbers, physical addresses, names, and persistent local storage updates.
  
  Code for `js/branches.js`:
  ```javascript
  // Data for the 3 branches
  export const branches = {
      centro: {
          name: "Sucursal Centro",
          phone: "525551234567", // Format: countrycode + number
          address: "Av. Juárez #105, Col. Centro"
      },
      norte: {
          name: "Sucursal Norte",
          phone: "525559876543",
          address: "Blvd. Bernardo Quintana #450"
      },
      sur: {
          name: "Sucursal Sur",
          phone: "525555555555",
          address: "Av. Constituyentes #209"
      }
  };

  const BRANCH_KEY = "spicywings_active_branch";

  // Get active branch key from localStorage or return null
  export function getActiveBranchKey() {
      return localStorage.getItem(BRANCH_KEY);
  }

  // Get full active branch object
  export function getActiveBranch() {
      const key = getActiveBranchKey();
      return key ? branches[key] : null;
  }

  // Set active branch and persist to localStorage
  export function setActiveBranch(branchKey) {
      if (branches[branchKey]) {
          localStorage.setItem(BRANCH_KEY, branchKey);
          updateBranchIndicatorUI(branchKey);
          return true;
      }
      return false;
  }

  // Update navbar/headers and modal descriptions
  export function updateBranchIndicatorUI(branchKey) {
      const indicator = document.getElementById("active-branch-indicator");
      const modalBranchName = document.getElementById("modal-active-branch-name");
      const branch = branches[branchKey];
      
      if (branch) {
          if (indicator) {
              indicator.textContent = `📍 ${branch.name}`;
          }
          if (modalBranchName) {
              modalBranchName.textContent = `${branch.name} (${branch.address})`;
          }
      }
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add js/branches.js
  git commit -m "feat: construct branch management module and persistent storage logic"
  ```

---

### Task 5: Cart Operations Module

**Files:**
- Create: `js/cart.js`

- [ ] **Step 1: Implement cart operations script**
  Provide state management, count changes, UI rendering updates and quantity actions.
  
  Code for `js/cart.js`:
  ```javascript
  // Cart state array of items
  // Format: { id, name, price, qty, option }
  let cart = [];

  export function getCart() {
      return cart;
  }

  export function addToCart(id, name, price, option = "") {
      // Find matching item with same option (sauce)
      const existingItem = cart.find(item => item.id === id && item.option === option);
      
      if (existingItem) {
          existingItem.qty += 1;
      } else {
          cart.push({ id, name, price: parseFloat(price), qty: 1, option });
      }
      
      updateCartUI();
  }

  export function changeQty(id, option, delta) {
      const idx = cart.findIndex(item => item.id === id && item.option === option);
      if (idx !== -1) {
          cart[idx].qty += delta;
          if (cart[idx].qty <= 0) {
              cart.splice(idx, 1);
          }
          updateCartUI();
      }
  }

  export function getCartTotal() {
      return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  export function getCartCount() {
      return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  export function updateCartUI() {
      const container = document.getElementById("cart-items-container");
      const badge = document.getElementById("cart-badge");
      const totalPriceEl = document.getElementById("cart-total-price");
      const checkoutBtn = document.getElementById("checkout-btn");
      
      if (!container) return;
      
      // Update badge
      const totalCount = getCartCount();
      if (badge) badge.textContent = totalCount;
      
      // Toggle checkout button state
      if (checkoutBtn) {
          checkoutBtn.disabled = totalCount === 0;
      }
      
      // Empty check
      if (cart.length === 0) {
          container.innerHTML = `<div class="cart-empty-message">Tu carrito está vacío 🍗</div>`;
          if (totalPriceEl) totalPriceEl.textContent = "$0.00 MXN";
          return;
      }
      
      // Populate items list
      container.innerHTML = cart.map(item => `
          <div class="cart-item">
              <div class="cart-item-details">
                  <h4>${item.name}</h4>
                  ${item.option ? `<p class="cart-item-option">Salsa: ${item.option}</p>` : ""}
                  <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)} MXN</span>
              </div>
              <div class="cart-item-quantity-controls">
                  <button class="qty-btn" data-id="${item.id}" data-option="${item.option}" data-action="dec">-</button>
                  <span class="qty-val">${item.qty}</span>
                  <button class="qty-btn" data-id="${item.id}" data-option="${item.option}" data-action="inc">+</button>
              </div>
          </div>
      `).join("");
      
      // Setup events on dynamically created quantity buttons
      container.querySelectorAll(".qty-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
              const id = btn.getAttribute("data-id");
              const option = btn.getAttribute("data-option");
              const action = btn.getAttribute("data-action");
              const delta = action === "inc" ? 1 : -1;
              changeQty(id, option, delta);
          });
      });
      
      if (totalPriceEl) {
          totalPriceEl.textContent = `$${getCartTotal().toFixed(2)} MXN`;
      }
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add js/cart.js
  git commit -m "feat: complete interactive cart state and dynamic listing DOM rendering"
  ```

---

### Task 6: WhatsApp Link Builder & Flow Orchestration

**Files:**
- Create: `js/whatsapp.js`
- Create: `js/main.js`

- [ ] **Step 1: Write WhatsApp message generator module**
  Format items lists and totals, build redirect URLs.
  
  Code for `js/whatsapp.js`:
  ```javascript
  import { getCart, getCartTotal } from "./cart.js";
  import { getActiveBranch } from "./branches.js";

  export function sendOrderToWhatsApp(customerName, method, address = "", notes = "") {
      const activeBranch = getActiveBranch();
      if (!activeBranch) {
          alert("Por favor, selecciona una sucursal primero.");
          return;
      }

      const cart = getCart();
      const total = getCartTotal();

      // Construction of formatted message
      let msg = `🍗 *¡NUEVO PEDIDO - SPICY WINGS!* 🍗\n`;
      msg += `--------------------------------------\n`;
      msg += `👤 *Cliente:* ${customerName}\n`;
      msg += `📍 *Método:* ${method === "recoger" ? `Para Recoger (${activeBranch.name})` : "Envío a Domicilio"}\n`;
      if (method === "domicilio" && address) {
          msg += `🏠 *Dirección:* ${address}\n`;
      }
      msg += `\n📋 *Detalle del Pedido:*\n`;

      cart.forEach(item => {
          const sauceText = item.option ? ` (Salsa: ${item.option})` : "";
          msg += `• ${item.qty}x ${item.name}${sauceText} - $${(item.price * item.qty).toFixed(2)} MXN\n`;
      });

      msg += `\n💰 *Total a Pagar:* $${total.toFixed(2)} MXN\n`;
      msg += `--------------------------------------\n`;
      if (notes) {
          msg += `💬 *Notas:* ${notes}\n`;
      }
      msg += `\n¡Espero su confirmación!`;

      // Build WhatsApp wa.me URL
      const encodedMsg = encodeURIComponent(msg);
      const url = `https://wa.me/${activeBranch.phone}?text=${encodedMsg}`;

      // Open in a new tab
      window.open(url, "_blank");
  }
  ```

- [ ] **Step 2: Create main.js as the global events coordinator**
  Connect page loaders, sucursal popup handlers, drawer states, checkout clicks and selectors.
  
  Code for `js/main.js`:
  ```javascript
  import { getActiveBranchKey, setActiveBranch, branches } from "./branches.js";
  import { addToCart, updateCartUI } from "./cart.js";
  import { sendOrderToWhatsApp } from "./whatsapp.js";

  document.addEventListener("DOMContentLoaded", () => {
      // Elements
      const branchModal = document.getElementById("branch-modal");
      const checkoutModal = document.getElementById("checkout-modal");
      const checkoutCloseBtn = document.getElementById("checkout-close-btn");
      const activeBranchIndicator = document.getElementById("active-branch-indicator");
      
      const cartSidebar = document.getElementById("cart-sidebar");
      const cartToggleBtn = document.getElementById("cart-toggle-btn");
      const cartCloseBtn = document.getElementById("cart-close-btn");
      const sidebarOverlay = document.getElementById("sidebar-overlay");
      
      const checkoutBtn = document.getElementById("checkout-btn");
      const checkoutForm = document.getElementById("checkout-form");
      const deliveryMethodRadios = document.getElementsByName("delivery-method");
      const addressGroup = document.getElementById("address-group");
      const customerAddress = document.getElementById("customer-address");

      // Check for active branch in localStorage
      const savedBranch = getActiveBranchKey();
      if (!savedBranch) {
          // Open branch modal forcibly
          branchModal.classList.add("open");
      } else {
          setActiveBranch(savedBranch);
      }

      // Branch selection action
      document.querySelectorAll(".branch-option-btn").forEach(btn => {
          btn.addEventListener("click", () => {
              const selectedBranch = btn.getAttribute("data-branch");
              setActiveBranch(selectedBranch);
              branchModal.classList.remove("open");
          });
      });

      // Show/Hide active branch indicator triggers modal
      activeBranchIndicator.addEventListener("click", () => {
          branchModal.classList.add("open");
      });

      // Cart sidebar toggle controls
      const openCart = () => {
          cartSidebar.classList.add("open");
          sidebarOverlay.classList.add("active");
      };
      
      const closeCart = () => {
          cartSidebar.classList.remove("open");
          sidebarOverlay.classList.remove("active");
      };

      cartToggleBtn.addEventListener("click", openCart);
      cartCloseBtn.addEventListener("click", closeCart);
      sidebarOverlay.addEventListener("click", closeCart);

      // Add products to cart action
      document.querySelectorAll(".product-card").forEach(card => {
          const addBtn = card.querySelector(".add-to-cart-btn");
          if (!addBtn) return;
          
          addBtn.addEventListener("click", () => {
              const id = card.getAttribute("data-id");
              const name = card.getAttribute("data-name");
              const price = card.getAttribute("data-price");
              
              // Extract sauce option if present
              const sauceSelect = card.querySelector(".sauce-select");
              const option = sauceSelect ? sauceSelect.value : "";
              
              addToCart(id, name, price, option);
              openCart();
          });
      });

      // Checkout form interactions
      checkoutBtn.addEventListener("click", () => {
          // Close cart Drawer first
          closeCart();
          // Open Checkout modal
          checkoutModal.classList.add("open");
      });

      checkoutCloseBtn.addEventListener("click", () => {
          checkoutModal.classList.remove("open");
      });

      // Delivery details display switch
      deliveryMethodRadios.forEach(radio => {
          radio.addEventListener("change", (e) => {
              if (e.target.value === "domicilio") {
                  addressGroup.style.display = "block";
                  customerAddress.required = true;
              } else {
                  addressGroup.style.display = "none";
                  customerAddress.required = false;
                  customerAddress.value = "";
              }
          });
      });

      // Submit form
      checkoutForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const name = document.getElementById("customer-name").value;
          const method = document.querySelector('input[name="delivery-method"]:checked').value;
          const address = customerAddress.value;
          const notes = document.getElementById("customer-notes").value;

          sendOrderToWhatsApp(name, method, address, notes);
          checkoutModal.classList.remove("open");
      });

      // Trigger initial UI rendering empty cart
      updateCartUI();
  });
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add js/whatsapp.js js/main.js
  git commit -m "feat: complete UI coordination and WhatsApp checkout generation redirection"
  ```

---

## Verification Plan

### Manual Verification
1. Open the project root in a browser environment.
2. Verify that:
   - The Branch Selection modal is displayed and blocks interactions.
   - Clicking a branch sets it correctly, saves state in local storage, and closes the modal.
3. Test Cart:
   - Add "Alitas (10 piezas)" selecting Buffalo sauce. Verify it shows in cart drawer.
   - Add another "Alitas (10 piezas)" but selecting Lemon Pepper sauce. Verify they are two separate items.
   - Increment Lemon Pepper and decrement Buffalo. Check totals.
4. Test WhatsApp:
   - Click "Continuar Pedido" button. Verify checkout modal opens.
   - Fill form as Pickup, click WhatsApp order.
   - Verify it opens standard `https://wa.me/` matching the selected branch number, containing the formatted menu details in text encoding.
