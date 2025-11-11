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
 */
async function addItemToCartAPI(cartItem) {
    try {
        const token = TokenHelper.getAccessToken();
        console.log('🛒 Adding to cart:', cartItem);
        console.log('🔑 Token:', token ? 'Token exists (length: ' + token.length + ')' : 'No token');
        
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        }
        
        const url = `${window.BASE_URL}/api/cart/add`;
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
            const errorText = await response.text();
            console.error('❌ Add to cart failed:', response.status, errorText);
            
            if (response.status === 401) {
                TokenHelper.clearTokens();
                throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
            }
            throw new Error(errorText || 'Không thể thêm sản phẩm vào giỏ hàng');
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
        
        await addItemToCartAPI(cartItem);
        await updateCartBadge();
        showToast(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
    } catch (error) {
        console.error('❌ Add to cart failed:', error);
        showToast(error.message || 'Lỗi thêm vào giỏ hàng', 'error');
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
function showToast(message, type = 'success') {
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
