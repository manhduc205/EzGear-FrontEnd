/* ==================== ORDER DETAIL MODULE JS ==================== */

// State
let orderDetailState = {
    order: null,
    isLoading: false
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initOrderDetailPage();
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

// ==================== DETAIL PAGE LOGIC ====================
function initOrderDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get('code');
    
    if (!orderCode) {
        alert('Không tìm thấy mã đơn hàng');
        window.location.href = './order.html';
        return;
    }
    
    loadOrderDetail(orderCode);
}

async function loadOrderDetail(orderCode) {
    showLoading(true);
    try {
        if (!TokenHelper.isLoggedIn()) {
            window.location.href = '../auth/login.html';
            return;
        }

        // Call API to get order detail
        const url = `${window.BASE_URL}/api/orders/${orderCode}`;
        console.log('Loading order detail from:', url);
        console.log('Token exists:', !!TokenHelper.getAccessToken());
        
        const response = await httpRequest(url, { method: 'GET' });
        console.log('Order detail response:', response);
        
        // Handle response structure
        let order = null;
        if (response.payload) {
            order = response.payload;
        } else if (response.data) {
            order = response.data;
        } else {
            order = response;
        }
        
        if (!order) throw new Error('Order not found');
        
        orderDetailState.order = order;
        renderOrderDetail(order);
        
    } catch (error) {
        console.error('Error loading order detail:', error);
        showLoading(false);
        
        // Show error message
        const errorMsg = error.message || 'Không thể tải chi tiết đơn hàng';
        alert(errorMsg);
        
        // Redirect back to order list after 1 second
        setTimeout(() => {
            window.location.href = './order.html';
        }, 1000);
    } finally {
        showLoading(false);
    }
}

function renderOrderDetail(order) {
    // 1. Basic Info
    document.getElementById('orderIdDisplay').textContent = '#' + order.orderCode;
    document.getElementById('orderStatusText').textContent = getStatusLabel(order.status);
    
    const statusTextElement = document.getElementById('orderStatusText');
    statusTextElement.className = `text-uppercase fw-bold ${getStatusClass(order.status)}`;
    
    // 2. Update Stepper with dates and status
    updateStepper(order);
    
    // 3. Shipping Address
    renderShippingAddress(order);
    
    // 4. Order Items
    renderOrderItems(order.items || []);
    
    // 5. Payment Summary
    renderPaymentSummary(order);
}

function updateStepper(order) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(s => s.classList.remove('active'));
    
    // Update dates if available
    if (order.createdAt) {
        document.getElementById('dateCreated').textContent = formatDate(order.createdAt);
    }
    
    // Map status to step activation
    const statusMap = {
        'PENDING_CONFIRMATION': 0,
        'DRAFT': 0,
        'CONFIRMED': 1,
        'PENDING_SHIPMENT': 1,
        'SHIPPING': 2,
        'PENDING_DELIVERY': 2,
        'COMPLETED': 3
    };
    
    const activeStep = statusMap[order.status];
    
    if (activeStep !== undefined) {
        for (let i = 0; i <= activeStep; i++) {
            if (steps[i]) steps[i].classList.add('active');
        }
    }
    
    // Update step dates if available from order history/timeline
    if (order.confirmedAt) {
        const confirmedDateEl = document.getElementById('dateConfirmed');
        if (confirmedDateEl) confirmedDateEl.textContent = formatDate(order.confirmedAt);
    }
    
    if (order.shippingAt) {
        const shippingDateEl = document.getElementById('dateShipping');
        if (shippingDateEl) shippingDateEl.textContent = formatDate(order.shippingAt);
    }
    
    if (order.completedAt) {
        const completedDateEl = document.getElementById('dateCompleted');
        if (completedDateEl) completedDateEl.textContent = formatDate(order.completedAt);
    }
}

function renderShippingAddress(order) {
    // Use direct properties from API response
    const name = order.receiverName || '';
    const phone = order.receiverPhone || '';
    const address = order.receiverAddress || '';
    
    document.getElementById('receiverName').textContent = name;
    document.getElementById('receiverPhone').textContent = phone;
    document.getElementById('receiverAddress').textContent = address;
}

function renderOrderItems(items) {
    if (!items || items.length === 0) {
        document.getElementById('orderItemsList').innerHTML = '<p class="text-center text-muted p-4">Không có sản phẩm nào</p>';
        return;
    }
    
    const itemsHtml = items.map(item => {
        const productName = item.productName || 'Sản phẩm';
        const skuName = item.skuName || 'Tiêu chuẩn';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const originalPrice = item.originalPrice || 0;
        const imageUrl = item.imageUrl || '../../assets/img/placeholder.svg';
        
        return `
            <div class="detail-item">
                <img src="${imageUrl}" alt="${productName}" class="item-image" 
                     style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #eee;"
                     onerror="this.src='../../assets/img/placeholder.svg'">
                <div class="ms-3 flex-grow-1">
                    <div class="fw-bold text-dark">${productName}</div>
                    <div class="text-muted small">Phân loại: ${skuName}</div>
                    <div class="text-muted small">x${quantity}</div>
                </div>
                <div class="text-end">
                    <div class="text-danger fw-bold">${formatCurrency(price)}</div>
                    ${originalPrice > price ? `<div class="text-muted small text-decoration-line-through">${formatCurrency(originalPrice)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('orderItemsList').innerHTML = itemsHtml;
}

function renderPaymentSummary(order) {
    // Payment method
    const paymentMethod = order.paymentMethod || 'Thanh toán khi nhận hàng';
    document.getElementById('paymentMethod').textContent = paymentMethod;
    
    // Use field names from API response
    const merchandiseSubtotal = order.merchandiseSubtotal || 0;
    const shippingFee = order.shippingFee || 0;
    const voucherDiscount = order.voucherDiscount || 0;
    const grandTotal = order.grandTotal || 0;
    
    document.getElementById('subTotal').textContent = formatCurrency(merchandiseSubtotal);
    document.getElementById('shippingFee').textContent = formatCurrency(shippingFee);
    document.getElementById('voucherDiscount').textContent = `-${formatCurrency(voucherDiscount)}`;
    document.getElementById('finalTotal').textContent = formatCurrency(grandTotal);
}

function calculateSubTotal(items) {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
        const price = item.price || item.unitPrice || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
    }, 0);
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
        'CONFIRMED': 'Đã xác nhận',
        'SHIPPING': 'Đang vận chuyển'
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
        'CONFIRMED': 'status-shipping',
        'SHIPPING': 'status-shipping'
    };
    return map[status] || '';
}
