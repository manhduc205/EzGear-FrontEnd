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

    const refreshBtn = document.getElementById('refreshShipmentBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (orderDetailState.order) {
                loadShipmentHistory(orderDetailState.order);
            }
        });
    }
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
    const orderCode = urlParams.get('orderCode');
    
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
        // loadShipmentHistory(order); // Uncomment if shipment history API is available
        
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
    document.getElementById('paymentStatusText').textContent = order.paymentStatus || '...';
    document.getElementById('createdAtText').textContent = formatDate(order.createdAt);
    
    const statusTextElement = document.getElementById('orderStatusText');
    statusTextElement.className = `badge bg-light text-dark border text-uppercase fw-bold ${getStatusClass(order.status)}`;
    
    // 2. Update Stepper
    updateStepper(order);
    
    // 3. Shipping Address
    renderShippingAddress(order);
    
    // 4. Order Items
    renderOrderItems(order.items || []);
    
    // 5. Payment Summary
    renderPaymentSummary(order);
}

function updateStepper(order) {
    // Reset all steps
    const steps = {
        'placed': document.getElementById('step-placed'),
        'confirmed': document.getElementById('step-confirmed'),
        'shipping': document.getElementById('step-shipping'),
        'completed': document.getElementById('step-completed'),
        'rated': document.getElementById('step-rated')
    };

    Object.values(steps).forEach(step => {
        if(step) {
            step.classList.remove('active', 'completed');
            // Reset date
            const dateEl = step.querySelector('.step-date');
            if(dateEl) dateEl.textContent = '...';
        }
    });

    // Set dates if available
    if (order.createdAt) {
        document.getElementById('dateCreated').textContent = formatDate(order.createdAt);
        steps.placed.classList.add('completed');
    }

    // Determine active step based on status
    const status = order.status;
    
    // Logic flow: placed -> confirmed -> shipping -> completed -> rated
    if (status === 'WAITING_PAYMENT' || status === 'PENDING_CONFIRMATION') {
        steps.placed.classList.add('active');
    } 
    else if (status === 'PENDING_SHIPMENT' || status === 'CONFIRMED') {
        steps.placed.classList.add('completed');
        steps.confirmed.classList.add('active');
    }
    else if (status === 'SHIPPING' || status === 'PENDING_DELIVERY') {
        steps.placed.classList.add('completed');
        steps.confirmed.classList.add('completed');
        steps.shipping.classList.add('active');
    }
    else if (status === 'COMPLETED') {
        steps.placed.classList.add('completed');
        steps.confirmed.classList.add('completed');
        steps.shipping.classList.add('completed');
        steps.completed.classList.add('active');
        // If rated, move active to rated (logic to be added if 'isRated' flag exists)
    }
    else if (status === 'CANCELLED') {
        // Handle cancelled state if needed
    }
}

function renderShippingAddress(order) {
    document.getElementById('receiverName').textContent = order.receiverName || '';
    document.getElementById('receiverPhone').textContent = order.receiverPhone || '';
    document.getElementById('receiverAddress').textContent = order.receiverAddress || '';
}

function renderOrderItems(items) {
    const container = document.getElementById('orderItemsList');
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-center text-muted p-4">Không có sản phẩm nào</p>';
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
            <div class="d-flex align-items-center py-3 border-bottom">
                <img src="${imageUrl}" class="rounded border me-3" alt="${productName}" 
                     style="width: 80px; height: 80px; object-fit: cover;"
                     onerror="this.src='../../assets/img/placeholder.svg'">
                <div class="flex-grow-1">
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
    
    container.innerHTML = itemsHtml;
}

function renderPaymentSummary(order) {
    document.getElementById('paymentMethod').textContent = order.paymentMethod || 'Thanh toán khi nhận hàng';
    
    document.getElementById('subTotal').textContent = formatCurrency(order.merchandiseSubtotal || 0);
    document.getElementById('shippingFee').textContent = formatCurrency(order.shippingFee || 0);
    document.getElementById('voucherDiscount').textContent = `-${formatCurrency(order.voucherDiscount || 0)}`;
    document.getElementById('finalTotal').textContent = formatCurrency(order.grandTotal || 0);
}

// ==================== SHIPMENT HISTORY ====================
async function loadShipmentHistory(order) {
    try {
        const orderId = order.id || order.orderId || order.orderCode; // fallback orderCode if API accepts
        if (!orderId) return;

        const url = `${window.BASE_URL}/api/shipment-history/tracking/${orderId}`;
        const response = await httpRequest(url, { method: 'GET' });

        const data = response.payload || response.data || response;
        renderShipmentHistory(data);
    } catch (err) {
        console.error('Shipment history error:', err);
        const timeline = document.getElementById('shipmentTimeline');
        if (timeline) {
            timeline.innerHTML = `<div class="timeline-empty text-muted">Không có dữ liệu vận chuyển</div>`;
        }
    }
}

function renderShipmentHistory(data) {
    if (!data) return;
    const timeline = data.timeline || [];

    document.getElementById('trackingCode').textContent = data.trackingCode || '—';
    document.getElementById('expectedDelivery').textContent = data.expectedDeliveryTime ? formatDate(data.expectedDeliveryTime) : '—';
    document.getElementById('shipmentStatus').textContent = data.currentStatus || '—';

    const container = document.getElementById('shipmentTimeline');
    if (!container) return;

    if (!timeline.length) {
        container.innerHTML = `<div class="timeline-empty text-muted">Chưa có cập nhật giao hàng</div>`;
        return;
    }

    const html = timeline.map(item => {
        const completed = item.completed === true;
        return `
            <div class="timeline-item ${completed ? 'done' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${item.title || 'Cập nhật'}</div>
                    <div class="timeline-desc">${item.description || ''}</div>
                    <div class="timeline-time">${item.time ? formatDate(item.time) : ''}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
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
        'WAITING_PAYMENT': 'Chờ thanh toán',
        'PENDING_SHIPMENT': 'Chờ lấy hàng',
        'SHIPPING': 'Đang giao hàng',
        'COMPLETED': 'Hoàn thành',
        'CANCELLED': 'Đã hủy'
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        'WAITING_PAYMENT': 'status-pending',
        'PENDING_SHIPMENT': 'status-pending',
        'SHIPPING': 'status-shipping',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled'
    };
    return map[status] || '';
}
