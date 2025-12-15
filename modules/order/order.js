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
                 // Optional: window.location.href = '/modules/auth/login.html';
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
        <div class="order-card">
            <div class="order-card-header">
                <div class="order-meta">
                    <span class="order-id">Mã đơn hàng: #${order.orderCode}</span>
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
    const detailLink = `./order-detail.html?orderCode=${orderCode}`;
    
    if (status === 'COMPLETED') {
        return `
            <button class="btn-primary-solid">Mua lại</button>
            <button class="btn-secondary-outline" onclick="window.location.href='${detailLink}'">Xem chi tiết</button>
        `;
    } else if (status === 'WAITING_PAYMENT' || status === 'PENDING_SHIPMENT') {
        return `
            <button class="btn-primary-outline">Liên hệ người bán</button>
            <button class="btn-secondary-outline" onclick="window.location.href='${detailLink}'">Xem chi tiết</button>
        `;
    } else {
        return `<button class="btn-secondary-outline" onclick="window.location.href='${detailLink}'">Xem chi tiết</button>`;
    }
}
