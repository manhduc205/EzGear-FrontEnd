/* ==================== SHOP PAGE JS ==================== */
/* Product listing with filters, search, and add to cart */

// ==================== STATE MANAGEMENT ====================
let shopState = {
    products: [],
    filteredProducts: [],
    currentPage: 1,
    pageSize: 12,
    totalPages: 1,
    filters: {
        category: '',
        brand: '',
        priceRange: '',
        search: ''
    },
    sort: 'newest'
};

// ==================== API CALLS ====================

/**
 * Search products using ProductSkuSearchRequest
 * @param {Object} searchRequest - Search request object
 */
async function searchProductSkusAPI(searchRequest) {
    try {
        console.log('Searching products with request:', searchRequest);
        
        const token = TokenHelper.getAccessToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Thêm token nếu có (một số API có thể yêu cầu auth)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${window.BASE_URL}/api/product-skus/search`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(searchRequest)
        });

        console.log('Search response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Search error response:', errorText);
            throw new Error('Failed to search products');
        }

        const data = await response.json();
        console.log('Search API response:', data);
        
        // Backend trả về ApiResponse với structure: {success, message, payload}
        if (data.success && data.payload) {
            console.log('Products loaded:', data.payload);
            return data.payload; // Returns Page<ProductSKU>
        } else {
            console.error('API returned unsuccessful response:', data);
            return { content: [], totalPages: 0, totalElements: 0 };
        }
    } catch (error) {
        console.error('Search products error:', error);
        showToast('Lỗi tải sản phẩm: ' + error.message, 'error');
        return { content: [], totalPages: 0, totalElements: 0 };
    }
}

/**
 * Add item to cart
 * @param {Object} cartItem - Cart item matching backend CartItem model
 * @param {Number} provinceId - Optional province ID for location-based inventory
 */
async function addItemToCartAPI(cartItem, provinceId = null) {
    try {
        const token = TokenHelper.getAccessToken();
        console.log('🛒 Adding to cart:', cartItem);
        console.log('🔑 Token:', token ? 'Token exists (length: ' + token.length + ')' : 'No token');
        
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        }
        
        // Build URL with optional provinceId parameter
        let url = `${window.BASE_URL}/api/cart/add`;
        if (provinceId) {
            url += `?provinceId=${provinceId}`;
            console.log('🌍 Using provinceId:', provinceId);
        }
        console.log('🌐 POST to:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cartItem)
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            // Try to parse error response as JSON first
            let errorMessage = 'Không thể thêm sản phẩm vào giỏ hàng';
            
            try {
                const errorData = await response.json();
                console.error('❌ Add to cart failed:', response.status, errorData);
                
                // Extract error message from different response formats
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            } catch (e) {
                // If not JSON, try to get text
                const errorText = await response.text();
                console.error('❌ Add to cart failed (text):', response.status, errorText);
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            
            if (response.status === 401) {
                TokenHelper.clearTokens();
                throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ Add to cart success:', result);
        
        // Backend trả về ApiResponse với payload
        if (result.success && result.payload) {
            return result.payload;
        }
        
        return result;
    } catch (error) {
        console.error('💥 Add to cart error:', error);
        throw error;
    }
}

/**
 * Get current cart
 */
async function getCartAPI() {
    try {
        const token = TokenHelper.getAccessToken();
        console.log('🔑 Getting cart with token:', token ? 'Token exists (length: ' + token.length + ')' : 'No token');
        
        if (!token) {
            console.log('❌ No token found, cannot get cart');
            return null;
        }
        
        const url = `${window.BASE_URL}/api/cart`;
        console.log('🌐 Fetching cart from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Get cart response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Get cart failed:', response.status, errorText);
            
            if (response.status === 401) {
                console.log('🔒 Unauthorized - clearing tokens');
                TokenHelper.clearTokens();
            }
            return null;
        }
        
        const result = await response.json();
        console.log('✅ Get cart result:', result);
        
        // Backend trả về ApiResponse với payload
        if (result.success && result.payload) {
            return result.payload;
        }
        
        return result;
    } catch (error) {
        console.error('💥 Get cart error:', error);
        return null;
    }
}

// ==================== UI RENDERING ====================

/**
 * Render products grid
 */
function renderProducts() {
    const container = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    console.log('=== Rendering products ===');
    console.log('Products to render:', shopState.filteredProducts);
    
    if (!shopState.filteredProducts || shopState.filteredProducts.length === 0) {
        console.log('No products to display');
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    console.log(`Rendering ${shopState.filteredProducts.length} products`);
    
    container.innerHTML = shopState.filteredProducts.map(sku => {
        console.log('Processing SKU:', sku);
        
        // Lấy thông tin product từ SKU
        const product = sku.product || {};
        const brand = product.brand || {};
        
        // Tính discount nếu có originalPrice
        const originalPrice = sku.originalPrice || 0;
        const currentPrice = sku.price || 0;
        const discount = originalPrice > currentPrice ? 
            Math.round((1 - currentPrice / originalPrice) * 100) : 0;
        
        // Xác định stock status - Lưu ý: backend có thể không trả về stockQuantity
        const stockQty = sku.stockQuantity || sku.stock_quantity || 100; // Default 100 nếu không có
        const stockStatus = stockQty === 0 ? 'out-stock' : 
                          stockQty < 10 ? 'low-stock' : 'in-stock';
        
        const stockText = stockQty === 0 ? 'Hết hàng' :
                         stockQty < 10 ? `Chỉ còn ${stockQty}` : 'Còn hàng';
        
        // SKU name hoặc product name
        const productName = sku.name || product.name || 'Sản phẩm';
        const productImage = product.imageUrl || product.image_url || 'https://via.placeholder.com/400x300?text=No+Image';
        const brandName = brand.name || 'No Brand';
        
        console.log('Rendering product:', {
            id: sku.id,
            productId: sku.productId || sku.product_id,
            name: productName,
            price: currentPrice,
            originalPrice: originalPrice,
            discount: discount,
            image: productImage,
            brand: brandName,
            stock: stockQty
        });
        
        return `
            <div class="product-card" data-sku-id="${sku.id}">
                <div class="product-image-container">
                    <img src="${productImage}" 
                         alt="${productName}"
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                    ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ''}
                    <div class="product-stock ${stockStatus}">${stockText}</div>
                </div>
                <div class="product-info">
                    <div class="product-brand">${brandName}</div>
                    <div class="product-name" title="${productName}">${productName}</div>
                    <div class="product-rating">
                        <span class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </span>
                        <span class="rating-count">(0)</span>
                    </div>
                    <div class="product-price-row">
                        <span class="product-price">${formatPrice(currentPrice)}</span>
                        ${originalPrice > currentPrice ? `
                            <span class="product-price-old">${formatPrice(originalPrice)}</span>
                            <span class="product-discount">-${discount}%</span>
                        ` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${sku.id}, '${productName.replace(/'/g, "\\'")}', event)" 
                                ${stockQty === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${stockQty === 0 ? 'Hết hàng' : 'Thêm giỏ'}
                        </button>
                        <button class="btn-quick-view" onclick="viewProductDetail(${sku.productId || sku.product_id || product.id}, event)" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Products rendered successfully');
}

/**
 * Render pagination
 */
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (shopState.totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    prevBtn.disabled = shopState.currentPage === 1;
    nextBtn.disabled = shopState.currentPage === shopState.totalPages;
    
    let html = '';
    for (let i = 1; i <= shopState.totalPages; i++) {
        if (i === 1 || i === shopState.totalPages || 
            (i >= shopState.currentPage - 1 && i <= shopState.currentPage + 1)) {
            html += `
                <button class="page-btn ${i === shopState.currentPage ? 'active' : ''}" 
                        onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === shopState.currentPage - 2 || i === shopState.currentPage + 2) {
            html += `<span style="padding: 0 5px; color: #aaa;">...</span>`;
        }
    }
    
    pageNumbers.innerHTML = html;
}

/**
 * Update cart badge
 */
async function updateCartBadge() {
    if (!TokenHelper.isLoggedIn()) {
        console.log('👤 User not logged in, cart badge = 0');
        document.getElementById('cartBadge').textContent = '0';
        return;
    }
    
    try {
        console.log('🛒 Updating cart badge...');
        const cart = await getCartAPI();
        
        if (!cart) {
            console.log('⚠️ No cart data, badge = 0');
            document.getElementById('cartBadge').textContent = '0';
            return;
        }
        
        // Cart có thể là object với items array hoặc chỉ là array
        const items = cart.items || cart.cartItems || [];
        const count = items.length || 0;
        
        console.log('✅ Cart badge updated:', count, 'items');
        document.getElementById('cartBadge').textContent = count;
    } catch (error) {
        console.error('💥 Update cart badge error:', error);
        document.getElementById('cartBadge').textContent = '0';
    }
}

// ==================== EVENT HANDLERS ====================

/**
 * Add product to cart
 */
async function addToCart(skuId, productName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (!TokenHelper.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 1500);
        return;
    }
    
    showLoading(true);
    
    try {
        const sku = shopState.filteredProducts.find(s => s.id === skuId);
        
        if (!sku) {
            throw new Error('Không tìm thấy sản phẩm');
        }
        
        // Thử format 1: Chỉ gửi skuId và quantity
        const cartItem = {
            skuId: skuId,
            quantity: 1
        };
        
        console.log('🛒 Adding cart item:', cartItem);
        console.log('🌍 Current provinceId:', locationState.selectedLocationId);
        
        // Pass current selected provinceId to check inventory at that location
        await addItemToCartAPI(cartItem, locationState.selectedLocationId);
        await updateCartBadge();
        showToast(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
    } catch (error) {
        console.error('❌ Add to cart failed:', error);
        
        // Hiển thị thông báo lỗi rõ ràng
        let errorMessage = error.message || 'Lỗi thêm vào giỏ hàng';
        
        // Customize message for common errors
        if (errorMessage.toLowerCase().includes('out of stock') || 
            errorMessage.toLowerCase().includes('hết hàng') ||
            errorMessage.toLowerCase().includes('không đủ') ||
            errorMessage.toLowerCase().includes('stock')) {
            showToast(` ${errorMessage}`, 'error');
        } else if (errorMessage.includes('đăng nhập')) {
            showToast(`${errorMessage}`, 'warning');
        } else {
            showToast(` ${errorMessage}`, 'error');
        }
    } finally {
        showLoading(false);
    }
}

/**
 * Handle search
 */
function handleSearch(e) {
    e.preventDefault();
    const keyword = document.getElementById('searchInput').value.trim();
    shopState.filters.search = keyword;
    shopState.currentPage = 1;
    loadProducts();
}

/**
 * Handle filter change
 */
function handleFilterChange() {
    shopState.filters.category = document.getElementById('categoryFilter').value;
    shopState.filters.brand = document.getElementById('brandFilter').value;
    shopState.filters.priceRange = document.getElementById('priceFilter').value;
    shopState.currentPage = 1;
    loadProducts();
}

/**
 * Handle sort
 */
function handleSort(sortType) {
    shopState.sort = sortType;
    
    // Update active button
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-sort="${sortType}"]`).classList.add('active');
    
    loadProducts();
}

/**
 * Go to page
 */
function goToPage(page) {
    shopState.currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Previous page
 */
function previousPage() {
    if (shopState.currentPage > 1) {
        goToPage(shopState.currentPage - 1);
    }
}

/**
 * Next page
 */
function nextPage() {
    if (shopState.currentPage < shopState.totalPages) {
        goToPage(shopState.currentPage + 1);
    }
}

/**
 * View product detail
 */
function viewProductDetail(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    // TODO: Navigate to product detail page
    showToast('Chức năng xem chi tiết đang được phát triển', 'warning');
}

// ==================== LOCATION MANAGEMENT ====================

let locationState = {
    locations: [],
    selectedLocationId: null
};

/**
 * Fetch locations from API
 */
async function fetchLocations() {
    try {
        // Use public API or authenticated if needed
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
        // Handle array response directly or wrapped in payload
        locationState.locations = Array.isArray(data) ? data : (data.payload || []);
        
        console.log('🌍 Locations loaded:', locationState.locations.length);
        
        // Initialize default location if not set
        if (!locationState.selectedLocationId) {
            const savedLocation = localStorage.getItem('selectedLocation');
            if (savedLocation) {
                const { id, name } = JSON.parse(savedLocation);
                selectLocation(id, name, false);
            } else {
                // Default to Hanoi or first available
                const defaultLoc = locationState.locations.find(l => l.name.includes('Hà Nội')) || locationState.locations[0];
                if (defaultLoc) {
                    selectLocation(defaultLoc.id, defaultLoc.name, false);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
        // Fallback data if API fails
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
    
    // Reset search
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
 * Select location
 */
function selectLocation(id, name, close = true) {
    locationState.selectedLocationId = id;
    
    // Update Header UI
    const headerLocationText = document.querySelector('.header-location .text-large');
    if (headerLocationText) {
        headerLocationText.textContent = name;
    }
    
    // Save to localStorage
    localStorage.setItem('selectedLocation', JSON.stringify({ id, name }));
    
    // Re-render if modal is open
    if (document.getElementById('locationModal').classList.contains('show')) {
        handleLocationSearch(); // Re-render with current filter
    }
    
    if (close) {
        closeLocationModal();
        showToast(`Đã chọn khu vực: ${name}`, 'success');
        // Trigger reload products if needed
        // loadProducts();
    }
}

// Initialize locations on load
document.addEventListener('DOMContentLoaded', () => {
    fetchLocations();
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Show/hide loading
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

/**
 * Format price
 */
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

/**
 * Show toast
 */
/**
 * Show toast
 */
function showToast(message, type = 'success') {
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Hiển thị lâu hơn cho error/warning (5s thay vì 3s)
    const duration = (type === 'error' || type === 'warning') ? 5000 : 3000;
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// ==================== LOAD DATA ====================

/**
 * Load products
 */
async function loadProducts() {
    showLoading(true);
    
    try {
        console.log('=== Loading products ===');
        console.log('Current filters:', shopState.filters);
        console.log('Current page:', shopState.currentPage);
        console.log('Page size:', shopState.pageSize);
        
        // Build search request theo ProductSkuSearchRequest của backend
        const searchRequest = {
            page: shopState.currentPage - 1, // 0-indexed
            size: shopState.pageSize
        };
        
        // Thêm các filter nếu có
        if (shopState.filters.search) {
            searchRequest.keyword = shopState.filters.search;
        }
        
        if (shopState.filters.category) {
            searchRequest.categoryId = parseInt(shopState.filters.category);
        }
        
        if (shopState.filters.brand) {
            searchRequest.brandId = parseInt(shopState.filters.brand);
        }
        
        // Handle price range
        if (shopState.filters.priceRange) {
            const [min, max] = shopState.filters.priceRange.split('-');
            searchRequest.minPrice = parseFloat(min);
            searchRequest.maxPrice = parseFloat(max);
        }
        
        console.log('Sending search request:', searchRequest);
        
        const result = await searchProductSkusAPI(searchRequest);
        
        console.log('Search result:', result);
        
        shopState.filteredProducts = result.content || [];
        shopState.totalPages = result.totalPages || 1;
        
        console.log('Filtered products count:', shopState.filteredProducts.length);
        console.log('Total pages:', shopState.totalPages);
        
        // Apply client-side sorting
        if (shopState.sort === 'price-asc') {
            shopState.filteredProducts.sort((a, b) => a.price - b.price);
        } else if (shopState.sort === 'price-desc') {
            shopState.filteredProducts.sort((a, b) => b.price - a.price);
        }
        
        renderProducts();
        renderPagination();
    } catch (error) {
        console.error('Load products error:', error);
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('productsGrid').innerHTML = '';
    } finally {
        showLoading(false);
    }
}

/**
 * Initialize user info
 */
function initUserInfo() {
    if (TokenHelper.isLoggedIn()) {
        const userEmail = localStorage.getItem('user_email') || 'User';
        const initial = userEmail.charAt(0).toUpperCase();
        document.getElementById('userAvatar').textContent = initial;
        document.getElementById('userName').textContent = userEmail.split('@')[0];
    } else {
        document.getElementById('userInfo').innerHTML = `
            <button class="btn-cart" style="background: transparent; border: 1px solid #c8102e; padding: 8px 20px;" 
                    onclick="window.location.href='../auth/login.html'">
                <i class="fas fa-sign-in-alt"></i>
                Đăng nhập
            </button>
        `;
    }
}

// ==================== INITIALIZATION ====================

/**
 * Initialize shop page
 */
async function initShop() {
    initUserInfo();
    
    // Chỉ update cart badge nếu đã đăng nhập
    if (TokenHelper.isLoggedIn()) {
        await updateCartBadge();
    }
    
    await loadProducts();
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShop);
} else {
    initShop();
}
