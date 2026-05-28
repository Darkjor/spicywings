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

    // Abrir directo la app móvil de WhatsApp (sin fallback a WhatsApp Web)
    const encodedMsg = encodeURIComponent(msg);
    window.location.href = `whatsapp://send?phone=${activeBranch.phone}&text=${encodedMsg}`;
}
