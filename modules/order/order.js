/* ==================== ORDER MODULE JS ==================== */

// State
let orderState = {
    orders: [],
    currentFilter: 'ALL',
    isLoading: false
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the list page or detail page
    if (document.getElementById('ordersList')) {
        initOrderListPage();
    } else if (document.getElementById('orderStepper')) {
        initOrderDetailPage();
    }
    
    // Init User Info in Header
    initHeaderUser();
});

function initHeaderUser() {
    const userInfo = TokenHelper.getUserInfo();
    if (userInfo) {
        const usernameDisplay = document.getElementById('usernameDisplay');
        const sidebarName = document.getElementById('sidebarName');
        
        if (usernameDisplay) usernameDisplay.textContent = userInfo.username;
        if (sidebarName) sidebarName.textContent = userInfo.username;
    } else {
        // Redirect if not logged in
        window.location.href = '../auth/login.html';
    }
}

// ==================== LIST PAGE LOGIC ====================
function initOrderListPage() {
    loadOrders('ALL');
    
    // Search listener
    const searchInput = document.getElementById('searchOrderInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const term = e.target.value.toLowerCase();
                const filtered = orderState.orders.filter(o => 
                    o.orderCode.toLowerCase().includes(term) || 
                    o.items.some(i => i.productName.toLowerCase().includes(term))
                );
                renderOrders(filtered);
            }
        });
    }
}

async function loadOrders(status) {
    showLoading(true);
    try {
        if (!TokenHelper.isLoggedIn()) {
            window.location.href = '../auth/login.html';
            return;
        }

        // Call API
        // Assuming endpoint is /api/orders/my-orders or /api/orders
        const url = `${window.BASE_URL}/api/orders/my-orders`; 
        const response = await httpRequest(url, { method: 'GET' });
        
        // Handle response structure
        // Assuming response.payload contains the list, or response itself is the list
        let orders = [];
        if (response.payload) {
            orders = response.payload;
        } else if (Array.isArray(response)) {
            orders = response;
        } else if (response.data) {
            orders = response.data;
        }
        
        orderState.orders = orders;
        
        // Filter
        let filtered = orders;
        if (status !== 'ALL') {
            filtered = orders.filter(o => o.status === status);
        }
        
        renderOrders(filtered);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        // Fallback to empty state or show error
        document.getElementById('ordersList').innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                <p>Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

function filterOrders(status) {
    // Update active tab
    document.querySelectorAll('.order-tabs .nav-link').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    orderState.currentFilter = status;
    
    // Client-side filtering if we already have all orders
    // Or re-fetch if the API supports server-side filtering
    // For now, client-side filtering from the loaded state
    let filtered = orderState.orders;
    if (status !== 'ALL') {
        filtered = orderState.orders.filter(o => o.status === status);
    }
    renderOrders(filtered);
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    const html = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="shop-name">
                    <i class="fas fa-store"></i> EzGear Official Store
                    <span class="text-muted mx-2">|</span>
                    <span>${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-status ${getStatusClass(order.status)}">
                    ${getStatusLabel(order.status)}
                </div>
            </div>
            
            ${(order.items || []).map(item => `
                <a href="./order-detail.html?code=${order.orderCode}" class="order-item">
                    <img src="${item.imageUrl || '../../assets/img/placeholder.svg'}" alt="${item.productName}" class="item-image" onerror="this.src='../../assets/img/placeholder.svg'">
                    <div class="item-details">
                        <div class="item-name">${item.productName}</div>
                        <div class="item-variant">Phân loại: ${item.skuName || 'Tiêu chuẩn'}</div>
                        <div class="item-quantity">x${item.quantity}</div>
                    </div>
                    <div class="item-price-qty">
                        <span class="current-price">${formatCurrency(item.price)}</span>
                    </div>
                </a>
            `).join('')}
            
            <div class="order-footer">
                <div class="total-section">
                    <span class="total-label">Thành tiền:</span>
                    <span class="total-price">${formatCurrency(order.grandTotal)}</span>
                </div>
                <div class="action-buttons">
                    <a href="./order-detail.html?code=${order.orderCode}" class="btn-action btn-outline-gray">Xem chi tiết</a>
                    ${order.status === 'COMPLETED' ? `<button class="btn-action btn-primary-red" onclick="reOrder('${order.orderCode}')">Mua lại</button>` : ''}
                    ${order.status === 'PENDING_CONFIRMATION' ? `<button class="btn-action btn-outline-gray" onclick="cancelOrder('${order.orderCode}')">Hủy đơn</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// ==================== DETAIL PAGE LOGIC ====================
function initOrderDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId) {
        alert('Không tìm thấy mã đơn hàng');
        window.location.href = './order.html';
        return;
    }
    
    loadOrderDetail(orderId);
}

async function loadOrderDetail(id) {
    showLoading(true);
    try {
        const url = `${window.BASE_URL}/api/orders/${id}`;
        const response = await httpRequest(url, { method: 'GET' });
        
        let order = null;
        if (response.payload) order = response.payload;
        else if (response.data) order = response.data;
        else order = response;
        
        if (!order) throw new Error('Order not found');
        
        renderOrderDetail(order);
        
    } catch (error) {
        console.error(error);
        alert('Không thể tải chi tiết đơn hàng');
    } finally {
        showLoading(false);
    }
}

function renderOrderDetail(order) {
    // Basic Info
    document.getElementById('orderIdDisplay').textContent = '#' + order.id;
    document.getElementById('orderStatusText').textContent = getStatusLabel(order.status);
    document.getElementById('orderStatusText').className = `text-uppercase fw-bold ${getStatusClass(order.status)}`;
    
    // Stepper
    updateStepper(order.status);
    
    // Dates
    if (order.createdAt) document.getElementById('dateCreated').textContent = formatDate(order.createdAt);
    // Add other dates if available in API response
    
    // Address
    if (order.shippingAddress) {
        document.getElementById('receiverName').textContent = order.shippingAddress.name || order.receiverName || '';
        document.getElementById('receiverPhone').textContent = order.shippingAddress.phone || order.receiverPhone || '';
        document.getElementById('receiverAddress').textContent = order.shippingAddress.fullAddress || order.shippingAddress || '';
    }
    
    // Items
    const itemsHtml = (order.items || []).map(item => `
        <div class="detail-item">
            <img src="${item.image || '../../assets/img/no-image.png'}" alt="${item.productName}" class="item-image" style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #eee;">
            <div class="ms-3 flex-grow-1">
                <div class="fw-bold text-dark">${item.productName}</div>
                <div class="text-muted small">Phân loại: ${item.variant || 'Tiêu chuẩn'}</div>
                <div class="text-muted small">x${item.quantity}</div>
            </div>
            <div class="text-end">
                <div class="text-danger fw-bold">${formatCurrency(item.price)}</div>
                ${item.originalPrice > item.price ? `<div class="text-muted small text-decoration-line-through">${formatCurrency(item.originalPrice)}</div>` : ''}
            </div>
        </div>
    `).join('');
    document.getElementById('orderItemsList').innerHTML = itemsHtml;
    
    // Payment
    document.getElementById('paymentMethod').textContent = order.paymentMethod || 'Thanh toán khi nhận hàng';
    document.getElementById('subTotal').textContent = formatCurrency(order.subTotal || order.totalAmount); // Fallback
    document.getElementById('shippingFee').textContent = formatCurrency(order.shippingFee || 0);
    document.getElementById('voucherDiscount').textContent = `-${formatCurrency(order.discount || 0)}`;
    document.getElementById('finalTotal').textContent = formatCurrency(order.totalAmount);
}

function updateStepper(status) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(s => s.classList.remove('active'));
    
    // Logic mapping status to steps
    // Assuming steps are: 0: Placed, 1: Confirmed, 2: Shipping, 3: Completed
    if (status === 'PENDING_CONFIRMATION' || status === 'DRAFT') {
        steps[0].classList.add('active');
    } else if (status === 'PENDING_SHIPMENT' || status === 'CONFIRMED') {
        steps[0].classList.add('active'); 
        steps[1].classList.add('active');
    } else if (status === 'PENDING_DELIVERY' || status === 'SHIPPING') {
        steps[0].classList.add('active'); 
        steps[1].classList.add('active'); 
        steps[2].classList.add('active');
    } else if (status === 'COMPLETED') {
        steps.forEach(s => s.classList.add('active'));
    }
}

// ==================== ACTIONS ====================
async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    
    try {
        const url = `${window.BASE_URL}/api/orders/${orderId}/cancel`;
        await httpRequest(url, { method: 'POST' }); // Or PUT/PATCH depending on API
        
        alert('Đã hủy đơn hàng thành công');
        loadOrders(orderState.currentFilter); // Reload list
    } catch (error) {
        console.error(error);
        alert('Không thể hủy đơn hàng: ' + error.message);
    }
}

function reOrder(orderId) {
    // Implement re-order logic (add items to cart then redirect)
    alert('Chức năng đang phát triển');
}

// ==================== UTILS ====================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) overlay.classList.add('active');
        else overlay.classList.remove('active');
    }
}

// formatCurrency and formatDate are now imported from utils.js

function getStatusLabel(status) {
    const map = {
        'PENDING_CONFIRMATION': 'Chờ xác nhận',
        'PENDING_SHIPMENT': 'Chờ lấy hàng',
        'PENDING_DELIVERY': 'Đang giao',
        'COMPLETED': 'Hoàn thành',
        'CANCELLED': 'Đã hủy',
        'REFUND_PENDING': 'Trả hàng/Hoàn tiền',
        'DRAFT': 'Đơn nháp',
        'CONFIRMED': 'Đã xác nhận'
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        'PENDING_CONFIRMATION': 'status-pending',
        'PENDING_SHIPMENT': 'status-shipping',
        'PENDING_DELIVERY': 'status-shipping',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled',
        'REFUND_PENDING': 'status-refund',
        'DRAFT': 'status-pending',
        'CONFIRMED': 'status-shipping'
    };
    return map[status] || '';
}
