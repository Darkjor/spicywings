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
