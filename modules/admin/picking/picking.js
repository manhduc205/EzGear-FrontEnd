/* ==================== ORDER PICKING MODULE JS ==================== */

// State
let pickingState = {
    orders: [],
    currentOrder: null,
    checkedItems: new Set(),
    currentFilter: 'all'
};

// ==================== INITIALIZATION ====================
window.addEventListener('load', async () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // admin-common.js already handles auth check
    // Just load picking data
    await initPickingModule();
    
    loadingOverlay.classList.remove('active');
});

function initPickingModule() {
    // Load orders
    loadPickingOrders();
    
    // Setup filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            pickingState.currentFilter = btn.getAttribute('data-filter');
            filterOrders();
        });
    });
}

// ==================== LOAD ORDERS ====================
async function loadPickingOrders() {
    try {
        const token = localStorage.getItem('accessToken');
        const url = `${BASE_URL}/orders/manage/picking`;
        console.log('Loading picking orders from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        const data = await response.json();
        console.log('Picking orders response:', data);
        
        pickingState.orders = data || [];
        renderOrderList();
        
    } catch (error) {
        console.error('Error loading picking orders:', error);
        showErrorState();
    }
}

function refreshOrders() {
    // Show loading
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Đang tải danh sách đơn hàng...</p>
        </div>
    `;
    
    // Reload
    loadPickingOrders();
}

// ==================== RENDER ORDER LIST ====================
function renderOrderList() {
    const container = document.getElementById('orderList');
    const countContainer = document.getElementById('orderCount');
    
    if (!container) return;
    
    if (pickingState.orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Tuyệt vời! Đã hết đơn cần nhặt</p>
            </div>
        `;
        countContainer.innerHTML = '<i class="fas fa-box"></i><span>0 đơn hàng chờ xử lý</span>';
        return;
    }
    
    // Update count
    countContainer.innerHTML = `<i class="fas fa-box"></i><span>${pickingState.orders.length} đơn hàng chờ xử lý</span>`;
    
    // Render cards
    container.innerHTML = pickingState.orders.map(order => {
        const timeAgo = calculateTimeAgo(order.createdAt);
        const isUrgent = timeAgo.hours >= 3;
        const itemCount = order.items ? order.items.length : 0;
        
        return `
            <div class="order-card" onclick="viewOrderDetail('${order.orderCode}')">
                <div class="order-card-header">
                    <div class="order-info">
                        <h3>#${order.orderCode}</h3>
                        <div class="order-time ${isUrgent ? 'urgent' : ''}">
                            <i class="fas fa-clock"></i>
                            ${timeAgo.text}
                            ${isUrgent ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
                        </div>
                    </div>
                    <span class="order-badge badge-pending">${getStatusText(order.status)}</span>
                </div>
                <div class="order-summary">
                    <div class="summary-item">
                        <span class="summary-label">Sản phẩm</span>
                        <span class="summary-value">${itemCount}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Tổng tiền</span>
                        <span class="summary-value price">${formatCurrency(order.grandTotal)}</span>
                    </div>
                </div>
                <button class="btn-start-picking">
                    <span>Bắt đầu nhặt</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }).join('');
}

// ==================== FILTER ORDERS ====================
function filterOrders() {
    const filter = pickingState.currentFilter;
    
    if (filter === 'all') {
        renderOrderList();
        return;
    }
    
    let filtered = [];
    
    if (filter === 'urgent') {
        // Orders older than 3 hours
        filtered = pickingState.orders.filter(order => {
            const timeAgo = calculateTimeAgo(order.createdAt);
            return timeAgo.hours >= 3;
        });
    } else if (filter === 'large') {
        // Orders with more than 3 items
        filtered = pickingState.orders.filter(order => {
            return order.items && order.items.length > 3;
        });
    }
    
    // Temporarily replace orders for rendering
    const originalOrders = pickingState.orders;
    pickingState.orders = filtered;
    renderOrderList();
    pickingState.orders = originalOrders;
}

// ==================== VIEW ORDER DETAIL ====================
function viewOrderDetail(orderCode) {
    const order = pickingState.orders.find(o => o.orderCode === orderCode);
    if (!order) return;
    
    pickingState.currentOrder = order;
    pickingState.checkedItems.clear();
    
    // Switch views
    document.getElementById('listView').classList.remove('active');
    document.getElementById('detailView').classList.add('active');
    
    // Render detail
    renderOrderDetail(order);
}

function renderOrderDetail(order) {
    // Order code and time
    document.getElementById('detailOrderCode').textContent = `#${order.orderCode}`;
    const timeAgo = calculateTimeAgo(order.createdAt);
    document.getElementById('detailOrderTime').textContent = timeAgo.text;
    
    // Customer info
    document.getElementById('customerName').textContent = order.receiverName || '---';
    document.getElementById('customerPhone').textContent = order.receiverPhone || '---';
    document.getElementById('customerAddress').textContent = order.receiverAddress || '---';
    
    // Items
    const itemsContainer = document.getElementById('pickingItems');
    itemsContainer.innerHTML = order.items.map((item, index) => `
        <div class="picking-item" id="item-${index}">
            <div class="item-image">
                <img src="${item.imageUrl}" alt="${item.productName}" onerror="this.src='../../../assets/img/no-image.png'">
            </div>
            <div class="item-info">
                <div class="item-name">${item.productName}</div>
                <div class="item-sku">${item.skuName || 'Tiêu chuẩn'}</div>
                <span class="item-quantity">x${item.quantity}</span>
            </div>
            <div class="item-checkbox">
                <input type="checkbox" id="check-${index}" onchange="toggleItem(${index})">
            </div>
        </div>
    `).join('');
    
    // Progress - calculate total quantity of all items
    const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    document.getElementById('pickedCount').textContent = '0';
    document.getElementById('totalCount').textContent = totalQuantity;
    
    // Store total items count for progress tracking
    pickingState.totalItemsCount = order.items.length;
    
    // Confirm button
    document.getElementById('btnConfirm').disabled = true;
}

// ==================== TOGGLE ITEM ====================
function toggleItem(index) {
    const checkbox = document.getElementById(`check-${index}`);
    const item = document.getElementById(`item-${index}`);
    
    if (checkbox.checked) {
        pickingState.checkedItems.add(index);
        item.classList.add('checked');
    } else {
        pickingState.checkedItems.delete(index);
        item.classList.remove('checked');
    }
    
    updateProgress();
}

function updateProgress() {
    const totalItemsCount = pickingState.totalItemsCount || pickingState.currentOrder.items.length;
    const pickedCount = pickingState.checkedItems.size;
    
    // Calculate total picked quantity
    let totalPickedQuantity = 0;
    pickingState.checkedItems.forEach(index => {
        const item = pickingState.currentOrder.items[index];
        if (item) {
            totalPickedQuantity += (item.quantity || 0);
        }
    });
    
    document.getElementById('pickedCount').textContent = totalPickedQuantity;
    
    // Enable confirm button when all items checked
    const btnConfirm = document.getElementById('btnConfirm');
    if (pickedCount === totalItemsCount) {
        btnConfirm.disabled = false;
    } else {
        btnConfirm.disabled = true;
    }
}

// ==================== CONFIRM PACKING ====================
async function confirmPacking() {
    const order = pickingState.currentOrder;
    if (!order) return;
    
    // Disable button and show loading
    const btnConfirm = document.getElementById('btnConfirm');
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang xử lý...</span>';
    
    try {
        const token = localStorage.getItem('accessToken');
        const url = `${BASE_URL}/orders/update-status/${order.orderCode}?status=SHIPPING`;
        console.log('Confirming packing:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to confirm packing');
        
        // Handle both JSON and text responses
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        console.log('Confirm response:', data);
        
        // Show success message
        showSuccessMessage();
        
        // Reload orders and back to list
        setTimeout(() => {
            backToList();
            loadPickingOrders();
        }, 1500);
        
    } catch (error) {
        console.error('Error confirming packing:', error);
        alert('Không thể xác nhận đóng gói. Vui lòng thử lại.');
        
        // Reset button
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = '<i class="fas fa-check-circle"></i><span>Xác nhận đóng gói</span>';
    }
}

function showSuccessMessage() {
    const itemsContainer = document.getElementById('pickingItems');
    itemsContainer.innerHTML = `
        <div style="background: white; padding: 60px 20px; border-radius: 12px; text-align: center; box-shadow: var(--shadow-sm);">
            <i class="fas fa-check-circle" style="font-size: 5rem; color: var(--success-green); margin-bottom: 20px;"></i>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">Đóng gói thành công!</h2>
            <p style="font-size: 1rem; color: var(--text-secondary);">Đơn hàng #${pickingState.currentOrder.orderCode} đã sẵn sàng giao.</p>
        </div>
    `;
}

// ==================== BACK TO LIST ====================
function backToList() {
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('listView').classList.add('active');
    pickingState.currentOrder = null;
    pickingState.checkedItems.clear();
}

// ==================== HELPERS ====================
function getStatusText(status) {
    const map = {
        'WAITING_PAYMENT': 'CHỜ THANH TOÁN',
        'PENDING_SHIPMENT': 'CHỜ LẤY HÀNG',
        'SHIPPING': 'ĐANG GIAO',
        'COMPLETED': 'HOÀN THÀNH',
        'CANCELLED': 'ĐÃ HỦY'
    };
    return map[status] || status;
}

function calculateTimeAgo(dateString) {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffMs = now - orderDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    let text = '';
    if (diffDays > 0) {
        text = `Đặt cách đây ${diffDays} ngày`;
    } else if (diffHours > 0) {
        text = `Đặt cách đây ${diffHours} giờ`;
    } else if (diffMins > 0) {
        text = `Đặt cách đây ${diffMins} phút`;
    } else {
        text = 'Vừa đặt';
    }
    
    return {
        text,
        hours: diffHours,
        minutes: diffMins
    };
}

function showErrorState() {
    const container = document.getElementById('orderList');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-circle" style="color: var(--danger-red);"></i>
            <p>Không thể tải danh sách đơn hàng</p>
            <button class="btn-refresh" onclick="refreshOrders()" style="margin-top: 20px;">
                <i class="fas fa-sync-alt"></i>
                <span>Thử lại</span>
            </button>
        </div>
    `;
}
