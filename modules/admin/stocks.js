let stocks = [];
let filteredStocks = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;
    await loadSidebar();
    loadUserInfo();
    await loadStocks();
});

async function loadStocks() {
    showLoading(true);
    try {
        const res = await fetch(`${BASE_URL}/stocks`, { 
            headers: getAuthHeaders() 
        });
        
        console.log('Stocks response status:', res.status);
        
        if (!res.ok) {
            const text = await res.text();
            console.error('Stocks error:', text);
            throw new Error('Failed to load stocks');
        }
        
        const data = await res.json();
        console.log('Stocks data:', data);
        
        // API returns direct array
        stocks = Array.isArray(data) ? data : [];
        filteredStocks = [...stocks];
        renderStocks();
        
    } catch (err) {
        console.error('Error loading stocks:', err);
        showToast('Lỗi tải tồn kho: ' + err.message, 'error');
        document.getElementById('stocksTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#999;">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem; color:#ff6b6b;"></i>
                    <p style="margin-top:10px">Không thể tải dữ liệu tồn kho. Kiểm tra API hoặc quyền truy cập.</p>
                </td>
            </tr>`;
    } finally {
        showLoading(false);
    }
}

function renderStocks() {
    const tbody = document.getElementById('stocksTableBody');
    if (!filteredStocks || filteredStocks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#999;">
                    <i class="fas fa-warehouse" style="font-size:2rem; color:#ccc;"></i>
                    <p style="margin-top:10px">Chưa có dữ liệu tồn kho</p>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredStocks.map((s, index) => {
        const qtyOnHand = s.qtyOnHand || 0;
        const qtyReserved = s.qtyReserved || 0;
        const safetyStock = s.safetyStock || 0;
        const available = s.available || 0;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong style="font-family: 'Courier New', monospace; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem;">${s.sku || 'N/A'}</strong></td>
                <td style="font-weight: 500;">${s.skuName || 'N/A'}</td>
                <td>${s.warehouseName || 'N/A'}</td>
                <td class="stock-qty">${qtyOnHand}</td>
                <td>${qtyReserved}</td>
                <td>${safetyStock}</td>
                <td style="font-weight: 600; color: ${available > 0 ? '#11998e' : '#ff6b6b'};">
                    ${available}
                </td>
            </tr>`;
    }).join('');
}

function handleSearch() {
    const term = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!term) {
        filteredStocks = [...stocks];
    } else {
        filteredStocks = stocks.filter(s => {
            const sku = (s.sku || '').toString().toLowerCase();
            const name = (s.skuName || '').toLowerCase();
            const warehouse = (s.warehouseName || '').toLowerCase();
            return sku.includes(term) || name.includes(term) || warehouse.includes(term);
        });
    }
    
    renderStocks();
}