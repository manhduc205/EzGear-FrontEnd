/**
 * Shop List Page - Complete Product Listing
 * Displays all products from a category with filtering, sorting, and pagination
 */

// ==================== CONSTANTS ====================

// Use global BASE_URL from api.js for consistency
const API_BASE_URL = window.BASE_URL || 'http://127.0.0.1:8080';

// Category slug to ID mapping (from backend)
const CATEGORY_SLUG_TO_ID = {
    'laptop-gaming': 1,
    'laptop-van-phong': 2,
    'laptop-do-hoa': 3,
    'macbook': 4,
    'desktop': 5,
    'tablet': 6
};

const CATEGORY_NAMES = {
    'laptop-gaming': 'Laptop Gaming',
    'laptop-van-phong': 'Laptop Văn Phòng',
    'laptop-do-hoa': 'Laptop Đồ Họa',
    'macbook': 'Macbook',
    'thiet-bi-van-phong': 'Thiết Bị Văn Phòng',
    'pc-gaming': 'PC Gaming'
};

// ==================== STATE ====================

const listState = {
    categorySlug: '',
    categoryName: '',
    allProducts: [],
    displayedProducts: [],
    brands: [],
    filters: {
        brand: null,
        priceRange: 'all',
        sort: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 12,
        totalPages: 1
    },
    lastLoadedBrand: undefined  // Track brand changes
};

// ==================== API FUNCTIONS ====================

/**
 * Load brands from API by category ID
 */
async function loadBrandsByCategoryId(categoryId) {
    if (!categoryId) {
        console.warn('⚠️ No categoryId provided, returning empty brands');
        return [];
    }
    
    const url = `${API_BASE_URL}/api/brands/${categoryId}`;
    console.log(`🔄 Loading brands from: ${url}`);
    try {
        // Use httpRequest to handle authentication properly
        const data = await httpRequest(url, { method: 'GET' });
        // Support payload wrapper or direct array
        const brands = data.payload || data || [];
        if (Array.isArray(brands) && brands.length > 0) {
            console.log(`✅ Loaded ${brands.length} brands for category ${categoryId}:`, brands);
            return brands;
        }
        throw new Error('No brands in response');
    } catch (error) {
        console.error(`❌ Brands API error for category ${categoryId}:`, error.message);
        return [];
    }
}

/**
 * Load category info to get category ID
 */
async function loadCategoryInfo(categorySlug) {
    try {
        // First: Check if we have a mapping for this category
        if (CATEGORY_SLUG_TO_ID[categorySlug]) {
            const categoryId = CATEGORY_SLUG_TO_ID[categorySlug];
            console.log(`✅ Found categoryId from mapping: ${categorySlug} → ${categoryId}`);
            return { id: categoryId, slug: categorySlug };
        }
        
        // Second: Try to get from products API response
        const productsUrl = `${API_BASE_URL}/api/products/public/category/${categorySlug}?page=0&limit=1`;
        const productsData = await httpRequest(productsUrl, { method: 'GET' });
        
        if (productsData) {
            const payload = productsData.payload || productsData;
            
            // If response has category field
            if (payload.category && payload.category.id) {
                console.log(`✅ Found category from products API:`, payload.category);
                return payload.category;
            }
            
            // If products have categoryId
            if (payload.content && payload.content.length > 0) {
                const product = payload.content[0];
                if (product.categoryId) {
                    console.log(`✅ Found categoryId from product:`, product.categoryId);
                    return { id: product.categoryId, slug: categorySlug };
                }
            }
        }
        
        throw new Error('Category not found');
    } catch (error) {
        console.warn(`⚠️ Could not load category info for ${categorySlug}:`, error.message);
        return null;
    }
}

/**
 * Load products by category slug - load ALL products with optional sort from backend
 */
async function loadProducts(categorySlug, brand = null, sort = '') {
    try {
        // Load all products with sort parameter if provided
        let url = `${API_BASE_URL}/api/products/public/category/${categorySlug}?page=0&limit=1000`;
        
        // Add backend sort if specified (for top-rated, most-reviewed, best-selling)
        if (sort && ['top-rated', 'most-reviewed', 'best-selling'].includes(sort)) {
            url += `&sort=${sort}`;
        }
        
        if (brand) url += `&brand=${encodeURIComponent(brand)}`;

        console.log(`📡 Fetching products: ${url}`);
        const response = await httpRequest(url, { method: 'GET' });
        
        // Support APIs that return payload or raw array
        if (response && (response.success || response.payload)) {
            const payload = response.payload || response;
            if (payload.content) {
                console.log(`✅ Loaded ${payload.content.length} products`);
                return payload.content;
            }
            if (Array.isArray(payload)) {
                console.log(`✅ Loaded ${payload.length} products`);
                return payload;
            }
        }
        throw new Error('Invalid response');
    } catch (error) {
        console.error(`❌ Error loading products for ${categorySlug}:`, error.message);
        return [];
    }
}

// ==================== FILTER & SORT ====================

/**
 * Apply all filters and sorting to products
 * IMPORTANT: Brand filter needs server reload, others can be done frontend
 */
async function applyFilters() {
    // Check if brand changed (from having value to null or vice versa)
    const brandChanged = listState.filters.brand !== listState.lastLoadedBrand;
    
    // Check if we need to reload from server
    // - Brand filter changed: need server reload
    // - Backend sorts (top-rated, etc): need server reload
    const needsServerReload = brandChanged || 
                              ['top-rated', 'most-reviewed', 'best-selling'].includes(listState.filters.sort);
    
    if (needsServerReload) {
        console.log(`🔄 Reloading từ server - brand: ${listState.filters.brand || 'all'}, sort: ${listState.filters.sort || 'latest'}`);
        console.log(`   (Brand changed from: ${listState.lastLoadedBrand || 'all'} to ${listState.filters.brand || 'all'})`);
        
        // Reload from server with brand and sort parameters
        const products = await loadProducts(listState.categorySlug, listState.filters.brand, listState.filters.sort);
        listState.allProducts = products;
        listState.lastLoadedBrand = listState.filters.brand;  // Track the loaded brand
    }
    
    // Bắt đầu với TẤT CẢ sản phẩm
    let filtered = [...listState.allProducts];
    
    console.log(`🔍 Bắt đầu filter/sort từ ${filtered.length} sản phẩm`);
    
    // 1. Price range filter (frontend only)
    if (listState.filters.priceRange !== 'all') {
        const [min, max] = listState.filters.priceRange.split('-').map(v => parseInt(v) * 1000000);
        if (max) {
            filtered = filtered.filter(p => p.price >= min && p.price < max);
        } else {
            filtered = filtered.filter(p => p.price >= min);
        }
        console.log(`  - Lọc giá: còn ${filtered.length} sản phẩm`);
    }
    
    // 2. Sort - Chỉ sort frontend cho price sorts (backend sorts đã được xử lý khi load)
    if (listState.filters.sort && !needsServerReload) {
        console.log(`  - Sắp xếp: ${listState.filters.sort} cho ${filtered.length} sản phẩm`);
        switch (listState.filters.sort) {
            case 'price-asc':
                filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
                console.log(`    ✓ Giá thấp nhất: ${formatCurrency(filtered[0]?.price || 0)}, cao nhất: ${formatCurrency(filtered[filtered.length - 1]?.price || 0)}`);
                break;
            case 'price-desc':
                filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
                console.log(`    ✓ Giá cao nhất: ${formatCurrency(filtered[0]?.price || 0)}, thấp nhất: ${formatCurrency(filtered[filtered.length - 1]?.price || 0)}`);
                break;
            default:
                console.log(`    - Không sắp xếp (giữ nguyên thứ tự)`);
                break;
        }
    } else if (needsServerReload) {
        console.log(`  ✓ Đã sort từ server: ${listState.filters.sort}`);
    }
    
    // 3. Lưu kết quả và reset về trang 1
    listState.displayedProducts = filtered;
    listState.pagination.currentPage = 1;
    listState.pagination.totalPages = Math.ceil(filtered.length / listState.pagination.itemsPerPage);
    
    console.log(`✅ Kết quả: ${filtered.length} sản phẩm, ${listState.pagination.totalPages} trang`);
    
    // 5. Render (sẽ lấy 12 sản phẩm đầu tiên từ kết quả đã sắp xếp)
    renderProducts();
    renderPagination();
    updateProductCount();
}

/**
 * Get paginated products (slice từ displayedProducts đã được sắp xếp)
 */
function getPaginatedProducts() {
    const start = (listState.pagination.currentPage - 1) * listState.pagination.itemsPerPage;
    const end = start + listState.pagination.itemsPerPage;
    const paginated = listState.displayedProducts.slice(start, end);
    
    console.log(`📄 Trang ${listState.pagination.currentPage}/${listState.pagination.totalPages}: Hiển thị ${paginated.length} sản phẩm (${start + 1}-${start + paginated.length})`);
    if (paginated.length > 0) {
        console.log(`   Sản phẩm đầu: ${paginated[0]?.name} - ${formatCurrency(paginated[0]?.price || 0)}`);
        console.log(`   Sản phẩm cuối: ${paginated[paginated.length - 1]?.name} - ${formatCurrency(paginated[paginated.length - 1]?.price || 0)}`);
    }
    
    return paginated;
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render brand filters
 */
function renderBrandFilters() {
    const container = document.getElementById('brandFilters');
    if (!container) {
        console.error('❌ brandFilters container not found in DOM');
        return;
    }
    
    console.log(`🏷️ Rendering ${listState.brands.length} brands`, listState.brands);
    
    const allBtn = `
        <button class="brand-filter-btn active" data-brand="">
            Tất cả
        </button>
    `;

    const brandBtns = listState.brands.map(brand => {
        const key = brand.slug || (brand.name || '').toLowerCase();
        return `
            <button class="brand-filter-btn" data-brand="${key}">
                ${brand.name}
            </button>
        `;
    }).join('');
    
    container.innerHTML = allBtn + brandBtns;
    console.log(`✅ Brand filters rendered successfully`);
}

/**
 * Render star icons for a rating (0-5)
 */
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.5;
    let html = '';
    
    const starSvg = `<svg class="star-icon" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    const halfStarSvg = `<svg class="star-icon half" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="half"><stop offset="50%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#d1d5db"/></linearGradient></defs><path fill="url(#half)" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    const emptyStarSvg = `<svg class="star-icon empty" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    
    for (let i = 0; i < full; i++) html += starSvg;
    if (half) html += halfStarSvg;
    const remaining = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < remaining; i++) html += emptyStarSvg;
    return html;
}

/**
 * Render products grid
 */
function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    const products = getPaginatedProducts();
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">search_off</span>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Vui lòng thử thay đổi bộ lọc</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => {
        const displayRating = product.ratingAverage || product.rating;
        const reviewCount = product.reviewCount || 0;
        
        return `
        <div class="product-card" data-product-id="${product.id}">
            <a href="./product-detail.html?slug=${product.slug}" class="product-link">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        ${product.price > 0 
                            ? `<span class="price">${formatCurrency(product.price)}</span>` 
                            : '<span class="price contact">Liên hệ</span>'}
                    </div>
                    ${displayRating ? `<div class="product-rating">${renderStars(displayRating)} <span class="rating-value">${displayRating.toFixed(1)}</span> <span class="review-count">(${reviewCount})</span></div>` : ''}
                </div>
            </a>
            <button class="btn-add-cart" onclick="handleAddToCart(${product.id})">
                <span class="material-symbols-outlined">shopping_cart</span>
                Thêm vào giỏ
            </button>
        </div>
    `;
    }).join('');
}

/**
 * Render pagination
 */
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const numbersContainer = document.getElementById('paginationNumbers');
    
    if (!pagination) return;
    
    if (listState.pagination.totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Previous button
    prevBtn.disabled = listState.pagination.currentPage === 1;
    
    // Next button
    nextBtn.disabled = listState.pagination.currentPage === listState.pagination.totalPages;
    
    // Page numbers
    const numbers = [];
    const current = listState.pagination.currentPage;
    const total = listState.pagination.totalPages;
    
    // Always show first page
    numbers.push(1);
    
    // Show pages around current
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        if (!numbers.includes(i)) numbers.push(i);
    }
    
    // Always show last page
    if (total > 1 && !numbers.includes(total)) {
        numbers.push(total);
    }
    
    numbersContainer.innerHTML = numbers.map((num, idx) => {
        const prev = numbers[idx - 1];
        const gap = prev && num - prev > 1 ? '<span class="pagination-ellipsis">...</span>' : '';
        return gap + `<button class="pagination-number ${num === current ? 'active' : ''}" data-page="${num}">${num}</button>`;
    }).join('');
}

/**
 * Update product count display
 */
function updateProductCount() {
    const countEl = document.querySelector('.product-count');
    if (countEl) {
        const start = (listState.pagination.currentPage - 1) * listState.pagination.itemsPerPage + 1;
        const end = Math.min(start + listState.pagination.itemsPerPage - 1, listState.displayedProducts.length);
        const total = listState.displayedProducts.length;
        
        if (total === 0) {
            countEl.textContent = 'Không có sản phẩm';
        } else {
            countEl.textContent = `Hiển thị ${start}-${end} trong ${total} sản phẩm`;
        }
    }
}

// ==================== EVENT HANDLERS ====================

/**
 * Handle brand filter click - DON'T reload from server, filter locally
 */
function handleBrandFilter(brand, buttonEl) {
    // Convert empty string to null (for "Tất cả" button)
    const brandValue = brand && brand.length > 0 ? brand : null;
    
    console.log(`🔍 Brand filter clicked: ${brandValue || 'all'}`);
    listState.filters.brand = brandValue;

    // Update UI
    document.querySelectorAll('.brand-filter-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonEl && buttonEl.classList) {
        buttonEl.classList.add('active');
    } else {
        // fallback: mark matching data-brand as active
        document.querySelectorAll('.brand-filter-btn').forEach(btn => {
            if (btn.dataset.brand === (brand || '')) btn.classList.add('active');
        });
    }

    console.log(`📢 Applying filters with brand: ${brandValue || 'all'}`);
    // Apply filters (will reload from server with brand parameter if not null)
    applyFilters();
}

/**
 * Handle price range filter click
 */
function handlePriceRange(range) {
    listState.filters.priceRange = range;
    
    // Update UI
    document.querySelectorAll('.price-range-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.range === range);
    });
    
    applyFilters();
}

/**
 * Handle sort change
 */
async function handleSort(sortValue) {
    listState.filters.sort = sortValue;
    await applyFilters();
}

/**
 * Handle page change
 */
function handlePageChange(page) {
    listState.pagination.currentPage = page;
    renderProducts();
    renderPagination();
    updateProductCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Handle add to cart
 */
window.handleAddToCart = async function(productId) {
    const product = listState.allProducts.find(p => p.id === productId);
    if (!product) return;
    
    try {
        const response = await httpRequest(`${API_BASE_URL}/api/cart/add`, {
            method: 'POST',
            body: JSON.stringify({
                productId: product.id,
                quantity: 1
            })
        });
        
        if (response.success) {
            showToast('✅ Đã thêm vào giỏ hàng', 'success');
            // Update cart badge if exists
            const event = new CustomEvent('cartUpdated');
            window.dispatchEvent(event);
        } else {
            throw new Error(response.message || 'Thêm vào giỏ hàng thất bại');
        }
    } catch (error) {
        console.warn('Add to cart failed:', error);
        showToast('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning');
    }
};

// ==================== INITIALIZATION ====================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Brand filter
    document.getElementById('brandFilters')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.brand-filter-btn');
        if (btn) {
            const brand = btn.dataset.brand; // Could be "" for "Tất cả" or "asus" for ASUS
            handleBrandFilter(brand, btn);
        }
    });
    
    // Price range filter
    document.querySelector('.price-range-options')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.price-range-btn');
        if (btn) {
            handlePriceRange(btn.dataset.range);
        }
    });
    
    // Sort select
    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
        handleSort(e.target.value);
    });
    
    // Pagination
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (listState.pagination.currentPage > 1) {
            handlePageChange(listState.pagination.currentPage - 1);
        }
    });
    
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        if (listState.pagination.currentPage < listState.pagination.totalPages) {
            handlePageChange(listState.pagination.currentPage + 1);
        }
    });
    
    document.getElementById('paginationNumbers')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.pagination-number');
        if (btn) {
            handlePageChange(parseInt(btn.dataset.page));
        }
    });
}

/**
 * Initialize page
 */
async function initShopList() {
    try {
        // Load sidebar categories
        const categories = await fetch(`${API_BASE_URL}/api/categories`)
            .then(r => r.json())
            .catch(() => Object.entries(CATEGORY_NAMES).map(([slug, name]) => ({ id: 1, name, slug })));
        
        // Render sidebar
        const sidebarNav = document.getElementById('sidebarNav');
        if (sidebarNav) {
            sidebarNav.innerHTML = '<h3 style="padding: 0 12px; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">Danh mục sản phẩm</h3>';
            categories.forEach(cat => {
                const link = document.createElement('a');
                link.href = `./shop-list.html?category=${cat.slug}`;
                link.textContent = cat.name;
                link.className = 'sidebar-link';
                if (cat.slug === listState.categorySlug) {
                    link.classList.add('active');
                }
                sidebarNav.appendChild(link);
            });
        }
        
        // Get category from URL
        const urlParams = new URLSearchParams(window.location.search);
        listState.categorySlug = urlParams.get('category') || 'laptop-gaming';
        listState.categoryName = CATEGORY_NAMES[listState.categorySlug] || 'Sản phẩm';
        
        // Update page title
        document.title = `${listState.categoryName} - EzGear`;
        document.getElementById('pageTitle').textContent = listState.categoryName;
        
        // Load category info to get category ID
        const categoryInfo = await loadCategoryInfo(listState.categorySlug);
        const categoryId = categoryInfo ? categoryInfo.id : null;
        
        // Load data in parallel
        const [brands, products] = await Promise.all([
            loadBrandsByCategoryId(categoryId),
            loadProducts(listState.categorySlug)
        ]);
        
        listState.brands = brands;
        listState.allProducts = products;
        listState.displayedProducts = [...products];
        listState.pagination.totalPages = Math.ceil(products.length / listState.pagination.itemsPerPage);
        
        // Render UI
        renderBrandFilters();
        renderProducts();
        renderPagination();
        updateProductCount();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('✅ Shop List initialized successfully');
    } catch (error) {
        console.error('❌ Shop List initialization failed:', error);
        showToast('Không thể tải danh sách sản phẩm', 'error');
    }
}

// ==================== START ====================

// Export for use in HTML
window.initShopList = initShopList;
