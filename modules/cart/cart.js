/* ==================== CART MODULE JS ==================== */
/* API Calls and Cart Logic - Following Module Pattern */

// ==================== STATE MANAGEMENT ====================
let cartState = {
    items: [],
    selectedItems: new Set(),
    voucher: null,
    isLoading: false,
    currentProvinceId: null  // Track current selected province for inventory checking
};

// ==================== API CALLS ====================

/**
 * Get current user's cart
 * @param {Number} provinceId - Optional province ID for location-based inventory
 */
async function getCartAPI(provinceId = null) {
    try {
        const token = TokenHelper.getAccessToken();
        console.log('🔑 Getting cart with token:', token ? 'exists' : 'missing');
        
        if (!token) {
            console.log('❌ No token, redirecting to login');
            window.location.href = '/modules/auth/login.html';
            return null;
        }
        
        // Build URL with optional provinceId parameter
        let url = `${window.BASE_URL}/api/cart`;
        if (provinceId) {
            url += `?provinceId=${provinceId}`;
        }
        
        const response = await fetch(url, {
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
 * @param {Number} provinceId - Optional province ID for location-based inventory
 */
async function addItemAPI(item, provinceId = null) {
    try {
        // Build URL with optional provinceId parameter
        let url = `${window.BASE_URL}/api/cart/add`;
        if (provinceId) {
            url += `?provinceId=${provinceId}`;
        }
        
        const response = await fetch(url, {
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
 * @param {Number} provinceId - Optional province ID for location-based inventory
 */
async function updateQuantityAPI(skuId, quantity, provinceId = null) {
    try {
        // Build URL with quantity and optional provinceId parameters
        let url = `${window.BASE_URL}/api/cart/update/${skuId}?quantity=${quantity}`;
        if (provinceId) {
            url += `&provinceId=${provinceId}`;
        }
        
        const response = await fetch(url, {
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
 * @param {Number} provinceId - Optional province ID for location-based inventory
 */
async function removeItemAPI(skuId, provinceId = null) {
    try {
        // Build URL with optional provinceId parameter
        let url = `${window.BASE_URL}/api/cart/remove/${skuId}`;
        if (provinceId) {
            url += `?provinceId=${provinceId}`;
        }
        
        const response = await fetch(url, {
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

    container.innerHTML = cartState.items.map(item => {
        // Safely extract data with fallbacks
        const productName = item.productName || item.name || item.skuName || 'Sản phẩm';
        const productImage = item.imageUrl || item.image || item.productImage || '../../assets/img/placeholder.svg';
        const price = item.price || item.unitPrice || item.retailPrice || 0;
        const originalPrice = item.originalPrice || item.originalRetailPrice || 0;
        const skuId = item.skuId || item.id;
        const productId = item.productId || 0;
        const quantity = item.quantity || 1;
        const stockQuantity = item.availableQuantity || item.stockQuantity || item.stock || 0;
        const variant = item.variant || item.variantName || item.skuName || '';
        
        // Kiểm tra hết hàng - API trả về outOfStock hoặc availableQuantity === 0
        const isOutOfStock = item.outOfStock === true || stockQuantity === 0;
        
        return `
        <div class="cart-item ${cartState.selectedItems.has(skuId) ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}" data-sku-id="${skuId}">
            ${isOutOfStock ? `
            <div class="sold-out-tag">
                <img src="../../assets/img/sold-out.png" alt="Hết hàng">
            </div>` : ''}

            <!-- Checkbox -->
            <div class="item-checkbox">
                <input 
                    type="checkbox" 
                    class="item-select-checkbox"
                    data-sku-id="${skuId}"
                    ${cartState.selectedItems.has(skuId) ? 'checked' : ''}
                    ${isOutOfStock ? 'disabled' : ''}
                >
            </div>

            <!-- Image -->
            <div class="item-image">
                <img src="${productImage}" 
                     alt="${productName}"
                     class="product-img"
                     onerror="this.src='../../assets/img/placeholder.svg'">
            </div>

            <!-- Info -->
            <div class="item-info">
                <div class="item-name" onclick="viewProduct(${productId})">
                    ${productName}
                </div>
                
                ${variant ? `
                    <div class="item-variant">
                        <i class="fas fa-tag"></i> ${variant}
                    </div>
                ` : ''}

                <div class="item-stock ${getStockClass(stockQuantity)}">
                    <i class="fas fa-box"></i>
                    ${getStockText(stockQuantity)}
                </div>
                
                ${isOutOfStock ? `<div class="text-danger small" style="color: #d70018; font-weight: 500; margin-top: 5px;">
                    <i class="fas fa-exclamation-circle"></i> Tạm hết hàng tại khu vực này
                </div>` : ''}

                <!-- Bottom Row -->
                <div class="item-bottom">
                    <!-- Price -->
                    <div class="item-price">
                        <div class="price-current">${formatPrice(price)}</div>
                        ${originalPrice && originalPrice > price ? `
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="price-original">${formatPrice(originalPrice)}</span>
                                <span class="price-discount">-${Math.round((1 - price / originalPrice) * 100)}%</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div class="item-actions">
                        <!-- Quantity Control -->
                        <div class="quantity-control">
                            <button 
                                onclick="changeQuantity(${skuId}, ${quantity - 1})"
                            >
                                <i class="fas fa-minus"></i>
                            </button>
                            <input 
                                type="number" 
                                value="${quantity}" 
                                min="1" 
                                max="${stockQuantity}"
                                onchange="changeQuantity(${skuId}, parseInt(this.value))"
                            >
                            <button 
                                onclick="changeQuantity(${skuId}, ${quantity + 1})"
                            >
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>

                        <!-- Remove Button -->
                        <button class="btn-remove" onclick="removeItem(${skuId})" title="Xóa sản phẩm">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');

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
        cartState.selectedItems.has(item.skuId || item.id)
    );

    const subtotal = selectedItems.reduce((sum, item) => {
        const price = item.price || item.unitPrice || item.retailPrice || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
    }, 0);
    
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
    const item = cartState.items.find(i => (i.skuId || i.id) === skuId);
    
    if (!item) return;
    
    const stockQuantity = item.stockQuantity || item.stock || 100;
    const currentQuantity = item.quantity || 1;
    
    // Validate quantity
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > stockQuantity) {
        showToast(`Chỉ còn ${stockQuantity} sản phẩm trong kho`, 'warning');
        newQuantity = stockQuantity;
    }
    
    if (newQuantity === currentQuantity) return;
    
    // Show loading
    showLoading(true);
    
    try {
        await updateQuantityAPI(skuId, newQuantity, cartState.currentProvinceId);
        // Reload cart to get latest data from backend
        await loadCart();
        showToast('Cập nhật số lượng thành công', 'success');
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
        await removeItemAPI(skuId, cartState.currentProvinceId);
        cartState.selectedItems.delete(skuId);
        // Reload cart to get latest data from backend
        await loadCart();
        showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
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
            await removeItemAPI(skuId, cartState.currentProvinceId);
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
        cartState.selectedItems.has(item.skuId || item.id)
    );
    
    if (selectedItems.length === 0) {
        showToast('Vui lòng chọn sản phẩm để thanh toán', 'warning');
        return;
    }
    
    // Prepare cart items with only necessary fields
    const checkoutItems = selectedItems.map(item => ({
        skuId: item.skuId || item.id,
        quantity: item.quantity,
        // Keep additional info for display in checkout page
        productName: item.productName || item.name,
        skuName: item.skuName || item.name,
        imageUrl: item.imageUrl || item.image,
        price: item.price || item.unitPrice,
        productId: item.productId
    }));
    
    console.log('🛒 Proceeding to checkout with items:', checkoutItems);
    
    // Save to session storage
    sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutItems));
    
    // Save voucher if applied
    if (cartState.voucher) {
        sessionStorage.setItem('checkoutVoucher', JSON.stringify(cartState.voucher));
    } else {
        sessionStorage.removeItem('checkoutVoucher');
    }
    
    // Redirect to checkout
    window.location.href = '../checkout/checkout.html';
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
 * Load cart data with current province ID
 */
async function loadCart() {
    showLoading(true);
    
    try {
        const cart = await getCartAPI(cartState.currentProvinceId);
        
        console.log('📦 Cart data received:', cart);
        console.log('🌍 Province ID used:', cartState.currentProvinceId);
        
        if (cart) {
            // Backend có thể trả về cart.items hoặc cart.cartItems hoặc trực tiếp là array
            if (Array.isArray(cart)) {
                cartState.items = cart;
            } else if (cart.items) {
                cartState.items = cart.items;
            } else if (cart.cartItems) {
                cartState.items = cart.cartItems;
            } else {
                cartState.items = [];
            }
            
            console.log('✅ Cart items loaded:', cartState.items.length, 'items');
            console.log('First item sample:', cartState.items[0]);
            
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
 * Initialize user info in header
 */
function initUserInfo() {
    if (TokenHelper.isLoggedIn()) {
        const userEmail = localStorage.getItem('user_email') || 'User';
        const initial = userEmail.charAt(0).toUpperCase();
        document.getElementById('userAvatar').textContent = initial;
        document.getElementById('userName').textContent = userEmail.split('@')[0];
    } else {
        document.getElementById('userInfo').innerHTML = `
            <button class="btn-cart" style="background: transparent; border: 1px solid white; padding: 8px 20px;" 
                    onclick="window.location.href='../auth/login.html'">
                <i class="fas fa-sign-in-alt"></i>
                Đăng nhập
            </button>
        `;
    }
}

/**
 * Update cart badge in header
 */
async function updateCartBadge() {
    if (!TokenHelper.isLoggedIn()) {
        document.getElementById('cartBadge').textContent = '0';
        return;
    }
    
    try {
        const cart = await getCartAPI();
        if (!cart) {
            document.getElementById('cartBadge').textContent = '0';
            return;
        }
        
        const items = cart.items || cart.cartItems || [];
        const count = items.length || 0;
        document.getElementById('cartBadge').textContent = count;
    } catch (error) {
        console.error('Update cart badge error:', error);
        document.getElementById('cartBadge').textContent = '0';
    }
}

// ==================== LOCATION MANAGEMENT ====================

let locationState = {
    locations: [],
    selectedLocationId: null
};

/**
 * Fetch locations/provinces from API
 */
async function fetchLocations() {
    try {
        const token = TokenHelper.getAccessToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${window.BASE_URL}/api/locations`, {
            headers: headers
        });
        
        if (!response.ok) throw new Error('Failed to fetch locations');
        
        const data = await response.json();
        locationState.locations = Array.isArray(data) ? data : (data.payload || []);
        
        console.log('🌍 Locations/Provinces loaded:', locationState.locations.length);
        
        // Initialize default location if not set
        if (!locationState.selectedLocationId) {
            const savedLocation = localStorage.getItem('selectedLocation');
            if (savedLocation) {
                const { id, name } = JSON.parse(savedLocation);
                selectLocation(id, name, false);
            } else {
                const defaultLoc = locationState.locations.find(l => l.name.includes('Hà Nội')) || locationState.locations[0];
                if (defaultLoc) {
                    selectLocation(defaultLoc.id, defaultLoc.name, false);
                }
            }
        } else {
            // If location already selected, ensure cart state is synced
            cartState.currentProvinceId = locationState.selectedLocationId;
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
        locationState.locations = [
            { id: 1, name: 'Hà Nội' },
            { id: 2, name: 'Hồ Chí Minh' }
        ];
    }
}

/**
 * Open location modal
 */
function openLocationModal() {
    const modal = document.getElementById('locationModal');
    modal.classList.add('show');
    
    document.getElementById('locationSearchInput').value = '';
    
    if (locationState.locations.length === 0) {
        fetchLocations().then(() => renderLocations(locationState.locations));
    } else {
        renderLocations(locationState.locations);
    }
}

/**
 * Close location modal
 */
function closeLocationModal() {
    document.getElementById('locationModal').classList.remove('show');
}

/**
 * Render locations list
 */
function renderLocations(locations) {
    const list = document.getElementById('locationList');
    
    if (locations.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px;">Không tìm thấy kết quả</div>';
        return;
    }
    
    list.innerHTML = locations.map(loc => `
        <div class="location-item ${loc.id === locationState.selectedLocationId ? 'selected' : ''}" 
             onclick="selectLocation(${loc.id}, '${loc.name}')">
            <span>${loc.name}</span>
            <i class="fas fa-check-circle"></i>
        </div>
    `).join('');
}

/**
 * Handle location search
 */
function handleLocationSearch() {
    const keyword = document.getElementById('locationSearchInput').value.toLowerCase();
    const filtered = locationState.locations.filter(loc => 
        loc.name.toLowerCase().includes(keyword)
    );
    renderLocations(filtered);
}

/**
 * Select location and reload cart with new province inventory
 */
function selectLocation(id, name, close = true) {
    const previousLocationId = locationState.selectedLocationId;
    locationState.selectedLocationId = id;
    
    const headerLocationText = document.querySelector('.header-location .text-large');
    if (headerLocationText) {
        headerLocationText.textContent = name;
    }
    
    localStorage.setItem('selectedLocation', JSON.stringify({ id, name }));
    
    if (document.getElementById('locationModal').classList.contains('show')) {
        handleLocationSearch();
    }
    
    if (close) {
        closeLocationModal();
        showToast(`Đã chọn khu vực: ${name}`, 'success');
    }
    
    // Update cart state with new province ID and reload cart to check inventory
    cartState.currentProvinceId = id;
    
    // Only reload if location actually changed and we're logged in
    if (previousLocationId !== id && TokenHelper.isLoggedIn()) {
        console.log('🔄 Location changed, reloading cart with provinceId:', id);
        loadCart();
    }
}

/**
 * Initialize cart page
 */
function initCart() {
    // Initialize header
    initUserInfo();
    updateCartBadge();
    fetchLocations();
    
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
