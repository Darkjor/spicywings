import { getActiveBranchKey, setActiveBranch } from "./branches.js";
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
