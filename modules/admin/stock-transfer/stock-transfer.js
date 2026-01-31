/* ==================== STOCK TRANSFER MANAGEMENT JS ==================== */

// ==================== CONSTANTS & STATE ====================
// BASE_URL is already defined in admin-common.js
const TRANSFERS_API = BASE_URL + '/stock-transfers';
const WAREHOUSES_API = BASE_URL + '/warehouses';
const PRODUCT_SEARCH_API = BASE_URL + '/product-skus/admin/search';

let state = {
    transfers: [],
    warehouses: [],
    currentTransfer: null,
    filteredTransfers: [],
    searchTimeout: null,
    selectedProducts: new Map() // Map to track selected products by skuId
};

// ==================== HTTP REQUEST HELPER ====================
async function httpRequest(url, options = {}) {
    const token = localStorage.getItem('accessToken'); // Changed from 'token' to 'accessToken'
    
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            ...options.headers
        }
    };

    if (options.body) {
        config.body = options.body;
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        // Check content type to determine how to parse response
        const contentType = response.headers.get('content-type');
        
        // If the response is text or if it's an action endpoint, return text
        if (contentType && contentType.includes('text/plain')) {
            return await response.text();
        }
        
        // Try to parse as JSON, fallback to text if it fails
        try {
            const data = await response.json();
            return data;
        } catch (e) {
            // If JSON parsing fails, return the text
            const text = await response.text();
            return text;
        }
    } catch (error) {
        console.error('HTTP Request Error:', error);
        throw error;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Stock Transfer page loaded');
    
    // admin-common.js will handle authentication check
    // Load sidebar and user info  
    if (typeof loadSidebar === 'function') {
        await loadSidebar();
    }
    if (typeof loadUserInfo === 'function') {
        loadUserInfo();
    }
    
    // Initial Data Load
    showLoading(true);
    try {
        await Promise.all([
            loadWarehouses(),
            loadTransfers()
        ]);
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    } finally {
        showLoading(false);
    }
    
    // Setup product search
    setupProductSearch();
});

// ==================== DATA LOADING ====================

async function loadWarehouses() {
    try {
        const data = await httpRequest(WAREHOUSES_API, {
            method: 'GET'
        });

        state.warehouses = data.payload || data || [];
        populateWarehouseSelects();
    } catch (error) {
        console.error('Error loading warehouses:', error);
        showToast('Không thể tải danh sách kho: ' + error.message, 'error');
    }
}

async function loadTransfers() {
    try {
        const data = await httpRequest(TRANSFERS_API, {
            method: 'GET'
        });

        state.transfers = data.payload || data || [];
        state.filteredTransfers = state.transfers;
        
        updateStats();
        renderTransferTable(state.filteredTransfers);
    } catch (error) {
        console.error('Error loading transfers:', error);
        showToast('Không thể tải danh sách phiếu chuyển: ' + error.message, 'error');
        renderTransferTable([]);
    }
}

// ==================== STATS UPDATE ====================

function updateStats() {
    const total = state.transfers.length;
    const pending = state.transfers.filter(t => t.status === 'PENDING').length;
    const shipping = state.transfers.filter(t => t.status === 'SHIPPING').length;
    const completed = state.transfers.filter(t => t.status === 'COMPLETED').length;

    document.getElementById('totalTransfers').textContent = total;
    document.getElementById('pendingTransfers').textContent = pending;
    document.getElementById('shippingTransfers').textContent = shipping;
    document.getElementById('completedTransfers').textContent = completed;
}

// ==================== RENDERING ====================

function populateWarehouseSelects() {
    const fromSelect = document.getElementById('fromWarehouse');
    const toSelect = document.getElementById('toWarehouse');
    
    const options = state.warehouses.map(w => 
        `<option value="${w.id}">${w.name}${w.address ? ' - ' + w.address : ''}</option>`
    ).join('');

    fromSelect.innerHTML = '<option value="">Chọn kho nguồn...</option>' + options;
    toSelect.innerHTML = '<option value="">Chọn kho đích...</option>' + options;
}

function renderTransferTable(transfers) {
    const tbody = document.getElementById('transfersTableBody');
    
    if (!transfers || transfers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: #dee2e6; margin-bottom: 15px; display: block;"></i>
                    <p style="color: #999; font-size: 1rem; margin: 0;">Không có phiếu chuyển nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transfers.map(t => {
        // Generate action buttons based on status
        let actionButtons = '';
        
        if (t.status === 'PENDING') {
            actionButtons = `
                <button class="btn-icon btn-icon-success" onclick="event.stopPropagation(); shipTransfer(${t.id})" title="Xuất kho chuyển đi">
                    <i class="fas fa-shipping-fast"></i>
                </button>
                <button class="btn-icon btn-icon-danger" onclick="event.stopPropagation(); cancelTransfer(${t.id})" title="Hủy phiếu">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
        } else if (t.status === 'SHIPPING' || t.status === 'APPROVED') {
            actionButtons = `
                <button class="btn-icon btn-icon-success" onclick="event.stopPropagation(); receiveTransfer(${t.id})" title="Nhập kho">
                    <i class="fas fa-check-double"></i>
                </button>
                <button class="btn-icon btn-icon-danger" onclick="event.stopPropagation(); cancelTransfer(${t.id})" title="Hủy phiếu">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
        }
        
        actionButtons += `
            <button class="btn-icon" onclick="openDetailModal(${t.id})" title="Xem chi tiết">
                <i class="fas fa-eye"></i>
            </button>
        `;
        
        return `
            <tr>
                <td><span style="font-family: monospace; font-weight: 500;">${t.code || 'N/A'}</span></td>
                <td>${t.fromWarehouseName || t.fromWarehouse?.name || '-'}</td>
                <td>${t.toWarehouseName || t.toWarehouse?.name || '-'}</td>
                <td>${formatDate(t.createdAt)}</td>
                <td>${getStatusBadge(t.status)}</td>
                <td class="text-center" style="font-weight: 600;">${t.items?.length || 0}</td>
                <td class="text-center">
                    <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const map = {
        'PENDING': { class: 'status-pending', text: 'Chờ Xử Lý' },
        'SHIPPING': { class: 'status-shipping', text: 'Đang Chuyển' },
        'COMPLETED': { class: 'status-completed', text: 'Hoàn Thành' },
        'CANCELLED': { class: 'status-cancelled', text: 'Đã Hủy' }
    };
    
    const s = map[status] || { class: 'status-badge', text: status };
    return `<span class="status-badge ${s.class}">${s.text}</span>`;
}

// ==================== SEARCH & FILTER ====================

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filterStatus').value;

    let filtered = state.transfers;

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(t => 
            (t.code && t.code.toLowerCase().includes(searchTerm)) ||
            (t.id && t.id.toString().includes(searchTerm)) ||
            (t.fromWarehouseName && t.fromWarehouseName.toLowerCase().includes(searchTerm)) ||
            (t.toWarehouseName && t.toWarehouseName.toLowerCase().includes(searchTerm))
        );
    }

    // Filter by status
    if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
    }

    state.filteredTransfers = filtered;
    renderTransferTable(filtered);
}

// ==================== CREATE TRANSFER LOGIC ====================

function openCreateModal() {
    // Reset form
    document.getElementById('createTransferForm').reset();
    document.getElementById('createItemsBody').innerHTML = '';
    document.getElementById('emptyItemsMsg').style.display = 'block';
    document.getElementById('productSearch').value = '';
    document.getElementById('productSearchResults').innerHTML = '';
    document.getElementById('productSearchResults').style.display = 'none';
    
    // Clear selected products
    state.selectedProducts.clear();
    
    // Show modal
    document.getElementById('createTransferModal').classList.add('show');
}

function closeCreateModal() {
    document.getElementById('createTransferModal').classList.remove('show');
}

function addProductToList(product) {
    // Check if product already added
    if (state.selectedProducts.has(product.id)) {
        showToast('Sản phẩm này đã được thêm vào danh sách', 'warning');
        return;
    }
    
    const tbody = document.getElementById('createItemsBody');
    document.getElementById('emptyItemsMsg').style.display = 'none';
    
    const rowId = `sku-${product.id}`;
    const row = document.createElement('tr');
    row.id = rowId;
    row.dataset.skuId = product.id;
    row.innerHTML = `
        <td>${product.skuName || product.name || 'N/A'}</td>
        <td><span class="status-badge" style="background: #e9ecef; color: #495057;">${product.skuCode || 'N/A'}</span></td>
        <td>
            <input type="number" class="item-qty" placeholder="Số lượng" required min="1" value="1" step="1">
        </td>
        <td class="text-center">
            <button type="button" class="btn-remove-row" onclick="removeProductRow('${product.id}')" title="Xóa">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
    
    // Add to selected products
    state.selectedProducts.set(product.id, product);
    
    // Clear search
    document.getElementById('productSearch').value = '';
    document.getElementById('productSearchResults').innerHTML = '';
    document.getElementById('productSearchResults').style.display = 'none';
}

function removeProductRow(skuId) {
    const row = document.getElementById(`sku-${skuId}`);
    if (row) {
        row.remove();
        state.selectedProducts.delete(skuId);
    }
    
    if (document.getElementById('createItemsBody').children.length === 0) {
        document.getElementById('emptyItemsMsg').style.display = 'block';
    }
}

// ==================== PRODUCT SEARCH ====================

function setupProductSearch() {
    const searchInput = document.getElementById('productSearch');
    const searchResults = document.getElementById('productSearchResults');
    
    if (!searchInput) return;
    
    // Search on input
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim();
        
        // Clear previous timeout
        if (state.searchTimeout) {
            clearTimeout(state.searchTimeout);
        }
        
        // Hide results if empty
        if (!keyword) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }
        
        // Debounce search
        state.searchTimeout = setTimeout(() => {
            searchProducts(keyword);
        }, 300);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.product-search-wrapper')) {
            searchResults.style.display = 'none';
        }
    });
}

async function searchProducts(keyword) {
    const searchResults = document.getElementById('productSearchResults');
    
    try {
        searchResults.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
        searchResults.style.display = 'block';
        
        const payload = {
            keyword: keyword,
            isActive: true,
            page: 0,
            size: 10
        };
        
        const response = await httpRequest(PRODUCT_SEARCH_API, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        let products = [];
        if (response.payload && response.payload.content) {
            products = response.payload.content;
        } else if (response.content) {
            products = response.content;
        } else if (Array.isArray(response)) {
            products = response;
        }
        
        displaySearchResults(products);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-error"><i class="fas fa-exclamation-circle"></i> Lỗi tìm kiếm</div>';
    }
}

function displaySearchResults(products) {
    const searchResults = document.getElementById('productSearchResults');
    
    if (!products || products.length === 0) {
        searchResults.innerHTML = '<div class="search-empty"><i class="fas fa-inbox"></i> Không tìm thấy sản phẩm</div>';
        return;
    }
    
    const html = products.map(product => {
        const isSelected = state.selectedProducts.has(product.id);
        return `
            <div class="search-result-item ${isSelected ? 'selected' : ''}" 
                 onclick="${isSelected ? '' : `addProductToList(${JSON.stringify(product).replace(/"/g, '&quot;')})` }">
                <div class="result-info">
                    <div class="result-name">${product.skuName || product.name || 'N/A'}</div>
                    <div class="result-meta">
                        <span class="result-sku"><i class="fas fa-barcode"></i> ${product.skuCode || 'N/A'}</span>
                    </div>
                </div>
                ${isSelected ? '<div class="result-badge"><i class="fas fa-check"></i> Đã chọn</div>' : '<div class="result-action"><i class="fas fa-plus"></i></div>'}
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = html;
}

async function submitCreateTransfer() {
    console.log('submitCreateTransfer called');
    
    const fromId = document.getElementById('fromWarehouse').value;
    const toId = document.getElementById('toWarehouse').value;
    const note = document.getElementById('transferNote').value.trim();
    
    console.log('Form values:', { fromId, toId, note });
    
    // Validation
    if (!fromId || !toId) {
        showToast('Vui lòng chọn kho nguồn và kho đích', 'warning');
        return;
    }
    
    if (fromId === toId) {
        showToast('Kho nguồn và kho đích không được trùng nhau', 'warning');
        return;
    }

    // Gather items
    const items = [];
    const rows = document.querySelectorAll('#createItemsBody tr');
    
    console.log('Found rows:', rows.length);
    
    for (let row of rows) {
        const skuId = row.dataset.skuId;
        const quantity = row.querySelector('.item-qty')?.value;
        
        if (skuId && quantity) {
            items.push({
                skuId: parseInt(skuId),
                quantity: parseInt(quantity)
            });
        }
    }

    console.log('Items to transfer:', items);

    if (items.length === 0) {
        showToast('Vui lòng thêm ít nhất một sản phẩm', 'warning');
        return;
    }

    const payload = {
        fromWarehouseId: parseInt(fromId),
        toWarehouseId: parseInt(toId),
        note: note || undefined,
        items: items
    };

    console.log('Payload to send:', payload);

    showLoading(true);
    try {
        const response = await httpRequest(TRANSFERS_API, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        console.log('Create response:', response);
        showToast('Tạo phiếu chuyển thành công!', 'success');
        closeCreateModal();
        await loadTransfers(); // Reload table
    } catch (error) {
        console.error('Create transfer error:', error);
        showToast('Lỗi tạo phiếu: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== DETAIL & ACTIONS ====================

async function openDetailModal(id) {
    showLoading(true);
    try {
        const data = await httpRequest(`${TRANSFERS_API}/${id}`, {
            method: 'GET'
        });

        const transfer = data.payload || data;
        state.currentTransfer = transfer;

        // Populate Info
        document.getElementById('detailCode').textContent = transfer.code || 'N/A';
        
        // Reference code (optional field)
        const refCodeContainer = document.getElementById('detailRefCodeContainer');
        const refCodeValue = document.getElementById('detailRefCode');
        if (transfer.referenceCode && transfer.referenceCode.trim()) {
            refCodeValue.textContent = transfer.referenceCode;
            refCodeContainer.style.display = 'block';
        } else {
            refCodeContainer.style.display = 'none';
        }
        
        document.getElementById('detailFrom').textContent = transfer.fromWarehouseName || transfer.fromWarehouse?.name || '-';
        document.getElementById('detailTo').textContent = transfer.toWarehouseName || transfer.toWarehouse?.name || '-';
        document.getElementById('detailDate').textContent = formatDate(transfer.createdAt);
        
        // Handle creator name from different possible fields
        let creatorName = 'Admin';
        if (transfer.createdBy) {
            if (typeof transfer.createdBy === 'object') {
                creatorName = transfer.createdBy.fullName || transfer.createdBy.email || transfer.createdBy.username || 'Admin';
            } else {
                creatorName = transfer.createdBy;
            }
        } else if (transfer.createdByName) {
            creatorName = transfer.createdByName;
        }
        document.getElementById('detailCreator').textContent = creatorName;
        document.getElementById('detailStatus').innerHTML = getStatusBadge(transfer.status);
        
        // Note
        const noteContainer = document.getElementById('detailNoteContainer');
        const noteValue = document.getElementById('detailNote');
        if (transfer.note && transfer.note.trim()) {
            noteValue.textContent = transfer.note;
            noteContainer.style.display = 'block';
        } else {
            noteContainer.style.display = 'none';
        }

        // Populate Items
        const tbody = document.getElementById('detailItemsBody');
        if (transfer.items && transfer.items.length > 0) {
            tbody.innerHTML = transfer.items.map((item, index) => {
                // Extract product info from different possible structures
                let productName = 'N/A';
                let skuCode = 'N/A';
                
                if (item.productSku) {
                    productName = item.productSku.name || item.productSku.skuName || 'N/A';
                    skuCode = item.productSku.sku || item.productSku.skuCode || 'N/A';
                } else {
                    productName = item.productName || item.skuName || item.name || 'Sản phẩm #' + (item.skuId || item.id);
                    skuCode = item.skuCode || item.sku || 'N/A';
                }
                
                return `
                    <tr>
                        <td style="font-weight: 600; color: #666;">${index + 1}</td>
                        <td style="color: #333;">${productName}</td>
                        <td><span class="status-badge" style="background: #e9ecef; color: #495057; font-family: monospace;">${skuCode}</span></td>
                        <td class="text-end" style="font-weight: 600; color: #c8102e;">${item.quantity}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 30px; color: #999;">Không có sản phẩm</td></tr>';
        }

        // Setup Action Buttons
        setupActionButtons(transfer);

        document.getElementById('detailTransferModal').classList.add('show');
    } catch (error) {
        console.error('Detail error:', error);
        showToast('Không thể tải chi tiết phiếu: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function closeDetailModal() {
    document.getElementById('detailTransferModal').classList.remove('show');
    state.currentTransfer = null;
}

function setupActionButtons(transfer) {
    const footer = document.getElementById('detailModalFooter');
    let buttonsHtml = '';

    if (transfer.status === 'PENDING') {
        buttonsHtml = `
            <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                <button type="button" class="btn btn-success" onclick="shipTransfer(${transfer.id})" style="min-width: 160px;">
                    <i class="fas fa-shipping-fast"></i> Xuất Kho Chuyển Đi
                </button>
                <button type="button" class="btn btn-danger" onclick="cancelTransfer(${transfer.id})" style="min-width: 120px;">
                    <i class="fas fa-times-circle"></i> Hủy Phiếu
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeDetailModal()" style="min-width: 100px;">
                    <i class="fas fa-times"></i> Đóng
                </button>
            </div>
        `;
    } else if (transfer.status === 'SHIPPING' || transfer.status === 'APPROVED') {
        buttonsHtml = `
            <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                <button type="button" class="btn btn-success" onclick="receiveTransfer(${transfer.id})" style="min-width: 140px;">
                    <i class="fas fa-check-double"></i> Nhập Kho
                </button>
                <button type="button" class="btn btn-danger" onclick="cancelTransfer(${transfer.id})" style="min-width: 120px;">
                    <i class="fas fa-times-circle"></i> Hủy Phiếu
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeDetailModal()" style="min-width: 100px;">
                    <i class="fas fa-times"></i> Đóng
                </button>
            </div>
        `;
    } else if (transfer.status === 'COMPLETED') {
        buttonsHtml = `
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeDetailModal()" style="min-width: 100px;">
                    <i class="fas fa-times"></i> Đóng
                </button>
            </div>
        `;
    } else if (transfer.status === 'CANCELLED') {
        buttonsHtml = `
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeDetailModal()" style="min-width: 100px;">
                    <i class="fas fa-times"></i> Đóng
                </button>
            </div>
        `;
    } else {
        buttonsHtml = `
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeDetailModal()" style="min-width: 100px;">
                    <i class="fas fa-times"></i> Đóng
                </button>
            </div>
        `;
    }
    
    footer.innerHTML = buttonsHtml;
}

async function shipTransfer(id) {
    const confirmMsg = `🚚 XÁC NHẬN XUẤT KHO CHUYỂN ĐI\n\n` +
        `Hành động này sẽ:\n` +
        `✓ Trừ số lượng sản phẩm khỏi kho nguồn\n` +
        `✓ Chuyển trạng thái sang "Đang chuyển"\n\n` +
        `Bạn có chắc chắn muốn tiếp tục?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }

    await callTransferAction(`${TRANSFERS_API}/${id}/ship`, '✓ Đã xuất kho chuyển đi thành công!');
}

async function receiveTransfer(id) {
    const confirmMsg = `📦 XÁC NHẬN NHẬP KHO\n\n` +
        `Hành động này sẽ:\n` +
        `✓ Cộng số lượng sản phẩm vào kho đích\n` +
        `✓ Hoàn thành phiếu chuyển kho\n\n` +
        `Bạn có chắc chắn đã nhận đủ hàng?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }

    await callTransferAction(`${TRANSFERS_API}/${id}/receive`, '✓ Đã nhập kho thành công!');
}

async function cancelTransfer(id) {
    const confirmMsg = `⚠️ XÁC NHẬN HỦY PHIẾU CHUYỂN KHO\n\n` +
        `CẢNH BÁO: Hành động này KHÔNG THỂ hoàn tác!\n\n` +
        `Bạn có chắc chắn muốn hủy phiếu này?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }

    await callTransferAction(`${TRANSFERS_API}/${id}/cancel`, '✓ Đã hủy phiếu chuyển kho thành công!');
}

async function callTransferAction(url, successMsg) {
    showLoading(true);
    try {
        const response = await httpRequest(url, {
            method: 'POST'
        });

        // Response can be either a string message or an object
        console.log('Action response:', response);
        
        showToast(successMsg, 'success');
        closeDetailModal();
        await loadTransfers(); // Reload list
    } catch (error) {
        console.error('Action error:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== UTILITY FUNCTIONS ====================

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(toastContainer);
    }

    // Toast colors
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };

    const bgColor = colors[type] || colors.info;
    const textColor = type === 'warning' ? '#212529' : '#fff';

    // Create toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${bgColor};
        color: ${textColor};
        padding: 15px 20px;
        border-radius: 8px;
        margin-top: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 300px;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
    `;

    // Icon
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${iconMap[type] || iconMap.info}" style="font-size: 1.2rem;"></i>
        <span style="flex: 1;">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add animation styles
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});
