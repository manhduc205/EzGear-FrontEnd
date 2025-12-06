/* ==================== STOCK TRANSFER MANAGEMENT JS ==================== */

// ==================== CONSTANTS & STATE ====================
const API_BASE = window.BASE_URL + '/api';
const TRANSFERS_API = API_BASE + '/stock-transfers';
const WAREHOUSES_API = API_BASE + '/warehouses';

let state = {
    transfers: [],
    warehouses: [],
    currentTransfer: null
};

// Bootstrap Modals
let createModal;
let detailModal;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Modals
    createModal = new bootstrap.Modal(document.getElementById('createTransferModal'));
    detailModal = new bootstrap.Modal(document.getElementById('detailTransferModal'));

    // Load Sidebar (Assuming common admin structure)
    loadSidebar();

    // Initial Data Load
    await Promise.all([
        loadWarehouses(),
        loadTransfers()
    ]);

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 500));
});

function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        fetch('../../../components/sidebar-admin.html')
            .then(response => response.text())
            .then(html => {
                sidebarContainer.innerHTML = html;
                // Highlight current menu item
                const currentPath = window.location.pathname;
                // Add active class logic here if needed
            });
    }
}

// ==================== DATA LOADING ====================

async function loadWarehouses() {
    try {
        const response = await fetch(WAREHOUSES_API, {
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) throw new Error('Failed to load warehouses');

        const data = await response.json();
        state.warehouses = data.payload || data; // Handle ApiResponse wrapper

        populateWarehouseSelects();
    } catch (error) {
        console.error('Error loading warehouses:', error);
        showToast('Không thể tải danh sách kho', 'error');
    }
}

async function loadTransfers() {
    showLoading(true);
    try {
        const response = await fetch(TRANSFERS_API, {
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) throw new Error('Failed to load transfers');

        const data = await response.json();
        state.transfers = data.payload || data; // Handle ApiResponse wrapper

        renderTransferTable(state.transfers);
    } catch (error) {
        console.error('Error loading transfers:', error);
        showToast('Không thể tải danh sách phiếu chuyển', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== RENDERING ====================

function populateWarehouseSelects() {
    const fromSelect = document.getElementById('fromWarehouse');
    const toSelect = document.getElementById('toWarehouse');
    
    const options = state.warehouses.map(w => 
        `<option value="${w.id}">${w.name} - ${w.address || ''}</option>`
    ).join('');

    fromSelect.innerHTML = '<option value="">Chọn kho nguồn...</option>' + options;
    toSelect.innerHTML = '<option value="">Chọn kho đích...</option>' + options;
}

function renderTransferTable(transfers) {
    const tbody = document.getElementById('transfersTableBody');
    
    if (!transfers || transfers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    <i class="fas fa-box-open fa-2x mb-2"></i><br>
                    Không có phiếu chuyển nào
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transfers.map(t => `
        <tr>
            <td class="ps-4 fw-bold">#${t.id}</td>
            <td><span class="font-monospace">${t.code || 'N/A'}</span></td>
            <td>${t.fromWarehouseName || t.fromWarehouse?.name || '-'}</td>
            <td>${t.toWarehouseName || t.toWarehouse?.name || '-'}</td>
            <td>${t.createdBy || 'Admin'}</td>
            <td>${formatDate(t.createdAt)}</td>
            <td>${getStatusBadge(t.status)}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-primary action-btn" onclick="openDetailModal(${t.id})" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    const map = {
        'PENDING': { class: 'status-pending', text: 'Chờ xuất' },
        'SHIPPING': { class: 'status-shipping', text: 'Đang chuyển' },
        'COMPLETED': { class: 'status-completed', text: 'Hoàn tất' },
        'CANCELLED': { class: 'status-cancelled', text: 'Đã hủy' }
    };
    
    const s = map[status] || { class: 'bg-secondary text-white', text: status };
    return `<span class="transfer-status ${s.class}">${s.text}</span>`;
}

// ==================== CREATE TRANSFER LOGIC ====================

function openCreateModal() {
    // Reset form
    document.getElementById('createTransferForm').reset();
    document.getElementById('createItemsBody').innerHTML = '';
    document.getElementById('emptyItemsMsg').style.display = 'block';
    
    // Add one empty row by default
    addProductRow();
    
    createModal.show();
}

function addProductRow() {
    const tbody = document.getElementById('createItemsBody');
    document.getElementById('emptyItemsMsg').style.display = 'none';
    
    const rowId = Date.now();
    const row = document.createElement('tr');
    row.id = `row-${rowId}`;
    row.innerHTML = `
        <td>
            <input type="number" class="form-control form-control-sm item-sku" placeholder="Nhập SKU ID" required min="1">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm item-qty" placeholder="Số lượng" required min="1" value="1">
        </td>
        <td class="text-center">
            <button type="button" class="btn-remove-row" onclick="removeProductRow('${rowId}')">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

function removeProductRow(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    if (row) row.remove();
    
    if (document.getElementById('createItemsBody').children.length === 0) {
        document.getElementById('emptyItemsMsg').style.display = 'block';
    }
}

async function submitCreateTransfer() {
    const fromId = document.getElementById('fromWarehouse').value;
    const toId = document.getElementById('toWarehouse').value;
    const note = document.getElementById('transferNote').value;
    
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
    
    rows.forEach(row => {
        const skuId = row.querySelector('.item-sku').value;
        const quantity = row.querySelector('.item-qty').value;
        
        if (skuId && quantity) {
            items.push({
                skuId: parseInt(skuId),
                quantity: parseInt(quantity)
            });
        }
    });

    if (items.length === 0) {
        showToast('Vui lòng thêm ít nhất một sản phẩm', 'warning');
        return;
    }

    const payload = {
        fromWarehouseId: parseInt(fromId),
        toWarehouseId: parseInt(toId),
        note: note,
        items: items
    };

    showLoading(true);
    try {
        const response = await fetch(TRANSFERS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create transfer');
        }

        showToast('Tạo phiếu chuyển thành công', 'success');
        createModal.hide();
        loadTransfers(); // Reload table
    } catch (error) {
        console.error('Create transfer error:', error);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== DETAIL & ACTIONS ====================

async function openDetailModal(id) {
    showLoading(true);
    try {
        // Fetch detail
        const response = await fetch(`${TRANSFERS_API}/${id}`, {
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) throw new Error('Failed to load transfer details');

        const data = await response.json();
        const transfer = data.payload || data;
        state.currentTransfer = transfer;

        // Populate Info
        document.getElementById('detailCode').textContent = transfer.code || 'N/A';
        document.getElementById('detailFrom').textContent = transfer.fromWarehouseName || transfer.fromWarehouse?.name;
        document.getElementById('detailTo').textContent = transfer.toWarehouseName || transfer.toWarehouse?.name;
        document.getElementById('detailDate').textContent = formatDate(transfer.createdAt);
        document.getElementById('detailCreator').textContent = transfer.createdBy || 'Admin';
        document.getElementById('detailStatus').innerHTML = getStatusBadge(transfer.status);
        document.getElementById('detailNote').textContent = transfer.note || 'Không có ghi chú';

        // Populate Items
        const tbody = document.getElementById('detailItemsBody');
        tbody.innerHTML = (transfer.items || []).map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.productName || 'Sản phẩm #' + item.skuId}</td>
                <td><span class="badge bg-light text-dark border">${item.skuCode || item.skuId}</span></td>
                <td class="text-end fw-bold">${item.quantity}</td>
            </tr>
        `).join('');

        // Setup Action Buttons
        setupActionButtons(transfer);

        detailModal.show();
    } catch (error) {
        console.error('Detail error:', error);
        showToast('Không thể tải chi tiết phiếu', 'error');
    } finally {
        showLoading(false);
    }
}

function setupActionButtons(transfer) {
    const footer = document.getElementById('detailModalFooter');
    let buttonsHtml = '';

    if (transfer.status === 'PENDING') {
        buttonsHtml = `
            <button type="button" class="btn btn-warning text-dark" onclick="shipTransfer(${transfer.id})">
                <i class="fas fa-shipping-fast me-2"></i>Xuất Kho
            </button>
        `;
    } else if (transfer.status === 'SHIPPING') {
        buttonsHtml = `
            <button type="button" class="btn btn-success" onclick="receiveTransfer(${transfer.id})">
                <i class="fas fa-check-circle me-2"></i>Nhập Kho
            </button>
        `;
    }

    buttonsHtml += `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>`;
    footer.innerHTML = buttonsHtml;
}

async function shipTransfer(id) {
    if (!confirm('Xác nhận xuất kho cho phiếu chuyển này?')) return;

    callTransferAction(`${TRANSFERS_API}/${id}/ship`, 'Xuất kho thành công');
}

async function receiveTransfer(id) {
    if (!confirm('Xác nhận đã nhận đủ hàng và nhập kho?')) return;

    callTransferAction(`${TRANSFERS_API}/${id}/receive`, 'Nhập kho thành công');
}

async function callTransferAction(url, successMsg) {
    showLoading(true);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Action failed');
        }

        showToast(successMsg, 'success');
        detailModal.hide();
        loadTransfers(); // Reload list
    } catch (error) {
        console.error('Action error:', error);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== UTILS ====================

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) overlay.classList.remove('d-none');
    else overlay.classList.add('d-none');
}

function showToast(message, type = 'info') {
    // Simple toast implementation or use existing one if available in utils
    // Assuming a simple alert for now if no toast library, 
    // but let's try to create a bootstrap toast dynamically
    
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }

    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
    
    const toastHtml = `
        <div class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    const container = document.querySelector('.toast-container');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = toastHtml;
    const toastEl = tempDiv.firstElementChild;
    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleSearch() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = state.transfers.filter(t => 
        (t.code && t.code.toLowerCase().includes(term)) ||
        (t.id && t.id.toString().includes(term))
    );
    renderTransferTable(filtered);
}
