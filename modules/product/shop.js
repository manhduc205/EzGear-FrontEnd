/* ==================== EZGEAR SHOP JS - TECHRETAIL STYLE ==================== */

// API Base URL
const BASE_URL = 'http://127.0.0.1:8080/api';

// Category Icons Mapping (Material Symbols)
const CATEGORY_ICONS = {
    'Điện thoại': 'smartphone',
    'Tablet': 'tablet_android',
    'Laptop': 'laptop_mac',
    'PC': 'computer',
    'Màn hình': 'tv',
    'Bàn phím': 'keyboard',
    'Chuột': 'mouse',
    'Tai nghe': 'headphones',
    'Loa': 'speaker',
    'Phụ kiện': 'keyboard',
    'Gaming': 'sports_esports',
    'Camera': 'photo_camera',
    'Đồng hồ': 'watch',
    'Âm thanh': 'headphones',
    'Nhà thông minh': 'home_iot_device',
    'Tivi': 'tv',
    'default': 'devices'
};

// State Management
const shopState = {
    categories: [],
    brands: [],
    products: [],
    featuredProducts: [],
    selectedCategoryId: null,
    selectedBrandId: null,
    currentSlide: 0,
    bannerImages: [
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:690:300/q:90/plain/https://dashboard.cellphones.com.vn/storage/sliding-tet-2025-ver2.jpg',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:690:300/q:90/plain/https://dashboard.cellphones.com.vn/storage/sliding-ip-16-th11.jpg',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:690:300/q:90/plain/https://dashboard.cellphones.com.vn/storage/sliding-laptop-ai.jpg'
    ]
};

// ==================== API CALLS ====================

/**
 * Load categories from API
 */
async function loadCategories() {
    try {
        const response = await fetch(`${BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to load categories');
        
        const data = await response.json();
        shopState.categories = data.payload || data || [];
        console.log('✅ Categories loaded:', shopState.categories.length);
        return shopState.categories;
    } catch (error) {
        console.error('❌ Load categories error:', error);
        return [];
    }
}

/**
 * Load brands from API
 */
async function loadBrands() {
    try {
        const response = await fetch(`${BASE_URL}/brands`);
        if (!response.ok) throw new Error('Failed to load brands');
        
        const data = await response.json();
        shopState.brands = data.payload || data || [];
        console.log('✅ Brands loaded:', shopState.brands.length);
        return shopState.brands;
    } catch (error) {
        console.error('❌ Load brands error:', error);
        return [];
    }
}

/**
 * Search products with filters
 */
async function searchProducts(options = {}) {
    try {
        const token = TokenHelper.getAccessToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const searchRequest = {
            page: options.page || 0,
            size: options.size || 8
        };

        if (options.categoryId) searchRequest.categoryId = options.categoryId;
        if (options.brandId) searchRequest.brandId = options.brandId;
        if (options.keyword) searchRequest.keyword = options.keyword;

        const response = await fetch(`${BASE_URL}/product-skus/search`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(searchRequest)
        });

        if (!response.ok) throw new Error('Failed to search products');

        const data = await response.json();
        if (data.success && data.payload) {
            return data.payload.content || [];
        }
        return [];
    } catch (error) {
        console.error('❌ Search products error:', error);
        return [];
    }
}

/**
 * Add item to cart
 */
async function addToCart(skuId, productName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!TokenHelper.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning');
        setTimeout(() => window.location.href = '../auth/auth.html', 1500);
        return;
    }

    try {
        const token = TokenHelper.getAccessToken();
        const response = await fetch(`${BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ skuId: skuId, quantity: 1 })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Không thể thêm vào giỏ hàng');
        }

        showToast(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
        updateCartBadge();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/**
 * Update cart badge count
 */
async function updateCartBadge() {
    if (!TokenHelper.isLoggedIn()) return;

    try {
        const token = TokenHelper.getAccessToken();
        const response = await fetch(`${BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const cart = data.payload || data;
            const items = cart.items || cart.cartItems || [];
            const badge = document.getElementById('cartBadge');
            if (badge) badge.textContent = items.length;
        }
    } catch (error) {
        console.error('Update cart badge error:', error);
    }
}

// ==================== RENDERING ====================

/**
 * Render sidebar categories
 */
function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    let html = '';
    shopState.categories.forEach((cat, index) => {
        const icon = CATEGORY_ICONS[cat.name] || CATEGORY_ICONS['default'];
        html += `
            <div class="sidebar-item ${index === 0 ? 'active' : ''}" data-category-id="${cat.id}" onclick="selectCategory(${cat.id})">
                <div class="item-left">
                    <span class="material-symbols-outlined">${icon}</span>
                    <span>${cat.name}</span>
                </div>
                <span class="material-symbols-outlined arrow">chevron_right</span>
            </div>
        `;
    });

    // Add extra items
    html += `
        <div class="sidebar-item" onclick="window.location.href='#'">
            <div class="item-left">
                <span class="material-symbols-outlined">newspaper</span>
                <span>Tin công nghệ</span>
            </div>
            <span class="material-symbols-outlined arrow">chevron_right</span>
        </div>
    `;

    nav.innerHTML = html;
}

/**
 * Render category tabs
 */
function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return;

    const mainCategories = shopState.categories.slice(0, 5);
    let html = '';

    mainCategories.forEach((cat, index) => {
        html += `
            <button class="category-tab ${index === 0 ? 'active' : ''}" 
                    data-category-id="${cat.id}"
                    onclick="selectCategoryTab(${cat.id}, this)">
                ${cat.name}
            </button>
        `;
    });

    container.innerHTML = html;

    // Set initial category
    if (mainCategories.length > 0) {
        shopState.selectedCategoryId = mainCategories[0].id;
    }
}

/**
 * Render brand tags
 */
function renderBrandTags() {
    const container = document.getElementById('brandTags');
    if (!container) return;

    let html = '';
    shopState.brands.slice(0, 10).forEach(brand => {
        html += `
            <button class="brand-tag" data-brand-id="${brand.id}" onclick="selectBrand(${brand.id}, this)">
                ${brand.name}
            </button>
        `;
    });

    container.innerHTML = html;
}

/**
 * Render brand filters for featured section
 */
function renderFeaturedBrandFilters() {
    const container = document.getElementById('featuredBrandFilters');
    if (!container) return;

    let html = `<button class="brand-filter active" onclick="loadFeaturedProducts(null, this)">Tất cả</button>`;
    shopState.brands.slice(0, 5).forEach(brand => {
        html += `
            <button class="brand-filter" onclick="loadFeaturedProducts(${brand.id}, this)">
                ${brand.name}
            </button>
        `;
    });

    container.innerHTML = html;
}

/**
 * Render brands grid
 */
function renderBrandsGrid() {
    const container = document.getElementById('brandsGrid');
    if (!container) return;

    // Use placeholder brand logos
    const brandLogos = [
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:150:50/q:90/plain/https://cellphones.com.vn/media/wysiwyg/apple-logo.png',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:150:50/q:90/plain/https://cellphones.com.vn/media/wysiwyg/Icon/brand_samsung.png',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:150:50/q:90/plain/https://cellphones.com.vn/media/wysiwyg/Icon/brand_xiaomi.png',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:150:50/q:90/plain/https://cellphones.com.vn/media/wysiwyg/Icon/brand_oppo.png',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:150:50/q:90/plain/https://cellphones.com.vn/media/wysiwyg/Icon/brand_asus.png',
        'https://cdn2.cellphones.com.vn/insecure/rs:fill:150:50/q:90/plain/https://cellphones.com.vn/media/wysiwyg/Icon/brand_dell.png'
    ];

    let html = '';
    shopState.brands.slice(0, 6).forEach((brand, index) => {
        const logo = brandLogos[index] || brandLogos[0];
        html += `
            <div class="brand-item" onclick="filterByBrand(${brand.id})">
                <img src="${logo}" alt="${brand.name}" onerror="this.parentElement.innerHTML='<span style=\\'font-weight:700;color:#999;\\'>${brand.name}</span>'">
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Render product card HTML
 */
function renderProductCard(sku, size = 'normal') {
    const product = sku.product || {};
    const brand = product.brand || {};
    
    const originalPrice = sku.originalPrice || 0;
    const currentPrice = sku.price || 0;
    const discount = originalPrice > currentPrice ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
    
    const productName = sku.name || product.name || 'Sản phẩm';
    const productImage = product.imageUrl || sku.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';
    const productSlug = product.slug || '';
    
    const rating = product.rating || 4.5;
    const reviewCount = product.reviewCount || Math.floor(Math.random() * 100) + 10;

    // Generate rating stars
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<span class="material-symbols-outlined">star</span>';
        } else if (i === fullStars && hasHalf) {
            starsHtml += '<span class="material-symbols-outlined">star_half</span>';
        } else {
            starsHtml += '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 0;">star</span>';
        }
    }

    return `
        <div class="product-card" onclick="viewProductDetail('${productSlug}')">
            <button class="product-favorite" onclick="addToWishlist(${sku.id}, event)">
                <span class="material-symbols-outlined">favorite</span>
            </button>
            <div class="product-image" style="background-image: url('${productImage}')"></div>
            <h3 class="product-name">${productName}</h3>
            <div class="product-price-row">
                <span class="product-price">${formatPrice(currentPrice)}</span>
                ${discount > 0 ? `<span class="product-discount">-${discount}%</span>` : ''}
            </div>
            ${originalPrice > currentPrice ? `<p class="product-price-old">${formatPrice(originalPrice)}</p>` : '<p class="product-price-old">&nbsp;</p>'}
            <div class="product-tags">
                <span class="product-tag student">S-Student giảm thêm</span>
                <span class="product-tag installment">Trả góp 0%</span>
            </div>
            <div class="product-promo">
                <p>Tặng phụ kiện cao cấp trị giá 500.000đ</p>
            </div>
            <div class="product-rating">
                <div class="rating-stars">${starsHtml}</div>
                <span class="rating-count">(${reviewCount})</span>
            </div>
        </div>
    `;
}

/**
 * Render skeleton loading cards
 */
function renderSkeletonCards(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
            </div>
        `;
    }
    return html;
}

/**
 * Render products grid
 */
async function renderProductsGrid(categoryId = null, brandId = null) {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    // Show skeleton loading
    container.innerHTML = renderSkeletonCards(8);

    const products = await searchProducts({
        categoryId: categoryId || shopState.selectedCategoryId,
        brandId: brandId,
        size: 8
    });

    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 10px;">inventory_2</span>
                <p>Chưa có sản phẩm trong danh mục này</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => renderProductCard(p)).join('');
}

/**
 * Load and render featured products
 */
async function loadFeaturedProducts(brandId = null, buttonEl = null) {
    const container = document.getElementById('featuredGrid');
    if (!container) return;

    // Update active button
    if (buttonEl) {
        document.querySelectorAll('.brand-filter').forEach(btn => btn.classList.remove('active'));
        buttonEl.classList.add('active');
    }

    // Show skeleton loading
    container.innerHTML = renderSkeletonCards(5);

    const products = await searchProducts({
        brandId: brandId,
        size: 10
    });

    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                <p>Không tìm thấy sản phẩm</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.slice(0, 5).map(p => renderProductCard(p)).join('');
}

// ==================== EVENT HANDLERS ====================

/**
 * Select category from sidebar
 */
function selectCategory(categoryId) {
    shopState.selectedCategoryId = categoryId;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.categoryId == categoryId);
    });

    // Scroll to category section and load products
    document.getElementById('categorySection').scrollIntoView({ behavior: 'smooth' });
    
    // Update tab if exists
    const tab = document.querySelector(`.category-tab[data-category-id="${categoryId}"]`);
    if (tab) {
        selectCategoryTab(categoryId, tab);
    } else {
        renderProductsGrid(categoryId);
    }
}

/**
 * Select category tab
 */
function selectCategoryTab(categoryId, tabEl) {
    shopState.selectedCategoryId = categoryId;
    shopState.selectedBrandId = null;

    // Update tab active state
    document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
    tabEl.classList.add('active');

    // Reset brand tags
    document.querySelectorAll('.brand-tag').forEach(tag => tag.classList.remove('active'));

    // Load products
    renderProductsGrid(categoryId);
}

/**
 * Select brand filter
 */
function selectBrand(brandId, tagEl) {
    // Toggle active
    const isActive = tagEl.classList.contains('active');
    document.querySelectorAll('.brand-tag').forEach(tag => tag.classList.remove('active'));
    
    if (!isActive) {
        tagEl.classList.add('active');
        shopState.selectedBrandId = brandId;
    } else {
        shopState.selectedBrandId = null;
    }

    renderProductsGrid(shopState.selectedCategoryId, shopState.selectedBrandId);
}

/**
 * Filter by brand (from brands section)
 */
function filterByBrand(brandId) {
    shopState.selectedBrandId = brandId;
    document.getElementById('categorySection').scrollIntoView({ behavior: 'smooth' });
    renderProductsGrid(null, brandId);
}

/**
 * View product detail
 */
function viewProductDetail(slug) {
    if (slug) {
        window.location.href = `product-detail.html?slug=${encodeURIComponent(slug)}`;
    }
}

/**
 * Add to wishlist
 */
function addToWishlist(skuId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    showToast('Đã thêm vào danh sách yêu thích!', 'success');
}

// ==================== BANNER SLIDER ====================

/**
 * Initialize banner slider
 */
function initBannerSlider() {
    const slider = document.getElementById('bannerSlider');
    const dotsContainer = document.getElementById('bannerDots');
    if (!slider || !dotsContainer) return;

    // Create slides
    let slidesHtml = '';
    let dotsHtml = '';

    shopState.bannerImages.forEach((img, index) => {
        slidesHtml += `
            <div class="banner-slide ${index === 0 ? 'active' : ''}">
                <img src="${img}" alt="Banner ${index + 1}">
            </div>
        `;
        dotsHtml += `<div class="banner-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`;
    });

    slider.innerHTML = slidesHtml;
    dotsContainer.innerHTML = dotsHtml;

    // Auto slide
    setInterval(() => nextSlide(), 5000);
}

function nextSlide() {
    shopState.currentSlide = (shopState.currentSlide + 1) % shopState.bannerImages.length;
    updateSlider();
}

function prevSlide() {
    shopState.currentSlide = (shopState.currentSlide - 1 + shopState.bannerImages.length) % shopState.bannerImages.length;
    updateSlider();
}

function goToSlide(index) {
    shopState.currentSlide = index;
    updateSlider();
}

function updateSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === shopState.currentSlide);
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === shopState.currentSlide);
    });
}

// ==================== UTILITIES ====================

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    toast.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('show', show);
    }
}

// ==================== INITIALIZATION ====================

async function initShop() {
    console.log('🚀 Initializing EzGear Shop...');
    showLoading(true);

    try {
        // Load data in parallel
        await Promise.all([
            loadCategories(),
            loadBrands()
        ]);

        // Render UI components
        renderSidebar();
        renderCategoryTabs();
        renderBrandTags();
        renderFeaturedBrandFilters();
        renderBrandsGrid();
        initBannerSlider();

        // Load initial products
        if (shopState.categories.length > 0) {
            await renderProductsGrid(shopState.categories[0].id);
        }
        
        await loadFeaturedProducts();

        // Update cart badge
        if (TokenHelper.isLoggedIn()) {
            updateCartBadge();
        }

        console.log('✅ EzGear Shop initialized successfully');
    } catch (error) {
        console.error('❌ Init shop error:', error);
        showToast('Có lỗi xảy ra khi tải trang', 'error');
    } finally {
        showLoading(false);
    }
}

// Export functions
window.initShop = initShop;
window.selectCategory = selectCategory;
window.selectCategoryTab = selectCategoryTab;
window.selectBrand = selectBrand;
window.filterByBrand = filterByBrand;
window.loadFeaturedProducts = loadFeaturedProducts;
window.viewProductDetail = viewProductDetail;
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goToSlide = goToSlide;
