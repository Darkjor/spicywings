// --- BRANCHES LOGIC ---
const branches = {
    centro: {
        name: "Sucursal Centro",
        phone: "523317037056", // Número WhatsApp correcto
        address: "Av. Juárez #105, Col. Centro"
    },
    norte: {
        name: "Sucursal Norte",
        phone: "523317037056", // Número WhatsApp correcto
        address: "Blvd. Bernardo Quintana #450"
    },
    sur: {
        name: "Sucursal Sur",
        phone: "523317037056", // Número WhatsApp correcto
        address: "Av. Constituyentes #209"
    }
};

const BRANCH_KEY = "spicywings_active_branch";

function getActiveBranchKey() {
    return localStorage.getItem(BRANCH_KEY);
}

function getActiveBranch() {
    const key = getActiveBranchKey();
    return key ? branches[key] : null;
}

function setActiveBranch(branchKey) {
    if (branches[branchKey]) {
        localStorage.setItem(BRANCH_KEY, branchKey);
        updateBranchIndicatorUI(branchKey);
        return true;
    }
    return false;
}

function updateBranchIndicatorUI(branchKey) {
    const indicator = document.getElementById("active-branch-indicator");
    const modalBranchName = document.getElementById("modal-active-branch-name");
    const branch = branches[branchKey];
    
    if (branch) {
        if (indicator) {
            indicator.textContent = `\uD83D\uDCCD ${branch.name}`;
        }
        if (modalBranchName) {
            modalBranchName.textContent = `${branch.name} (${branch.address})`;
        }
    }
}

// --- CART LOGIC ---
let cart = [];

function getCart() {
    return cart;
}

function addToCart(id, name, price, option = "") {
    const existingItem = cart.find(item => item.id === id && item.option === option);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id, name, price: parseFloat(price), qty: 1, option });
    }
    
    updateCartUI();
}

function changeQty(id, option, delta) {
    const idx = cart.findIndex(item => item.id === id && item.option === option);
    if (idx !== -1) {
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) {
            cart.splice(idx, 1);
        }
        updateCartUI();
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartUI() {
    const container = document.getElementById("cart-items-container");
    const badge = document.getElementById("cart-badge");
    const totalPriceEl = document.getElementById("cart-total-price");
    const checkoutBtn = document.getElementById("checkout-btn");
    
    if (!container) return;
    
    const totalCount = getCartCount();
    if (badge) badge.textContent = totalCount;
    
    if (checkoutBtn) {
        checkoutBtn.disabled = totalCount === 0;
    }
    
    if (cart.length === 0) {
        container.innerHTML = `<div class="cart-empty-message">Tu carrito est\u00E1 vac\u00EDo \uD83C\uDF57</div>`;
        if (totalPriceEl) totalPriceEl.textContent = "$0.00 MXN";
        return;
    }
    
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

// --- WHATSAPP REDIRECTION LOGIC ---
function sendOrderToWhatsApp(customerName, method, address = "", notes = "") {
    const activeBranch = getActiveBranch();
    if (!activeBranch) {
        alert("Por favor, selecciona una sucursal primero.");
        return;
    }

    const currentCart = getCart();
    const total = getCartTotal();

    let msg = `\uD83C\uDF57 *\u00A1NUEVO PEDIDO - SPICY WINGS!* \uD83C\uDF57\n`;
    msg += `--------------------------------------\n`;
    msg += `\uD83D\uDC64 *Cliente:* ${customerName}\n`;
    msg += `\uD83D\uDCCD *M\u00E9todo:* ${method === "recoger" ? `Para Recoger (${activeBranch.name})` : "Env\u00EDo a Domicilio"}\n`;
    if (method === "domicilio" && address) {
        msg += `\uD83C\uDFE0 *Direcci\u00F3n:* ${address}\n`;
    }
    msg += `\n\uD83D\uDCCB *Detalle del Pedido:*\n`;

    currentCart.forEach(item => {
        const sauceText = item.option ? ` (Salsa: ${item.option})` : "";
        msg += `\u2022 ${item.qty}x ${item.name}${sauceText} - $${(item.price * item.qty).toFixed(2)} MXN\n`;
    });

    msg += `\n\uD83D\uDCB0 *Total a Pagar:* $${total.toFixed(2)} MXN\n`;
    msg += `--------------------------------------\n`;
    if (notes) {
        msg += `\uD83D\uDCAC *Notas:* ${notes}\n`;
    }
    msg += `\n\u00A1Espero su confirmaci\u00F3n!`;

    const encodedMsg = encodeURIComponent(msg);
    // Abrir app móvil de WhatsApp directamente (sin WhatsApp Web)
    window.location.href = `whatsapp://send?phone=${activeBranch.phone}&text=${encodedMsg}`;
}

// --- GLOBAL EVENT COORDINATION ---
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
        // Set Centro as the default branch on first load
        setActiveBranch("centro");
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
        closeCart();
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
