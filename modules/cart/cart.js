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
            window.location.href = '/modules/auth/auth.html';
            return null;
        }
        
        // Build URL with optional provinceId parameter
        let url = `http://localhost:8080/api/cart`;
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
                window.location.href = '/modules/auth/auth.html';
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
        let url = `http://localhost:8080/api/cart/add`;
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
        // Map CartItemResponse from backend
        // Backend returns: skuId, skuName, productName, imageUrl, price, quantity, selected, categoryId, isOutOfStock, availableQuantity
        const productName = item.productName || 'Sản phẩm';
        const productImage = item.imageUrl || '../../assets/img/placeholder.svg';
        const price = item.price || 0;
        const originalPrice = item.originalPrice || 0;
        const skuId = item.skuId;
        const productId = item.productId || 0;
        const quantity = item.quantity || 1;
        const stockQuantity = item.availableQuantity || 0;
        const variant = item.skuName || '';
        
        // Kiểm tra hết hàng - Backend trả về isOutOfStock
        const isOutOfStock = item.isOutOfStock === true || item.availableQuantity === 0;
        
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
    
    // 🔥 AUTO-REMOVE VOUCHER: Check if voucher is still valid for current selection
    if (cartState.voucher) {
        let shouldRemoveVoucher = false;
        
        // Case 1: No items selected
        if (selectedItems.length === 0) {
            shouldRemoveVoucher = true;
            console.log('🚫 Removing voucher: No items selected');
        }
        // Case 2: Check category-based voucher
        else if (cartState.voucher.scope === 'CATEGORY' && cartState.voucher.applicableCategoryIds) {
            const hasApplicableItem = selectedItems.some(item => 
                cartState.voucher.applicableCategoryIds.includes(item.categoryId)
            );
            if (!hasApplicableItem) {
                shouldRemoveVoucher = true;
                console.log('🚫 Removing voucher: No items match category requirements');
            }
        }
        // Case 3: Check minimum order
        else if (cartState.voucher.minOrder && subtotal < cartState.voucher.minOrder) {
            shouldRemoveVoucher = true;
            console.log('🚫 Removing voucher: Subtotal below minimum order');
        }
        
        if (shouldRemoveVoucher) {
            // Auto-remove voucher
            cartState.voucher = null;
            document.getElementById('cartVoucherApplied').style.display = 'none';
            document.getElementById('cartVoucherContainer').style.display = 'block';
            const voucherInput = document.getElementById('cartVoucherInput');
            if (voucherInput) voucherInput.value = '';
            showToast('Đã hủy mã giảm giá do thay đổi giỏ hàng', 'info');
        }
    }
    
    // Support either percent-based or fixed-amount voucher
    let discount = 0;
    if (cartState.voucher) {
        if (typeof cartState.voucher.discountAmount === 'number' && cartState.voucher.discountAmount > 0) {
            discount = Math.min(cartState.voucher.discountAmount, subtotal);
        } else if (typeof cartState.voucher.discountPercent === 'number' && cartState.voucher.discountPercent > 0) {
            discount = subtotal * cartState.voucher.discountPercent / 100;
        }
    }
    const total = Math.max(0, subtotal - discount);

    // Update UI
    document.getElementById('selectedCount').textContent = cartState.selectedItems.size;
    document.getElementById('summaryItemCount').textContent = selectedItems.length;
    document.getElementById('subtotalAmount').textContent = formatPrice(subtotal);
    document.getElementById('discountAmount').textContent = discount > 0 ? `-${formatPrice(discount)}` : '0₫';
    document.getElementById('totalAmount').textContent = formatPrice(total);

    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = selectedItems.length === 0;
    
    // Update voucher modal data
    updateVoucherModalCartData();
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
    
    // If trying to decrease below 1, remove the item silently (no global loading overlay)
    if (newQuantity < 1) {
        await removeItemSilent(skuId);
        return;
    }

    // Validate max quantity
    if (newQuantity > stockQuantity) {
        showToast(`Chỉ còn ${stockQuantity} sản phẩm trong kho`, 'warning');
        newQuantity = stockQuantity;
    }

    if (newQuantity === currentQuantity) return;

    // Update UI optimistically: update local state then persist to backend without global loader
    try {
        // Update local item quantity so UI responds instantly
        item.quantity = newQuantity;
        renderCartItems();
        updateSummary();

        // Persist change
        await updateQuantityAPI(skuId, newQuantity, cartState.currentProvinceId);

        // Reload cart to sync with backend (silent)
        await loadCart();
        showToast('Cập nhật số lượng thành công', 'success');
    } catch (error) {
        console.error('Change quantity error:', error);
        // Re-load to ensure consistency
        await loadCart();
        showToast('Cập nhật số lượng thất bại', 'error');
    }
}

/**
 * Remove item silently without showing global loading overlay
 */
async function removeItemSilent(skuId) {
    try {
        await removeItemAPI(skuId, cartState.currentProvinceId);
        cartState.selectedItems.delete(skuId);
        await loadCart();
        showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
    } catch (error) {
        console.error('Silent remove error:', error);
        showToast('Xóa sản phẩm thất bại', 'error');
    }
}

/**
 * Remove item from cart
 */
async function removeItem(skuId) {
    // Remove confirmation prompt to make it smoother
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

// ==================== VOUCHER MODAL INTEGRATION ====================

/**
 * Initialize cart voucher modal
 */
function initializeCartVoucherModal() {
    // Create voucher select button for cart
    createVoucherSelectButton('cartVoucherContainer', 'cartVoucherInput', 'Chọn Voucher Giảm Giá');
    
    // Initialize voucher modal with cart specific options
    if (typeof initVoucherModal === 'function') {
        initVoucherModal({
            modalId: 'cartVoucherModal',
            inputId: 'cartVoucherInput', 
            cartData: getCartDataForVoucher(),
            onApply: (code) => {
                // Auto apply voucher when selected from modal
                applyVoucherCode(code);
            }
        });
    }
    
    // Add event listeners for new voucher input
    const voucherInput = document.getElementById('cartVoucherInput');
    if (voucherInput) {
        voucherInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyVoucherCode(voucherInput.value);
            }
        });
        
        voucherInput.addEventListener('change', (e) => {
            if (e.target.value.trim()) {
                applyVoucherCode(e.target.value);
            }
        });
    }

    // Add event listener for remove voucher button
    const removeBtn = document.getElementById('removeCartVoucherBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', removeCartVoucher);
    }
}

/**
 * Get cart data formatted for voucher system
 */
function getCartDataForVoucher() {
    // Use same logic as updateSummary() to get selected items
    const selectedItems = cartState.items.filter(item => 
        cartState.selectedItems.has(item.skuId || item.id)
    );

    const totalPrice = selectedItems.reduce((sum, item) => {
        const price = item.price || item.unitPrice || item.retailPrice || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
    }, 0);
    
    const items = selectedItems.map(item => {
        // Map CartItemResponse from backend
        // Backend returns: skuId, skuName, productName, imageUrl, price, quantity, selected, categoryId, isOutOfStock, availableQuantity
        
        return {
            skuId: item.skuId,
            skuName: item.skuName,
            productName: item.productName,
            imageUrl: item.imageUrl,
            categoryId: item.categoryId, // Backend trả về trực tiếp categoryId
            price: item.price || 0,
            quantity: item.quantity || 1,
            selected: item.selected || false,
            isOutOfStock: item.isOutOfStock || item.outOfStock || false,
            availableQuantity: item.availableQuantity || 0
        };
    });
    
    console.log('🛒 Cart data for voucher:', { totalPrice, itemsCount: items.length, items });
    
    return {
        totalPrice,
        items
    };
}

/**
 * Update cart data in voucher modal when cart changes
 */
function updateVoucherModalCartData() {
    if (window.voucherModal) {
        const cartData = getCartDataForVoucher();
        console.log('📊 Updating voucher modal with cart data:', cartData);
        window.voucherModal.updateCartData(cartData);
    }
}

/**
 * Apply voucher with code - New function for modal integration
 */
async function applyVoucherCode(code) {
    if (!code || !code.trim()) {
        showToast('Vui lòng nhập mã giảm giá', 'warning');
        return;
    }

    const voucherCode = code.trim();
    
    // Check if there are selected items
    if (cartState.selectedItems.size === 0) {
        showToast('Vui lòng chọn sản phẩm trước khi áp dụng voucher', 'warning');
        return;
    }
    
    showLoading(true);
    try {
        let result = null;
        let matchedVoucher = null; // Store matched voucher for metadata

        // Try multiple endpoint patterns to be robust
        const endpoints = [
            `http://localhost:8080/api/voucher/validate/${voucherCode}`,
            `http://localhost:8080/api/voucher/validate?code=${encodeURIComponent(voucherCode)}`,
            `http://localhost:8080/api/voucher/validate`
        ];

        for (const url of endpoints) {
            try {
                let resp;
                if (url.endsWith('/validate')) {
                    // try POST body pattern
                    resp = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
                        },
                        body: JSON.stringify({ code: voucherCode })
                    });
                } else {
                    resp = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
                        }
                    });
                }

                if (!resp.ok) {
                    // try next endpoint
                    continue;
                }

                const json = await resp.json().catch(() => null);
                if (json && json.success && json.payload) {
                    result = json;
                    break;
                }
            } catch (e) {
                // ignore and try next
                console.warn('Voucher endpoint attempt failed:', e);
                continue;
            }
        }

        // If backend validate endpoints all failed, try client-side validation using available vouchers
        if (!result) {
            console.log('❌ No validate endpoint found, trying client-side validation...');
            
            try {
                // Get available vouchers and validate client-side
                const availableResponse = await fetch('http://localhost:8080/api/voucher/available', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (availableResponse.ok) {
                    const availableData = await availableResponse.json();
                    const availableVouchers = availableData.payload || [];
                    
                    // Find voucher with matching code and store globally
                    matchedVoucher = availableVouchers.find(v => 
                        v.code.toUpperCase() === voucherCode.toUpperCase()
                    );
                    
                    if (matchedVoucher) {
                        // Client-side validation
                        const selectedItems = cartState.items.filter(item => 
                            cartState.selectedItems.has(item.skuId || item.id)
                        );
                        
                        const subtotal = selectedItems.reduce((sum, item) => {
                            const price = item.price || item.unitPrice || item.retailPrice || 0;
                            const quantity = item.quantity || 1;
                            return sum + (price * quantity);
                        }, 0);
                        
                        // Check minimum order
                        if (matchedVoucher.minOrder && subtotal < matchedVoucher.minOrder) {
                            throw new Error(`Đơn hàng tối thiểu ${formatPrice(matchedVoucher.minOrder)}`);
                        }
                        
                        // Check category scope
                        if (matchedVoucher.scope === 'CATEGORY' && matchedVoucher.applicableCategoryIds) {
                            const hasApplicableItem = selectedItems.some(item => 
                                matchedVoucher.applicableCategoryIds.includes(item.categoryId)
                            );
                            
                            if (!hasApplicableItem) {
                                throw new Error('Không có sản phẩm phù hợp trong giỏ hàng');
                            }
                        }
                        
                        // Check expiry
                        const now = new Date();
                        const endDate = new Date(matchedVoucher.endAt);
                        if (now > endDate) {
                            throw new Error('Voucher đã hết hạn');
                        }
                        
                        // Calculate discount
                        let discountAmount = 0;
                        if (matchedVoucher.discountType === 'PERCENT') {
                            discountAmount = Math.round(subtotal * matchedVoucher.discountValue / 100);
                            if (matchedVoucher.maxDiscount) {
                                discountAmount = Math.min(discountAmount, matchedVoucher.maxDiscount);
                            }
                        } else {
                            discountAmount = matchedVoucher.discountValue;
                        }
                        
                        // Set result as if from API
                        result = {
                            success: true,
                            payload: {
                                code: matchedVoucher.code,
                                discountAmount: discountAmount,
                                name: `Voucher ${matchedVoucher.code}`,
                                id: matchedVoucher.id
                            }
                        };
                    } else {
                        throw new Error('Mã voucher không tồn tại');
                    }
                } else {
                    throw new Error('Không thể kiểm tra mã voucher');
                }
            } catch (clientValidationError) {
                throw new Error(clientValidationError.message || 'Mã giảm giá không hợp lệ');
            }
        }

        const voucher = result.payload;
        cartState.voucher = {
            code: voucher.code,
            discountPercent: voucher.discountPercent,
            discountAmount: voucher.discountAmount,
            name: voucher.name,
            // Store validation metadata for auto-removal check
            scope: voucher.scope || matchedVoucher?.scope,
            applicableCategoryIds: voucher.applicableCategoryIds || matchedVoucher?.applicableCategoryIds,
            minOrder: voucher.minOrder || matchedVoucher?.minOrder
        };
        
        showAppliedVoucher(voucher);
        updateSummary();
        showToast('Áp dụng mã giảm giá thành công!', 'success');
        
    } catch (error) {
        console.error('Apply voucher error:', error);
        showToast(error.message || 'Mã giảm giá không hợp lệ', 'error');
        
        // Clear input on error
        const voucherInput = document.getElementById('cartVoucherInput');
        if (voucherInput) {
            voucherInput.value = '';
        }
    } finally {
        showLoading(false);
    }
}

/**
 * Show applied voucher
 */
function showAppliedVoucher(voucher) {
    // Hide voucher container and show applied voucher
    document.getElementById('cartVoucherContainer').style.display = 'none';
    document.getElementById('cartVoucherApplied').style.display = 'flex';
    
    // Update applied voucher info
    document.getElementById('cartVoucherName').textContent = voucher.name || voucher.code;
    
    // Clear input
    const voucherInput = document.getElementById('cartVoucherInput');
    if (voucherInput) {
        voucherInput.value = '';
    }
}

/**
 * Remove cart voucher
 */
function removeCartVoucher() {
    cartState.voucher = null;
    
    // Hide applied voucher and show voucher container
    document.getElementById('cartVoucherApplied').style.display = 'none';
    document.getElementById('cartVoucherContainer').style.display = 'block';
    
    // Clear input
    const voucherInput = document.getElementById('cartVoucherInput');
    if (voucherInput) {
        voucherInput.value = '';
    }
    
    updateSummary();
    showToast('Đã hủy mã giảm giá', 'success');
}

// ==================== ORIGINAL VOUCHER FUNCTIONS ====================

/**
 * Apply voucher - Legacy function, now calls applyVoucherCode
 */
async function applyVoucher() {
    const voucherInput = document.getElementById('voucherInput');
    if (voucherInput && voucherInput.value) {
        await applyVoucherCode(voucherInput.value);
    }
}

/**
 * Remove voucher - Legacy function
 */
function removeVoucher() {
    removeCartVoucher();
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
        sessionStorage.setItem('checkoutVoucher', JSON.stringify({
            code: cartState.voucher.code,
            discountAmount: cartState.voucher.discountAmount,
            discountPercent: cartState.voucher.discountPercent,
            name: cartState.voucher.name,
            id: cartState.voucher.id
        }));
        console.log('💾 Saved voucher to checkout:', cartState.voucher);
    } else {
        // Clear any existing voucher if none applied
        sessionStorage.removeItem('checkoutVoucher');
    }
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
            
            // 🔍 DEBUG: Check if categoryId exists in cart items
            if (cartState.items.length > 0) {
                const firstItem = cartState.items[0];
                console.log('🔍 Item structure check:', {
                    hasCategoryId: 'categoryId' in firstItem,
                    categoryId: firstItem.categoryId,
                    hasCategory: 'category' in firstItem,
                    category: firstItem.category,
                    hasCategoryDTO: 'categoryDTO' in firstItem,
                    categoryDTO: firstItem.categoryDTO,
                    allKeys: Object.keys(firstItem)
                });
            }
            
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
                    onclick="window.location.href='../auth/auth.html'">
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
            window.location.href = '/modules/auth/auth.html';
        }, 1500);
        return;
    }

    // Initialize voucher modal
    initializeCartVoucherModal();

    // Event listeners
    document.getElementById('selectAllCheckbox').addEventListener('change', handleSelectAll);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
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
