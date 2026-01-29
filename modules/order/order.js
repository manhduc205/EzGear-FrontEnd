/* ==================== ORDER MODULE JS ==================== */

// State
let orderState = {
    orders: [],
    currentFilter: 'ALL',
    isLoading: false
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initOrderListPage();
    initHeaderUser();
});

function initHeaderUser() {
    // Assuming TokenHelper is available globally or imported
    if (typeof TokenHelper !== 'undefined') {
        const userInfo = TokenHelper.getUserInfo();
        if (userInfo) {
            const sidebarName = document.getElementById('sidebarName');
            if (sidebarName) sidebarName.textContent = userInfo.username;
        }
    }
}

// ==================== LIST PAGE LOGIC ====================
function initOrderListPage() {
    // Tab listeners
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked
            tab.classList.add('active');
            
            const status = tab.getAttribute('data-status');
            loadOrders(status);
        });
    });

    // Initial load
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
        let orders = [];
        
        // Try to fetch from API
        if (typeof window.BASE_URL !== 'undefined') {
             const url = `${window.BASE_URL}/api/orders/my-orders`; 
             const token = localStorage.getItem('accessToken');
             
             if (!token) {
                 console.warn("No access token found. Redirecting to login...");
                 // Optional: window.location.href = '/modules/auth/auth.html';
                 return;
             }

             try {
                 console.log("Fetching orders from:", url);
                 const response = await fetch(url, {
                     headers: {
                         'Authorization': `Bearer ${token}`,
                         'Content-Type': 'application/json'
                     }
                 });
                 
                 if (response.ok) {
                     const data = await response.json();
                     console.log("Orders data received:", data);
                     orders = data.payload || data;
                 } else {
                     console.error("Failed to fetch orders:", response.status, response.statusText);
                     const errorText = await response.text();
                     console.error("Error details:", errorText);
                 }
             } catch (e) {
                 console.error("API call failed:", e);
             }
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
        document.getElementById('ordersList').innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                <p>Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.</p>
            </div>
        `;
    } finally {
        // showLoading(false);
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <p class="text-muted mt-3">Chưa có đơn hàng nào</p>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card" data-order-code="${order.orderCode}">
            <div class="order-card-header">
                <div class="order-meta">
                    <div class="meta-left">
                        <span class="order-id">Mã đơn hàng: #${order.orderCode}</span>
                        <span class="order-payment payment-${formatPaymentMethod(order.paymentMethod).toLowerCase()}">${formatPaymentMethod(order.paymentMethod)}</span>
                    </div>
                    <span class="order-date">Ngày đặt: ${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</div>
            </div>
            <div class="order-card-body" onclick="window.location.href='./order-detail.html?orderCode=${order.orderCode}'">
                ${order.items.map(item => `
                    <div class="product-item">
                        <div class="product-image">
                            <img src="${item.imageUrl}" alt="${item.productName}" onerror="this.src='../../assets/img/no-image.png'">
                        </div>
                        <div class="product-info">
                            <div class="product-name">${item.productName}</div>
                            <div class="product-variant">Phân loại: ${item.skuName || 'Tiêu chuẩn'}</div>
                            <div class="product-qty">x${item.quantity}</div>
                        </div>
                        <div class="product-price">
                            <span class="current-price">${formatCurrency(item.price)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-card-footer">
                <div class="total-payment">
                    <span>Thành tiền:</span>
                    <span class="price-large">${formatCurrency(order.grandTotal)}</span>
                </div>
                <div class="action-buttons">
                    ${getActionButtons(order)}
                </div>
            </div>
        </div>
    `).join('');
}

function showLoading(show) {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (show) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-danger" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }
}

// ==================== HELPERS ====================
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function getStatusText(status) {
    const map = {
        'WAITING_PAYMENT': 'CHỜ THANH TOÁN',
        'PENDING_SHIPMENT': 'CHỜ LẤY HÀNG',
        'SHIPPING': 'ĐANG GIAO HÀNG',
        'COMPLETED': 'HOÀN THÀNH',
        'CANCELLED': 'ĐÃ HỦY'
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        'WAITING_PAYMENT': 'status-pending',
        'PENDING_SHIPMENT': 'status-pending',
        'SHIPPING': 'status-pending',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled'
    };
    return map[status] || '';
}

function getActionButtons(order) {
    const status = order.status;
    const orderCode = order.orderCode;
    const paymentMethod = order.paymentMethod || '';
    const detailLink = `./order-detail.html?orderCode=${orderCode}`;
    
    // Helper to detect COD-like payment methods
    function isCOD(method) {
        if (!method) return false;
        const s = String(method).toLowerCase().replace(/[^a-z0-9]/g, '');
        return s.includes('cod') || s.includes('cash') || s.includes('cashondelivery') || s.includes('cashondeliver');
    }

    // Check if order can be cancelled
    const canCancel = (status === 'WAITING_PAYMENT') || 
                     (status === 'PENDING_SHIPMENT' && isCOD(paymentMethod));
    
    if (status === 'COMPLETED') {
        return `
            <button class="btn-primary-solid">Mua lại</button>
            <button class="btn-secondary-outline" onclick="window.location.href='${detailLink}'">Xem chi tiết</button>
        `;
    } else if (status === 'WAITING_PAYMENT' || status === 'PENDING_SHIPMENT') {
        let buttons = '';
        
        if (canCancel) {
            buttons += `<button class="btn-danger-outline" onclick="confirmCancelOrder('${orderCode}')">Hủy đơn hàng</button>`;
        }
        
        buttons += `<button class="btn-secondary-outline" onclick="window.location.href='${detailLink}'">Xem chi tiết</button>`;
        return buttons;
    } else {
        return `<button class="btn-secondary-outline" onclick="window.location.href='${detailLink}'">Xem chi tiết</button>`;
    }
}

// Normalize payment method to short label used in UI
function formatPaymentMethod(method) {
    if (!method) return '---';
    const s = String(method).toLowerCase();
    if (s.includes('cod') || s.includes('cash')) return 'COD';
    if (s.includes('vnp') || s.includes('vnpay')) return 'VNPAY';
    // fallback: return uppercase short token
    return String(method).toUpperCase().split(' ')[0];
}

// ==================== CANCEL ORDER FUNCTIONALITY ====================
function confirmCancelOrder(orderCode) {
    showCancelOrderModal(orderCode);
}

function showCancelOrderModal(orderCode) {
    // Create modal HTML
    const modalHTML = `
        <div id="cancelOrderModal" class="custom-modal" onclick="hideCancelOrderModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                        Xác nhận hủy đơn hàng
                    </h5>
                    <button type="button" class="close-btn" onclick="hideCancelOrderModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="mb-3">Bạn có chắc chắn muốn hủy đơn hàng <strong>#${orderCode}</strong> không?</p>
                    <div class="alert alert-warning d-flex align-items-center">
                        <i class="fas fa-info-circle me-2"></i>
                        <span>Lưu ý: Hành động này không thể hoàn tác.</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" id="cancelCloseBtn" class="btn-secondary-outline" onclick="hideCancelOrderModal()">Không, giữ lại</button>
                    <button type="button" id="cancelConfirmBtn" class="btn-danger-solid" onclick="confirmCancelOrderAction('${orderCode}')">
                        <i class="fas fa-trash-alt me-1"></i>Có, hủy đơn hàng
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('cancelOrderModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal with animation
    setTimeout(() => {
        const modal = document.getElementById('cancelOrderModal');
        if (modal) {
            modal.classList.add('show');
        }
    }, 10);
}

function hideCancelOrderModal(event) {
    // If clicking on backdrop or close button
    if (!event || event.target.id === 'cancelOrderModal' || event.type === 'click') {
        const modal = document.getElementById('cancelOrderModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
}

function confirmCancelOrderAction(orderCode) {
    // Do NOT hide the modal yet; show loading state
    const confirmBtn = document.getElementById('cancelConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Đang hủy...';
    }
    const closeBtn = document.getElementById('cancelCloseBtn');
    if (closeBtn) closeBtn.disabled = true;
    cancelOrder(orderCode);
}

async function cancelOrder(orderCode) {
    try {
        // Show loading state
        const orderCard = document.querySelector(`[data-order-code="${orderCode}"]`);
        if (orderCard) {
            const cancelBtn = orderCard.querySelector('.btn-danger-outline');
            if (cancelBtn) {
                cancelBtn.disabled = true;
                cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang hủy...';
            }
        }
        
        const url = `${window.BASE_URL}/api/orders/cancel/${orderCode}`;
        console.log('Cancelling order:', url);
        
        const response = await httpRequest(url, { 
            method: 'POST'
        });
        
        console.log('Cancel response:', response);
        
        // Show success message inside modal (if present)
        const modal = document.getElementById('cancelOrderModal');
        if (modal) {
            const body = modal.querySelector('.modal-body');
            const footer = modal.querySelector('.modal-footer');
            if (body) {
                body.innerHTML = `
                    <div class="d-flex align-items-center" style="gap:12px;">
                        <i class="fas fa-check-circle" style="color:var(--success-green); font-size:32px;"></i>
                        <div>
                            <div style="font-weight:600; font-size:1rem;">Hủy đơn hàng thành công</div>
                            <div style="color:var(--text-secondary);">Đơn hàng <strong>#${orderCode}</strong> đã được hủy.</div>
                        </div>
                    </div>
                `;
            }
            if (footer) {
                footer.innerHTML = `<button type="button" class="btn-primary-solid" onclick="hideCancelOrderModal(); location.reload();">Đóng</button>`;
            }
        }

        // Also show a brief toast notification
        showNotification('Đơn hàng đã được hủy thành công!', 'success');

        // Reload orders list (after short delay so user sees modal)
        setTimeout(async () => {
            const currentTab = document.querySelector('.tab-item.active');
            const currentStatus = currentTab ? currentTab.getAttribute('data-status') : 'ALL';
            await loadOrders(currentStatus);
        }, 800);
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        
        let errorMessage = 'Không thể hủy đơn hàng. Vui lòng thử lại sau.';
        if (error.status === 400) {
            errorMessage = 'Đơn hàng không thể hủy vào thời điểm này.';
        } else if (error.status === 404) {
            errorMessage = 'Không tìm thấy đơn hàng.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
        
        // Reset button state
        const orderCard = document.querySelector(`[data-order-code="${orderCode}"]`);
        if (orderCard) {
            const cancelBtn = orderCard.querySelector('.btn-danger-outline');
            if (cancelBtn) {
                cancelBtn.disabled = false;
                cancelBtn.innerHTML = 'Hủy đơn hàng';
            }
        }
    }
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}
