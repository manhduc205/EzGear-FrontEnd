// Purchase Orders Management JavaScript
let orders = [];
let filteredOrders = [];
let currentFilter = 'all';
let itemCounter = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await loadWarehouses();
    await loadOrders();
});

// Load warehouses
async function loadWarehouses() {
    try {
        const response = await fetch(`${BASE_URL}/warehouses`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load warehouses');
        
        const warehouses = await response.json();
        console.log('Warehouses data:', warehouses);
        
        const warehouseSelect = document.getElementById('warehouseId');
        warehouseSelect.innerHTML = '<option value="">-- Chọn kho --</option>';
        
        // Handle different response formats
        const warehouseList = warehouses.payload || warehouses.data || warehouses;
        
        if (Array.isArray(warehouseList)) {
            warehouseList.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = `${warehouse.name || warehouse.warehouseName || 'N/A'} - ${warehouse.address || warehouse.location || ''}`;
                warehouseSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading warehouses:', error);
        showToast('Không thể tải danh sách kho', 'error');
    }
}

// Load all purchase orders
async function loadOrders() {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/purchase-orders`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        const data = await response.json();
        console.log('Purchase orders data:', data);
        
        if (data.success && data.payload) {
            orders = Array.isArray(data.payload) ? data.payload : [];
            filteredOrders = [...orders];
            updateBadges();
            renderOrders();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Lỗi tải dữ liệu đơn hàng', 'error');
        document.getElementById('ordersTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Không thể tải dữ liệu
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

// Update status badges
function updateBadges() {
    const counts = {
        all: orders.length,
        DRAFT: orders.filter(o => o.status === 'DRAFT').length,
        CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
        RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
        CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
    };
    
    document.getElementById('badgeAll').textContent = counts.all;
    document.getElementById('badgeDraft').textContent = counts.DRAFT;
    document.getElementById('badgeConfirmed').textContent = counts.CONFIRMED;
    document.getElementById('badgeReceived').textContent = counts.RECEIVED;
    document.getElementById('badgeCancelled').textContent = counts.CANCELLED;
}

// Filter by status
function filterByStatus(status) {
    currentFilter = status;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    
    // Filter orders
    if (status === 'all') {
        filteredOrders = [...orders];
    } else {
        filteredOrders = orders.filter(o => o.status === status);
    }
    
    renderOrders();
}

// Render orders table
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Không có đơn hàng nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredOrders.map(order => {
        // Use total from API, fallback to subtotal or calculate from items
        let totalAmount = order.total || order.subtotal;
        if (!totalAmount && order.items && order.items.length > 0) {
            totalAmount = order.items.reduce((sum, item) => sum + (item.lineTotal || item.quantity * item.unitPrice), 0);
        }
        
        return `
        <tr>
            <td><strong>${order.code || '#' + order.id}</strong></td>
            <td>${order.supplierName || 'N/A'}</td>
            <td>${order.warehouseName || 'N/A'}</td>
            <td>${formatDate(order.createdAt || new Date())}</td>
            <td><strong>${formatCurrency(totalAmount || 0)}</strong></td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${order.status === 'DRAFT' ? `
                        <button class="btn btn-sm btn-warning" onclick="openEditModal(${order.id})" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="confirmOrder(${order.id})" title="Xác nhận">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    ${order.status === 'CONFIRMED' ? `
                        <button class="btn btn-sm btn-success" onclick="receiveOrder(${order.id})" title="Nhận hàng">
                            <i class="fas fa-box"></i>
                        </button>
                    ` : ''}
                    ${order.status === 'DRAFT' || order.status === 'CONFIRMED' ? `
                        <button class="btn btn-sm btn-danger" onclick="cancelOrder(${order.id})" title="Hủy đơn">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Get status badge
function getStatusBadge(status) {
    const statusMap = {
        'DRAFT': { class: 'draft', text: 'Chờ xác nhận' },
        'CONFIRMED': { class: 'confirmed', text: 'Đã xác nhận' },
        'RECEIVED': { class: 'received', text: 'Đã nhận hàng' },
        'CANCELLED': { class: 'cancelled', text: 'Đã hủy' }
    };
    
    const statusInfo = statusMap[status] || { class: 'draft', text: status };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Search orders
function handleSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    
    let baseOrders = currentFilter === 'all' ? orders : orders.filter(o => o.status === currentFilter);
    
    if (!keyword) {
        filteredOrders = baseOrders;
    } else {
        filteredOrders = baseOrders.filter(order => 
            (order.id && order.id.toString().includes(keyword)) ||
            (order.code && order.code.toLowerCase().includes(keyword)) ||
            (order.supplierName && order.supplierName.toLowerCase().includes(keyword))
        );
    }
    
    renderOrders();
}

// Open add modal
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Tạo Đơn Nhập Hàng';
    document.getElementById('orderForm').reset();
    document.getElementById('orderId').value = '';
    document.getElementById('orderItems').innerHTML = '';
    itemCounter = 0;
    addOrderItem(); // Add first item
    document.getElementById('orderModal').classList.add('active');
}

// Open edit modal
async function openEditModal(id) {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/purchase-orders/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load order');
        
        const data = await response.json();
        console.log('Response data:', data); // Debug log
        
        // Handle API response format with payload
        const order = data.payload || data.data || data;
        
        if (!order || !order.id) throw new Error('Order not found');
        
        // Only allow editing DRAFT orders
        if (order.status !== 'DRAFT') {
            showToast('Chỉ có thể sửa đơn hàng ở trạng thái Chờ xác nhận', 'error');
            return;
        }
        
        // Update modal title
        document.getElementById('modalTitle').textContent = 'Sửa Đơn Nhập Hàng';
        
        // Set order ID for update
        document.getElementById('orderId').value = id;
        
        // Fill form
        document.getElementById('supplierName').value = order.supplierName || '';
        document.getElementById('warehouseId').value = order.warehouseId || '';
        document.getElementById('notes').value = order.note || '';
        
        // Clear and add items
        document.getElementById('orderItems').innerHTML = '';
        itemCounter = 0;
        
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                itemCounter++;
                const itemsDiv = document.getElementById('orderItems');
                
                const itemHtml = `
                    <div class="order-item" id="item_${itemCounter}" style="padding: 15px; background: white; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: start;">
                            <div>
                                <label style="font-size: 0.85rem; margin-bottom: 5px; display: block;">SKU ID</label>
                                <input type="number" class="form-control item-sku-id" placeholder="ID SKU" value="${item.skuId || item.sku || ''}" required>
                            </div>
                            <div>
                                <label style="font-size: 0.85rem; margin-bottom: 5px; display: block;">Số lượng</label>
                                <input type="number" class="form-control item-quantity" placeholder="SL" min="1" value="${item.quantity || ''}" required>
                            </div>
                            <div>
                                <label style="font-size: 0.85rem; margin-bottom: 5px; display: block;">Giá nhập</label>
                                <input type="number" class="form-control item-price" placeholder="Giá" min="0" value="${item.unitPrice || ''}" required>
                            </div>
                            <div style="padding-top: 28px;">
                                <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(${itemCounter})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                itemsDiv.insertAdjacentHTML('beforeend', itemHtml);
            });
        } else {
            addOrderItem(); // Add at least one empty item
        }
        
        // Show modal
        document.getElementById('orderModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading order:', error);
        showToast('Lỗi khi tải đơn hàng: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Add order item
function addOrderItem() {
    itemCounter++;
    const itemsDiv = document.getElementById('orderItems');
    
    const itemHtml = `
        <div class="order-item" id="item_${itemCounter}" style="padding: 15px; background: white; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: start;">
                <div>
                    <label style="font-size: 0.85rem; margin-bottom: 5px; display: block;">SKU ID</label>
                    <input type="number" class="form-control item-sku-id" placeholder="ID SKU" required>
                </div>
                <div>
                    <label style="font-size: 0.85rem; margin-bottom: 5px; display: block;">Số lượng</label>
                    <input type="number" class="form-control item-quantity" placeholder="SL" min="1" required>
                </div>
                <div>
                    <label style="font-size: 0.85rem; margin-bottom: 5px; display: block;">Giá nhập</label>
                    <input type="number" class="form-control item-price" placeholder="Giá" min="0" required>
                </div>
                <div style="padding-top: 28px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeOrderItem(${itemCounter})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    itemsDiv.insertAdjacentHTML('beforeend', itemHtml);
}

// Remove order item
function removeOrderItem(id) {
    const item = document.getElementById(`item_${id}`);
    if (item) {
        item.remove();
    }
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').classList.remove('active');
    document.getElementById('orderForm').reset();
}

// Close detail modal
function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// Handle form submit
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('orderForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createOrder();
        });
    }
});

// Create purchase order
async function createOrder() {
    const orderId = document.getElementById('orderId').value;
    const supplierName = document.getElementById('supplierName').value.trim();
    const warehouseId = document.getElementById('warehouseId').value;
    const note = document.getElementById('notes').value.trim();
    
    // Collect items
    const items = [];
    document.querySelectorAll('.order-item').forEach(itemDiv => {
        const skuId = itemDiv.querySelector('.item-sku-id').value;
        const quantity = itemDiv.querySelector('.item-quantity').value;
        const unitPrice = itemDiv.querySelector('.item-price').value;
        
        if (skuId && quantity && unitPrice) {
            items.push({
                skuId: parseInt(skuId),
                quantity: parseInt(quantity),
                unitPrice: parseFloat(unitPrice)
            });
        }
    });
    
    if (!supplierName || items.length === 0) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Check if updating or creating
        const isUpdate = orderId && orderId.trim() !== '';
        const url = isUpdate ? `${BASE_URL}/purchase-orders/${orderId}` : `${BASE_URL}/purchase-orders`;
        const method = isUpdate ? 'PUT' : 'POST';
        
        // Calculate subtotal and total from items
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const total = subtotal; // You can add tax or discount calculation here if needed
        
        // Build payload - for update, only send fields that can be updated
        const payload = {
            supplierName,
            items,
            note,
            subtotal,
            total
        };
        
        // Only include warehouseId if it has a value
        if (warehouseId) {
            payload.warehouseId = parseInt(warehouseId);
        }
        
        // Add createdBy for new orders (get from current user session)
        if (!isUpdate) {
            const userInfo = getUserInfo();
            if (userInfo && userInfo.id) {
                payload.createdBy = userInfo.id;
            }
        }
        
        console.log('Sending payload:', payload);
        console.log('URL:', url);
        console.log('Method:', method);
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Error message:', data.message || data.error);
        console.log('Full error details:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            throw new Error(data.message || data.error || (isUpdate ? 'Failed to update order' : 'Failed to create order'));
        }
        
        if (data.success) {
            showToast(isUpdate ? 'Cập nhật đơn nhập hàng thành công!' : 'Tạo đơn nhập hàng thành công!', 'success');
            closeModal();
            await loadOrders();
        } else {
            throw new Error(data.message || data.error || (isUpdate ? 'Failed to update order' : 'Failed to create order'));
        }
    } catch (error) {
        console.error('Error saving order:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Confirm order
async function confirmOrder(id) {
    if (!confirm('Xác nhận đơn nhập hàng này?')) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/purchase-orders/${id}/confirm`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to confirm order');
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Xác nhận đơn hàng thành công!', 'success');
            await loadOrders();
        }
    } catch (error) {
        console.error('Error confirming order:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Receive order
async function receiveOrder(id) {
    if (!confirm('Xác nhận đã nhận hàng?')) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/purchase-orders/${id}/receive`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to receive order');
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Nhận hàng thành công!', 'success');
            await loadOrders();
        }
    } catch (error) {
        console.error('Error receiving order:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Cancel order
async function cancelOrder(id) {
    if (!confirm('Hủy đơn nhập hàng này?')) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/purchase-orders/${id}/cancel`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to cancel order');
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Hủy đơn hàng thành công!', 'success');
            await loadOrders();
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// View order details
async function viewOrder(id) {
    showLoading(true);
    
    try {
        // Try to find order in current orders list first
        let order = orders.find(o => o.id === id);
        
        // If not found or items not loaded, fetch from API
        if (!order || !order.items || order.items.length === 0) {
            const response = await fetch(`${BASE_URL}/purchase-orders/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to load order details');
            
            const data = await response.json();
            
            console.log('Order detail API response:', data);
            
            if (data.success && data.payload) {
                order = data.payload;
            } else if (Array.isArray(data)) {
                order = data[0];
            } else if (data.id) {
                order = data;
            }
        }
        
        if (!order) {
            throw new Error('Order not found');
        }
        
        console.log('Order to display:', order);
        console.log('Order items:', order.items);
        
        document.getElementById('detailOrderId').textContent = order.code || '#' + order.id;
        
        let itemsHtml = '<table class="order-items-table"><thead><tr><th>SKU</th><th>Sản Phẩm</th><th>Số Lượng</th><th>Đơn Giá</th><th>Thành Tiền</th></tr></thead><tbody>';
        
        let calculatedTotal = 0;
        
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                console.log('Processing item:', item);
                const lineTotal = item.lineTotal || (item.quantity * item.unitPrice);
                calculatedTotal += lineTotal;
                itemsHtml += `
                    <tr>
                        <td><strong style="font-family: 'Courier New', monospace; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem;">${item.sku || 'N/A'}</strong></td>
                        <td style="font-weight: 500;">${item.skuName || 'N/A'}</td>
                        <td>${item.quantity || 0}</td>
                        <td>${formatCurrency(item.unitPrice || 0)}</td>
                        <td><strong>${formatCurrency(lineTotal)}</strong></td>
                    </tr>
                `;
            });
        } else {
            itemsHtml += `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                        Không có sản phẩm
                    </td>
                </tr>
            `;
        }
        
        itemsHtml += '</tbody></table>';
        
        // Use total from API if available, fallback to subtotal or calculated
        const displayTotal = order.total || order.subtotal || calculatedTotal;
        
        document.getElementById('orderDetailContent').innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <p><strong>Nhà Cung Cấp:</strong> ${order.supplierName || 'N/A'}</p>
                    <p><strong>Kho Hàng:</strong> ${order.warehouseName || (order.warehouseId ? 'Kho #' + order.warehouseId : 'N/A')}</p>
                    <p><strong>Trạng Thái:</strong> ${getStatusBadge(order.status)}</p>
                </div>
                <div>
                    <p><strong>Người Tạo:</strong> ${order.createdBy ? 'User #' + order.createdBy : 'N/A'}</p>
                    <p><strong>Ghi Chú:</strong> ${order.note || 'Không có'}</p>
                </div>
            </div>
            
            <div class="order-detail-section">
                <h3>Chi Tiết Sản Phẩm</h3>
                ${itemsHtml}
                <div class="order-total">
                    Tổng Cộng: ${formatCurrency(displayTotal)}
                </div>
            </div>
        `;
        
        document.getElementById('detailModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Lỗi tải chi tiết đơn hàng', 'error');
    } finally {
        showLoading(false);
    }
}
