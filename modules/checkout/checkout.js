/* ==================== CHECKOUT MODULE JS ==================== */
/* Xử lý flow thanh toán với phương thức vận chuyển */

// ==================== STATE MANAGEMENT ====================
let checkoutState = {
    cartItems: [], // Sản phẩm từ giỏ hàng
    selectedAddress: null,
    voucherCode: null,
    voucherDiscount: 0, // Số tiền giảm từ voucher
    paymentMethod: 'COD',
    selectedServiceId: null, // Service ID được chọn
    availableServices: [], // Danh sách dịch vụ vận chuyển
    currentShippingFee: 0,
    branchId: null,
    isProcessing: false
};

// ==================== API ENDPOINTS ====================
const CHECKOUT_API = `http://localhost:8080/api/orders/place`;
const ADDRESS_API = `http://localhost:8080/api/customer-addresses`;
const SHIPPING_SERVICES_API = `http://localhost:8080/api/shipping/available-services`;
const SHIPPING_FEE_API = `http://localhost:8080/api/shipping/fee`;
const APPLY_VOUCHER_API = `http://localhost:8080/api/voucher/apply`;

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
            window.location.href = '../auth/auth.html';
        }, 1500);
        return;
    }
    
    // Get cart items from sessionStorage (passed from cart page) or localStorage (cart key)
    const savedCartItems = sessionStorage.getItem('checkoutItems') || localStorage.getItem('cart');
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
            checkoutState.voucherDiscount = voucher.discountAmount || 0;
            console.log('🎫 Restored voucher from cart:', voucher);
            
            // Show applied voucher immediately
            showAppliedVoucherDisplay(voucher.code, voucher.discountAmount || 0);
        }
        
        console.log('📦 Cart items:', checkoutState.cartItems);
        
        // Setup event listeners
        setupEventListeners();
        
        // Render products from cart items
        renderProductsFromCart();
        
        // Initialize voucher modal
        initializeVoucherModal();
        
        // Calculate summary (including voucher discount)
        calculateLocalSummary();
        
        // Load user addresses (and auto-select default)
        await loadUserAddresses();
        
        // Show message to select address first
        document.getElementById('shippingLoading').style.display = 'none';
        document.getElementById('shippingNoAddress').style.display = 'block';
        
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
        // Map CartItemResponse from backend
        // Backend returns: skuId, skuName, productName, imageUrl, price, quantity, selected, categoryId, isOutOfStock, availableQuantity
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
 * Calculate order summary locally
 */
function calculateLocalSummary() {
    const subtotal = checkoutState.cartItems.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    const discount = checkoutState.voucherDiscount || 0;
    const shippingFee = checkoutState.currentShippingFee || 0;
    const total = subtotal - discount + shippingFee;
    
    // Update UI
    document.getElementById('summaryItemCount').textContent = checkoutState.cartItems.length;
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shippingFee').textContent = formatPrice(shippingFee);
    document.getElementById('totalAmount').textContent = formatPrice(total);
    
    // Show/hide discount row
    const discountRow = document.getElementById('discountRow');
    if (discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discount').textContent = `-${formatPrice(discount)}`;
    } else {
        discountRow.style.display = 'none';
    }
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
            console.log('🔍 Checking all addresses for default field:', addresses.map(addr => ({
                id: addr.id,
                name: addr.receiverName,
                isDefault: addr.isDefault,
                default: addr.default,
                is_default: addr.is_default
            })));
            
            // 🔥 FIX: Auto-select default address - Check multiple field names
            const defaultAddress = addresses.find(addr => {
                return addr.isDefault === true || 
                       addr.default === true || 
                       addr.is_default === true ||
                       addr.isDefault === 1 ||
                       addr.default === 1 ||
                       addr.is_default === 1;
            });
            
            if (defaultAddress) {
                console.log('🏠 Auto-selecting default address:', defaultAddress);
                console.log('🏠 Default field values:', {
                    isDefault: defaultAddress.isDefault,
                    default: defaultAddress.default,
                    is_default: defaultAddress.is_default
                });
                
                // 🔥 FIX: Ensure proper selection and UI update
                await selectAddress(defaultAddress);
                
                // 🔥 FIX: Force UI update if selectAddress didn't work properly
                setTimeout(() => {
                    if (checkoutState.selectedAddress) {
                        document.getElementById('noAddress').style.display = 'none';
                        document.getElementById('selectedAddressCard').style.display = 'flex';
                        console.log('✅ UI updated - default address selected');
                    } else {
                        console.warn('⚠️ selectAddress failed, showing address selection');
                        document.getElementById('noAddress').style.display = 'block';
                        document.getElementById('selectedAddressCard').style.display = 'none';
                    }
                }, 100);
                
            } else {
                console.log('📍 No default address found, showing address selection');
                console.log('🔍 All addresses checked:', addresses.map(addr => `ID:${addr.id} isDefault:${addr.isDefault} default:${addr.default} is_default:${addr.is_default}`));
                // Show the address selection UI
                document.getElementById('noAddress').style.display = 'block';
                document.getElementById('selectedAddressCard').style.display = 'none';
            }
        } else {
            console.log('📍 No addresses found');
            // Show the address selection UI
            document.getElementById('noAddress').style.display = 'block';
            document.getElementById('selectedAddressCard').style.display = 'none';
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
                <div class="address-actions" onclick="event.stopPropagation()">
                    <button class="btn-icon" onclick="editAddress(${addr.id})" title="Sửa địa chỉ">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteAddress(${addr.id})" title="Xóa địa chỉ">
                        <i class="fas fa-trash"></i>
                    </button>
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
 * Delete address
 */
async function deleteAddress(addressId) {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
        return;
    }
    
    try {
        const response = await fetch(`${ADDRESS_API}/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể xóa địa chỉ');
        }
        
        showToast('Đã xóa địa chỉ', 'success');
        
        // Reload address list
        await openAddressModal();
        
        // If deleted address was selected, clear selection
        if (checkoutState.selectedAddress?.id === addressId) {
            checkoutState.selectedAddress = null;
            document.getElementById('shippingAddress').innerHTML = `
                <div class="no-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>Vui lòng chọn địa chỉ nhận hàng</p>
                </div>
            `;
            document.getElementById('shippingNoAddress').style.display = 'block';
            document.getElementById('shippingServices').style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Delete address error:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Edit address
 */
async function editAddress(addressId) {
    try {
        // Load all addresses
        const response = await fetch(ADDRESS_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải thông tin địa chỉ');
        }
        
        const data = await response.json();
        const addresses = data.payload || data.data || data;
        const address = addresses.find(addr => addr.id === addressId);
        
        if (!address) {
            throw new Error('Không tìm thấy địa chỉ');
        }
        
        // Close address selection modal
        closeAddressModal();
        
        // Open edit modal
        openEditAddressModal(address);
        
    } catch (error) {
        console.error('❌ Load address error:', error);
        showToast(error.message, 'error');
    }
}

// ==================== EDIT ADDRESS MODAL ====================

// Edit location state
let editSelectedProvince = { id: null, name: '' };
let editSelectedDistrict = { id: null, name: '' };
let editSelectedWard = { code: '', name: '' };

const GHN_API = `${window.BASE_URL}/api/ghn-locations`;

/**
 * Select address label (Nhà Riêng / Văn Phòng)
 */
function selectAddressLabel(button, value) {
    // Remove active class from all buttons
    document.querySelectorAll('.label-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Update hidden input
    document.getElementById('editLabel').value = value;
}

/**
 * Open edit address modal
 */
async function openEditAddressModal(address) {
    console.log('📝 Opening edit modal with address:', address);
    
    // Fill form with address data
    document.getElementById('editAddressId').value = address.id;
    document.getElementById('editReceiverName').value = address.receiverName;
    document.getElementById('editReceiverPhone').value = address.receiverPhone;
    document.getElementById('editAddressLine').value = address.addressLine;
    
    // Set label buttons
    const labelValue = address.label || 'Nhà Riêng';
    document.getElementById('editLabel').value = labelValue;
    document.querySelectorAll('.label-btn').forEach(btn => {
        if (btn.dataset.value === labelValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Set default checkbox (backend trả về field 'default', không phải 'isDefault')
    const isDefaultCheckbox = document.getElementById('editIsDefault');
    const isDefault = address.default !== undefined ? address.default : address.isDefault;
    isDefaultCheckbox.checked = Boolean(isDefault === true || isDefault === 1);
    console.log('🔳 Checkbox mặc định:', isDefaultCheckbox.checked, '| address.default:', address.default);
    
    // Set location data
    document.getElementById('editProvinceId').value = address.provinceId;
    document.getElementById('editDistrictId').value = address.districtId;
    document.getElementById('editWardCode').value = address.wardCode;
    
    // Load location names
    try {
        // Load province name
        const provincesResponse = await fetch(`${GHN_API}/provinces`, {
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        const provinces = await provincesResponse.json();
        console.log('🌍 Provinces loaded:', provinces.length, 'items');
        console.log('🔍 Sample province:', provinces[0]);
        
        // 🔥 FIX: So sánh String với String
        const province = provinces.find(p => String(p.id) === String(address.provinceId));
        console.log('✅ Province found:', province);
        
        if (province) {
            editSelectedProvince = { id: province.id, name: province.name };
            
            // Load districts
            const districtsResponse = await fetch(`${GHN_API}/districts?provinceId=${address.provinceId}`, {
                headers: {
                    'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
                }
            });
            const districts = await districtsResponse.json();
            console.log('🏙️ Districts loaded:', districts.length, 'items');
            
            // 🔥 FIX: So sánh String với String
            const district = districts.find(d => String(d.id) === String(address.districtId));
            console.log('✅ District found:', district);
            
            if (district) {
                editSelectedDistrict = { id: district.id, name: district.name };
                
                // Load wards
                const wardsResponse = await fetch(`${GHN_API}/wards?districtId=${address.districtId}`, {
                    headers: {
                        'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
                    }
                });
                const wards = await wardsResponse.json();
                console.log('📍 Wards loaded:', wards.length, 'items');
                
                // 🔥 FIX: So sánh String với String
                const ward = wards.find(w => String(w.id) === String(address.wardCode));
                console.log('📍 Ward found:', ward, '| Looking for:', address.wardCode);
                
                if (ward) {
                    editSelectedWard = { code: ward.id, name: ward.name };
                }
            }
        }
        
        // 🔥 FIX QUAN TRỌNG: Gán lại giá trị vào input hidden
        document.getElementById('editProvinceId').value = String(address.provinceId);
        document.getElementById('editDistrictId').value = String(address.districtId);
        document.getElementById('editWardCode').value = String(address.wardCode);
        
        // Update UI
        updateEditLocationDisplay();
        
    } catch (error) {
        console.error('❌ Load location error:', error);
    }
    
    // Show modal
    document.getElementById('editAddressModal').classList.add('show');
}

/**
 * Close edit address modal
 */
function closeEditAddressModal() {
    document.getElementById('editAddressModal').classList.remove('show');
    document.getElementById('editAddressForm').reset();
    editSelectedProvince = { id: null, name: '' };
    editSelectedDistrict = { id: null, name: '' };
    editSelectedWard = { code: '', name: '' };
}

/**
 * Open edit location modal
 */
function openEditLocationModal() {
    document.getElementById('editLocationModal').classList.add('show');
    loadEditProvinces();
}

/**
 * Close edit location modal
 */
function closeEditLocationModal() {
    document.getElementById('editLocationModal').classList.remove('show');
}

/**
 * Load provinces for edit
 */
async function loadEditProvinces() {
    const list = document.getElementById('editLocationList');
    list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const response = await fetch(`${GHN_API}/provinces`, {
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        const provinces = await response.json();
        
        list.innerHTML = provinces.map(province => `
            <div class="location-item ${editSelectedProvince.id === province.id ? 'selected' : ''}" 
                 onclick="selectEditProvince(${province.id}, '${province.name}')">
                <span>${province.name}</span>
                ${editSelectedProvince.id === province.id ? '<i class="fas fa-check"></i>' : ''}
            </div>
        `).join('');
        
        // Setup search
        setupEditLocationSearch(provinces, 'province');
        
    } catch (error) {
        console.error('❌ Load provinces error:', error);
        list.innerHTML = '<div class="error">Không thể tải danh sách tỉnh/thành</div>';
    }
}

/**
 * Select province for edit
 */
function selectEditProvince(id, name) {
    editSelectedProvince = { id, name };
    editSelectedDistrict = { id: null, name: '' };
    editSelectedWard = { code: '', name: '' };
    
    document.getElementById('editProvinceId').value = id;
    document.getElementById('editDistrictId').value = '';
    document.getElementById('editWardCode').value = '';
    
    updateEditLocationDisplay();
    switchEditTab('editDistrict');
    loadEditDistricts();
}

/**
 * Load districts for edit
 */
async function loadEditDistricts() {
    if (!editSelectedProvince.id) {
        return;
    }
    
    const list = document.getElementById('editLocationList');
    list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const response = await fetch(`${GHN_API}/districts?provinceId=${editSelectedProvince.id}`, {
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        const districts = await response.json();
        
        list.innerHTML = districts.map(district => `
            <div class="location-item ${editSelectedDistrict.id === district.id ? 'selected' : ''}" 
                 onclick="selectEditDistrict(${district.id}, '${district.name}')">
                <span>${district.name}</span>
                ${editSelectedDistrict.id === district.id ? '<i class="fas fa-check"></i>' : ''}
            </div>
        `).join('');
        
        setupEditLocationSearch(districts, 'district');
        
    } catch (error) {
        console.error('❌ Load districts error:', error);
        list.innerHTML = '<div class="error">Không thể tải danh sách quận/huyện</div>';
    }
}

/**
 * Select district for edit
 */
function selectEditDistrict(id, name) {
    editSelectedDistrict = { id, name };
    editSelectedWard = { code: '', name: '' };
    
    document.getElementById('editDistrictId').value = id;
    document.getElementById('editWardCode').value = '';
    
    updateEditLocationDisplay();
    switchEditTab('editWard');
    loadEditWards();
}

/**
 * Load wards for edit
 */
async function loadEditWards() {
    if (!editSelectedDistrict.id) {
        return;
    }
    
    const list = document.getElementById('editLocationList');
    list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const response = await fetch(`${GHN_API}/wards?districtId=${editSelectedDistrict.id}`, {
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        const wards = await response.json();
        
        list.innerHTML = wards.map(ward => `
            <div class="location-item ${editSelectedWard.code === ward.id ? 'selected' : ''}" 
                 onclick="selectEditWard('${ward.id}', '${ward.name}')">
                <span>${ward.name}</span>
                ${editSelectedWard.code === ward.id ? '<i class="fas fa-check"></i>' : ''}
            </div>
        `).join('');
        
        setupEditLocationSearch(wards, 'ward');
        
    } catch (error) {
        console.error('❌ Load wards error:', error);
        list.innerHTML = '<div class="error">Không thể tải danh sách phường/xã</div>';
    }
}

/**
 * Select ward for edit
 */
function selectEditWard(code, name) {
    editSelectedWard = { code, name };
    document.getElementById('editWardCode').value = code;
    updateEditLocationDisplay();
}

/**
 * Update edit location display
 */
function updateEditLocationDisplay() {
    document.getElementById('editProvinceTab').textContent = editSelectedProvince.name || 'Chọn';
    document.getElementById('editDistrictTab').textContent = editSelectedDistrict.name || 'Chọn';
    document.getElementById('editWardTab').textContent = editSelectedWard.name || 'Chọn';
    
    if (editSelectedProvince.name && editSelectedDistrict.name && editSelectedWard.name) {
        document.getElementById('editSelectedLocation').textContent = 
            `${editSelectedWard.name}, ${editSelectedDistrict.name}, ${editSelectedProvince.name}`;
    }
}

/**
 * Switch edit tab
 */
function switchEditTab(tabName) {
    // Update tab active state
    document.querySelectorAll('.location-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Load data for selected tab
    if (tabName === 'editProvince') {
        loadEditProvinces();
    } else if (tabName === 'editDistrict') {
        loadEditDistricts();
    } else if (tabName === 'editWard') {
        loadEditWards();
    }
}

// Add event listeners for edit tabs
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#editLocationModal .location-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchEditTab(tab.dataset.tab);
        });
    });
});

/**
 * Setup edit location search
 */
function setupEditLocationSearch(items, type) {
    const searchInput = document.getElementById('editLocationSearch');
    searchInput.value = '';
    
    searchInput.oninput = (e) => {
        const keyword = e.target.value.toLowerCase();
        const list = document.getElementById('editLocationList');
        
        let filteredItems = items;
        if (keyword) {
            filteredItems = items.filter(item => {
                const name = item.name;
                return name.toLowerCase().includes(keyword);
            });
        }
        
        if (filteredItems.length === 0) {
            list.innerHTML = '<div class="no-results">Không tìm thấy kết quả</div>';
            return;
        }
        
        list.innerHTML = filteredItems.map(item => {
            const id = item.id;
            const name = item.name;
            const isSelected = type === 'province' ? editSelectedProvince.id === id :
                             type === 'district' ? editSelectedDistrict.id === id :
                             editSelectedWard.code === id;
            const selectFn = type === 'province' ? 'selectEditProvince' :
                           type === 'district' ? 'selectEditDistrict' :
                           'selectEditWard';
            
            return `
                <div class="location-item ${isSelected ? 'selected' : ''}" 
                     onclick="${selectFn}(${type === 'ward' ? `'${id}'` : id}, '${name}')">
                    <span>${name}</span>
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            `;
        }).join('');
    };
}

/**
 * Confirm edit location
 */
function confirmEditLocation() {
    if (!editSelectedProvince.id || !editSelectedDistrict.id || !editSelectedWard.code) {
        showToast('Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã', 'warning');
        return;
    }
    closeEditLocationModal();
}

/**
 * Save edit address
 */
async function saveEditAddress(event) {
    event.preventDefault();
    
    const addressId = document.getElementById('editAddressId').value;
    const addressData = {
        userId: null,
        receiverName: document.getElementById('editReceiverName').value,
        receiverPhone: document.getElementById('editReceiverPhone').value,
        provinceId: parseInt(document.getElementById('editProvinceId').value),
        districtId: parseInt(document.getElementById('editDistrictId').value),
        wardCode: document.getElementById('editWardCode').value,
        addressLine: document.getElementById('editAddressLine').value,
        label: document.getElementById('editLabel').value,
        isDefault: document.getElementById('editIsDefault').checked
    };
    
    if (!addressData.provinceId || !addressData.districtId || !addressData.wardCode) {
        showToast('Vui lòng chọn đầy đủ địa chỉ', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${ADDRESS_API}/${addressId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(addressData)
        });
        
        if (!response.ok) {
            throw new Error('Không thể cập nhật địa chỉ');
        }
        
        showToast('Đã cập nhật địa chỉ', 'success');
        closeEditAddressModal();
        
        // If updated address was selected, reload shipping services
        if (checkoutState.selectedAddress?.id === parseInt(addressId)) {
            // Reload address list to get updated data
            const listResponse = await fetch(ADDRESS_API, {
                headers: {
                    'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
                }
            });
            const listData = await listResponse.json();
            const addresses = listData.payload || listData.data || listData;
            const updatedAddress = addresses.find(addr => addr.id === parseInt(addressId));
            
            if (updatedAddress) {
                await selectAddress(updatedAddress);
            }
        }
        
        // Reload address modal if it's open
        if (document.getElementById('addressModal').classList.contains('show')) {
            await openAddressModal();
        }
        
    } catch (error) {
        console.error('❌ Update address error:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Select address and load shipping services
 */
async function selectAddress(address) {
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
    
    // Load shipping services
    await loadShippingServices();
    
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

// ==================== SHIPPING SERVICES ====================

/**
 * Load available shipping services
 */
async function loadShippingServices() {
    if (!checkoutState.selectedAddress) {
        document.getElementById('shippingNoAddress').style.display = 'block';
        document.getElementById('shippingServices').style.display = 'none';
        return;
    }
    
    // Show loading
    document.getElementById('shippingNoAddress').style.display = 'none';
    document.getElementById('shippingLoading').style.display = 'block';
    document.getElementById('shippingServices').style.display = 'none';
    
    try {
        // First, get nearest branch based on address
        // If backend doesn't provide branch API, we can let backend auto-detect in shipping service call
        const branchResponse = await fetch(`${window.BASE_URL}/api/warehouses/nearest?addressId=${checkoutState.selectedAddress.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        let branchId = 1; // Fallback to default
        
        if (branchResponse.ok) {
            const branchData = await branchResponse.json();
            branchId = branchData.payload?.id || branchData.id || 1;
            checkoutState.branchId = branchId;
            console.log('🏢 Selected branch:', branchId);
        } else {
            console.warn('⚠️ Cannot get nearest branch, using default branchId = 1');
            checkoutState.branchId = 1;
        }
        
        // Gọi API để lấy danh sách dịch vụ vận chuyển
        const response = await fetch(SHIPPING_SERVICES_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify({
                branchId: checkoutState.branchId,
                addressId: checkoutState.selectedAddress.id
            })
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải phương thức vận chuyển');
        }
        
        const data = await response.json();
        console.log('🚚 Shipping services:', data);
        
        const result = data.payload || data;
        checkoutState.availableServices = result.services || [];
        checkoutState.selectedServiceId = result.defaultServiceId;
        
        // Render shipping services
        renderShippingServices();
        
        // Load fee for default service
        if (checkoutState.selectedServiceId) {
            await loadShippingFee(checkoutState.selectedServiceId);
            updateCheckoutButton(); // Enable checkout after loading fee
        }
        
    } catch (error) {
        console.error('❌ Load shipping services error:', error);
        showToast('Lỗi tải phương thức vận chuyển: ' + error.message, 'error');
        
        document.getElementById('shippingLoading').style.display = 'none';
        document.getElementById('shippingServices').innerHTML = `
            <div class="shipping-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Không thể tải phương thức vận chuyển</span>
            </div>
        `;
        document.getElementById('shippingServices').style.display = 'block';
    }
}

/**
 * Render shipping services
 */
function renderShippingServices() {
    const container = document.getElementById('shippingServices');
    
    if (!checkoutState.availableServices || checkoutState.availableServices.length === 0) {
        container.innerHTML = '<p>Không có phương thức vận chuyển</p>';
        container.style.display = 'block';
        return;
    }
    
    container.innerHTML = checkoutState.availableServices.map(service => {
        const isActive = checkoutState.selectedServiceId === service.service_id;
        const icon = getServiceIcon(service.short_name);
        
        return `
            <label class="shipping-service ${isActive ? 'active' : ''}" 
                   id="serviceWrapper${service.service_id}"
                   data-service-id="${service.service_id}"
                   style="display: none;">
                <input type="radio" name="shippingService" value="${service.service_id}" ${isActive ? 'checked' : ''}>
                <div class="service-content">
                    <div class="service-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="service-info">
                        <div class="service-name">${service.short_name}</div>
                        <div class="service-desc">${service.service_type_id === 2 ? 'Giao hàng tiết kiệm' : 'Giao hàng nhanh'}</div>
                    </div>
                </div>
                <div class="service-fee" id="serviceFee${service.service_id}">
                    <!-- sẽ cập nhật sau -->
                </div>
                <i class="fas fa-check-circle"></i>
            </label>
        `;
    }).join('');
    
    document.getElementById('shippingLoading').style.display = 'none';
    container.style.display = 'flex';
    
    // Add event listeners
    container.querySelectorAll('input[name="shippingService"]').forEach(radio => {
        radio.addEventListener('change', async (e) => {
            const serviceId = parseInt(e.target.value);
            await selectShippingService(serviceId);
        });
    });
}

/**
 * Get icon for service
 */
function getServiceIcon(shortName) {
    if (shortName && shortName.toLowerCase().includes('nhanh')) {
        return 'fa-rocket';
    } else if (shortName && shortName.toLowerCase().includes('tiết kiệm')) {
        return 'fa-box';
    }
    return 'fa-truck';
}

/**
 * Select shipping service
 */
async function selectShippingService(serviceId) {
    checkoutState.selectedServiceId = serviceId;
    
    // Update UI active state
    document.querySelectorAll('.shipping-service').forEach(service => {
        service.classList.remove('active');
    });
    document.querySelector(`.shipping-service[data-service-id="${serviceId}"]`).classList.add('active');
    
    // Load shipping fee
    await loadShippingFee(serviceId);
    
    // Enable checkout button
    updateCheckoutButton();
}

/**
 * Load shipping fee for selected service
 */
async function loadShippingFee(serviceId) {
    if (!checkoutState.cartItems || checkoutState.cartItems.length === 0) {
        return;
    }
    
    // 🔥 Chuẩn bị cartItems theo format backend yêu cầu
    const cartItems = checkoutState.cartItems.map(item => ({
        skuId: item.skuId || item.id,
        quantity: item.quantity
    }));
    
    try {
        const response = await fetch(SHIPPING_FEE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify({
                branchId: checkoutState.branchId || 1,
                addressId: checkoutState.selectedAddress.id,
                cartItems: cartItems, // 🔥 Gửi đầy đủ cartItems
                serviceId: serviceId
            })
        });
        
        if (!response.ok) {
            throw new Error('Không thể tính phí vận chuyển');
        }
        
        const data = await response.json();
        console.log('💰 Shipping fee:', data);
        
        const feeData = data.payload?.data || data.data;
        const shippingFee = feeData?.total || 0;
        
        // Update fee in service display
        const serviceFeeElement = document.getElementById(`serviceFee${serviceId}`);
        const serviceWrapper = document.getElementById(`serviceWrapper${serviceId}`);
        
        if (shippingFee > 0) {
            // Cập nhật UI
            if (serviceFeeElement) {
                serviceFeeElement.innerHTML = `
                    <div class="service-price">${formatPrice(shippingFee)}</div>
                    ${feeData?.expected_delivery_time ? `<div class="service-time">${feeData.expected_delivery_time}</div>` : ''}
                `;
            }
            
            // 🔥 Hiển thị dịch vụ khi tính được phí
            if (serviceWrapper) {
                serviceWrapper.style.display = 'flex';
            }
            
            // Update checkout state and summary
            checkoutState.currentShippingFee = shippingFee;
            calculateLocalSummary();
        } else {
            // 🔥 Ẩn dịch vụ nếu không tính được phí
            if (serviceWrapper) {
                serviceWrapper.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('❌ Load shipping fee error:', error);
        // 🔥 Ẩn dịch vụ nếu lỗi
        const serviceWrapper = document.getElementById(`serviceWrapper${serviceId}`);
        if (serviceWrapper) {
            serviceWrapper.style.display = 'none';
        }
    }
}

// ==================== VOUCHER MANAGEMENT ====================

/**
 * Initialize voucher modal
 */
function initializeVoucherModal() {
    // Create voucher select button
    createVoucherSelectButton('voucherContainer', 'voucherInput', 'Chọn Voucher Của Bạn');
    
    // Initialize voucher modal with checkout specific options
    if (typeof initVoucherModal === 'function') {
        initVoucherModal({
            modalId: 'voucherModal',
            inputId: 'voucherInput',
            cartData: getCartDataForVoucher(),
            onApply: (code) => {
                // Auto apply voucher when selected from modal
                applyVoucherCode(code);
            }
        });
    }
    
    // Update voucher input event listener
    const voucherInput = document.getElementById('voucherInput');
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
}

/**
 * Get cart data formatted for voucher system
 */
function getCartDataForVoucher() {
    const totalPrice = checkoutState.cartItems.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    const items = checkoutState.cartItems.map(item => {
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
    
    console.log('🛒 Checkout cart data for voucher:', { totalPrice, itemsCount: items.length, items });
    
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
        window.voucherModal.updateCartData(getCartDataForVoucher());
    }
}

/**
 * Apply voucher with code - Updated to work with new system
 */
async function applyVoucherCode(code) {
    if (!code || !code.trim()) {
        showToast('Vui lòng nhập mã giảm giá', 'warning');
        return;
    }
    
    const voucherCode = code.trim().toUpperCase();
    
    // Validate có sản phẩm và địa chỉ
    if (!checkoutState.cartItems || checkoutState.cartItems.length === 0) {
        showToast('Vui lòng thêm sản phẩm vào giỏ hàng', 'warning');
        return;
    }
    
    showLoading(true, 'Đang kiểm tra mã giảm giá...');
    
    try {
        // Calculate subtotal
        const subtotal = checkoutState.cartItems.reduce((sum, item) => {
            return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);
        
        const shippingFee = checkoutState.currentShippingFee || 0;
        
        // Build items for voucher validation
        const items = checkoutState.cartItems.map(item => {
            // Map CartItemResponse from backend
            // Backend returns: skuId, skuName, productName, imageUrl, price, quantity, selected, categoryId, isOutOfStock, availableQuantity
            
            return {
                skuId: item.skuId,
                productId: item.productId,
                categoryId: item.categoryId, // Backend trả về trực tiếp categoryId
                price: item.price || 0,
                quantity: item.quantity || 1
            };
        });
        
        const requestBody = {
            code: voucherCode,
            subtotal: subtotal,
            shippingFee: shippingFee,
            items: items
        };
        
        console.log('📤 Apply voucher request:', requestBody);
        
        const response = await fetch(APPLY_VOUCHER_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Mã giảm giá không hợp lệ');
        }
        
        const data = await response.json();
        console.log('📥 Apply voucher response:', data);
        
        const result = data.payload || data;
        const discount = result.discount || 0;
        
        // Update state
        checkoutState.voucherCode = voucherCode;
        checkoutState.voucherDiscount = discount;
        
        // Show applied voucher UI
        showAppliedVoucherDisplay(voucherCode, discount);
        
        // Update summary
        calculateLocalSummary();
        
        showToast(`Áp dụng mã thành công! Giảm ${formatPrice(discount)}`, 'success');
        
    } catch (error) {
        console.error('❌ Apply voucher error:', error);
        showToast(error.message || 'Mã giảm giá không hợp lệ', 'error');
        
        // Clear input on error
        const voucherInput = document.getElementById('voucherInput');
        if (voucherInput) {
            voucherInput.value = '';
        }
    } finally {
        showLoading(false);
    }
}

/**
 * Show applied voucher display
 */
function showAppliedVoucherDisplay(code, discount) {
    // Hide voucher container and show applied voucher
    document.getElementById('voucherContainer').style.display = 'none';
    document.getElementById('voucherApplied').style.display = 'flex';
    
    // Update applied voucher info
    document.getElementById('appliedVoucherCode').textContent = code;
    document.getElementById('appliedVoucherValue').textContent = `-${formatPrice(discount)}`;
}

/**
 * Apply voucher - Call API to validate and calculate discount
 * Legacy function - now calls applyVoucherCode
 */
async function applyVoucher() {
    const voucherInput = document.getElementById('voucherInput');
    if (voucherInput && voucherInput.value) {
        await applyVoucherCode(voucherInput.value);
    }
}

/**
 * Remove voucher
 */
async function removeVoucher() {
    checkoutState.voucherCode = null;
    checkoutState.voucherDiscount = 0;
    
    // Clear voucher input
    const voucherInput = document.getElementById('voucherInput');
    if (voucherInput) {
        voucherInput.value = '';
    }
    
    // Hide applied voucher and show voucher container
    document.getElementById('voucherApplied').style.display = 'none';
    document.getElementById('voucherContainer').style.display = 'block';
    
    // Update summary
    calculateLocalSummary();
    
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
    
    if (checkoutState.selectedAddress && 
        checkoutState.selectedServiceId && 
        checkoutState.cartItems.length > 0) {
        btnCheckout.disabled = false;
        btnCheckout.classList.remove('disabled');
    } else {
        btnCheckout.disabled = true;
        btnCheckout.classList.add('disabled');
    }
}

/**
 * Process checkout - POST /api/orders/place
 */
async function processCheckout() {
    if (checkoutState.isProcessing) return;
    
    // 1. Validation
    // Check if selectedAddressId is set
    if (!checkoutState.selectedAddress || !checkoutState.selectedAddress.id) {
        showToast('Vui lòng chọn địa chỉ nhận hàng', 'warning');
        return;
    }
    
    // Check if cart is not empty
    if (!checkoutState.cartItems || checkoutState.cartItems.length === 0) {
        showToast('Không có sản phẩm trong đơn hàng', 'error');
        return;
    }

    // Check if shipping service is selected
    if (!checkoutState.selectedServiceId) {
        showToast('Vui lòng chọn phương thức vận chuyển', 'warning');
        return;
    }
    
    // 2. Loading UI
    checkoutState.isProcessing = true;
    showLoading(true, 'Đang xử lý đơn hàng...');
    
    try {
        // Gather data
        const note = document.getElementById('orderNote') ? document.getElementById('orderNote').value : '';
        
        const requestBody = {
            cartItems: checkoutState.cartItems.map(item => ({
                skuId: item.skuId || item.id,
                quantity: item.quantity
            })),
            addressId: checkoutState.selectedAddress.id,
            branchId: checkoutState.branchId || 1, // Default to 1 if not set
            note: note,
            voucherCode: checkoutState.voucherCode || null,
            paymentMethod: checkoutState.paymentMethod,
            shippingServiceId: checkoutState.selectedServiceId
        };
        
        console.log('📤 Placing order:', requestBody);
        
        // 3. API Call
        const response = await fetch(CHECKOUT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Đặt hàng thất bại');
        }
        
        console.log('📥 Order response:', data);
        
        // 4. Handle Success
        const result = data.payload || data;
        
        // If VNPAY (paymentUrl exists)
        if (checkoutState.paymentMethod === 'VNPAY' && result.paymentUrl) {
            window.location.href = result.paymentUrl;
            return;
        }
        
        // If COD (paymentUrl null) or other success
        // Hide loading
        showLoading(false);
        
        // Clear Cart from localStorage and sessionStorage
        localStorage.removeItem('cart');
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('checkoutVoucher');
        
        // Set order code to #orderCode
        if (document.getElementById('orderCode')) {
            document.getElementById('orderCode').textContent = result.orderCode || '-';
        }
        
        // Show #successModal
        showSuccessModal(result);
        
    } catch (error) {
        // 5. Handle Error
        console.error('❌ Checkout error:', error);
        alert(error.message || 'Có lỗi xảy ra khi đặt hàng');
        showLoading(false);
    } finally {
        checkoutState.isProcessing = false;
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
    window.location.href = `../order/order-detail.html?code=${orderCode}`;
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
