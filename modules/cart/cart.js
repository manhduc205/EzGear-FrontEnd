/* ==================== CART MODULE JS ==================== */
/* API Calls and Cart Logic - Following Module Pattern */

// ==================== STATE MANAGEMENT ====================
let cartState = {
    items: [],
    selectedItems: new Set(),
    voucher: null,
    isLoading: false
};

// ==================== API CALLS ====================

/**
 * Get current user's cart
 */
async function getCartAPI() {
    try {
        const token = TokenHelper.getAccessToken();
        console.log('🔑 Getting cart with token:', token ? 'exists' : 'missing');
        
        if (!token) {
            console.log('❌ No token, redirecting to login');
            window.location.href = '/modules/auth/login.html';
            return null;
        }
        
        const response = await fetch(`${window.BASE_URL}/api/cart`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Get cart response:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.log('🔒 Unauthorized, clearing tokens');
                TokenHelper.clearTokens();
                window.location.href = '/modules/auth/login.html';
                return null;
            }
            throw new Error('Không thể tải giỏ hàng');
        }

        const result = await response.json();
        console.log('✅ Cart data:', result);
        
        // Backend trả về ApiResponse với payload
        if (result.success && result.payload) {
            return result.payload;
        }
        
        return result;
    } catch (error) {
        console.error('💥 Get cart error:', error);
        showToast('Lỗi tải giỏ hàng: ' + error.message, 'error');
        return null;
    }
}

/**
 * Add item to cart
 * @param {Object} item - Cart item with skuId, quantity, etc.
 */
async function addItemAPI(item) {
    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(item)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Không thể thêm sản phẩm');
        }

        return await response.json();
    } catch (error) {
        console.error('Add item error:', error);
        showToast('Lỗi thêm sản phẩm: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Update item quantity
 * @param {Number} skuId - SKU ID
 * @param {Number} quantity - New quantity
 */
async function updateQuantityAPI(skuId, quantity) {
    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/update/${skuId}?quantity=${quantity}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Không thể cập nhật số lượng');
        }

        // Xử lý response rỗng hoặc có body
        const text = await response.text();
        if (text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                console.log('Response is not JSON:', text);
                return { success: true };
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Update quantity error:', error);
        showToast('Lỗi cập nhật số lượng: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Remove item from cart
 * @param {Number} skuId - SKU ID
 */
async function removeItemAPI(skuId) {
    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/remove/${skuId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể xóa sản phẩm');
        }

        // Xử lý response rỗng
        const text = await response.text();
        if (text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                return { success: true };
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Remove item error:', error);
        showToast('Lỗi xóa sản phẩm: ' + error.message, 'error');
        throw error;
    }
}

/**
 * Clear entire cart
 */
async function clearCartAPI() {
    try {
        const response = await fetch(`${window.BASE_URL}/api/cart/clear`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể xóa giỏ hàng');
        }

        return await response.text();
    } catch (error) {
        console.error('Clear cart error:', error);
        showToast('Lỗi xóa giỏ hàng: ' + error.message, 'error');
        throw error;
    }
}

// ==================== UI RENDERING ====================

/**
 * Render cart items to UI
 */
function renderCartItems() {
    const container = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    
    if (!cartState.items || cartState.items.length === 0) {
        container.innerHTML = '';
        emptyCart.style.display = 'block';
        document.getElementById('cartCount').textContent = '0';
        updateSummary();
        return;
    }

    emptyCart.style.display = 'none';
    document.getElementById('cartCount').textContent = cartState.items.length;

    container.innerHTML = cartState.items.map(item => `
        <div class="cart-item ${cartState.selectedItems.has(item.skuId) ? 'selected' : ''}" data-sku-id="${item.skuId}">
            <!-- Checkbox -->
            <div class="item-checkbox">
                <input 
                    type="checkbox" 
                    class="item-select-checkbox"
                    data-sku-id="${item.skuId}"
                    ${cartState.selectedItems.has(item.skuId) ? 'checked' : ''}
                >
            </div>

            <!-- Image -->
            <div class="item-image">
                <img src="${item.imageUrl || '../../assets/img/placeholder.svg'}" 
                     alt="${item.productName}"
                     onerror="this.src='../../assets/img/placeholder.svg'">
            </div>

            <!-- Info -->
            <div class="item-info">
                <div class="item-name" onclick="viewProduct(${item.productId})">
                    ${item.productName}
                </div>
                
                ${item.variant ? `
                    <div class="item-variant">
                        <i class="fas fa-tag"></i> ${item.variant}
                    </div>
                ` : ''}

                <div class="item-stock ${getStockClass(item.stockQuantity)}">
                    <i class="fas fa-box"></i>
                    ${getStockText(item.stockQuantity)}
                </div>

                <!-- Bottom Row -->
                <div class="item-bottom">
                    <!-- Price -->
                    <div class="item-price">
                        <div class="price-current">${formatPrice(item.price)}</div>
                        ${item.originalPrice && item.originalPrice > item.price ? `
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="price-original">${formatPrice(item.originalPrice)}</span>
                                <span class="price-discount">-${Math.round((1 - item.price / item.originalPrice) * 100)}%</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div class="item-actions">
                        <!-- Quantity Control -->
                        <div class="quantity-control">
                            <button 
                                onclick="changeQuantity(${item.skuId}, ${item.quantity - 1})"
                                ${item.quantity <= 1 ? 'disabled' : ''}
                            >
                                <i class="fas fa-minus"></i>
                            </button>
                            <input 
                                type="number" 
                                value="${item.quantity}" 
                                min="1" 
                                max="${item.stockQuantity}"
                                onchange="changeQuantity(${item.skuId}, parseInt(this.value))"
                            >
                            <button 
                                onclick="changeQuantity(${item.skuId}, ${item.quantity + 1})"
                                ${item.quantity >= item.stockQuantity ? 'disabled' : ''}
                            >
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>

                        <!-- Remove Button -->
                        <button class="btn-remove" onclick="removeItem(${item.skuId})" title="Xóa sản phẩm">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Attach event listeners to checkboxes
    document.querySelectorAll('.item-select-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleItemSelect);
    });

    updateSummary();
}

/**
 * Get stock status class
 */
function getStockClass(quantity) {
    if (quantity === 0) return 'stock-out';
    if (quantity < 10) return 'stock-low';
    return 'stock-available';
}

/**
 * Get stock text
 */
function getStockText(quantity) {
    if (quantity === 0) return 'Hết hàng';
    if (quantity < 10) return `Chỉ còn ${quantity} sản phẩm`;
    return 'Còn hàng';
}

/**
 * Update summary section
 */
function updateSummary() {
    const selectedItems = cartState.items.filter(item => 
        cartState.selectedItems.has(item.skuId)
    );

    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = cartState.voucher ? (subtotal * cartState.voucher.discountPercent / 100) : 0;
    const total = subtotal - discount;

    // Update UI
    document.getElementById('selectedCount').textContent = cartState.selectedItems.size;
    document.getElementById('summaryItemCount').textContent = selectedItems.length;
    document.getElementById('subtotalAmount').textContent = formatPrice(subtotal);
    document.getElementById('discountAmount').textContent = discount > 0 ? `-${formatPrice(discount)}` : '0₫';
    document.getElementById('totalAmount').textContent = formatPrice(total);

    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = selectedItems.length === 0;
}

// ==================== EVENT HANDLERS ====================

/**
 * Handle select all checkbox
 */
function handleSelectAll(e) {
    const isChecked = e.target.checked;
    
    if (isChecked) {
        cartState.items.forEach(item => cartState.selectedItems.add(item.skuId));
    } else {
        cartState.selectedItems.clear();
    }
    
    renderCartItems();
}

/**
 * Handle individual item select
 */
function handleItemSelect(e) {
    const skuId = parseInt(e.target.dataset.skuId);
    
    if (e.target.checked) {
        cartState.selectedItems.add(skuId);
    } else {
        cartState.selectedItems.delete(skuId);
    }
    
    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    selectAllCheckbox.checked = cartState.selectedItems.size === cartState.items.length;
    
    renderCartItems();
}

/**
 * Change item quantity
 */
async function changeQuantity(skuId, newQuantity) {
    const item = cartState.items.find(i => i.skuId === skuId);
    
    if (!item) return;
    
    // Validate quantity
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > item.stockQuantity) {
        showToast(`Chỉ còn ${item.stockQuantity} sản phẩm trong kho`, 'warning');
        newQuantity = item.stockQuantity;
    }
    
    if (newQuantity === item.quantity) return;
    
    // Show loading
    showLoading(true);
    
    try {
        const updatedCart = await updateQuantityAPI(skuId, newQuantity);
        
        if (updatedCart) {
            cartState.items = updatedCart.items || [];
            renderCartItems();
            showToast('Cập nhật số lượng thành công', 'success');
        }
    } catch (error) {
        console.error('Change quantity error:', error);
    } finally {
        showLoading(false);
    }
}

/**
 * Remove item from cart
 */
async function removeItem(skuId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    showLoading(true);
    
    try {
        const updatedCart = await removeItemAPI(skuId);
        
        if (updatedCart) {
            cartState.items = updatedCart.items || [];
            cartState.selectedItems.delete(skuId);
            renderCartItems();
            showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
        }
    } catch (error) {
        console.error('Remove item error:', error);
    } finally {
        showLoading(false);
    }
}

/**
 * Delete selected items
 */
async function deleteSelected() {
    if (cartState.selectedItems.size === 0) {
        showToast('Vui lòng chọn sản phẩm cần xóa', 'warning');
        return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa ${cartState.selectedItems.size} sản phẩm đã chọn?`)) return;
    
    showLoading(true);
    
    try {
        // Remove each selected item
        for (const skuId of cartState.selectedItems) {
            await removeItemAPI(skuId);
        }
        
        // Reload cart
        await loadCart();
        cartState.selectedItems.clear();
        showToast('Đã xóa các sản phẩm đã chọn', 'success');
    } catch (error) {
        console.error('Delete selected error:', error);
    } finally {
        showLoading(false);
    }
}

/**
 * Apply voucher
 */
function applyVoucher() {
    const voucherCode = document.getElementById('voucherInput').value.trim();
    
    if (!voucherCode) {
        showToast('Vui lòng nhập mã giảm giá', 'warning');
        return;
    }
    
    // Mock voucher validation (replace with real API call)
    const mockVouchers = {
        'EZGEAR10': { code: 'EZGEAR10', discountPercent: 10, name: 'Giảm 10%' },
        'EZGEAR20': { code: 'EZGEAR20', discountPercent: 20, name: 'Giảm 20%' },
        'WELCOME50': { code: 'WELCOME50', discountPercent: 50, name: 'Chào mừng - Giảm 50%' }
    };
    
    const voucher = mockVouchers[voucherCode.toUpperCase()];
    
    if (voucher) {
        cartState.voucher = voucher;
        document.getElementById('voucherInput').value = '';
        document.getElementById('voucherApplied').style.display = 'flex';
        document.getElementById('voucherName').textContent = voucher.name;
        updateSummary();
        showToast('Áp dụng mã giảm giá thành công!', 'success');
    } else {
        showToast('Mã giảm giá không hợp lệ', 'error');
    }
}

/**
 * Remove voucher
 */
function removeVoucher() {
    cartState.voucher = null;
    document.getElementById('voucherApplied').style.display = 'none';
    updateSummary();
    showToast('Đã hủy mã giảm giá', 'success');
}

/**
 * Proceed to checkout
 */
function proceedToCheckout() {
    const selectedItems = cartState.items.filter(item => 
        cartState.selectedItems.has(item.skuId)
    );
    
    if (selectedItems.length === 0) {
        showToast('Vui lòng chọn sản phẩm để thanh toán', 'warning');
        return;
    }
    
    // Save selected items and voucher to session storage
    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    if (cartState.voucher) {
        sessionStorage.setItem('checkoutVoucher', JSON.stringify(cartState.voucher));
    }
    
    // Redirect to checkout
    window.location.href = '/modules/checkout/index.html';
}

/**
 * View product details
 */
function viewProduct(productId) {
    window.location.href = `/product-detail.html?id=${productId}`;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
    cartState.isLoading = show;
}

/**
 * Format price to VND
 */
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Load cart data
 */
async function loadCart() {
    showLoading(true);
    
    try {
        const cart = await getCartAPI();
        
        if (cart) {
            cartState.items = cart.items || [];
            renderCartItems();
        }
    } catch (error) {
        console.error('Load cart error:', error);
    } finally {
        showLoading(false);
    }
}

// ==================== INITIALIZATION ====================

/**
 * Initialize cart page
 */
function initCart() {
    // Check authentication
    if (!TokenHelper.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để xem giỏ hàng', 'warning');
        setTimeout(() => {
            window.location.href = '/modules/auth/login.html';
        }, 1500);
        return;
    }

    // Event listeners
    document.getElementById('selectAllCheckbox').addEventListener('change', handleSelectAll);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
    document.getElementById('applyVoucherBtn').addEventListener('click', applyVoucher);
    document.getElementById('removeVoucherBtn').addEventListener('click', removeVoucher);
    document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);

    // Load cart data
    loadCart();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    initCart();
}
