/* ==================== ORDERS MANAGEMENT MODULE JS ==================== */

// State Management
let ordersState = {
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    orders: [],
    filters: {
        keyword: '',
        status: '',
        paymentStatus: '',
        startDate: '',
        endDate: ''
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Orders Management Module Loaded');
    
    // Check authentication
    if (!TokenHelper || !TokenHelper.isLoggedIn()) {
        window.location.href = '../../auth/auth.html';
        return;
    }

    initializePage();
    initializeEventListeners();
    loadOrders();
    loadStatistics();
});

function initializePage() {
    // Initialize date range picker
    flatpickr('#dateRange', {
        mode: 'range',
        dateFormat: 'd/m/Y',
        locale: 'vn',
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                ordersState.filters.startDate = selectedDates[0].toISOString();
                ordersState.filters.endDate = selectedDates[1].toISOString();
            } else {
                ordersState.filters.startDate = '';
                ordersState.filters.endDate = '';
            }
        }
    });
}

function initializeEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            ordersState.filters.keyword = e.target.value.trim();
            ordersState.currentPage = 0;
            loadOrders();
        }, 500);
    });

    // Filter button
    document.getElementById('filterBtn').addEventListener('click', () => {
        ordersState.filters.status = document.getElementById('statusFilter').value;
        ordersState.filters.paymentStatus = document.getElementById('paymentFilter').value;
        ordersState.currentPage = 0;
        loadOrders();
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadOrders();
        loadStatistics();
        showToast('Đã làm mới dữ liệu', 'success');
    });
}

// ==================== API CALLS ====================

/**
 * Load orders with filters and pagination
 */
async function loadOrders() {
    try {
        showLoadingTable(true);

        const params = new URLSearchParams({
            page: ordersState.currentPage,
            limit: ordersState.pageSize
        });

        // Add filters if present
        if (ordersState.filters.keyword) params.append('keyword', ordersState.filters.keyword);
        if (ordersState.filters.status) params.append('status', ordersState.filters.status);
        if (ordersState.filters.startDate) params.append('startDate', ordersState.filters.startDate);
        if (ordersState.filters.endDate) params.append('endDate', ordersState.filters.endDate);

        const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
        const url = `${baseUrl}/api/orders/manage/all?${params.toString()}`;

        const response = await httpRequest(url, { method: 'GET' });

        if (response.success && response.payload) {
            ordersState.orders = response.payload.content || [];
            ordersState.totalPages = response.payload.totalPages || 0;
            ordersState.totalElements = response.payload.totalElements || 0;
            ordersState.currentPage = response.payload.number || 0;

            renderOrdersTable();
            renderPagination();
            updatePaginationInfo();
        } else {
            throw new Error(response.message || 'Không thể tải danh sách đơn hàng');
        }
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showErrorTable(error.message);
        showToast('Không thể tải danh sách đơn hàng', 'error');
    }
}

/**
 * Load statistics for dashboard cards
 */
async function loadStatistics() {
    try {
        const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
        
        // Load each status count
        const statuses = ['PENDING_SHIPMENT', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
        
        for (const status of statuses) {
            const url = `${baseUrl}/api/orders/manage/all?status=${status}&limit=1`;
            const response = await httpRequest(url, { method: 'GET' });
            
            if (response.success && response.payload) {
                const count = response.payload.totalElements || 0;
                
                switch(status) {
                    case 'PENDING_SHIPMENT':
                        document.getElementById('statPending').textContent = count;
                        break;
                    case 'SHIPPING':
                        document.getElementById('statShipping').textContent = count;
                        break;
                    case 'COMPLETED':
                        document.getElementById('statCompleted').textContent = count;
                        break;
                    case 'CANCELLED':
                        document.getElementById('statCancelled').textContent = count;
                        break;
                }
            }
        }
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
    }
}

/**
 * Load order detail
 */
async function loadOrderDetail(orderCode) {
    try {
        const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
        const url = `${baseUrl}/api/orders/${orderCode}`;

        const response = await httpRequest(url, { method: 'GET' });

        if (response) {
            renderOrderDetail(response);
        } else {
            throw new Error('Không thể tải thông tin đơn hàng');
        }
    } catch (error) {
        console.error('❌ Error loading order detail:', error);
        showToast('Không thể tải chi tiết đơn hàng', 'error');
    }
}

/**
 * Confirm payment
 */
async function confirmPayment(orderCode) {
    try {
        const result = await Swal.fire({
            title: 'Xác nhận thanh toán?',
            text: 'Hành động này sẽ tạo hóa đơn cho đơn hàng.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
        const url = `${baseUrl}/api/orders/${orderCode}/confirm-payment`;

        const response = await httpRequest(url, { method: 'POST' });

        if (response.success) {
            showToast('Xác nhận thanh toán thành công!', 'success');
            loadOrders();
            loadStatistics();
        } else {
            throw new Error(response.message || 'Không thể xác nhận thanh toán');
        }
    } catch (error) {
        console.error('❌ Error confirming payment:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderCode, newStatus) {
    try {
        const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
        const url = `${baseUrl}/api/orders/update-status/${orderCode}?status=${newStatus}`;

        const response = await httpRequest(url, { method: 'POST' });

        if (response) {
            showToast('Cập nhật trạng thái thành công!', 'success');
            loadOrders();
            loadStatistics();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateStatusModal'));
            if (modal) modal.hide();
        } else {
            throw new Error('Không thể cập nhật trạng thái');
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Cancel order
 */
async function cancelOrder(orderCode) {
    try {
        const result = await Swal.fire({
            title: 'Hủy đơn hàng?',
            text: 'Bạn có chắc muốn hủy đơn hàng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Hủy đơn hàng',
            cancelButtonText: 'Không'
        });

        if (!result.isConfirmed) return;

        const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
        const url = `${baseUrl}/api/orders/cancel/${orderCode}`;

        const response = await httpRequest(url, { method: 'POST' });

        if (response) {
            showToast('Đơn hàng đã được hủy', 'success');
            loadOrders();
            loadStatistics();
        } else {
            throw new Error('Không thể hủy đơn hàng');
        }
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        showToast(error.message, 'error');
    }
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render orders table
 */
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (!ordersState.orders || ordersState.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h4>Không có đơn hàng nào</h4>
                        <p class="text-muted">Thử thay đổi bộ lọc để xem kết quả khác</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ordersState.orders.map((order, index) => {
        const rowNumber = ordersState.currentPage * ordersState.pageSize + index + 1;
        const statusBadge = getStatusBadge(order.status);
        const paymentBadge = getPaymentBadge(order.paymentStatus);
        const canConfirmPayment = order.paymentStatus === 'UNPAID';
        const canCancel = ['WAITING_PAYMENT', 'PENDING_SHIPMENT'].includes(order.status);

        return `
            <tr>
                <td>${rowNumber}</td>
                <td>
                    <strong class="text-danger">${order.orderCode}</strong>
                </td>
                <td>
                    <div class="fw-bold">${order.receiverName || 'N/A'}</div>
                    <small class="text-muted">${order.receiverPhone || ''}</small>
                </td>
                <td>${formatDateTime(order.createdAt)}</td>
                <td><strong class="text-danger">${formatCurrency(order.grandTotal)}</strong></td>
                <td>${paymentBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action btn-view" onclick="viewOrderDetail('${order.orderCode}')" 
                            title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canConfirmPayment ? `
                            <button class="btn-action btn-confirm" onclick="confirmPayment('${order.orderCode}')" 
                                title="Xác nhận thanh toán">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-action btn-edit" onclick="openUpdateStatusModal('${order.orderCode}')" 
                            title="Cập nhật trạng thái">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${canCancel ? `
                            <button class="btn-action btn-cancel" onclick="cancelOrder('${order.orderCode}')" 
                                title="Hủy đơn hàng">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render order detail modal
 */
function renderOrderDetail(order) {
    const content = document.getElementById('orderDetailContent');
    
    content.innerHTML = `
        <div class="order-detail-grid">
            <div class="detail-section">
                <h6><i class="fas fa-info-circle"></i> Thông Tin Đơn Hàng</h6>
                <div class="detail-row">
                    <span class="detail-label">Mã đơn hàng:</span>
                    <span class="detail-value text-danger">${order.orderCode}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Trạng thái:</span>
                    <span class="detail-value">${getStatusBadge(order.status)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Thanh toán:</span>
                    <span class="detail-value">${getPaymentBadge(order.paymentStatus)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phương thức:</span>
                    <span class="detail-value">${order.paymentMethod || 'COD'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ngày đặt:</span>
                    <span class="detail-value">${formatDateTime(order.createdAt)}</span>
                </div>
            </div>

            <div class="detail-section">
                <h6><i class="fas fa-map-marker-alt"></i> Thông Tin Nhận Hàng</h6>
                <div class="detail-row">
                    <span class="detail-label">Người nhận:</span>
                    <span class="detail-value">${order.receiverName || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Số điện thoại:</span>
                    <span class="detail-value">${order.receiverPhone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Địa chỉ:</span>
                    <span class="detail-value">${order.receiverAddress || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h6><i class="fas fa-shopping-cart"></i> Sản Phẩm</h6>
            <table class="order-items-table">
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>
                                <div class="product-info">
                                    <img src="${item.imageUrl || 'https://via.placeholder.com/60'}" 
                                        alt="${item.productName}" class="product-img">
                                    <div>
                                        <div class="product-name">${item.productName}</div>
                                        <div class="product-sku">${item.skuName || ''}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>x${item.quantity}</td>
                            <td class="price-highlight">${formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="total-section">
            <div class="total-row">
                <span class="total-label">Tạm tính:</span>
                <span class="total-value">${formatCurrency(order.merchandiseSubtotal)}</span>
            </div>
            <div class="total-row">
                <span class="total-label">Phí vận chuyển:</span>
                <span class="total-value">${formatCurrency(order.shippingFee)}</span>
            </div>
            <div class="total-row">
                <span class="total-label">Giảm giá:</span>
                <span class="total-value text-success">-${formatCurrency(order.voucherDiscount)}</span>
            </div>
            <div class="total-row grand-total">
                <span class="total-label">Tổng cộng:</span>
                <span class="total-value">${formatCurrency(order.grandTotal)}</span>
            </div>
        </div>
    `;
}

/**
 * Render pagination
 */
function renderPagination() {
    const pagination = document.getElementById('pagination');
    
    if (ordersState.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `
        <li class="page-item ${ordersState.currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${ordersState.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    // Show max 5 pages
    let startPage = Math.max(0, ordersState.currentPage - 2);
    let endPage = Math.min(ordersState.totalPages - 1, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(0, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === ordersState.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i + 1}</a>
            </li>
        `;
    }

    html += `
        <li class="page-item ${ordersState.currentPage === ordersState.totalPages - 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${ordersState.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    pagination.innerHTML = html;
}

function updatePaginationInfo() {
    const from = ordersState.currentPage * ordersState.pageSize + 1;
    const to = Math.min((ordersState.currentPage + 1) * ordersState.pageSize, ordersState.totalElements);
    
    document.getElementById('showingFrom').textContent = from;
    document.getElementById('showingTo').textContent = to;
    document.getElementById('totalOrders').textContent = ordersState.totalElements;
}

// ==================== HELPER FUNCTIONS ====================

function getStatusBadge(status) {
    const statusMap = {
        'WAITING_PAYMENT': { class: 'badge-waiting', icon: 'fa-clock', label: 'Chờ thanh toán' },
        'PENDING_SHIPMENT': { class: 'badge-pending', icon: 'fa-box', label: 'Chờ lấy hàng' },
        'SHIPPING': { class: 'badge-shipping', icon: 'fa-truck', label: 'Đang giao' },
        'COMPLETED': { class: 'badge-completed', icon: 'fa-check-circle', label: 'Hoàn thành' },
        'CANCELLED': { class: 'badge-cancelled', icon: 'fa-times-circle', label: 'Đã hủy' }
    };

    const config = statusMap[status] || { class: 'badge-secondary', icon: 'fa-question', label: status };
    return `<span class="badge status-badge ${config.class}">
        <i class="fas ${config.icon}"></i> ${config.label}
    </span>`;
}

function getPaymentBadge(paymentStatus) {
    if (paymentStatus === 'PAID') {
        return '<span class="badge badge-paid"><i class="fas fa-check"></i> Đã thanh toán</span>';
    }
    return '<span class="badge badge-unpaid"><i class="fas fa-clock"></i> Chưa thanh toán</span>';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount || 0);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function showLoadingTable(show) {
    const tbody = document.getElementById('ordersTableBody');
    if (show) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="spinner-border text-danger" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
                </td>
            </tr>
        `;
    }
}

function showErrorTable(message) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle text-danger"></i>
                    <h4>Có lỗi xảy ra</h4>
                    <p class="text-muted">${message}</p>
                </div>
            </td>
        </tr>
    `;
}

function showToast(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}

// ==================== ACTION FUNCTIONS ====================

function changePage(page) {
    if (page < 0 || page >= ordersState.totalPages) return;
    ordersState.currentPage = page;
    loadOrders();
}

function viewOrderDetail(orderCode) {
    const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    modal.show();
    loadOrderDetail(orderCode);
}

function openUpdateStatusModal(orderCode) {
    document.getElementById('updateOrderCode').value = orderCode;
    const modal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
    modal.show();
}

function confirmUpdateStatus() {
    const orderCode = document.getElementById('updateOrderCode').value;
    const newStatus = document.getElementById('newStatusSelect').value;

    if (!newStatus) {
        showToast('Vui lòng chọn trạng thái', 'warning');
        return;
    }

    updateOrderStatus(orderCode, newStatus);
}
