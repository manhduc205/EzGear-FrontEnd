/* ==================== EZGEAR SHOP JS - DYNAMIC CATEGORY SECTIONS ==================== */

// API Base URL - Sử dụng từ config.js
const BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8080';

// Category Icons Mapping (Material Symbols)
const CATEGORY_ICONS = {
    'Điện thoại': 'smartphone',
    'Tablet': 'tablet_android',
    'Laptop': 'laptop_mac',
    'Laptop Gaming': 'sports_esports',
    'Laptop Văn phòng': 'business_center',
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

// Hardcoded Categories - REMOVED, will load from API instead

// State Management
const shopState = {
    categories: [], // Load from API
    allBrands: [], // load from API (empty until fetched)
    currentSlide: 0,
    bannerImages: [
        'https://cdn.hstatic.net/files/200000722513/file/gearvn-pc-gvn-t11-slider.jpg',
        'https://cdn.hstatic.net/files/200000722513/file/gearvn-thu-cu-doi-moi-t10-slider.jpeg',
        'https://cdn.hstatic.net/files/200000722513/file/gearvn-laptop-acer-predator-triton-14a-slider-t12.jpg',
        'https://cdn.hstatic.net/files/200000722513/file/gearvn-laptop-gigabyte-slider-t12.jpg',
        'https://cdn.hstatic.net/files/200000722513/file/gearvn-laptop-gaming-sub-banner-t1-26.png',
        'https://cdn.hstatic.net/files/200000722513/file/gearvn-build-pc-sub-banner-t1-26.png'
    ],
    // State for each category section
    categorySections: {}
};

// ==================== API CALLS ====================

/**
 * Load all categories from API
 */
async function loadCategories() {
    try {
        const url = `${BASE_URL}/api/categories`;
        console.log(`📡 Loading categories from: ${url}`);
        const data = await httpRequest(url, { method: 'GET' });
        const apiCategories = data.payload || data || [];
        if (apiCategories.length > 0) {
            shopState.categories = apiCategories;
            console.log(`✅ Loaded ${apiCategories.length} categories from API:`, 
                apiCategories.map(c => `${c.name} (${c.slug})`).join(', '));
        } else {
            throw new Error('No categories returned from API');
        }
        return shopState.categories;
    } catch (error) {
        console.error(`❌ Error loading categories:`, error.message);
        shopState.categories = [];
        return shopState.categories;
    }
}

/**
 * Load all brands from API
 */
async function loadAllBrands() {
    try {
        const url = `${BASE_URL}/api/brands`;
        const data = await httpRequest(url, { method: 'GET' });
        const apiBrands = data.payload || data || [];
        shopState.allBrands = apiBrands;
        console.log('✅ Brands loaded from API:', shopState.allBrands.length);
        if (shopState.allBrands.length > 0) {
            console.log('📸 Brand logos sample:', shopState.allBrands.slice(0, 3).map(b => ({
                name: b.name,
                logoUrl: b.logoUrl
            })));
        }
        return shopState.allBrands;
    } catch (error) {
        console.error('❌ Brands API Error:', error.message);
        shopState.allBrands = [];
        return shopState.allBrands;
    }
}

/**
 * Load products by category slug with filters
 * @param {string} slug - Category slug (e.g., 'laptop-gaming', 'laptop-van-phong')
 * @param {object} options - Filter options { limit, page, sortBy, brand }
 */
async function loadProductsByCategorySlug(slug, options = {}) {
    const { limit = 12, page = 0, sortBy = '', brand = null } = options;
    
    try {
        // IMPORTANT: Load ALL products (limit=1000) để sort toàn bộ trên frontend
        let url = `${BASE_URL}/api/products/public/category/${slug}?page=0&limit=1000`;
        
        // Add sorting parameter - chỉ gửi backend sorts, frontend sorts sẽ xử lý sau
        const backendSorts = ['top-rated', 'most-reviewed', 'best-selling'];
        if (sortBy && backendSorts.includes(sortBy)) {
            url += `&sort=${sortBy}`;
        }
        
        // Add brand filter - use brand slug/name (string)
        if (brand) {
            url += `&brand=${encodeURIComponent(brand)}`;
        }
        
        const data = await httpRequest(url, { method: 'GET' });
        
        if (data.success && data.payload) {
            let allProducts = data.payload.content || [];
            
            // Frontend sorting cho price sorts
            if (sortBy === 'price-asc') {
                allProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            } else if (sortBy === 'price-desc') {
                allProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            }
            
            // Apply pagination trên frontend
            const start = page * limit;
            const paginatedProducts = allProducts.slice(start, start + limit);
            
            console.log(`📦 Loaded ${allProducts.length} products, showing ${paginatedProducts.length} (page ${page + 1})`);
            if (sortBy) {
                console.log(`   Sort: ${sortBy} - First: ${paginatedProducts[0]?.name} (${formatCurrency(paginatedProducts[0]?.price || 0)})`);
            }
            
            return {
                products: paginatedProducts,
                totalPages: Math.ceil(allProducts.length / limit),
                totalElements: allProducts.length,
                last: start + limit >= allProducts.length
            };
        }
        
        return { products: [], totalPages: 0, totalElements: 0, last: true };
    } catch (error) {
        console.error(`❌ API Error for ${slug}:`, error.message);
        return { products: [], totalPages: 0, totalElements: 0, last: true };
    }
}

/**
 * Load brands by category ID using the new API endpoint
 */
async function loadBrandsByCategoryId(categoryId) {
    try {
        const url = `${BASE_URL}/api/brands/${categoryId}`;
        const data = await httpRequest(url, { method: 'GET' });
        
        if (data.success && data.payload) {
            const categoryBrands = data.payload || [];
            console.log(`✅ Found ${categoryBrands.length} brands in category ID ${categoryId}`);
            return categoryBrands;
        }
        
        return [];
    } catch (error) {
        console.error(`❌ Error loading brands for category ${categoryId}:`, error.message);
        return [];
    }
}

/**
 * Add item to cart
 */
async function addToCart(productId, productName, event) {
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
        const url = `${BASE_URL}/api/cart/add`;
        await httpRequest(url, { method: 'POST', body: JSON.stringify({ productId: productId, quantity: 1 }) });
        showToast(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
        updateCartBadge();
    } catch (error) {
        showToast(error.message || 'Không thể thêm vào giỏ hàng', 'error');
    }
}

/**
 * Update cart badge count
 */
async function updateCartBadge() {
    if (!TokenHelper.isLoggedIn()) return;

    try {
        const url = `${BASE_URL}/api/cart`;
        const data = await httpRequest(url, { method: 'GET' });
        const cart = data.payload || data;
        const items = cart.items || cart.cartItems || [];
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = items.length;
    } catch (error) {
        // Silently fail - cart badge is not critical
        console.debug('Cart badge update skipped:', error.message);
    }
}

// ==================== CATEGORY SECTION COMPONENT ====================

/**
 * CategorySection - Component to render a category section with products
 */
class CategorySection {
    constructor(container, { title, slug, categoryId, limit = 12 }) {
        this.container = container;
        this.title = title;
        this.slug = slug;
        this.categoryId = categoryId;
        this.limit = limit;
        this.products = [];
        this.brands = [];
        this.loading = true;
        this.error = false;
        this.selectedBrand = null; // Store brand slug/name instead of ID
        this.sortBy = '';
        this.sectionId = `category-section-${slug}`;
        
        // Initialize state for this section
        shopState.categorySections[slug] = {
            selectedBrand: null, // Store brand slug/name
            sortBy: ''
        };
        
        this.render();
        this.loadData();
    }
    
    /**
     * Render the section structure
     */
    render() {
        this.container.innerHTML = `
            <section class="category-section" id="${this.sectionId}">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="title-bar"></span>
                        ${this.title.toUpperCase()}
                    </h2>
                    <a href="./shop-list.html?category=${this.slug}" class="view-all-link">
                        Xem tất cả >>
                    </a>
                </div>
                
                <!-- Filters Row -->
                <div class="filters-row" id="filters-${this.slug}">
                    <div class="brand-filters" id="brand-filters-${this.slug}">
                        <!-- Brand filters will be loaded -->
                        <div class="filter-skeleton"></div>
                    </div>
                    <div class="price-filter">
                        <select class="price-sort-select" id="price-sort-${this.slug}" onchange="handlePriceSort('${this.slug}', this.value)">
                            <option value="">Sắp xếp</option>
                            <option value="price-asc">Giá: Thấp đến Cao</option>
                            <option value="price-desc">Giá: Cao đến Thấp</option>
                            <option value="top-rated">Đánh giá cao nhất</option>
                            <option value="most-reviewed">Nhiều đánh giá nhất</option>
                            <option value="best-selling">Bán chạy nhất</option>
                        </select>
                    </div>
                </div>
                
                <!-- Products Grid -->
                <div class="products-grid grid-12" id="products-grid-${this.slug}">
                    ${this.renderSkeletonCards()}
                </div>
            </section>
        `;
    }
    
    /**
     * Load brands and products data
     */
    async loadData() {
        try {
            // Load brands for this category using categoryId
            if (this.categoryId) {
                this.brands = await loadBrandsByCategoryId(this.categoryId);
            } else {
                this.brands = [];
            }
            this.renderBrandFilters();
            
            // Load products
            await this.loadProducts();
            
            this.loading = false;
            this.error = false;
        } catch (error) {
            console.error(`Error loading data for ${this.slug}:`, error);
            this.loading = false;
            this.error = true;
            this.renderError();
        }
    }
    
    /**
     * Load products with current filters
     */
    async loadProducts() {
        const gridContainer = document.getElementById(`products-grid-${this.slug}`);
        if (!gridContainer) return;
        
        // Show skeleton loading
        gridContainer.innerHTML = this.renderSkeletonCards();
        
        const state = shopState.categorySections[this.slug];
        const result = await loadProductsByCategorySlug(this.slug, {
            limit: this.limit,
            page: 0,
            sortBy: state.sortBy,
            brand: state.selectedBrand // Use brand slug/name
        });
        
        this.products = result.products;
        this.renderProducts();
    }
    
    /**
     * Render brand filter buttons
     */
    renderBrandFilters() {
        const container = document.getElementById(`brand-filters-${this.slug}`);
        if (!container) return;
        
        let html = `
            <button class="brand-filter-btn active" 
                    onclick="handleBrandFilter('${this.slug}', null, this)">
                Tất cả
            </button>
        `;
        
        this.brands.forEach(brand => {
            const brandSlug = (brand.slug || brand.name || '').toLowerCase();
            html += `
                <button class="brand-filter-btn" 
                        data-brand-slug="${brandSlug}"
                        onclick="handleBrandFilter('${this.slug}', '${brandSlug}', this)">
                    ${brand.name}
                </button>
            `;
        });
        
        container.innerHTML = html;
    }
    
    /**
     * Render skeleton loading cards
     */
    renderSkeletonCards() {
        let html = '';
        for (let i = 0; i < this.limit; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-price"></div>
                </div>
            `;
        }
        return html;
    }
    
    /**
     * Render products grid
     */
    renderProducts() {
        const container = document.getElementById(`products-grid-${this.slug}`);
        if (!container) return;
        
        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <p>Không tìm thấy sản phẩm</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.products.map(product => this.renderProductCard(product)).join('');
    }
    
    /**
     * Render a single product card
     */
    renderProductCard(product) {
        const {
            id,
            name = 'Sản phẩm',
            slug = '',
            imageUrl = 'https://via.placeholder.com/300x200?text=No+Image',
            price = 0,
            ratingAverage = 0,
            reviewCount = 0,
            ssd = '',
            cpu = '',
            vga = '',
            lcd = '',
            hz = '',
            ram = ''
        } = product;
        
        const formattedPrice = this.formatPrice(price);
        
        return `
            <div class="product-card" onclick="viewProductDetail('${slug}')">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" 
                         loading="lazy">
                </div>
                <h3 class="product-name" title="${name}"><strong>${name}</strong></h3>
                <div class="product-price-row">
                    <span class="product-price">${formattedPrice}</span>
                </div>
                ${renderProductRating(ratingAverage, reviewCount)}
                ${renderTechnicalSpecs(product)}
            </div>
        `;
    }
    
    /**
     * Format price to Vietnamese currency
     */
    formatPrice(price) {
        if (price === 0 || price === null || price === undefined) {
            return 'Liên hệ';
        }
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    }
    
    /**
     * Render error state
     */
    renderError() {
        const container = document.getElementById(`products-grid-${this.slug}`);
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <span class="material-symbols-outlined">error</span>
                <p>Có lỗi xảy ra khi tải sản phẩm</p>
                <button class="btn-retry" onclick="reloadCategorySection('${this.slug}')">
                    Thử lại
                </button>
            </div>
        `;
    }
}

// ==================== GLOBAL EVENT HANDLERS ====================

/**
 * Handle brand filter selection
 */
async function handleBrandFilter(slug, brandSlug, buttonEl) {
    // Update active state
    const container = document.getElementById(`brand-filters-${slug}`);
    if (container) {
        container.querySelectorAll('.brand-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        buttonEl.classList.add('active');
    }
    
    // Update state - store brand slug/name
    shopState.categorySections[slug].selectedBrand = brandSlug;
    
    console.log(`🔍 Filter brand: ${brandSlug || 'all'} for category: ${slug}`);
    
    // Reload products
    const section = shopState.categorySections[slug].instance;
    if (section) {
        await section.loadProducts();
    } else {
        // Fallback: find and reload
        await reloadCategorySectionProducts(slug);
    }
}

/**
 * Handle price sort selection
 */
async function handlePriceSort(slug, sortValue) {
    // Update state
    shopState.categorySections[slug].sortBy = sortValue;
    
    // Reload products
    await reloadCategorySectionProducts(slug);
}

/**
 * Reload products for a category section
 */
async function reloadCategorySectionProducts(slug) {
    const gridContainer = document.getElementById(`products-grid-${slug}`);
    if (!gridContainer) return;
    
    // Show loading
    gridContainer.innerHTML = renderGlobalSkeletonCards(12);
    
    const state = shopState.categorySections[slug];
    const result = await loadProductsByCategorySlug(slug, {
        limit: 12,
        page: 0,
        sortBy: state.sortBy,
        brand: state.selectedBrand // Use brand slug/name
    });
    
    if (result.products.length === 0) {
        gridContainer.innerHTML = `
            <div class="no-products">
                <span class="material-symbols-outlined">inventory_2</span>
                <p>Không tìm thấy sản phẩm</p>
            </div>
        `;
        return;
    }
    
    gridContainer.innerHTML = result.products.map(product => {
        const {
            name = 'Sản phẩm',
            slug: productSlug = '',
            imageUrl = 'https://via.placeholder.com/300x200?text=No+Image',
            price = 0,
            ratingAverage = 0,
            reviewCount = 0
        } = product;
        
        const formattedPrice = price === 0 ? 'Liên hệ' : new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
        
        return `
            <div class="product-card" onclick="viewProductDetail('${productSlug}')">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" 
                         loading="lazy">
                </div>
                <h3 class="product-name" title="${name}"><strong>${name}</strong></h3>
                <div class="product-price-row">
                    <span class="product-price">${formattedPrice}</span>
                </div>
                ${renderProductRating(ratingAverage, reviewCount)}
                ${renderTechnicalSpecs(product)}
            </div>
        `;
    }).join('');
}

/**
 * Reload entire category section
 */
function reloadCategorySection(slug) {
    const category = shopState.categories.find(c => c.slug === slug);
    if (!category) return;
    
    const container = document.querySelector(`#category-section-${slug}`);
    if (container) {
        const sectionWrapper = container.parentElement;
        new CategorySection(sectionWrapper, {
            title: category.name,
            slug: category.slug,
            limit: 12
        });
    }
}

/**
 * Render skeleton cards (global helper)
 */
function renderGlobalSkeletonCards(count = 12) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
                <div class="skeleton skeleton-price"></div>
            </div>
        `;
    }
    return html;
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
            <div class="sidebar-item ${index === 0 ? 'active' : ''}" 
                 data-category-slug="${cat.slug}" 
                 onclick="scrollToCategory('${cat.slug}')">
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
 * Scroll to a category section
 */
function scrollToCategory(slug) {
    const section = document.getElementById(`category-section-${slug}`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update active sidebar item
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.categorySlug === slug);
        });
    }
}

/**
 * Render all category sections
 */
async function renderCategorySections() {
    const container = document.getElementById('categorySectionsContainer');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create a section for each category
    for (const category of shopState.categories) {
        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'category-section-wrapper';
        container.appendChild(sectionWrapper);
        
        // Create CategorySection instance
        const section = new CategorySection(sectionWrapper, {
            title: category.name,
            slug: category.slug,
            categoryId: category.id,
            limit: 12
        });
        
        // Store reference
        shopState.categorySections[category.slug].instance = section;
    }
}

/**
 * Render brands grid
 */
function renderBrandsGrid() {
    const container = document.getElementById('brandsGrid');
    if (!container) return;
    // If API didn't return brands, show a subtle message instead of hardcoding logos
    if (!shopState.allBrands || shopState.allBrands.length === 0) {
        container.innerHTML = '<p class="no-brands">Không có thương hiệu để hiển thị</p>';
        return;
    }

    // Render brand logos using data from API (logoUrl) with graceful fallback
    // Use local placeholder to avoid DevTools blocking external placeholder services
    const placeholder = '../../assets/img/placeholder.svg';
    let html = '';
    shopState.allBrands.slice(0, 12).forEach((brand) => {
        const logo = brand.logoUrl || placeholder;
        html += `
            <div class="brand-item" onclick="filterGlobalByBrand(${brand.id})" title="${brand.name}">
                <img src="${logo}" alt="${brand.name}" 
                     onerror="this.onerror=null; this.src='${placeholder}'; console.warn('Brand image failed: ${brand.name}')">
            </div>
        `;
    });

    container.innerHTML = html;
    console.log('✅ Rendered brands grid with', shopState.allBrands.slice(0, 12).length, 'brands');
}

/**
 * Filter all sections by brand (from brands grid)
 */
function filterGlobalByBrand(brandId) {
    // Scroll to first category section
    const firstSection = document.querySelector('.category-section');
    if (firstSection) {
        firstSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    showToast('Đã chọn lọc theo thương hiệu', 'info');
}

// ==================== BANNER SLIDER ====================

/**
 * Initialize banner slider
 */
function initBannerSlider() {
    const slider = document.getElementById('bannerSlider');
    const dotsContainer = document.getElementById('bannerDots');
    if (!slider || !dotsContainer) return;

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
    if (price === 0 || price === null || price === undefined) {
        return 'Liên hệ';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

/**
 * Render star icons for rating (0-5)
 */
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.5;
    let html = '';
    for (let i = 0; i < full; i++) html += '<span class="material-symbols-outlined">star</span>';
    if (half) html += '<span class="material-symbols-outlined">star_half</span>';
    const remaining = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < remaining; i++) html += '<span class="material-symbols-outlined">star_outline</span>';
    return html;
}

/**
 * Render product rating HTML với SVG stars
 * @param {number} ratingAverage - Điểm đánh giá trung bình
 * @param {number} reviewCount - Số lượng đánh giá
 */
function renderProductRating(ratingAverage = 0, reviewCount = 0) {
    const full = Math.floor(Number(ratingAverage) || 0);
    const hasHalf = ((Number(ratingAverage) || 0) - full) >= 0.5;
    const remaining = 5 - full - (hasHalf ? 1 : 0);
    const gradId = 'starGrad_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 100000).toString(36);

    const starPath = 'M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0';

    let starsHtml = '';
    for (let i = 0; i < full; i++) {
        starsHtml += `<svg class="star-icon" width="14" height="14" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path fill="#FFD700" d="${starPath}"></path></svg>`;
    }

    if (hasHalf) {
        // half star using a horizontal linearGradient (gold -> gray)
        starsHtml += `<svg class="star-icon" width="14" height="14" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="50%" stop-color="#FFD700"/><stop offset="50%" stop-color="#e0e0e0"/></linearGradient></defs><path fill="url(#${gradId})" d="${starPath}"></path></svg>`;
    }

    for (let i = 0; i < remaining; i++) {
        starsHtml += `<svg class="star-icon" width="14" height="14" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path fill="#e0e0e0" d="${starPath}"></path></svg>`;
    }

    return `
        <div class="product-rating" style="display: flex; align-items: center; gap: 6px; margin-top: 8px; margin-bottom: 8px;">
            ${starsHtml}
            <span class="rating-value" style="font-weight: bold; font-size: 14px; margin-left: 4px;">${ratingAverage || 0}</span>
            <span class="review-count" style="color: #666; font-size: 13px;">(${reviewCount || 0} đánh giá)</span>
        </div>
    `;
}

/**
 * Render technical specs HTML cho sản phẩm
 * @param {object} product - Object sản phẩm chứa thông số kỹ thuật
 */
function renderTechnicalSpecs(product) {
    const ssd = product.ssd || '';
    const cpu = product.cpu || '';
    const vga = product.vga || '';
    const lcd = product.lcd || '';
    const hz = product.hz || '';
    const ram = product.ram || '';
    
    // Nếu không có thông số kỹ thuật nào, không render
    if (!ssd && !cpu && !vga && !lcd && !hz && !ram) {
        return '';
    }
    
    let specsHTML = '<div class="proloop-technical" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">';
    
    // SSD
    if (ssd) {
        specsHTML += `
            <div class="proloop-technical--line" data-tag="ssd" style="display: flex; align-items: center; gap: 5px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                <svg width="14" height="14" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.375 0H0.625C0.45924 0 0.300268 0.0702379 0.183058 0.195262C0.065848 0.320286 0 0.489856 0 0.666667V7.33333C0 7.51014 0.065848 7.67971 0.183058 7.80474C0.300268 7.92976 0.45924 8 0.625 8H9.375C9.54076 8 9.69973 7.92976 9.81694 7.80474C9.93415 7.67971 10 7.51014 10 7.33333V0.666667C10 0.489856 9.93415 0.320286 9.81694 0.195262C9.69973 0.0702379 9.54076 0 9.375 0ZM1.00312 0.666667C1.08087 0.664012 1.15758 0.686174 1.22344 0.730314C1.2893 0.774454 1.34131 0.838562 1.3728 0.914426C1.40429 0.99029 1.41384 1.07445 1.40021 1.15614C1.38657 1.23782 1.35039 1.31331 1.29629 1.37292C1.24219 1.43253 1.17264 1.47356 1.09655 1.49075C1.02045 1.50794 0.941279 1.5005 0.869171 1.46939C0.797062 1.43829 0.735302 1.38493 0.691801 1.31615C0.6483 1.24737 0.62504 1.1663 0.625 1.08333C0.624948 0.975098 0.664383 0.871089 0.734957 0.793321C0.805532 0.715553 0.901707 0.67013 1.00312 0.666667ZM1.00312 7.33333C0.925867 7.33333 0.850343 7.3089 0.786105 7.26311C0.721867 7.21733 0.6718 7.15225 0.642235 7.07612C0.612669 6.99998 0.604933 6.9162 0.620006 6.83538C0.635078 6.75455 0.672282 6.68031 0.726911 6.62204C0.781541 6.56377 0.851144 6.52408 0.926918 6.50801C1.00269 6.49193 1.08123 6.50018 1.15261 6.53172C1.22399 6.56325 1.285 6.61666 1.32792 6.68518C1.37084 6.7537 1.39375 6.83426 1.39375 6.91667C1.39375 7.02717 1.35259 7.13315 1.27934 7.2113C1.20608 7.28944 1.10673 7.33333 1.00312 7.33333ZM2.58438 5.40667C2.17714 5.41641 1.78244 5.25614 1.48438 4.96L1.75313 4.60667C1.98142 4.83976 2.28401 4.97196 2.6 4.97667C2.9125 4.97667 3.08437 4.81 3.08437 4.61333C3.08437 4.41667 2.9 4.31 2.4875 4.20667C1.95625 4.07333 1.58438 3.91 1.58438 3.39333C1.58438 2.87667 1.96562 2.56333 2.52187 2.56333C2.88042 2.55631 3.22837 2.69311 3.49687 2.94667L3.24375 3.31333C3.03896 3.11735 2.77507 3.00618 2.5 3C2.39772 2.98678 2.29469 3.01719 2.21333 3.08462C2.13198 3.15204 2.07889 3.25102 2.06562 3.36C2.06562 3.58333 2.25625 3.66333 2.66562 3.76333C3.20312 3.89333 3.5625 4.07667 3.5625 4.57667C3.5625 5.07667 3.2 5.40667 2.58438 5.40667ZM4.93125 5.40667C4.52402 5.41641 4.12932 5.25614 3.83125 4.96L4.1 4.60667C4.32829 4.83976 4.63088 4.97196 4.94688 4.97667C5.25938 4.97667 5.43125 4.81 5.43125 4.61333C5.43125 4.41667 5.24687 4.31 4.83437 4.20667C4.30312 4.07333 3.93125 3.91 3.93125 3.39333C3.93125 2.87667 4.31563 2.56333 4.86875 2.56333C5.2274 2.55565 5.57557 2.69254 5.84375 2.94667L5.59062 3.31333C5.38938 3.11081 5.12643 2.99246 4.85 2.98C4.74772 2.96678 4.64469 2.99719 4.56333 3.06462C4.48198 3.13204 4.42889 3.23102 4.41562 3.34C4.41562 3.56333 4.60625 3.64333 5.01562 3.74333C5.55312 3.87333 5.9125 4.05667 5.9125 4.55667C5.9125 5.05667 5.54688 5.40667 4.93125 5.40667ZM6.3625 5.36V2.61333H7.26875C8.11875 2.61333 8.71875 3.18333 8.71875 3.98667C8.71875 4.79 8.125 5.36 7.26875 5.36H6.3625ZM8.96562 7.33333C8.88837 7.33333 8.81284 7.3089 8.74861 7.26311C8.68437 7.21733 8.6343 7.15225 8.60473 7.07612C8.57517 6.99998 8.56743 6.9162 8.58251 6.83538C8.59758 6.75455 8.63478 6.68031 8.68941 6.62204C8.74404 6.56377 8.81364 6.52408 8.88942 6.50801C8.96519 6.49193 9.04373 6.50018 9.11511 6.53172C9.18649 6.56325 9.2475 6.61666 9.29042 6.68518C9.33334 6.7537 9.35625 6.83426 9.35625 6.91667C9.35625 7.02717 9.31509 7.13315 9.24184 7.2113C9.16858 7.28944 9.06923 7.33333 8.96562 7.33333ZM8.96562 1.5C8.88837 1.5 8.81284 1.47556 8.74861 1.42978C8.68437 1.384 8.6343 1.31892 8.60473 1.24278C8.57517 1.16665 8.56743 1.08287 8.58251 1.00205C8.59758 0.92122 8.63478 0.846977 8.68941 0.788706C8.74404 0.730434 8.81364 0.69075 8.88942 0.674673C8.96519 0.658596 9.04373 0.666847 9.11511 0.698384C9.18649 0.72992 9.2475 0.783325 9.29042 0.851846C9.33334 0.920366 9.35625 1.00092 9.35625 1.08333C9.35625 1.19384 9.31509 1.29982 9.24184 1.37796C9.16858 1.4561 9.06923 1.5 8.96562 1.5Z" fill="#6D6E72"></path><path d="M6.875 3.00181H7.30868C7.41352 2.99361 7.51853 3.01336 7.61727 3.05982C7.71601 3.10628 7.80639 3.17848 7.88285 3.27197C7.95931 3.36546 8.02023 3.47828 8.06187 3.60348C8.10352 3.72868 8.125 3.86362 8.125 4C8.125 4.13638 8.10352 4.27132 8.06187 4.39652C8.02023 4.52172 7.95931 4.63454 7.88285 4.72803C7.80639 4.82153 7.71601 4.89372 7.61727 4.94018C7.51853 4.98664 7.41352 5.00639 7.30868 4.99819H6.875V3.00181Z" fill="#6D6E72"></path></svg>
                <span style="font-weight: 500;">${ssd}</span>
            </div>`;
    }
    
    // CPU
    if (cpu) {
        specsHTML += `
            <div class="proloop-technical--line" data-tag="cpu" style="display: flex; align-items: center; gap: 5px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                <svg width="14" height="14" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.75 5.01732C8.75 5.86605 8.75 6.71478 8.75 7.57217C8.75 8.28233 8.29099 8.75 7.58083 8.75C5.85739 8.75 4.14261 8.75 2.41917 8.75C1.71767 8.75 1.25 8.29099 1.25 7.58949C1.25 5.86605 1.25 4.15127 1.25 2.42783C1.25 1.71767 1.73499 1.25 2.44515 1.25C4.15127 1.25 5.85739 1.25 7.56351 1.25C8.27367 1.25 8.75 1.71767 8.75 2.42783C8.75 3.28522 8.75 4.15127 8.75 5.01732ZM5.01732 2.48845C4.48037 2.48845 3.95208 2.50577 3.42379 2.47979C2.95612 2.46247 2.47979 2.84353 2.48845 3.42379C2.49711 4.47171 2.48845 5.51963 2.48845 6.56755C2.48845 7.13914 2.83487 7.50288 3.40647 7.51155C4.47171 7.52021 5.52829 7.52021 6.59353 7.51155C7.15646 7.50288 7.51154 7.16512 7.52021 6.60219C7.53753 5.53695 7.52887 4.46305 7.52021 3.3978C7.52021 2.79157 7.02656 2.46247 6.56755 2.47979C6.04792 2.50577 5.52829 2.48845 5.01732 2.48845Z" fill="#6D6E72"></path><path d="M9.55476 4.47915H8.125V3.26831H9.55476C9.79933 3.26831 10 3.53927 10 3.8695C10 4.20819 9.79933 4.47915 9.55476 4.47915Z" fill="#6D6E72"></path><path d="M9.55476 6.73142H8.125V5.52905H9.55476C9.79933 5.52905 10 5.80001 10 6.13024C10 6.46047 9.79933 6.73142 9.55476 6.73142Z" fill="#6D6E72"></path><path d="M0.44375 5.52905H1.875V6.73989H0.44375C0.2 6.73142 0 6.46047 0 6.13024C0 5.80001 0.2 5.52905 0.44375 5.52905Z" fill="#6D6E72"></path><path d="M0.44375 3.26831H1.875V4.47915H0.44375C0.2 4.47915 0 4.20819 0 3.8695C0 3.53927 0.2 3.26831 0.44375 3.26831Z" fill="#6D6E72"></path><path d="M4.47927 0.44375V1.875H3.26843V0.44375C3.26843 0.2 3.53939 0 3.86962 0C4.20831 0 4.47927 0.2 4.47927 0.44375Z" fill="#6D6E72"></path><path d="M6.73167 0.44375V1.875H5.5293V0.44375C5.5293 0.2 5.80025 0 6.13048 0C6.46071 0 6.73167 0.2 6.73167 0.44375Z" fill="#6D6E72"></path><path d="M5.5293 9.55477V8.125H6.74013V9.55477C6.74013 9.79934 6.46918 10 6.13895 10C5.80025 10 5.5293 9.79934 5.5293 9.55477Z" fill="#6D6E72"></path><path d="M3.26843 9.55477V8.125H4.47927V9.55477C4.47927 9.79934 4.20831 10 3.87809 10C3.53939 10 3.26843 9.79934 3.26843 9.55477Z" fill="#6D6E72"></path><path d="M6.875 4.99588C6.875 5.42445 6.875 5.86126 6.875 6.28983C6.875 6.64423 6.65247 6.875 6.28983 6.875C5.42445 6.875 4.55906 6.875 3.70192 6.875C3.35577 6.875 3.125 6.64423 3.125 6.29808C3.125 5.43269 3.125 4.56731 3.125 3.71016C3.125 3.35577 3.35577 3.125 3.71016 3.125C4.57555 3.125 5.44093 3.125 6.29808 3.125C6.64423 3.125 6.875 3.35577 6.875 3.70192C6.875 4.13874 6.875 4.56731 6.875 4.99588Z" fill="#6D6E72"></path></svg>
                <span style="font-weight: 500;">${cpu}</span>
            </div>`;
    }
    
    // VGA
    if (vga) {
        specsHTML += `
            <div class="proloop-technical--line" data-tag="vga" style="display: flex; align-items: center; gap: 5px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                <svg width="14" height="14" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.6875 8.37201H9.375V9.21545C9.375 9.29159 9.34408 9.35748 9.28223 9.41312C9.22038 9.46877 9.14714 9.49659 9.0625 9.49659C8.97786 9.49659 8.90462 9.46877 8.84277 9.41312C8.78092 9.35748 8.75 9.29159 8.75 9.21545V8.37201H8.125V9.21545C8.125 9.29159 8.09408 9.35748 8.03223 9.41312C7.97038 9.46877 7.89714 9.49659 7.8125 9.49659C7.72786 9.49659 7.65462 9.46877 7.59277 9.41312C7.53092 9.35748 7.5 9.29159 7.5 9.21545V8.37201H6.875V9.21545C6.875 9.29159 6.84408 9.35748 6.78223 9.41312C6.72038 9.46877 6.64714 9.49659 6.5625 9.49659C6.47786 9.49659 6.40462 9.46877 6.34277 9.41312C6.28092 9.35748 6.25 9.29159 6.25 9.21545V8.37201H5.625V9.21545C5.625 9.29159 5.59408 9.35748 5.53223 9.41312C5.47038 9.46877 5.39714 9.49659 5.3125 9.49659C5.22786 9.49659 5.15462 9.46877 5.09277 9.41312C5.03092 9.35748 5 9.29159 5 9.21545V8.37201H4.375V9.21545C4.375 9.29159 4.34408 9.35748 4.28223 9.41312C4.22038 9.46877 4.14714 9.49659 4.0625 9.49659C3.97786 9.49659 3.90462 9.46877 3.84277 9.41312C3.78092 9.35748 3.75 9.29159 3.75 9.21545V8.37201H3.125V9.21545C3.125 9.29159 3.09408 9.35748 3.03223 9.41312C2.97038 9.46877 2.89714 9.49659 2.8125 9.49659C2.72786 9.49659 2.65462 9.46877 2.59277 9.41312C2.53092 9.35748 2.5 9.29159 2.5 9.21545V8.37201H1.25L1.04492 1.70176H9.6875C9.77214 1.70176 9.84538 1.72958 9.90723 1.78523C9.96908 1.84087 10 1.90676 10 1.98291V8.09087C10 8.16701 9.96908 8.23291 9.90723 8.28855C9.84538 8.34419 9.77214 8.37201 9.6875 8.37201ZM9.375 3.31143C9.375 3.15915 9.31478 3.02736 9.19434 2.91608C9.07389 2.80479 8.92578 2.74915 8.75 2.74915H4.375C4.20573 2.74915 4.05924 2.80479 3.93555 2.91608C3.81185 3.02736 3.75 3.15915 3.75 3.31143V6.68515C3.75 6.8433 3.81185 6.97655 3.93555 7.08491C4.05924 7.19326 4.20573 7.24744 4.375 7.24744H8.75C8.92578 7.24744 9.07389 7.19326 9.19434 7.08491C9.31478 6.97655 9.375 6.8433 9.375 6.68515V3.31143ZM8.4375 6.68515H4.6875C4.60286 6.68515 4.52962 6.65733 4.46777 6.60169C4.40592 6.54605 4.375 6.48015 4.375 6.40401V3.59258C4.375 3.51644 4.40592 3.45054 4.46777 3.3949C4.52962 3.33926 4.60286 3.31143 4.6875 3.31143H8.4375C8.52214 3.31143 8.59538 3.33926 8.65723 3.3949C8.71908 3.45054 8.75 3.51644 8.75 3.59258V6.40401C8.75 6.48015 8.71908 6.54605 8.65723 6.60169C8.59538 6.65733 8.52214 6.68515 8.4375 6.68515ZM6.875 3.87372C6.52995 3.87372 6.23535 3.98354 5.99121 4.20319C5.74707 4.42283 5.625 4.68787 5.625 4.99829C5.625 5.30872 5.74707 5.57376 5.99121 5.7934C6.23535 6.01305 6.52995 6.12287 6.875 6.12287C7.22005 6.12287 7.51465 6.01305 7.75879 5.7934C8.00293 5.57376 8.125 5.30872 8.125 4.99829C8.125 4.68787 8.00293 4.42283 7.75879 4.20319C7.51465 3.98354 7.22005 3.87372 6.875 3.87372ZM6.87988 5.56058C6.70736 5.56058 6.55924 5.5064 6.43555 5.39805C6.31185 5.28969 6.25 5.1579 6.25 5.00269C6.25 4.84747 6.31185 4.71422 6.43555 4.60294C6.55924 4.49165 6.70736 4.43601 6.87988 4.43601C7.05241 4.43601 7.19889 4.49019 7.31934 4.59854C7.43978 4.7069 7.5 4.84015 7.5 4.99829C7.5 5.15644 7.43978 5.28969 7.31934 5.39805C7.19889 5.5064 7.05241 5.56058 6.87988 5.56058ZM1.65527 7.52356V9.21545C1.65527 9.29159 1.62435 9.35748 1.5625 9.41312C1.43723 9.52582 1.02214 9.49659 0.9375 9.49659C0.852865 9.49659 0.779622 9.46877 0.717773 9.41312C0.655924 9.35748 0.625 9.29159 0.625 9.21545V1.14261H0.3125C0.227865 1.14261 0.154622 1.11479 0.0927734 1.05915C0.0309245 1.00351 0 0.89745 0 0.821307C0 0.668184 0.0309245 0.639108 0.0927734 0.583465C0.154622 0.527822 0.227865 0.5 0.3125 0.5H0.9375C0.963542 0.5 0.983073 0.502929 0.996094 0.508786C1.25 0.5 1.25 0.5 1.5625 0.5C1.875 0.5 1.875 0.751021 1.875 0.821307L1.65527 7.52356Z" fill="#6D6E72"></path></svg>
                <span style="font-weight: 500;">${vga}</span>
            </div>`;
    }
    
    // LCD
    if (lcd) {
        specsHTML += `
            <div class="proloop-technical--line" data-tag="lcd" style="display: flex; align-items: center; gap: 5px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                <svg width="14" height="14" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3.5H3.875C3.98333 3.5 4.073 3.4645 4.144 3.3935C4.21467 3.32283 4.25 3.23333 4.25 3.125C4.25 3.01667 4.21467 2.92717 4.144 2.8565C4.073 2.7855 3.98333 2.75 3.875 2.75H2.75C2.60833 2.75 2.4895 2.79783 2.3935 2.8935C2.29783 2.9895 2.25 3.10833 2.25 3.25V4.375C2.25 4.48333 2.2855 4.57283 2.3565 4.6435C2.42717 4.7145 2.51667 4.75 2.625 4.75C2.73333 4.75 2.82283 4.7145 2.8935 4.6435C2.9645 4.57283 3 4.48333 3 4.375V3.5ZM6.75 5.25H5.875C5.76667 5.25 5.67717 5.28533 5.6065 5.356C5.5355 5.427 5.5 5.51667 5.5 5.625C5.5 5.73333 5.5355 5.82283 5.6065 5.8935C5.67717 5.9645 5.76667 6 5.875 6H7C7.14167 6 7.26033 5.952 7.356 5.856C7.452 5.76033 7.5 5.64167 7.5 5.5V4.375C7.5 4.26667 7.46467 4.177 7.394 4.106C7.323 4.03533 7.23333 4 7.125 4C7.01667 4 6.927 4.03533 6.856 4.106C6.78533 4.177 6.75 4.26667 6.75 4.375V5.25ZM3.5 9.5C3.35833 9.5 3.23967 9.452 3.144 9.356C3.048 9.26033 3 9.14167 3 9V8.5H1C0.725 8.5 0.489667 8.40217 0.294 8.2065C0.098 8.0105 0 7.775 0 7.5V1.5C0 1.225 0.098 0.9895 0.294 0.7935C0.489667 0.597833 0.725 0.5 1 0.5H9C9.275 0.5 9.5105 0.597833 9.7065 0.7935C9.90217 0.9895 10 1.225 10 1.5V7.5C10 7.775 9.90217 8.0105 9.7065 8.2065C9.5105 8.40217 9.275 8.5 9 8.5H7V9C7 9.14167 6.95217 9.26033 6.8565 9.356C6.7605 9.452 6.64167 9.5 6.5 9.5H3.5ZM1.5 7H8.5V2H1.5V7Z" fill="#6D6E72"></path></svg>
                <span style="font-weight: 500;">${lcd}</span>
            </div>`;
    }
    
    // Hz
    if (hz) {
        specsHTML += `
            <div class="proloop-technical--line" data-tag="hz" style="display: flex; align-items: center; gap: 5px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                <svg width="14" height="14" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_hz)"><path d="M5 0.833313V4.37498" stroke="#6D6E72" stroke-width="0.833333" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4.99992 0.833313C2.69867 0.833313 0.833252 2.69873 0.833252 4.99998C0.833252 7.30123 2.69867 9.16665 4.99992 9.16665C7.30117 9.16665 9.16659 7.30123 9.16659 4.99998C9.16659 4.03623 8.8395 3.14894 8.29013 2.4431" stroke="#6D6E72" stroke-width="0.833333" stroke-linecap="round"></path><path d="M4.99992 2.70831C3.73429 2.70831 2.70825 3.73435 2.70825 4.99998C2.70825 6.2656 3.73429 7.29165 4.99992 7.29165C6.26554 7.29165 7.29159 6.2656 7.29159 4.99998C7.29159 4.46998 7.11159 3.98185 6.8095 3.59373" stroke="#6D6E72" stroke-width="0.833333" stroke-linecap="round"></path><path d="M5 5.625C5.34518 5.625 5.625 5.34518 5.625 5C5.625 4.65482 5.34518 4.375 5 4.375C4.65482 4.375 4.375 4.65482 4.375 5C4.375 5.34518 4.65482 5.625 5 5.625Z" stroke="#6D6E72" stroke-width="0.833333"></path></g><defs><clipPath id="clip0_hz"><rect width="10" height="10" fill="white"></rect></clipPath></defs></svg>
                <span style="font-weight: 500;">${hz}</span>
            </div>`;
    }
    
    // RAM
    if (ram) {
        specsHTML += `
            <div class="proloop-technical--line" data-tag="ram" style="display: flex; align-items: center; gap: 5px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                <svg width="14" height="14" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_ram)"><path d="M0.807138 6.03778C0.483498 5.988 0.211453 5.78889 0.0754307 5.35956C0.0285264 5.204 0.00507422 5.01733 0.00507422 4.84311C0.000383788 3.79778 0.000383788 2.74622 0.00507422 1.69467C0.00507422 0.954222 0.347476 0.5 0.900947 0.5C3.63078 0.5 6.36061 0.5 9.09044 0.5C9.6486 0.5 9.991 0.948 9.991 1.68844C9.99569 2.72756 9.991 3.76667 9.991 4.812C9.991 5.484 9.75648 5.86978 9.2593 6.01911C9.23115 6.02533 9.20301 6.044 9.1608 6.05644C9.1608 6.36133 9.1608 6.66622 9.1608 6.96489C9.1608 7.37556 9.07637 7.49378 8.7668 7.49378C7.41127 7.5 6.06042 7.49378 4.70489 7.49378C3.56511 7.49378 2.42534 7.49378 1.28556 7.49378C0.891566 7.49378 0.8259 7.40044 0.821209 6.87778C0.821209 6.62267 0.821209 6.36756 0.821209 6.11244C0.83059 6.1 0.821209 6.08133 0.807138 6.03778ZM1.12609 4.68756C1.12609 4.79956 1.19175 4.89289 1.28087 4.89289C1.78744 4.90533 3.3259 4.91778 4.18894 4.924C4.34372 4.924 4.44691 4.82444 4.44691 4.66889C4.44691 3.93467 4.4516 2.57822 4.4516 1.956C4.4516 1.77556 4.33903 1.63244 4.20301 1.63244H1.28556C1.20113 1.63244 1.13078 1.72578 1.13078 1.83778L1.12609 4.68756ZM8.86999 4.60044V1.94356C8.86999 1.77556 8.7668 1.63867 8.64016 1.63867H5.80245C5.67581 1.63867 5.57262 1.77556 5.57262 1.94356V4.60044C5.57262 4.76844 5.67581 4.90533 5.80245 4.90533H8.64016C8.7668 4.90533 8.86999 4.76844 8.86999 4.60044ZM1.93284 6.05022C1.74522 6.05022 1.58106 6.05022 1.40751 6.05022C1.40751 6.29289 1.40751 6.51067 1.40751 6.74089C1.58575 6.74089 1.75461 6.74089 1.93284 6.74089C1.93284 6.51067 1.93284 6.28667 1.93284 6.05022ZM3.03978 6.05022C2.85686 6.05022 2.688 6.05022 2.51446 6.05022C2.51446 6.29289 2.51446 6.51067 2.51446 6.74711C2.69269 6.74711 2.85686 6.74711 3.03978 6.74711C3.03978 6.51067 3.03978 6.29289 3.03978 6.05022ZM3.6214 6.74089C3.8137 6.74089 3.97787 6.74089 4.15142 6.74089C4.15142 6.49822 4.15142 6.28044 4.15142 6.05644C3.96849 6.05644 3.79963 6.05644 3.6214 6.05644C3.6214 6.29911 3.6214 6.51067 3.6214 6.74089ZM5.26305 6.05022C5.07543 6.05022 4.91127 6.05022 4.73772 6.05022C4.73772 6.29289 4.73772 6.51067 4.73772 6.74711C4.91596 6.74711 5.08481 6.74711 5.26305 6.74711C5.26305 6.51067 5.26305 6.29289 5.26305 6.05022ZM6.37468 6.05022C6.18706 6.05022 6.01821 6.05022 5.84466 6.05022C5.84466 6.29289 5.84466 6.51067 5.84466 6.74089C6.02759 6.74089 6.20114 6.74089 6.37468 6.74089C6.37468 6.50444 6.37468 6.29289 6.37468 6.05022ZM6.96568 6.044C6.96568 6.29289 6.96568 6.52311 6.96568 6.74089C7.15329 6.74089 7.31746 6.74089 7.48162 6.74089C7.48162 6.49822 7.48162 6.28044 7.48162 6.044C7.30339 6.044 7.14391 6.044 6.96568 6.044ZM8.06324 6.73467C8.24147 6.73467 8.41033 6.73467 8.58856 6.73467C8.58856 6.49822 8.58856 6.27422 8.58856 6.05022C8.40564 6.05022 8.23678 6.05022 8.06324 6.05022C8.06324 6.28667 8.06324 6.49822 8.06324 6.73467Z" fill="#6D6E72"></path><path d="M2.27955 4.17114H1.89025C1.77768 4.17114 1.68387 4.0467 1.68387 3.89737V2.64048C1.68387 2.48492 1.77768 2.3667 1.89025 2.3667H2.27955C2.39212 2.3667 2.48593 2.48492 2.48593 2.64048V3.89737C2.48593 4.0467 2.39212 4.17114 2.27955 4.17114Z" fill="#6D6E72"></path><path d="M3.66792 4.17114H3.27861C3.16604 4.17114 3.07224 4.0467 3.07224 3.89737V2.63425C3.07224 2.48492 3.16135 2.3667 3.27861 2.3667H3.66792C3.78049 2.3667 3.8743 2.49114 3.8743 2.64048V3.90359C3.8743 4.0467 3.78049 4.17114 3.66792 4.17114Z" fill="#6D6E72"></path><path d="M6.3274 2.35425H6.72139C6.83396 2.35425 6.92777 2.47869 6.92777 2.62803V3.89114C6.92777 4.04047 6.83396 4.16491 6.72139 4.16491H6.3274C6.21483 4.16491 6.12102 4.04047 6.12102 3.89114V2.62803C6.12571 2.47869 6.21483 2.35425 6.3274 2.35425Z" fill="#6D6E72"></path><path d="M8.11445 4.16491H7.71576C7.60319 4.16491 7.50938 4.04047 7.50938 3.89114V2.62803C7.50938 2.47869 7.60319 2.35425 7.71576 2.35425H8.11445C8.22702 2.35425 8.32083 2.47869 8.32083 2.62803V3.89114C8.32083 4.04669 8.22702 4.16491 8.11445 4.16491Z" fill="#6D6E72"></path></g><defs><clipPath id="clip0_ram"><rect width="10" height="7" fill="white" transform="translate(0 0.5)"></rect></clipPath></defs></svg>
                <span style="font-weight: 500;">${ram}</span>
            </div>`;
    }
    
    specsHTML += '</div>';
    return specsHTML;
}

/**
 * Fetch products theo category slug với brand filter và phân trang
 * API Endpoint: GET /products/public/category/{categorySlug}?brand={brandSlug}&page={page}
 * @param {string} categorySlug - Category slug (ví dụ: 'laptop-gaming')
 * @param {string|null} brandSlug - Brand slug (ví dụ: 'asus', 'msi', null nếu lấy tất cả)
 * @param {number} page - Số trang (bắt đầu từ 0)
 * @param {object} options - Các tùy chọn thêm { limit, sortBy }
 * @returns {Promise<object>} - { products, totalPages, totalElements, last }
 */
async function fetchProducts(categorySlug, brandSlug = null, page = 0, options = {}) {
    const { limit = 12, sortBy = '' } = options;
    
    try {
        // Build URL với query string
        let url = `${BASE_URL}/api/products/public/category/${categorySlug}`;
        const params = new URLSearchParams();
        
        // Thêm brand filter nếu có
        if (brandSlug) {
            params.append('brand', brandSlug);
        }
        
        // Thêm pagination
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        // Thêm sorting nếu có
        if (sortBy === 'price-asc') {
            params.append('sort', 'price,asc');
        } else if (sortBy === 'price-desc') {
            params.append('sort', 'price,desc');
        }
        
        // Nối query string vào URL
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        console.log('🔍 Fetching products:', url);
        
        const data = await httpRequest(url, { method: 'GET' });
        
        if (data.success && data.payload) {
            return {
                products: data.payload.content || [],
                totalPages: data.payload.totalPages || 1,
                totalElements: data.payload.totalElements || 0,
                last: data.payload.last || false,
                currentPage: page
            };
        }
        
        return { products: [], totalPages: 0, totalElements: 0, last: true, currentPage: page };
    } catch (error) {
        console.error(`❌ API Error fetching products for ${categorySlug}:`, error.message);
        return { products: [], totalPages: 0, totalElements: 0, last: true, currentPage: page };
    }
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
function addToWishlist(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    showToast('Đã thêm vào danh sách yêu thích!', 'success');
}

// ==================== INITIALIZATION ====================

async function initShop() {
    console.log('🚀 Initializing EzGear Shop...');
    showLoading(true);

    try {
        // Load data in parallel
        await Promise.all([
            loadCategories(),
            loadAllBrands()
        ]);

        // Render UI components
        renderSidebar();
        renderBrandsGrid();
        initBannerSlider();
        
        // Render category sections (main feature)
        await renderCategorySections();

        // Update cart badge
        if (typeof TokenHelper !== 'undefined' && TokenHelper.isLoggedIn()) {
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

// Export functions to window
window.initShop = initShop;
window.scrollToCategory = scrollToCategory;
window.handleBrandFilter = handleBrandFilter;
window.handlePriceSort = handlePriceSort;
window.reloadCategorySection = reloadCategorySection;
window.filterGlobalByBrand = filterGlobalByBrand;
window.viewProductDetail = viewProductDetail;
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goToSlide = goToSlide;
window.fetchProducts = fetchProducts;
window.renderProductRating = renderProductRating;
window.renderTechnicalSpecs = renderTechnicalSpecs;
