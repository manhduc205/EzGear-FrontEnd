let transactions = [];
let filteredTransactions = [];
let warehouses = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;
    
    await loadSidebar();
    loadUserInfo();
    setDefaultDateRange();
    await loadWarehouses();
    await loadTransactions();
    updateStats();
    
    // Add real-time search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounceSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilter();
            }
        });
    }
    
    // Add date change listeners
    document.getElementById('fromDate')?.addEventListener('change', applyFilter);
    document.getElementById('toDate')?.addEventListener('change', applyFilter);
});

// Debounce search function
let searchTimeout;
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilter();
    }, 500); // Search after 500ms of no typing
}

// Set default date range (from 2024)
function setDefaultDateRange() {
    const today = new Date();
    const startDate = new Date('2024-01-01');
    
    document.getElementById('fromDate').valueAsDate = startDate;
    document.getElementById('toDate').valueAsDate = today;
}

// Load warehouses for dropdown
async function loadWarehouses() {
    try {
        const response = await fetch(`${BASE_URL}/warehouses`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            warehouses = await response.json();
            populateWarehousesDropdown();
        }
    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
}

// Populate warehouses dropdown
function populateWarehousesDropdown() {
    const select = document.getElementById('warehouseSelect');
    select.innerHTML = '<option value="">Tất cả kho hàng</option>';
    
    warehouses.forEach(warehouse => {
        const option = document.createElement('option');
        option.value = warehouse.id;
        option.textContent = warehouse.name;
        select.appendChild(option);
    });
}

// Load stock transactions
async function loadTransactions() {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/stock-transactions`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        console.log('Stock transactions response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Stock transactions error:', errorText);
            throw new Error('Failed to load transactions');
        }
        
        const data = await response.json();
        console.log('Stock transactions data:', data);
        
        // Backend trả về array trực tiếp
        transactions = Array.isArray(data) ? data : (data.payload || []);
        filteredTransactions = [...transactions];
        
        renderTransactions();
        updateStats();
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Lỗi tải dữ liệu giao dịch: ' + error.message, 'error');
        document.getElementById('transactionsTableBody').innerHTML = `
            <tr>
                <td colspan="11" class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
                    <p>Không thể tải dữ liệu. Vui lòng kiểm tra kết nối API.</p>
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

// Render transactions table
function renderTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Không có giao dịch nào</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredTransactions.map(transaction => {
        // Map API response fields
        const productName = transaction.productVariant || transaction.productName || 'N/A';
        const sku = transaction.sku || 'N/A';
        const warehouse = transaction.warehouseName || 'N/A';
        const transactionType = transaction.transactionType || 'N/A';
        const time = transaction.time || transaction.timestamp || new Date().toISOString();
        const quantity = transaction.quantity || 0;
        const stockBefore = transaction.stockBefore != null ? transaction.stockBefore : '-';
        const stockAfter = transaction.stockAfter != null ? transaction.stockAfter : '-';
        const purchasePrice = transaction.purchasePrice || 0;
        const retailPrice = transaction.retailPrice || 0;
        const agent = transaction.agent || 'System';
        
        // Determine type styling
        const isImport = transactionType.includes('Nhập') || quantity > 0;
        const typeClass = isImport ? 'type-import' : 'type-export';
        const quantityClass = quantity > 0 ? 'positive' : 'negative';
        const quantityPrefix = quantity > 0 ? '+' : '';
        
        return `
            <tr>
                <td>${formatDateTime(time)}</td>
                <td>
                    ${transaction.imageUrl ? `<img src="${transaction.imageUrl}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;">` : ''}
                    <strong>${productName}</strong>
                </td>
                <td><code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem;">${sku}</code></td>
                <td>${warehouse}</td>
                <td><span class="transaction-type ${typeClass}">${transactionType}</span></td>
                <td style="text-align: center; color: #999;">${stockBefore}</td>
                <td><span class="quantity-change ${quantityClass}">${quantityPrefix}${quantity}</span></td>
                <td style="text-align: center; font-weight: 600; color: #2c3e50;">${stockAfter}</td>
                <td>${formatCurrency(purchasePrice)}</td>
                <td>${formatCurrency(retailPrice)}</td>
                <td>${agent}</td>
            </tr>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.time || t.timestamp);
        transDate.setHours(0, 0, 0, 0);
        return transDate.getTime() === today.getTime();
    });
    
    // Count by quantity (positive = import, negative = export)
    const importCount = transactions.filter(t => (t.quantity || 0) > 0).length;
    const exportCount = transactions.filter(t => (t.quantity || 0) < 0).length;
    const adjustCount = transactions.filter(t => (t.quantity || 0) === 0).length;
    
    const todayImport = todayTransactions.filter(t => (t.quantity || 0) > 0).length;
    const todayExport = todayTransactions.filter(t => (t.quantity || 0) < 0).length;
    const todayAdjust = todayTransactions.filter(t => (t.quantity || 0) === 0).length;
    
    document.getElementById('totalImport').textContent = importCount;
    document.getElementById('totalExport').textContent = exportCount;
    document.getElementById('totalAdjust').textContent = adjustCount;
    document.getElementById('totalTransactions').textContent = transactions.length;
    
    document.getElementById('importChange').textContent = `+${todayImport} hôm nay`;
    document.getElementById('exportChange').textContent = `-${todayExport} hôm nay`;
    document.getElementById('adjustChange').textContent = `${todayAdjust} hôm nay`;
}

// Apply filter
function applyFilter() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredTransactions = transactions.filter(transaction => {
        let matchesDateFilter = true;
        let matchesSearchFilter = true;
        
        // Date filter
        if (fromDate && toDate) {
            const transDate = new Date(transaction.time || transaction.timestamp);
            const from = new Date(fromDate);
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            
            matchesDateFilter = transDate >= from && transDate <= to;
        }
        
        // Search filter - search across multiple fields
        if (searchTerm) {
            const productVariant = (transaction.productVariant || transaction.productName || '').toLowerCase();
            const sku = (transaction.sku || '').toLowerCase();
            const barcode = (transaction.barcode || '').toLowerCase();
            const agent = (transaction.agent || '').toLowerCase();
            const warehouse = (transaction.warehouseName || '').toLowerCase();
            const transactionType = (transaction.transactionType || '').toLowerCase();
            
            matchesSearchFilter = productVariant.includes(searchTerm) ||
                                 sku.includes(searchTerm) ||
                                 barcode.includes(searchTerm) ||
                                 agent.includes(searchTerm) ||
                                 warehouse.includes(searchTerm) ||
                                 transactionType.includes(searchTerm);
        }
        
        // Both filters must match
        return matchesDateFilter && matchesSearchFilter;
    });
    
    renderTransactions();
    showToast(`Đã lọc ${filteredTransactions.length}/${transactions.length} giao dịch`, 'success');
}

// Reset filter
function resetFilter() {
    setDefaultDateRange();
    document.getElementById('searchInput').value = '';
    
    filteredTransactions = [...transactions];
    renderTransactions();
    showToast('Đã đặt lại bộ lọc', 'success');
}

// Export to Excel
function exportToExcel() {
    if (filteredTransactions.length === 0) {
        showToast('Không có dữ liệu để xuất', 'error');
        return;
    }
    
    // Create CSV content with new API field structure
    let csv = 'Thời Gian,Sản Phẩm,SKU,Barcode,Số Lượng,Khả Dụng,Đã Đặt,Buffer,Giá Nhập,Giá Bán,Người Thực Hiện\n';
    
    filteredTransactions.forEach(t => {
        const productName = t.productVariant || t.productName || 'N/A';
        const time = t.time || t.timestamp || new Date().toISOString();
        
        csv += `${formatDateTime(time)},"${productName}",${t.sku || 'N/A'},${t.barcode || 'N/A'},${t.quantity || 0},${t.available || 0},${t.reserved || 0},${t.buffer || 0},${formatCurrency(t.purchasePrice || 0)},${formatCurrency(t.retailPrice || 0)},${t.agent || 'N/A'}\n`;
    });
    
    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Đã xuất file Excel thành công', 'success');
}
