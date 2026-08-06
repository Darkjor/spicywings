// Lógica del panel de administración (/admin): reporte de ventas del día
// (GET /admin/api/sales-today) y configuración actual en solo lectura
// (data/business.json y data/menu.json, mismo patrón fetch() que usan
// index.html y js/point-demo.js — estos JSON ya son estáticos/públicos).
// No hay edición/guardado aquí a propósito, ver nota en admin.html.
(() => {
    const salesReportEl = document.getElementById('sales-report');
    const businessConfigEl = document.getElementById('business-config');
    const menuConfigEl = document.getElementById('menu-config');

    function formatCurrency(amount) {
        const value = Number(amount) || 0;
        return `$${value.toFixed(2)} MXN`;
    }

    function formatTime(isoString) {
        if (!isoString) return '—';
        try {
            return new Date(isoString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '—';
        }
    }

    async function loadSalesReport() {
        try {
            const res = await fetch('/admin/api/sales-today');
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `El servidor respondió ${res.status}`);
            }
            const data = await res.json();
            renderSalesReport(data);
        } catch (error) {
            salesReportEl.innerHTML = `<p class="admin-error-state">No se pudo cargar el reporte de ventas: ${escapeHtml(error.message)}</p>`;
        }
    }

    function renderSalesReport(data) {
        const orders = Array.isArray(data.orders) ? data.orders : [];

        const summaryHtml = `
            <div class="admin-summary-row">
                <div class="admin-summary-card">
                    <div class="admin-summary-label">Total del día</div>
                    <div class="admin-summary-value">${formatCurrency(data.total)}</div>
                </div>
                <div class="admin-summary-card">
                    <div class="admin-summary-label">Órdenes pagadas</div>
                    <div class="admin-summary-value">${Number(data.count) || 0}</div>
                </div>
            </div>
        `;

        if (orders.length === 0) {
            salesReportEl.innerHTML = `${summaryHtml}<p class="admin-empty-state">Todavía no hay ventas confirmadas hoy.</p>`;
            return;
        }

        const rowsHtml = orders.map(order => `
            <tr>
                <td>${escapeHtml(order.external_reference || order.id || '—')}</td>
                <td>${escapeHtml(formatTime(order.date_created))}</td>
                <td class="admin-amount">${formatCurrency(order.amount)}</td>
            </tr>
        `).join('');

        salesReportEl.innerHTML = `
            ${summaryHtml}
            <table class="admin-orders-table">
                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Hora</th>
                        <th>Monto</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
    }

    async function loadConfig(url, targetEl) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
            const data = await res.json();
            targetEl.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            targetEl.textContent = `No se pudo cargar ${url}: ${error.message}`;
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    loadSalesReport();
    loadConfig('/data/business.json', businessConfigEl);
    loadConfig('/data/menu.json', menuConfigEl);
})();
