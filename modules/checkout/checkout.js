/* ==================== CHECKOUT MODULE JS ==================== */
/* Xử lý flow thanh toán hoàn chỉnh - POST /cart -> POST /checkout */

// ==================== STATE MANAGEMENT ====================
let checkoutState = {
    cartItems: [], // Sản phẩm từ giỏ hàng (từ cart page)
    selectedAddress: null,
    voucherCode: null,
    paymentMethod: 'COD',
    orderPreview: null, // Kết quả từ POST /cart
    isProcessing: false
};

// ==================== API ENDPOINTS ====================
const CHECKOUT_API = `${window.BASE_URL}/checkout`;
const ADDRESS_API = `${window.BASE_URL}/api/customer-addresses`;

// ==================== INITIALIZATION ====================

/**
 * Initialize checkout page
 */
async function initCheckout() {
    console.log('🛒 Initializing checkout...');
    
    // Check authentication
    if (!TokenHelper.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để thanh toán', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 1500);
        return;
    }
    
    // Get cart items from sessionStorage (passed from cart page)
    const savedCartItems = sessionStorage.getItem('checkoutItems');
    const savedVoucher = sessionStorage.getItem('checkoutVoucher');
    
    if (!savedCartItems) {
        showToast('Không có sản phẩm nào được chọn', 'warning');
        setTimeout(() => {
            window.location.href = '../cart/cart.html';
        }, 1500);
        return;
    }
    
    try {
        checkoutState.cartItems = JSON.parse(savedCartItems);
        if (savedVoucher) {
            const voucher = JSON.parse(savedVoucher);
            checkoutState.voucherCode = voucher.code;
        }
        
        console.log('📦 Cart items:', checkoutState.cartItems);
        
        // Setup event listeners
        setupEventListeners();
        
        // Render products from cart items
        renderProductsFromCart();
        calculateLocalSummary();
        
        // Load user addresses
        await loadUserAddresses();
        
    } catch (error) {
        console.error('❌ Init error:', error);
        showToast('Lỗi khởi tạo trang thanh toán', 'error');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            checkoutState.paymentMethod = e.target.value;
            
            // Update active state
            document.querySelectorAll('.payment-method').forEach(method => {
                method.classList.remove('active');
            });
            e.target.closest('.payment-method').classList.add('active');
            
            console.log('💳 Payment method changed:', checkoutState.paymentMethod);
        });
    });
}

// ==================== LOCAL CALCULATION (NO PREVIEW API) ====================

/**
 * Render products from cart items (no API call)
 */
function renderProductsFromCart() {
    const productsList = document.getElementById('productsList');
    const productCount = document.getElementById('productCount');
    
    productCount.textContent = checkoutState.cartItems.length;
    
    productsList.innerHTML = checkoutState.cartItems.map(item => {
        const lineTotal = (item.price || 0) * (item.quantity || 1);
        
        return `
            <div class="product-item">
                <div class="product-image">
                    <img src="${item.imageUrl || '../../assets/img/placeholder.svg'}" 
                         alt="${item.productName}"
                         onerror="this.src='../../assets/img/placeholder.svg'">
                    <span class="product-quantity">${item.quantity}</span>
                </div>
                <div class="product-info">
                    <div class="product-name">${item.productName}</div>
                    ${item.skuName && item.skuName !== item.productName ? `<div class="product-variant">${item.skuName}</div>` : ''}
                    <div class="product-price">
                        <span class="unit-price">${formatPrice(item.price)}</span>
                        <span class="quantity-label">x ${item.quantity}</span>
                    </div>
                </div>
                <div class="product-total">
                    ${formatPrice(lineTotal)}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Calculate order summary locally (client-side)
 */
function calculateLocalSummary() {
    const subtotal = checkoutState.cartItems.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    // For now, no discount calculation (will be done by backend)
    const discount = 0;
    const shippingFee = 0; // No shipping fee display
    const total = subtotal - discount + shippingFee;
    
    // Update UI
    document.getElementById('summaryItemCount').textContent = checkoutState.cartItems.length;
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shippingFee').textContent = formatPrice(shippingFee);
    document.getElementById('totalAmount').textContent = formatPrice(total);
    
    // Hide discount row initially
    document.getElementById('discountRow').style.display = 'none';
}

// ==================== ORDER PREVIEW (DEPRECATED - NOT USED) ====================

/**
 * Load order preview by calling POST /cart
 * API trả về: subtotal, discount, shippingFee, grandTotal
 * NOTE: This function is deprecated - backend doesn't have /cart endpoint
 */
async function loadOrderPreview() {
    console.warn('⚠️ loadOrderPreview() is deprecated - using local calculation instead');
    // This function is kept for reference but not used
    return;
}

/**
 * Render order preview products
 */
function renderOrderPreview() {
    const preview = checkoutState.orderPreview;
    if (!preview || !preview.items) {
        console.warn('⚠️ No order preview data');
        return;
    }
    
    const productsList = document.getElementById('productsList');
    const productCount = document.getElementById('productCount');
    
    productCount.textContent = preview.items.length;
    
    productsList.innerHTML = preview.items.map(item => `
        <div class="product-item">
            <div class="product-image">
                <img src="${item.imageUrl || '../../assets/img/placeholder.svg'}" 
                     alt="${item.productName}"
                     onerror="this.src='../../assets/img/placeholder.svg'">
                <span class="product-quantity">${item.quantity}</span>
            </div>
            <div class="product-info">
                <div class="product-name">${item.productName}</div>
                ${item.skuName ? `<div class="product-variant">${item.skuName}</div>` : ''}
                <div class="product-price">
                    <span class="unit-price">${formatPrice(item.price)}</span>
                    <span class="quantity-label">x ${item.quantity}</span>
                </div>
            </div>
            <div class="product-total">
                ${formatPrice(item.lineTotal)}
            </div>
        </div>
    `).join('');
}

/**
 * Update order summary sidebar
 */
function updateOrderSummary() {
    const preview = checkoutState.orderPreview;
    if (!preview) return;
    
    document.getElementById('summaryItemCount').textContent = preview.items?.length || 0;
    document.getElementById('subtotal').textContent = formatPrice(preview.subtotal || 0);
    document.getElementById('shippingFee').textContent = formatPrice(preview.shippingFee || 0);
    document.getElementById('totalAmount').textContent = formatPrice(preview.grandTotal || 0);
    
    // Show/hide discount row
    const discountRow = document.getElementById('discountRow');
    if (preview.discount && preview.discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discount').textContent = `-${formatPrice(preview.discount)}`;
    } else {
        discountRow.style.display = 'none';
    }
    
    // Update voucher display if applied
    if (checkoutState.voucherCode && preview.voucher) {
        showAppliedVoucher(preview.voucher);
    }
}

// ==================== ADDRESS MANAGEMENT ====================

/**
 * Load user addresses
 */
async function loadUserAddresses() {
    try {
        const response = await fetch(ADDRESS_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách địa chỉ');
        }
        
        const data = await response.json();
        console.log('📍 Addresses loaded:', data);
        
        const addresses = data.payload || data.data || data;
        
        if (addresses && addresses.length > 0) {
            // Auto-select default address
            const defaultAddress = addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
                selectAddress(defaultAddress);
            }
        }
        
    } catch (error) {
        console.error('❌ Load addresses error:', error);
        // Không hiển thị toast lỗi vì có thể user chưa có địa chỉ nào
    }
}

/**
 * Open address selection modal
 */
async function openAddressModal() {
    const modal = document.getElementById('addressModal');
    const addressList = document.getElementById('addressList');
    
    modal.classList.add('show');
    addressList.innerHTML = '<div class="loading-addresses"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const response = await fetch(ADDRESS_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách địa chỉ');
        }
        
        const data = await response.json();
        const addresses = data.payload || data.data || data;
        
        if (!addresses || addresses.length === 0) {
            addressList.innerHTML = `
                <div class="empty-addresses">
                    <i class="fas fa-map-marked-alt"></i>
                    <p>Bạn chưa có địa chỉ nào</p>
                </div>
            `;
            return;
        }
        
        addressList.innerHTML = addresses.map(addr => `
            <div class="address-item ${checkoutState.selectedAddress?.id === addr.id ? 'selected' : ''}" 
                 onclick="selectAddress(${JSON.stringify(addr).replace(/"/g, '&quot;')})">
                <div class="address-radio">
                    <i class="fas fa-${checkoutState.selectedAddress?.id === addr.id ? 'check-circle' : 'circle'}"></i>
                </div>
                <div class="address-content">
                    <div class="address-header">
                        <span class="address-label-tag">
                            <i class="fas fa-${addr.label === 'Văn Phòng' ? 'building' : 'home'}"></i>
                            ${addr.label || 'Nhà Riêng'}
                        </span>
                        ${addr.isDefault ? '<span class="default-badge">Mặc định</span>' : ''}
                    </div>
                    <div class="address-receiver">
                        <strong>${addr.receiverName}</strong> | ${addr.receiverPhone}
                    </div>
                    <div class="address-full">
                        ${addr.fullAddress || addr.addressLine}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Load addresses error:', error);
        addressList.innerHTML = `
            <div class="error-addresses">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không thể tải danh sách địa chỉ</p>
            </div>
        `;
    }
}

/**
 * Close address modal
 */
function closeAddressModal() {
    document.getElementById('addressModal').classList.remove('show');
}

/**
 * Select address
 * @param {Object} address - Address object
 */
function selectAddress(address) {
    if (typeof address === 'string') {
        address = JSON.parse(address);
    }
    
    checkoutState.selectedAddress = address;
    
    console.log('✅ Selected address:', address);
    
    // Update UI
    document.getElementById('noAddress').style.display = 'none';
    document.getElementById('selectedAddressCard').style.display = 'flex';
    
    document.getElementById('addressLabel').innerHTML = `
        <i class="fas fa-${address.label === 'Văn Phòng' ? 'building' : 'home'}"></i>
        ${address.label || 'Nhà Riêng'}
    `;
    document.getElementById('addressName').textContent = address.receiverName;
    document.getElementById('addressPhone').innerHTML = `
        <i class="fas fa-phone"></i> ${address.receiverPhone}
    `;
    document.getElementById('addressDetail').textContent = address.fullAddress || address.addressLine;
    
    // Close modal
    closeAddressModal();
    
    // Enable checkout button
    updateCheckoutButton();
}

/**
 * Add new address
 */
function addNewAddress() {
    // Redirect to address page
    window.location.href = '../address/index.html';
}

// ==================== VOUCHER MANAGEMENT ====================

/**
 * Apply voucher
 */
async function applyVoucher() {
    const voucherInput = document.getElementById('voucherInput');
    const voucherCode = voucherInput.value.trim().toUpperCase();
    
    if (!voucherCode) {
        showToast('Vui lòng nhập mã giảm giá', 'warning');
        return;
    }
    
    checkoutState.voucherCode = voucherCode;
    
    // Show applied voucher UI (actual discount calculated by backend)
    document.getElementById('voucherApplied').style.display = 'flex';
    document.getElementById('appliedVoucherCode').textContent = voucherCode;
    document.getElementById('voucherDiscountValue').textContent = 'Sẽ áp dụng khi đặt hàng';
    voucherInput.value = '';
    
    showToast('Mã giảm giá sẽ được áp dụng khi đặt hàng', 'success');
}

/**
 * Remove voucher
 */
async function removeVoucher() {
    checkoutState.voucherCode = null;
    document.getElementById('voucherInput').value = '';
    document.getElementById('voucherApplied').style.display = 'none';
    
    showToast('Đã hủy mã giảm giá', 'success');
}

/**
 * Show applied voucher
 * @param {Object} voucher - Voucher object from backend
 */
function showAppliedVoucher(voucher) {
    const voucherApplied = document.getElementById('voucherApplied');
    const voucherInput = document.getElementById('voucherInput');
    
    if (voucher && voucher.code) {
        voucherApplied.style.display = 'flex';
        voucherInput.value = '';
        
        document.getElementById('appliedVoucherCode').textContent = voucher.code;
        document.getElementById('voucherDiscountValue').textContent = formatPrice(voucher.discountValue || 0);
        
        showToast('Áp dụng mã giảm giá thành công!', 'success');
    } else {
        voucherApplied.style.display = 'none';
        
        if (checkoutState.voucherCode) {
            showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
            checkoutState.voucherCode = null;
        }
    }
}

// ==================== CHECKOUT PROCESS ====================

/**
 * Update checkout button state
 */
function updateCheckoutButton() {
    const btnCheckout = document.getElementById('btnCheckout');
    
    if (checkoutState.selectedAddress && checkoutState.cartItems.length > 0) {
        btnCheckout.disabled = false;
        btnCheckout.classList.remove('disabled');
    } else {
        btnCheckout.disabled = true;
        btnCheckout.classList.add('disabled');
    }
}

/**
 * Process checkout - POST /checkout
 */
async function processCheckout() {
    if (checkoutState.isProcessing) return;
    
    // Validate
    if (!checkoutState.selectedAddress) {
        showToast('Vui lòng chọn địa chỉ nhận hàng', 'warning');
        return;
    }
    
    if (!checkoutState.cartItems || checkoutState.cartItems.length === 0) {
        showToast('Không có sản phẩm trong đơn hàng', 'error');
        return;
    }
    
    checkoutState.isProcessing = true;
    showLoading(true, 'Đang xử lý đơn hàng...');
    
    try {
        const requestBody = {
            cartItems: checkoutState.cartItems.map(item => ({
                skuId: item.skuId || item.id,
                quantity: item.quantity
            })),
            addressId: checkoutState.selectedAddress.id,
            voucherCode: checkoutState.voucherCode || null,
            paymentMethod: checkoutState.paymentMethod
        };
        
        console.log('📤 POST /checkout request:', requestBody);
        
        const response = await fetch(CHECKOUT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Đặt hàng thất bại');
        }
        
        const data = await response.json();
        console.log('📥 POST /checkout response:', data);
        
        // Backend trả về orderCode, paymentUrl, message
        const result = data.payload || data;
        
        // Clear session storage
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('checkoutVoucher');
        
        // Show success
        showSuccessModal(result);
        
    } catch (error) {
        console.error('❌ Checkout error:', error);
        showToast('Lỗi đặt hàng: ' + error.message, 'error');
    } finally {
        checkoutState.isProcessing = false;
        showLoading(false);
    }
}

/**
 * Show success modal
 * @param {Object} orderResult - Order result from backend
 */
function showSuccessModal(orderResult) {
    const modal = document.getElementById('successModal');
    
    document.getElementById('orderCode').textContent = orderResult.orderCode || '-';
    
    let message = orderResult.message || 'Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.';
    
    // Handle payment URL for online payment
    if (orderResult.paymentUrl && checkoutState.paymentMethod !== 'COD') {
        message += '<br><br>Bạn sẽ được chuyển đến trang thanh toán...';
        
        // Redirect to payment URL after 2 seconds
        setTimeout(() => {
            window.location.href = orderResult.paymentUrl;
        }, 2000);
    }
    
    document.getElementById('successMessage').innerHTML = message;
    
    modal.classList.add('show');
}

/**
 * View order details
 */
function viewOrderDetails() {
    // Redirect to order details page
    const orderCode = document.getElementById('orderCode').textContent;
    window.location.href = `../order/details.html?code=${orderCode}`;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Show/hide loading overlay
 * @param {boolean} show - Show or hide
 * @param {string} message - Loading message
 */
function showLoading(show, message = 'Đang xử lý...') {
    const overlay = document.getElementById('loadingOverlay');
    
    if (show) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

/**
 * Format price to VND
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price || 0);
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - Type: success, error, warning
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

// ==================== AUTO INITIALIZE ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckout);
} else {
    initCheckout();
}
