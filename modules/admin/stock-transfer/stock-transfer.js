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

    // Initial Data Load
    await Promise.all([
        loadWarehouses(),
        loadTransfers()
    ]);

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 500));
});

// ==================== DATA LOADING ====================
async function loadWarehouses() {
    try {
        const response = await fetch(WAREHOUSES_API, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        
        if (!response.ok) throw new Error('Failed to load warehouses');
        
        state.warehouses = await response.json();
        populateWarehouseSelects();
    } catch (error) {
        console.error('Error loading warehouses:', error);
        showToast('Lỗi tải danh sách kho', 'error');
    }
}

async function loadTransfers() {
    showLoading(true);
    try {
        const response = await fetch(TRANSFERS_API, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });

        if (!response.ok) throw new Error('Failed to load transfers');

        state.transfers = await response.json();
        renderTransfersTable(state.transfers);
    } catch (error) {
        console.error('Error loading transfers:', error);
        showToast('Lỗi tải danh sách phiếu chuyển', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== RENDERING ====================
function populateWarehouseSelects() {
    const fromSelect = document.getElementById('fromWarehouse');
    const toSelect = document.getElementById('toWarehouse');
    
    const options = state.warehouses.map(w => 
        `<option value="${w.id}">${w.name}</option>`
    ).join('');

    fromSelect.innerHTML = '<option value="">Chọn kho nguồn...</option>' + options;
    toSelect.innerHTML = '<option value="">Chọn kho đích...</option>' + options;
}

function renderTransfersTable(transfers) {
    const tbody = document.getElementById('transfersTableBody');
    
    if (transfers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p class="mb-0">Không tìm thấy phiếu chuyển nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transfers.map(t => `
        <tr onclick="viewTransferDetail(${t.id})" style="cursor: pointer;">
            <td class="ps-4">#${t.id}</td>
            <td class="fw-medium text-primary">${t.transferCode || '---'}</td>
            <td>${getWarehouseName(t.fromWarehouseId)}</td>
            <td>${getWarehouseName(t.toWarehouseId)}</td>
            <td>${t.createdBy || 'System'}</td>
            <td>${formatDate(t.createdAt)}</td>
            <td>${getStatusBadge(t.status)}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-light text-primary" onclick="event.stopPropagation(); viewTransferDetail(${t.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==================== ACTIONS ====================
function openCreateModal() {
    document.getElementById('createTransferForm').reset();
    document.getElementById('createItemsBody').innerHTML = '';
    document.getElementById('emptyItemsMsg').style.display = 'block';
    createModal.show();
}

function addProductRow() {
    document.getElementById('emptyItemsMsg').style.display = 'none';
    const tbody = document.getElementById('createItemsBody');
    const rowId = Date.now();
    
    const row = document.createElement('tr');
    row.id = `row-${rowId}`;
    row.innerHTML = `
        <td>
            <input type="number" class="form-control form-control-sm sku-input" placeholder="Nhập SKU ID" required>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm qty-input" value="1" min="1" required>
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="removeRow('${rowId}')">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

function removeRow(rowId) {
    document.getElementById(`row-${rowId}`).remove();
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

    const items = [];
    document.querySelectorAll('#createItemsBody tr').forEach(row => {
        const skuId = row.querySelector('.sku-input').value;
        const quantity = row.querySelector('.qty-input').value;
        if (skuId && quantity) {
            items.push({ skuId: parseInt(skuId), quantity: parseInt(quantity) });
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

    try {
        const response = await fetch(TRANSFERS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to create transfer');

        showToast('Tạo phiếu chuyển thành công', 'success');
        createModal.hide();
        loadTransfers();
    } catch (error) {
        console.error('Error creating transfer:', error);
        showToast('Lỗi khi tạo phiếu chuyển', 'error');
    }
}

async function viewTransferDetail(id) {
    try {
        const response = await fetch(`${TRANSFERS_API}/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });

        if (!response.ok) throw new Error('Failed to load detail');

        const transfer = await response.json();
        state.currentTransfer = transfer;

        // Fill Info
        document.getElementById('detailCode').textContent = transfer.transferCode || '---';
        document.getElementById('detailFrom').textContent = getWarehouseName(transfer.fromWarehouseId);
        document.getElementById('detailTo').textContent = getWarehouseName(transfer.toWarehouseId);
        document.getElementById('detailDate').textContent = formatDate(transfer.createdAt);
        document.getElementById('detailCreator').textContent = transfer.createdBy || 'System';
        document.getElementById('detailStatus').innerHTML = getStatusBadge(transfer.status);
        document.getElementById('detailNote').textContent = transfer.note || 'Không có ghi chú';

        // Fill Items
        const tbody = document.getElementById('detailItemsBody');
        tbody.innerHTML = transfer.items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.productName || 'Sản phẩm #' + item.skuId}</td>
                <td>SKU-${item.skuId}</td>
                <td class="text-end fw-bold">${item.quantity}</td>
            </tr>
        `).join('');

        // Update Footer Buttons based on status
        updateDetailButtons(transfer);

        detailModal.show();
    } catch (error) {
        console.error('Error loading detail:', error);
        showToast('Lỗi tải chi tiết phiếu', 'error');
    }
}

function updateDetailButtons(transfer) {
    const footer = document.getElementById('detailModalFooter');
    let buttons = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>';

    if (transfer.status === 'PENDING') {
        buttons = `
            <button type="button" class="btn btn-danger" onclick="updateStatus(${transfer.id}, 'CANCELLED')">Hủy Phiếu</button>
            <button type="button" class="btn btn-primary" onclick="updateStatus(${transfer.id}, 'IN_TRANSIT')">Chuyển Hàng</button>
            ${buttons}
        `;
    } else if (transfer.status === 'IN_TRANSIT') {
        buttons = `
            <button type="button" class="btn btn-success" onclick="updateStatus(${transfer.id}, 'COMPLETED')">Hoàn Thành</button>
            ${buttons}
        `;
    }

    footer.innerHTML = buttons;
}

async function updateStatus(id, newStatus) {
    if (!confirm('Bạn có chắc chắn muốn thay đổi trạng thái phiếu này?')) return;

    try {
        const response = await fetch(`${TRANSFERS_API}/${id}/status?status=${newStatus}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });

        if (!response.ok) throw new Error('Failed to update status');

        showToast('Cập nhật trạng thái thành công', 'success');
        detailModal.hide();
        loadTransfers();
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Lỗi cập nhật trạng thái', 'error');
    }
}

// ==================== UTILS ====================
function getWarehouseName(id) {
    const w = state.warehouses.find(x => x.id === id);
    return w ? w.name : `Kho #${id}`;
}

function getStatusBadge(status) {
    const map = {
        'PENDING': '<span class="badge bg-warning text-dark">Chờ xử lý</span>',
        'IN_TRANSIT': '<span class="badge bg-info text-dark">Đang vận chuyển</span>',
        'COMPLETED': '<span class="badge bg-success">Hoàn thành</span>',
        'CANCELLED': '<span class="badge bg-danger">Đã hủy</span>'
    };
    return map[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = state.transfers.filter(t => 
        (t.transferCode && t.transferCode.toLowerCase().includes(term)) ||
        t.id.toString().includes(term)
    );
    renderTransfersTable(filtered);
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

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

function showToast(message, type = 'info') {
    // Simple alert for now, can be upgraded to Bootstrap Toast
    alert(message);
}
