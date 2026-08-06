// Lógica del punto de venta en tablet (/point-demo): carrito, creación del
// cobro vía POST /api/point/orders, y polling de su estado cada 2s hasta que
// la terminal Point lo confirma. Marca, colores y menú se cargan desde
// data/business.json y data/menu.json — no hay nada de negocio hardcodeado
// aquí.
(() => {
    let cart = [];
    let currentOrderId = null;
    let pollTimer = null;
    let simulateAvailable = true;

    const menuEl = document.getElementById('point-menu');
    const orderItemsEl = document.getElementById('order-items');
    const orderTotalEl = document.getElementById('order-total');
    const payBtn = document.getElementById('pay-btn');

    const buildView = document.getElementById('order-build-view');
    const statusView = document.getElementById('order-status-view');
    const statusPulse = document.getElementById('status-pulse');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusSub = document.getElementById('status-sub');
    const simulateBox = document.getElementById('simulate-box');
    const simulateBtn = document.getElementById('simulate-btn');
    const manualConfirmBox = document.getElementById('manual-confirm-box');
    const manualConfirmBtn = document.getElementById('manual-confirm-btn');
    const newOrderBtn = document.getElementById('new-order-btn');
    const modeNotice = document.getElementById('mode-notice');
    const receiptBox = document.getElementById('receipt-box');
    const receiptQr = document.getElementById('receipt-qr');
    let receiptRenderedFor = null;

    // Nombre del negocio: se carga desde data/business.json (personalízalo ahí, no aquí)
    fetch('data/business.json')
        .then(res => res.json())
        .then(business => {
            modeNotice.textContent = `Punto de venta ${business.name}: al pagar, el cobro se envía directo a la terminal Mercado Pago Point en sucursal.`;
            document.title = `${business.name} - Pedido en Tablet`;
            const logoAccent = document.querySelector('.logo-accent');
            const logoRest = logoAccent ? logoAccent.nextSibling : null;
            if (logoAccent) logoAccent.textContent = business.logoAccent || business.name;
            if (logoRest) logoRest.textContent = business.logoRest || '';
        })
        .catch(() => {
            modeNotice.textContent = 'Punto de venta en tablet: al pagar, el cobro se envía directo a la terminal Mercado Pago Point.';
        });

    function getCartTotal() {
        return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    function addToCart(id, name, price, option) {
        const existing = cart.find(item => item.id === id && item.option === option);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id, name, price, qty: 1, option: option || '' });
        }
        renderOrder();
    }

    function changeQty(id, option, delta) {
        const idx = cart.findIndex(item => item.id === id && item.option === option);
        if (idx === -1) return;
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        renderOrder();
    }

    function renderOrder() {
        const total = getCartTotal();
        payBtn.disabled = cart.length === 0;
        orderTotalEl.textContent = `$${total.toFixed(2)} MXN`;

        if (cart.length === 0) {
            orderItemsEl.innerHTML = '<div class="cart-empty-message">Agrega productos del menú 🍗</div>';
            return;
        }

        orderItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    ${item.option ? `<p class="cart-item-option">${item.option}</p>` : ''}
                    <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)} MXN</span>
                </div>
                <div class="cart-item-quantity-controls">
                    <button class="qty-btn" data-id="${item.id}" data-option="${item.option}" data-action="dec">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="qty-btn" data-id="${item.id}" data-option="${item.option}" data-action="inc">+</button>
                </div>
            </div>
        `).join('');

        orderItemsEl.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = btn.dataset.action === 'inc' ? 1 : -1;
                changeQty(btn.dataset.id, btn.dataset.option, delta);
            });
        });
    }

    async function loadMenu() {
        try {
            const res = await fetch('data/menu.json');
            const menu = await res.json();

            menuEl.innerHTML = menu.categories.map(category => `
                <div class="category-block">
                    <h2 class="category-title">${category.title}</h2>
                    <div class="products-grid">
                        ${category.items.map(item => `
                            <div class="product-card" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                                <div class="product-info">
                                    <h3>${item.name}</h3>
                                    <p class="product-desc">${item.description}</p>
                                    ${item.sauces.length ? `
                                        <div class="customization-wrapper">
                                            <label>Elige una opción:</label>
                                            <select class="sauce-select">
                                                ${item.sauces.map(s => `<option value="${s}">${s}</option>`).join('')}
                                            </select>
                                        </div>
                                    ` : ''}
                                    <div class="product-footer">
                                        <span class="price">$${item.price.toFixed(2)} MXN</span>
                                        <button class="add-to-cart-btn">Agregar</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            menuEl.querySelectorAll('.product-card').forEach(card => {
                const addBtn = card.querySelector('.add-to-cart-btn');
                addBtn.addEventListener('click', () => {
                    const sauceSelect = card.querySelector('.sauce-select');
                    addToCart(
                        card.dataset.id,
                        card.dataset.name,
                        parseFloat(card.dataset.price),
                        sauceSelect ? sauceSelect.value : ''
                    );
                });
            });
        } catch (error) {
            menuEl.innerHTML = '<p style="color: var(--color-secondary);">No se pudo cargar el menú.</p>';
        }
    }

    function renderReceiptQr() {
        // El polling llama setStatusView() cada 2s mientras el estado siga
        // "processed" (por ejemplo si el usuario tarda en darle "Nuevo
        // pedido") — este guard evita regenerar el mismo QR en cada tick.
        if (receiptRenderedFor === currentOrderId) return;
        receiptRenderedFor = currentOrderId;

        const receiptUrl = `${window.location.origin}/receipt/${currentOrderId}`;
        const qr = qrcode(0, 'M');
        qr.addData(receiptUrl);
        qr.make();
        receiptQr.innerHTML = qr.createImgTag(4, 8, 'Ticket de compra');
    }

    function setStatusView(status) {
        statusView.className = `point-status-screen point-status-${status}`;

        const isFinal = ['processed', 'failed', 'canceled', 'refunded'].includes(status);
        statusPulse.style.display = isFinal ? 'none' : 'block';
        simulateBox.style.display = (isFinal || !simulateAvailable) ? 'none' : 'block';
        // TEMPORAL — quitar junto con el botón después de probar el QR.
        manualConfirmBox.style.display = (isFinal || simulateAvailable) ? 'none' : 'block';
        newOrderBtn.style.display = isFinal ? 'block' : 'none';

        if (status === 'processed') {
            renderReceiptQr();
            receiptBox.style.display = 'flex';
        } else {
            receiptBox.style.display = 'none';
        }

        const config = {
            created: { icon: '💳', title: 'Enviando cobro a la terminal…', sub: 'Un momento, estamos preparando el cobro.' },
            at_terminal: { icon: '📟', title: 'Esperando pago en terminal…', sub: 'Confirma el cobro en la terminal Mercado Pago Point.' },
            action_required: { icon: '⚠️', title: 'Se requiere una acción', sub: 'Revisa la terminal, puede requerir reintentar el pago.' },
            processed: { icon: '✅', title: '¡Pago confirmado!', sub: 'El pedido fue pagado exitosamente.' },
            failed: { icon: '❌', title: 'El pago no se pudo procesar', sub: 'Intenta nuevamente con otra tarjeta.' },
            canceled: { icon: '🚫', title: 'Pago cancelado', sub: 'El cobro fue cancelado.' },
            refunded: { icon: '↩️', title: 'Pago reembolsado', sub: 'El cobro fue reembolsado.' }
        };

        const { icon, title, sub } = config[status] || config.at_terminal;
        statusIcon.textContent = icon;
        statusTitle.textContent = title;
        statusSub.textContent = sub;

        if (isFinal && pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    async function pollOrderStatus() {
        try {
            const res = await fetch(`/api/point/orders/${currentOrderId}`);
            if (!res.ok) return;
            const data = await res.json();
            simulateAvailable = Boolean(data.simulate_available);
            setStatusView(data.status);
        } catch (error) {
            // Reintenta en el siguiente tick
        }
    }

    payBtn.addEventListener('click', async () => {
        payBtn.disabled = true;
        payBtn.textContent = 'Creando cobro…';

        const description = cart.map(i => `${i.qty}x ${i.name}`).join(', ');

        try {
            const res = await fetch('/api/point/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: getCartTotal(),
                    description,
                    externalReference: `tablet-${Date.now()}`
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'No se pudo crear el cobro');

            currentOrderId = data.id;
            simulateAvailable = Boolean(data.simulate_available);
            buildView.style.display = 'none';
            statusView.style.display = 'block';
            setStatusView(data.status);

            pollTimer = setInterval(pollOrderStatus, 2000);
        } catch (error) {
            alert('Error al iniciar el cobro con Mercado Pago Point: ' + error.message);
            payBtn.disabled = false;
            payBtn.textContent = '💳 Pagar con tarjeta';
        }
    });

    simulateBtn.addEventListener('click', async () => {
        simulateBtn.disabled = true;
        simulateBtn.textContent = 'Simulando…';

        try {
            const res = await fetch(`/api/point/orders/${currentOrderId}/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'processed' })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'No se pudo simular el pago');
            }
        } catch (error) {
            alert('Error al simular el pago: ' + error.message);
        } finally {
            simulateBtn.disabled = false;
            simulateBtn.textContent = '✅ Simular pago exitoso';
        }
    });

    // TEMPORAL — quitar este bloque completo después de probar el QR.
    // No llama a Mercado Pago ni al backend: solo fuerza la pantalla local
    // a "procesado" para poder ver el QR sin esperar/generar un cobro real.
    manualConfirmBtn.addEventListener('click', () => {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        setStatusView('processed');
    });

    newOrderBtn.addEventListener('click', () => {
        cart = [];
        currentOrderId = null;
        receiptRenderedFor = null;
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        renderOrder();
        payBtn.disabled = true;
        payBtn.textContent = '💳 Pagar con tarjeta';
        statusView.style.display = 'none';
        buildView.style.display = 'block';
    });

    loadMenu();
    renderOrder();
})();
