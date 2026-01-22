/* ==================== PRODUCT DETAIL PAGE JS ==================== */
/* API Integration for product detail, related products, and reviews */

// ==================== TAILWIND CONFIG ====================
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#D70018",
                secondary: "#E04040",
                "background-light": "#F9FAFB",
                "background-dark": "#111827",
                "surface-light": "#FFFFFF",
                "surface-dark": "#1F2937",
                "text-light": "#1F2937",
                "text-dark": "#F3F4F6",
                "border-light": "#E5E7EB",
                "border-dark": "#374151",
                "accent-blue": "#2563EB",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                sans: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "0.75rem",
                xl: "1rem",
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            }
        },
    },
};

// ==================== STATE MANAGEMENT ====================
let productState = {
    product: null,
    selectedSku: null,
    relatedProducts: [],
    reviews: {
        content: [],
        totalPages: 0,
        totalElements: 0,
        currentPage: 0,
        pageSize: 5
    },
    galleryImages: [],
    currentImageIndex: 0
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get slug from URL
 * URL format: product-detail.html?slug=laptop-dell-xps-15-9530
 */
function getSlugFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('slug');
}

/**
 * Format price to VND
 */
function formatPrice(price) {
    if (!price && price !== 0) return '0₫';
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating, size = 'text-lg') {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += `<span class="material-icons ${size} text-yellow-500">star</span>`;
    }
    if (hasHalfStar) {
        html += `<span class="material-icons ${size} text-yellow-500">star_half</span>`;
    }
    for (let i = 0; i < emptyStars; i++) {
        html += `<span class="material-icons ${size} text-gray-300">star_border</span>`;
    }
    return html;
}

/**
 * Get rating label based on score
 */
function getRatingLabel(rating) {
    if (rating >= 4.5) return 'Tuyệt vời';
    if (rating >= 4) return 'Rất tốt';
    if (rating >= 3) return 'Tốt';
    if (rating >= 2) return 'Bình thường';
    return 'Kém';
}

/**
 * Get first letter of name for avatar
 */
function getAvatarLetter(name) {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
}

/**
 * Get random color for avatar background
 */
function getAvatarColor(name) {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

/**
 * Format date to relative time
 */
function formatRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
}

/**
 * Show toast notification
 */
function showToastNotification(message, type = 'info') {
    // Check if showToast exists from utils.js
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        // Fallback toast
        const toast = document.createElement('div');
        toast.className = `fixed top-5 right-5 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// ==================== API CALLS ====================

/**
 * Fetch product detail by slug
 */
async function fetchProductDetail(slug) {
    try {
        console.log('📦 Fetching product detail for slug:', slug);
        const response = await fetch(`${window.BASE_URL}/api/products/${slug}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Product detail response:', data);
        
        if (data.success && data.payload) {
            return data.payload;
        } else {
            throw new Error(data.message || 'Failed to fetch product detail');
        }
    } catch (error) {
        console.error('❌ Error fetching product detail:', error);
        showToastNotification('Lỗi tải thông tin sản phẩm: ' + error.message, 'error');
        return null;
    }
}

/**
 * Fetch related products
 */
async function fetchRelatedProducts(slug) {
    try {
        console.log('📦 Fetching related products for slug:', slug);
        const response = await fetch(`${window.BASE_URL}/api/products/${slug}/related`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Related products response:', data);
        
        if (data.success && data.payload) {
            return data.payload;
        }
        return [];
    } catch (error) {
        console.error('❌ Error fetching related products:', error);
        return [];
    }
}

/**
 * Fetch reviews with pagination
 */
async function fetchReviews(productId, page = 0, limit = 5) {
    try {
        console.log('📝 Fetching reviews for product:', productId, 'page:', page);
        const response = await fetch(`${window.BASE_URL}/api/reviews/product/${productId}?page=${page}&limit=${limit}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Reviews response:', data);
        
        if (data.success && data.payload) {
            return data.payload;
        }
        return { content: [], totalPages: 0, totalElements: 0 };
    } catch (error) {
        console.error('❌ Error fetching reviews:', error);
        return { content: [], totalPages: 0, totalElements: 0 };
    }
}

/**
 * Add item to cart
 */
async function addToCart(skuId, quantity = 1) {
    try {
        const token = typeof TokenHelper !== 'undefined' ? TokenHelper.getAccessToken() : localStorage.getItem('accessToken');
        
        if (!token) {
            showToastNotification('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'error');
            setTimeout(() => {
                window.location.href = '/modules/auth/auth.html';
            }, 1500);
            return false;
        }
        
        console.log('🛒 Adding to cart - SKU ID:', skuId, 'Quantity:', quantity);
        
        const response = await fetch(`${window.BASE_URL}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                skuId: skuId,
                quantity: quantity
            })
        });
        
        // Handle 403 Forbidden - likely token expired or invalid
        if (response.status === 403) {
            console.warn('⚠️ Cart API returned 403 - token may be invalid or expired');
            showToastNotification('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
            // Clear tokens and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setTimeout(() => {
                window.location.href = '/modules/auth/auth.html';
            }, 1500);
            return false;
        }
        
        // Try to parse response, handle empty body
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } else {
            data = {};
        }
        
        console.log('🛒 Add to cart response:', data);
        
        if (response.ok && (data.success !== false)) {
            showToastNotification('Đã thêm sản phẩm vào giỏ hàng!', 'success');
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
            return true;
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        showToastNotification('Lỗi thêm vào giỏ hàng: ' + error.message, 'error');
        return false;
    }
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render product detail page
 */
function renderProductDetail(product) {
    if (!product) {
        console.error('No product data to render');
        return;
    }
    
    productState.product = product;
    
    // Set page title
    document.title = `EzGear - ${product.name}`;
    
    // Update breadcrumb
    renderBreadcrumb(product);
    
    // Update product title and rating
    renderProductHeader(product);
    
    // Update main image and gallery
    renderGallery(product);
    
    // Update price section
    renderPriceSection(product);
    
    // Update SKU options (versions)
    renderSkuOptions(product);
    
    // Update reviews summary
    renderReviewsSummary(product);
    
    // Set default selected SKU (first available)
    if (product.skus && product.skus.length > 0) {
        const availableSku = product.skus.find(sku => sku.isStockAvailable) || product.skus[0];
        selectSku(availableSku);
    }
}

/**
 * Render breadcrumb navigation
 */
function renderBreadcrumb(product) {
    const breadcrumb = document.querySelector('nav.flex.text-sm');
    if (!breadcrumb) return;
    
    breadcrumb.innerHTML = `
        <a class="hover:text-primary transition-colors" href="/">Trang chủ</a>
        <span class="mx-2">/</span>
        <a class="hover:text-primary transition-colors" href="/modules/product/shop.html">${product.categoryName || 'Sản phẩm'}</a>
        <span class="mx-2">/</span>
        <a class="hover:text-primary transition-colors" href="/modules/product/shop.html?brand=${encodeURIComponent(product.brandName || '')}">${product.brandName || ''}</a>
        <span class="mx-2">/</span>
        <span class="text-gray-800 dark:text-gray-200 font-medium">${product.name}</span>
    `;
}

/**
 * Render product header (title, rating)
 */
function renderProductHeader(product) {
    // Update title
    const titleEl = document.querySelector('h1.text-2xl.md\\:text-3xl');
    if (titleEl) {
        titleEl.textContent = product.name;
    }
    
    // Update rating stars and review count
    const ratingContainer = document.querySelector('.flex.items-center.text-yellow-500');
    if (ratingContainer) {
        const rating = product.ratingAverage || 0;
        const reviewCount = product.reviewCount || 0;
        
        ratingContainer.innerHTML = `
            ${generateStarRating(rating)}
            <span class="ml-1 text-gray-600 dark:text-gray-400 font-semibold text-lg">${rating.toFixed(1)}</span>
            <span class="ml-1 text-gray-500 dark:text-gray-500">(${reviewCount} đánh giá)</span>
        `;
    }
}

/**
 * Render image gallery
 */
function renderGallery(product) {
    // Build gallery images array
    productState.galleryImages = [];
    if (product.imageUrl) {
        productState.galleryImages.push(product.imageUrl);
    }
    if (product.galleryImages && product.galleryImages.length > 0) {
        productState.galleryImages.push(...product.galleryImages);
    }
    
    // Update main image
    const mainImage = document.querySelector('.aspect-\\[4\\/3\\] > img');
    if (mainImage && productState.galleryImages.length > 0) {
        mainImage.src = productState.galleryImages[0];
        mainImage.alt = product.name;
    }
    
    // Update thumbnail gallery
    const galleryContainer = document.querySelector('.overflow-x-auto.custom-scrollbar');
    if (galleryContainer && productState.galleryImages.length > 0) {
        let thumbnailsHTML = '';
        
        productState.galleryImages.forEach((img, index) => {
            const isFirst = index === 0;
            thumbnailsHTML += `
                <button class="gallery-thumb flex-shrink-0 w-16 h-16 ${isFirst ? 'border-2 border-primary ring-1 ring-primary' : 'border border-gray-200 dark:border-gray-700'} rounded-lg overflow-hidden hover:border-primary dark:hover:border-primary transition" data-index="${index}">
                    <img class="w-full h-full object-cover" src="${img}" alt="Gallery ${index + 1}">
                </button>
            `;
        });
        
        galleryContainer.innerHTML = thumbnailsHTML;
        
        // Setup gallery click events
        setupGalleryEvents();
    }
}

/**
 * Setup gallery thumbnail click events
 */
function setupGalleryEvents() {
    const mainImage = document.querySelector('.aspect-\\[4\\/3\\] > img');
    const thumbnails = document.querySelectorAll('.gallery-thumb');
    
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = parseInt(thumb.dataset.index);
            productState.currentImageIndex = index;
            
            if (mainImage && productState.galleryImages[index]) {
                // Fade effect
                mainImage.style.opacity = '0.5';
                setTimeout(() => {
                    mainImage.src = productState.galleryImages[index];
                    mainImage.style.opacity = '1';
                }, 150);
            }
            
            // Update active thumbnail
            thumbnails.forEach(t => {
                t.classList.remove('border-2', 'border-primary', 'ring-1', 'ring-primary');
                t.classList.add('border', 'border-gray-200', 'dark:border-gray-700');
            });
            thumb.classList.remove('border', 'border-gray-200', 'dark:border-gray-700');
            thumb.classList.add('border-2', 'border-primary', 'ring-1', 'ring-primary');
        });
    });
    
    // Gallery navigation buttons
    const navButtons = document.querySelectorAll('.aspect-\\[4\\/3\\] button');
    if (navButtons.length >= 2) {
        // Previous button
        navButtons[0].addEventListener('click', (e) => {
            e.stopPropagation();
            const newIndex = (productState.currentImageIndex - 1 + productState.galleryImages.length) % productState.galleryImages.length;
            const thumb = document.querySelector(`.gallery-thumb[data-index="${newIndex}"]`);
            if (thumb) thumb.click();
        });
        
        // Next button
        navButtons[1].addEventListener('click', (e) => {
            e.stopPropagation();
            const newIndex = (productState.currentImageIndex + 1) % productState.galleryImages.length;
            const thumb = document.querySelector(`.gallery-thumb[data-index="${newIndex}"]`);
            if (thumb) thumb.click();
        });
    }
}

/**
 * Render price section
 */
function renderPriceSection(product) {
    const priceEl = document.querySelector('.text-3xl.font-bold.text-gray-900');
    if (priceEl) {
        // Get the lowest price from SKUs
        let displayPrice = 0;
        if (product.skus && product.skus.length > 0) {
            const availableSkus = product.skus.filter(sku => sku.isStockAvailable);
            if (availableSkus.length > 0) {
                displayPrice = Math.min(...availableSkus.map(sku => sku.price));
            } else {
                displayPrice = product.skus[0].price;
            }
        }
        priceEl.textContent = formatPrice(displayPrice);
    }
}

/**
 * Render SKU options (versions/variants)
 */
function renderSkuOptions(product) {
    if (!product.skus || product.skus.length === 0) return;
    
    // Find version container
    const versionContainer = document.querySelector('.grid.grid-cols-3.gap-3');
    if (!versionContainer) return;
    
    // Determine which SKU should be selected (first available one)
    const selectedSku = product.skus.find(sku => sku.isStockAvailable) || product.skus[0];
    
    let skuHTML = '';
    product.skus.forEach((sku, index) => {
        const isSelected = sku.id === selectedSku.id;
        const isOutOfStock = !sku.isStockAvailable;
        
        skuHTML += `
            <button class="sku-option relative py-3 px-2 border rounded-lg text-sm font-medium transition ${
                isSelected 
                    ? 'border-2 border-primary text-primary bg-red-50 dark:bg-red-900/20 font-bold shadow-sm' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary dark:hover:border-primary'
            } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}"
                data-sku-id="${sku.id}"
                data-price="${sku.price}"
                data-sku-name="${sku.skuName || sku.optionName}"
                data-sku-image="${sku.skuImage || product.imageUrl}"
                data-stock="${sku.isStockAvailable}"
                ${isOutOfStock ? 'disabled' : ''}>
                ${sku.optionName || sku.skuName}
                ${isOutOfStock ? '<span class="block text-xs text-red-500">Hết hàng</span>' : ''}
                ${isSelected ? `
                    <span class="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5">
                        <span class="material-icons text-xs leading-none block">check</span>
                    </span>
                ` : ''}
            </button>
        `;
    });
    
    versionContainer.innerHTML = skuHTML;
    
    // Setup SKU selection events
    setupSkuSelectionEvents();
}

/**
 * Setup SKU selection click events
 */
function setupSkuSelectionEvents() {
    const skuButtons = document.querySelectorAll('.sku-option');
    const priceEl = document.querySelector('.text-3xl.font-bold.text-gray-900');
    
    skuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            
            const skuId = parseInt(btn.dataset.skuId);
            const price = parseInt(btn.dataset.price);
            const skuImage = btn.dataset.skuImage;
            
            // Find and select the SKU
            const sku = productState.product.skus.find(s => s.id === skuId);
            if (sku) {
                selectSku(sku);
            }
            
            // Update price
            if (priceEl) {
                priceEl.style.opacity = '0';
                setTimeout(() => {
                    priceEl.textContent = formatPrice(price);
                    priceEl.style.opacity = '1';
                }, 200);
            }
            
            // Update main image if SKU has specific image
            if (skuImage) {
                const mainImage = document.querySelector('.aspect-\\[4\\/3\\] > img');
                if (mainImage) {
                    mainImage.style.opacity = '0.5';
                    setTimeout(() => {
                        mainImage.src = skuImage;
                        mainImage.style.opacity = '1';
                    }, 150);
                }
            }
            
            // Update button styles
            skuButtons.forEach(b => {
                b.classList.remove('border-2', 'border-primary', 'text-primary', 'bg-red-50', 'dark:bg-red-900/20', 'font-bold', 'shadow-sm');
                b.classList.add('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300');
                // Remove check icon
                const check = b.querySelector('.absolute');
                if (check) check.remove();
            });
            
            btn.classList.remove('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300');
            btn.classList.add('border-2', 'border-primary', 'text-primary', 'bg-red-50', 'dark:bg-red-900/20', 'font-bold', 'shadow-sm');
            
            // Add check icon
            const checkMark = document.createElement('span');
            checkMark.className = 'absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5';
            checkMark.innerHTML = '<span class="material-icons text-xs leading-none block">check</span>';
            btn.appendChild(checkMark);
        });
    });
}

/**
 * Select a SKU
 */
function selectSku(sku) {
    productState.selectedSku = sku;
    console.log('✅ Selected SKU:', sku);
    console.log('📌 productState.selectedSku is now:', productState.selectedSku);
    
    // Dispatch event for Find In Store to listen
    if (sku && sku.id) {
        document.dispatchEvent(new CustomEvent('skuChanged', { 
            detail: { skuId: sku.id } 
        }));
        
        // Update Find In Store immediately if already initialized
        if (FindInStoreState && FindInStoreState.currentSkuId !== sku.id) {
            FindInStoreState.currentSkuId = sku.id;
            console.log('🔄 SKU changed, finding stores for new SKU:', sku.id);
            findStores();
        } else if (!FindInStoreState) {
            // If Find In Store not initialized yet, just update button based on SKU stock
            console.log('📦 Find In Store not initialized, checking SKU stock availability');
            updateBuyButton(sku.isStockAvailable || false);
        }
    }
}

/**
 * Render reviews summary section
 */
function renderReviewsSummary(product) {
    const rating = product.ratingAverage || 0;
    const reviewCount = product.reviewCount || 0;
    
    // Update average rating display
    const avgRatingEl = document.querySelector('#reviews-section .text-5xl');
    if (avgRatingEl) {
        avgRatingEl.innerHTML = `${rating.toFixed(1)}<span class="text-2xl text-gray-500">/5</span>`;
    }
    
    // Update star display in summary
    const summaryStars = document.querySelector('#reviews-section .flex.text-yellow-500.mb-2');
    if (summaryStars) {
        summaryStars.innerHTML = generateStarRating(rating, 'text-xl');
    }
    
    // Update review count text
    const reviewCountEl = document.querySelector('#reviews-section .text-gray-500.text-sm.mb-4');
    if (reviewCountEl) {
        reviewCountEl.textContent = `${reviewCount} lượt đánh giá`;
    }
}

/**
 * Render reviews list
 */
function renderReviews(reviewsData) {
    productState.reviews = {
        ...productState.reviews,
        content: reviewsData.content || [],
        totalPages: reviewsData.totalPages || 0,
        totalElements: reviewsData.totalElements || 0,
        currentPage: reviewsData.number || 0
    };
    
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    
    if (productState.reviews.content.length === 0) {
        reviewsList.innerHTML = `
            <div class="text-center py-10 text-gray-500">
                <span class="material-icons text-5xl mb-4">rate_review</span>
                <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                <p class="text-sm mt-2">Hãy là người đầu tiên đánh giá!</p>
            </div>
        `;
        return;
    }
    
    let reviewsHTML = '';
    productState.reviews.content.forEach(review => {
        const avatarLetter = getAvatarLetter(review.userName);
        const avatarColor = getAvatarColor(review.userName);
        const ratingLabel = getRatingLabel(review.rating);
        
        reviewsHTML += `
            <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        ${review.userAvatar 
                            ? `<img src="${review.userAvatar}" alt="${review.userName}" class="w-full h-full rounded-full object-cover">` 
                            : avatarLetter
                        }
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-medium text-gray-900 dark:text-white">${review.userName || 'Người dùng'}</span>
                            <span class="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Đã mua hàng</span>
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <div class="flex text-yellow-500">
                                ${generateStarRating(review.rating, 'text-sm')}
                            </div>
                            <span class="text-sm ${review.rating >= 4 ? 'text-green-600' : review.rating >= 3 ? 'text-yellow-600' : 'text-red-600'} font-medium">
                                ${ratingLabel}
                            </span>
                        </div>
                        ${review.comment ? `
                            <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                ${review.comment}
                            </p>
                        ` : ''}
                        ${review.imageUrls && review.imageUrls.length > 0 ? `
                            <div class="flex gap-2 mb-3 flex-wrap">
                                ${review.imageUrls.map(img => `
                                    <img src="${img}" alt="Review image" class="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition" onclick="openImageModal('${img}')">
                                `).join('')}
                            </div>
                        ` : ''}
                        ${review.shopResponse ? `
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="material-icons text-primary text-sm">store</span>
                                    <span class="font-medium text-sm text-primary">EzGear phản hồi</span>
                                    <span class="text-xs text-gray-500">${formatRelativeTime(review.shopResponseAt)}</span>
                                </div>
                                <p class="text-gray-600 dark:text-gray-400 text-sm">${review.shopResponse}</p>
                            </div>
                        ` : ''}
                        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                            <span class="material-icons-outlined text-sm mr-1">schedule</span>
                            Đánh giá đã đăng vào ${formatRelativeTime(review.createdAt)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    reviewsList.innerHTML = reviewsHTML;
    
    // Update "Load more" button visibility
    updateLoadMoreButton();
}

/**
 * Update load more reviews button
 */
function updateLoadMoreButton() {
    const loadMoreBtn = document.querySelector('#reviews-section .mt-6.text-center button');
    if (loadMoreBtn) {
        if (productState.reviews.currentPage + 1 >= productState.reviews.totalPages) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
            loadMoreBtn.textContent = `Xem thêm đánh giá (${productState.reviews.totalElements - productState.reviews.content.length} còn lại)`;
        }
    }
}

/**
 * Render related products section
 */
function renderRelatedProducts(products) {
    if (!products || products.length === 0) return;
    
    productState.relatedProducts = products;
    
    // Find the related products grid
    const relatedGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4.gap-4');
    if (!relatedGrid) return;
    
    let productsHTML = '';
    products.forEach(product => {
        productsHTML += `
            <a href="product-detail.html?slug=${product.slug}" class="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-soft hover:shadow-lg transition group relative overflow-hidden">
                <div class="p-4">
                    <div class="aspect-[4/3] flex items-center justify-center mb-4 overflow-hidden">
                        <img alt="${product.name}" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" src="${product.imageUrl || '/assets/img/placeholder.png'}"/>
                    </div>
                    <div class="text-red-600 dark:text-red-400 text-xl font-bold italic mb-1">${formatPrice(product.price)}</div>
                    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2 hover:text-primary dark:hover:text-primary cursor-pointer transition">
                        ${product.name}
                    </h3>
                </div>
            </a>
        `;
    });
    
    relatedGrid.innerHTML = productsHTML;
    
    // Update section title
    const sectionTitle = document.querySelector('.bg-primary.text-white.font-bold.text-lg');
    if (sectionTitle) {
        sectionTitle.textContent = 'SẢN PHẨM CÙNG SERIES';
    }
}

/**
 * Render related products in "Sản phẩm cùng nhóm" section
 */
function renderGroupedProducts(products) {
    if (!products || products.length === 0) return;
    
    // Find the grouped products section - look for the h4 with specific text
    const h4Elements = document.querySelectorAll('h4.font-bold.mb-3');
    let groupedContainer = null;
    
    h4Elements.forEach(h4 => {
        if (h4.textContent.includes('Sản phẩm cùng nhóm')) {
            groupedContainer = h4.nextElementSibling;
        }
    });
    
    if (!groupedContainer) return;
    
    let productsHTML = '';
    products.forEach((product, index) => {
        const isCurrent = product.isCurrent || false;
        
        productsHTML += `
            <label class="cursor-pointer" ${!isCurrent ? `onclick="window.location.href='product-detail.html?slug=${product.slug}'"` : ''}>
                <input ${isCurrent ? 'checked' : ''} class="peer sr-only" name="grouped_product" type="radio"/>
                <div class="h-full relative p-3 border rounded-lg bg-surface-light dark:bg-surface-dark ${isCurrent ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 peer-checked:border-red-500 peer-checked:ring-1 peer-checked:ring-red-500 hover:border-gray-300 dark:hover:border-gray-600'} transition group flex flex-col justify-between">
                    <div>
                        <div class="flex items-start gap-2 mb-1">
                            ${isCurrent 
                                ? '<span class="material-icons text-green-500 text-base leading-none mt-0.5">check_circle</span>'
                                : '<div class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 mt-0.5 flex-shrink-0"></div>'
                            }
                            <div class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">${product.name}</div>
                        </div>
                    </div>
                    <div class="mt-2 text-center text-primary font-bold text-base">${formatPrice(product.price)}</div>
                </div>
            </label>
        `;
    });
    
    groupedContainer.innerHTML = productsHTML;
}

/**
 * Open image in modal
 */
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `
        <img src="${imageUrl}" class="max-w-full max-h-full object-contain rounded-lg" onclick="event.stopPropagation()">
        <button class="absolute top-4 right-4 text-white hover:text-gray-300 transition" onclick="this.parentElement.remove()">
            <span class="material-icons text-3xl">close</span>
        </button>
    `;
    document.body.appendChild(modal);
}

// Make it globally available
window.openImageModal = openImageModal;

// ==================== ACTION HANDLERS ====================

/**
 * Handle Add to Cart button click
 */
window.handleAddToCart = async function() {
    console.log('🛒 Add to Cart clicked');
    console.log('📌 Current selectedSku:', productState.selectedSku);
    
    if (!productState.selectedSku) {
        showToastNotification('Vui lòng chọn phiên bản sản phẩm', 'error');
        return;
    }
    
    if (!productState.selectedSku.isStockAvailable) {
        showToastNotification('Sản phẩm đã hết hàng', 'error');
        return;
    }
    
    await addToCart(productState.selectedSku.id, 1);
};

/**
 * Handle Buy Now button click
 */
window.handleBuyNow = async function() {
    console.log('🛍️ Buy Now clicked');
    console.log('📌 Current selectedSku:', productState.selectedSku);
    
    if (!productState.selectedSku) {
        showToastNotification('Vui lòng chọn phiên bản sản phẩm', 'error');
        return;
    }
    
    if (!productState.selectedSku.isStockAvailable) {
        showToastNotification('Sản phẩm đã hết hàng', 'error');
        return;
    }
    
    // Add to cart first
    const success = await addToCart(productState.selectedSku.id, 1);
    
    if (success) {
        // Redirect to checkout
        window.location.href = '/modules/checkout/checkout.html';
    }
};

/**
 * Setup action buttons (Add to cart, Buy now, etc.)
 */
function setupActionButtons() {
    // Add to Cart button - find by class and text content
    const allButtons = document.querySelectorAll('button');
    
    allButtons.forEach(btn => {
        const btnText = btn.textContent || '';
        
        // Favorite button
        if (btnText.includes('Yêu thích')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const icon = this.querySelector('.material-icons-outlined');
                if (icon) {
                    if (icon.innerText === 'favorite_border') {
                        icon.innerText = 'favorite';
                        icon.classList.add('text-red-500');
                        this.classList.add('text-red-500');
                        showToastNotification('Đã thêm vào danh sách yêu thích', 'success');
                    } else {
                        icon.innerText = 'favorite_border';
                        icon.classList.remove('text-red-500');
                        this.classList.remove('text-red-500');
                        showToastNotification('Đã xóa khỏi danh sách yêu thích', 'info');
                    }
                }
            });
        }
    });
    
    // Write review button
    const writeReviewBtn = document.querySelector('#reviews-section button.bg-primary');
    if (writeReviewBtn && writeReviewBtn.textContent.includes('Viết đánh giá')) {
        writeReviewBtn.addEventListener('click', () => {
            const isLoggedIn = typeof TokenHelper !== 'undefined' ? TokenHelper.isLoggedIn() : !!localStorage.getItem('accessToken');
            
            if (!isLoggedIn) {
                showToastNotification('Vui lòng đăng nhập để viết đánh giá', 'error');
                setTimeout(() => {
                    window.location.href = '/modules/auth/auth.html';
                }, 1500);
                return;
            }
            
            showToastNotification('Chức năng viết đánh giá đang được phát triển', 'info');
        });
    }
    
    // Load more reviews button
    const loadMoreBtn = document.querySelector('#reviews-section .mt-6.text-center button');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async () => {
            if (!productState.product) return;
            
            const nextPage = productState.reviews.currentPage + 1;
            if (nextPage >= productState.reviews.totalPages) return;
            
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<span class="material-icons animate-spin">refresh</span> Đang tải...';
            
            const newReviews = await fetchReviews(productState.product.id, nextPage, productState.reviews.pageSize);
            
            if (newReviews.content && newReviews.content.length > 0) {
                productState.reviews.content.push(...newReviews.content);
                productState.reviews.currentPage = newReviews.number;
                
                renderReviews({
                    ...newReviews,
                    content: productState.reviews.content
                });
            }
            
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = 'Xem thêm đánh giá';
        });
    }
}

/**
 * Setup review filter buttons
 */
function setupReviewFilters() {
    const filterBtns = document.querySelectorAll('.review-filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-primary', 'text-white', 'border-primary');
                b.classList.add('border-gray-300', 'dark:border-gray-600', 'text-gray-700', 'dark:text-gray-300');
            });
            btn.classList.add('active', 'bg-primary', 'text-white', 'border-primary');
            btn.classList.remove('border-gray-300', 'dark:border-gray-600', 'text-gray-700', 'dark:text-gray-300');
            
            const filterText = btn.textContent.trim();
            if (filterText !== 'Tất cả') {
                showToastNotification(`Đang lọc: ${filterText}`, 'info');
            }
        });
    });
}

/**
 * Setup address selector
 */
function setupAddressSelector() {
    const selects = document.querySelectorAll('select');
    selects.forEach(sel => {
        sel.addEventListener('change', (e) => {
            console.log('Đã chọn:', e.target.value);
        });
    });
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the product detail page
 */
async function initProductDetailPage() {
    console.log('🚀 Initializing product detail page...');
    
    // Get slug from URL
    const slug = getSlugFromURL();
    
    if (!slug) {
        showToastNotification('Không tìm thấy sản phẩm. Đang chuyển hướng...', 'error');
        setTimeout(() => {
            window.location.href = '/modules/product/shop.html';
        }, 2000);
        return;
    }
    
    console.log('📌 Product slug:', slug);
    
    // Fetch all data in parallel
    const [product, relatedProducts] = await Promise.all([
        fetchProductDetail(slug),
        fetchRelatedProducts(slug)
    ]);
    
    if (!product) {
        showToastNotification('Không tìm thấy sản phẩm', 'error');
        return;
    }
    
    // Render product detail
    renderProductDetail(product);
    
    // Render related products
    if (relatedProducts && relatedProducts.length > 0) {
        renderRelatedProducts(relatedProducts);
        
        // Calculate base price for current product
        let currentPrice = product.price || 0;
        if (product.skus && product.skus.length > 0) {
            const availableSkus = product.skus.filter(sku => sku.isStockAvailable);
            if (availableSkus.length > 0) {
                currentPrice = Math.min(...availableSkus.map(sku => sku.price));
            } else {
                currentPrice = product.skus[0].price;
            }
        }
        
        // Add current product to grouped products list
        const currentProductItem = {
            ...product,
            price: currentPrice,
            isCurrent: true
        };
        
        renderGroupedProducts([currentProductItem, ...relatedProducts]);
    }
    
    // Fetch and render reviews
    const reviews = await fetchReviews(product.id, 0, productState.reviews.pageSize);
    renderReviews(reviews);
    
    // Setup action buttons
    setupActionButtons();
    
    // Setup review filters
    setupReviewFilters();
    
    // Setup address selector
    setupAddressSelector();
    
    // Initialize Find In Store
    initFindInStore();
    
    console.log('✅ Product detail page initialized successfully');
}

// ==================== FIND IN STORE LOGIC ====================

const FindInStoreState = {
    provinces: [],
    districts: [],
    stores: [],
    selectedProvinceId: null,
    selectedDistrictId: null,
    currentSkuId: null
};

/**
 * Initialize Find In Store functionality
 */
async function initFindInStore() {
    console.log('🏪 Initializing Find In Store...');
    
    // Get current SKU ID from productState
    FindInStoreState.currentSkuId = productState.selectedSku?.id || null;
    
    if (!FindInStoreState.currentSkuId) {
        console.warn('⚠️ No SKU selected, waiting for SKU selection');
        // Disable buy button until SKU is selected
        updateBuyButton(false);
        // Listen for SKU changes
        document.addEventListener('skuChanged', (e) => {
            FindInStoreState.currentSkuId = e.detail.skuId;
            loadProvinces();
        });
        return;
    }
    
    // Load provinces and initial stores
    await loadProvinces();
    
    // Sync with header location if available
    syncWithHeaderLocation();
    
    await findStores();
    
    // Setup event listeners
    setupFindInStoreListeners();
    
    // Listen for location changes from header
    window.addEventListener('locationChanged', (e) => {
        if (e.detail && e.detail.id) {
            selectProvince(e.detail.id, e.detail.name);
        }
    });
}

/**
 * Sync with header location selection
 */
function syncWithHeaderLocation() {
    try {
        const savedLoc = localStorage.getItem('selectedLocation');
        if (savedLoc) {
            const parsed = JSON.parse(savedLoc);
            if (parsed && parsed.id && parsed.name) {
                // Update UI without triggering API calls yet
                FindInStoreState.selectedProvinceId = parsed.id;
                document.getElementById('selectedProvinceName').textContent = parsed.name;
                
                // Enable district button
                const districtBtn = document.getElementById('districtSelectBtn');
                if (districtBtn) districtBtn.disabled = false;
                
                // Load districts for this province
                loadDistricts(parsed.id);
                
                console.log('✅ Synced with header location:', parsed.name);
            }
        }
    } catch (error) {
        console.error('❌ Error syncing with header location:', error);
    }
}

/**
 * Load provinces from API
 */
async function loadProvinces() {
    try {
        console.log('📍 Loading provinces...');
        
        const token = typeof TokenHelper !== 'undefined' ? TokenHelper.getAccessToken() : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`${window.BASE_URL}/api/locations`, { headers });
        
        if (!response.ok) throw new Error('Failed to fetch provinces');
        
        const data = await response.json();
        FindInStoreState.provinces = Array.isArray(data) ? data : (data.payload || []);
        
        console.log('✅ Provinces loaded:', FindInStoreState.provinces.length);
    } catch (error) {
        console.error('❌ Error loading provinces:', error);
        // Fallback data
        FindInStoreState.provinces = [
            { id: 201, name: 'Hà Nội' },
            { id: 202, name: 'Hồ Chí Minh' },
            { id: 203, name: 'Đà Nẵng' }
        ];
    }
}

/**
 * Load districts for selected province
 */
async function loadDistricts(provinceId) {
    if (!provinceId) {
        FindInStoreState.districts = [];
        const districtBtn = document.getElementById('districtSelectBtn');
        if (districtBtn) districtBtn.disabled = true;
        return;
    }
    
    try {
        console.log('📍 Loading districts for province:', provinceId);
        
        const token = typeof TokenHelper !== 'undefined' ? TokenHelper.getAccessToken() : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(
            `${window.BASE_URL}/api/locations/districts?provinceId=${provinceId}`,
            { headers }
        );
        
        if (!response.ok) throw new Error('Failed to fetch districts');
        
        const data = await response.json();
        FindInStoreState.districts = Array.isArray(data) ? data : (data.payload || []);
        
        // Enable district button
        const districtBtn = document.getElementById('districtSelectBtn');
        if (districtBtn) {
            districtBtn.disabled = FindInStoreState.districts.length === 0;
        }
        
        console.log('✅ Districts loaded:', FindInStoreState.districts.length);
    } catch (error) {
        console.error('❌ Error loading districts:', error);
        FindInStoreState.districts = [];
        const districtBtn = document.getElementById('districtSelectBtn');
        if (districtBtn) districtBtn.disabled = true;
    }
}

/**
 * Find stores based on selected location
 */
async function findStores() {
    if (!FindInStoreState.currentSkuId) {
        console.warn('⚠️ No SKU ID available for finding stores');
        // Still update button to disabled state when no SKU
        updateBuyButton(false);
        return;
    }
    
    try {
        console.log('🔍 Finding stores...', {
            skuId: FindInStoreState.currentSkuId,
            provinceId: FindInStoreState.selectedProvinceId,
            districtId: FindInStoreState.selectedDistrictId
        });
        
        const token = typeof TokenHelper !== 'undefined' ? TokenHelper.getAccessToken() : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        // Build query params
        const params = new URLSearchParams({
            skuId: FindInStoreState.currentSkuId
        });
        
        if (FindInStoreState.selectedProvinceId) {
            params.append('provinceId', FindInStoreState.selectedProvinceId);
        }
        
        if (FindInStoreState.selectedDistrictId) {
            params.append('districtId', FindInStoreState.selectedDistrictId);
        }
        
        const response = await fetch(
            `${window.BASE_URL}/api/stocks/public/locations?${params}`,
            { headers }
        );
        
        if (!response.ok) throw new Error('Failed to fetch stores');
        
        const data = await response.json();
        
        if (data.success && data.payload) {
            FindInStoreState.stores = Array.isArray(data.payload) ? data.payload : [];
        } else {
            FindInStoreState.stores = [];
        }
        
        renderStoreList();
        
        console.log('✅ Stores found:', FindInStoreState.stores.length);
    } catch (error) {
        console.error('❌ Error finding stores:', error);
        FindInStoreState.stores = [];
        renderStoreList();
    }
}

/**
 * Open province modal
 */
window.openProvinceModal = function() {
    const modal = document.getElementById('provinceModal');
    if (modal) {
        modal.classList.add('show');
        renderProvinceList(FindInStoreState.provinces);
        document.getElementById('provinceSearchInput').value = '';
        document.getElementById('provinceSearchInput').focus();
    }
};

/**
 * Close province modal
 */
window.closeProvinceModal = function() {
    const modal = document.getElementById('provinceModal');
    if (modal) modal.classList.remove('show');
};

/**
 * Open district modal
 */
window.openDistrictModal = function() {
    if (FindInStoreState.districts.length === 0) return;
    
    const modal = document.getElementById('districtModal');
    if (modal) {
        modal.classList.add('show');
        renderDistrictList(FindInStoreState.districts);
        document.getElementById('districtSearchInput').value = '';
        document.getElementById('districtSearchInput').focus();
        
        // Show/hide clear button based on selection
        const clearBtn = document.getElementById('clearDistrictBtn');
        if (clearBtn) {
            if (FindInStoreState.selectedDistrictId) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
        }
    }
};

/**
 * Close district modal
 */
window.closeDistrictModal = function() {
    const modal = document.getElementById('districtModal');
    if (modal) modal.classList.remove('show');
};

/**
 * Clear district selection
 */
window.clearDistrictSelection = function() {
    FindInStoreState.selectedDistrictId = null;
    
    // Reset UI
    document.getElementById('selectedDistrictName').textContent = 'Chọn Quận/Huyện';
    
    // Hide clear button
    const clearBtn = document.getElementById('clearDistrictBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    
    // Find stores with only province filter
    findStores();
    
    // Close modal
    closeDistrictModal();
};


/**
 * Handle province search
 */
window.handleProvinceSearch = function() {
    const input = document.getElementById('provinceSearchInput');
    const filter = input.value.toLowerCase();
    const filtered = FindInStoreState.provinces.filter(p => 
        p.name.toLowerCase().includes(filter)
    );
    renderProvinceList(filtered);
};

/**
 * Handle district search
 */
window.handleDistrictSearch = function() {
    const input = document.getElementById('districtSearchInput');
    const filter = input.value.toLowerCase();
    const filtered = FindInStoreState.districts.filter(d => 
        d.name.toLowerCase().includes(filter)
    );
    renderDistrictList(filtered);
};

/**
 * Select province
 */
window.selectProvince = function(id, name) {
    FindInStoreState.selectedProvinceId = id;
    FindInStoreState.selectedDistrictId = null;
    
    // Update UI
    document.getElementById('selectedProvinceName').textContent = name;
    document.getElementById('selectedDistrictName').textContent = 'Chọn Quận/Huyện';
    
    // Enable district button
    const districtBtn = document.getElementById('districtSelectBtn');
    if (districtBtn) districtBtn.disabled = false;
    
    closeProvinceModal();
    
    // Save to localStorage (sync with header)
    const locationObj = { id, name };
    localStorage.setItem('selectedLocation', JSON.stringify(locationObj));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('locationChanged', { detail: locationObj }));
    
    // Load districts and find stores
    loadDistricts(id).then(() => findStores());
};

/**
 * Select district
 */
window.selectDistrict = function(id, name) {
    FindInStoreState.selectedDistrictId = id;
    
    // Update UI
    document.getElementById('selectedDistrictName').textContent = name;
    
    closeDistrictModal();
    
    // Find stores
    findStores();
};

/**
 * Render province list
 */
function renderProvinceList(provinces) {
    const list = document.getElementById('provinceList');
    if (!list) return;
    
    const currentId = FindInStoreState.selectedProvinceId;
    
    if (provinces.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #6b7280;">Không tìm thấy kết quả</div>';
        return;
    }
    
    list.innerHTML = provinces.map(p => `
        <div class="location-item ${p.id === currentId ? 'selected' : ''}" onclick="selectProvince(${p.id}, '${p.name}')">
            <span>${p.name}</span>
            <i class="fas fa-check"></i>
        </div>
    `).join('');
}

/**
 * Render district list
 */
function renderDistrictList(districts) {
    const list = document.getElementById('districtList');
    if (!list) return;
    
    const currentId = FindInStoreState.selectedDistrictId;
    
    if (districts.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #6b7280;">Không tìm thấy kết quả</div>';
        return;
    }
    
    list.innerHTML = districts.map(d => `
        <div class="location-item ${d.id === currentId ? 'selected' : ''}" onclick="selectDistrict(${d.id}, '${d.name}')">
            <span>${d.name}</span>
            <i class="fas fa-check"></i>
        </div>
    `).join('');
}

/**
 * Render store list
 */
function renderStoreList() {
    const storeCards = document.getElementById('storeCards');
    const storeList = document.getElementById('storeList');
    const storeEmpty = document.getElementById('storeEmpty');
    const storeCount = document.getElementById('storeCount');
    
    if (!storeCards || !storeList || !storeEmpty || !storeCount) return;
    
    // Update count
    storeCount.textContent = FindInStoreState.stores.length;
    
    if (FindInStoreState.stores.length === 0) {
        storeList.classList.add('hidden');
        storeEmpty.classList.remove('hidden');
        // No stores found = no stock
        console.log('⚠️ No stores found - disabling buy button');
        updateBuyButton(false);
        return;
    }
    
    storeList.classList.remove('hidden');
    storeEmpty.classList.add('hidden');
    
    // Check if any store has stock
    const hasStock = FindInStoreState.stores.some(store => store.quantity > 0);
    console.log('📍 Stock check:', {
        storesFound: FindInStoreState.stores.length,
        hasStock: hasStock,
        stores: FindInStoreState.stores.map(s => ({ name: s.branchName, qty: s.quantity }))
    });
    
    updateBuyButton(hasStock);
    
    storeCards.innerHTML = FindInStoreState.stores.map(store => {
        const stockClass = store.quantity > 10 ? 'in-stock' : 'low-stock';
        const stockText = store.quantity > 10 
            ? `Còn ${store.quantity} sản phẩm` 
            : `Chỉ còn ${store.quantity} sản phẩm`;
        
        return `
            <div class="store-card">
                <div class="store-card-name">${store.branchName || 'Chi nhánh'}</div>
                <div class="store-card-address">${store.fullAddress || 'Địa chỉ không có'}</div>
                <div class="store-stock-badge ${stockClass}">
                    <span class="material-icons text-[10px] mr-1">inventory_2</span>
                    ${stockText}
                </div>
                <div class="store-card-actions">
                    ${store.phone ? `
                        <a href="tel:${store.phone}" class="store-phone-btn">
                            <span class="material-icons text-[10px]">call</span> ${store.phone}
                        </a>
                    ` : ''}
                    ${store.mapUrl ? `
                        <a href="${store.mapUrl}" target="_blank" rel="noopener noreferrer" class="store-map-btn">
                            <span class="material-icons text-[10px]">map</span> Bản đồ
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update buy button based on stock availability
 */
function updateBuyButton(hasStock) {
    console.log('🔘 updateBuyButton called with hasStock:', hasStock);
    
    // Find all potential buy buttons
    const buyButtons = [
        // Try by class first
        ...document.querySelectorAll('.bg-gradient-to-r.from-red-600'),
        // Then by text content
        ...Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent.trim().toUpperCase();
            return text.includes('MUA NGAY') || text.includes('TẠM HẾT HÀNG');
        })
    ];
    
    console.log('🔍 Found buy buttons:', buyButtons.length);
    
    if (buyButtons.length === 0) {
        console.warn('⚠️ Buy button not found - will try again in 500ms');
        // Retry after a short delay in case button hasn't rendered yet
        setTimeout(() => {
            const retryButtons = [
                ...document.querySelectorAll('.bg-gradient-to-r.from-red-600'),
                ...Array.from(document.querySelectorAll('button')).filter(btn => {
                    const text = btn.textContent.trim().toUpperCase();
                    return text.includes('MUA NGAY') || text.includes('TẠM HẾT HÀNG');
                })
            ];
            if (retryButtons.length > 0) {
                console.log('✅ Found buy buttons on retry:', retryButtons.length);
                updateButtonState(retryButtons, hasStock);
            } else {
                console.error('❌ Buy button still not found after retry');
            }
        }, 500);
        return;
    }
    
    updateButtonState(buyButtons, hasStock);
}

/**
 * Update button state helper
 */
function updateButtonState(buyButtons, hasStock) {
    // Update all buy buttons found
    buyButtons.forEach(buyButton => {
        if (!hasStock) {
            // Disable and change text to "Tạm Hết Hàng"
            buyButton.disabled = true;
            buyButton.classList.add('opacity-60', 'cursor-not-allowed');
            buyButton.classList.remove('hover:from-red-500', 'hover:to-red-400', 'active:scale-95');
            buyButton.style.pointerEvents = 'none';
            
            // Find the text element inside button
            const textSpan = buyButton.querySelector('.text-lg, .font-bold, span');
            if (textSpan) {
                textSpan.textContent = 'TẠM HẾT HÀNG';
            } else {
                // If no span found, change button text directly
                const textNode = Array.from(buyButton.childNodes).find(node => 
                    node.nodeType === Node.TEXT_NODE || node.nodeName === 'SPAN'
                );
                if (textNode) {
                    if (textNode.nodeType === Node.TEXT_NODE) {
                        textNode.textContent = 'TẠM HẾT HÀNG';
                    } else {
                        textNode.textContent = 'TẠM HẾT HÀNG';
                    }
                }
            }
            
            console.log('❌ Buy button disabled - No stock available');
        } else {
            // Enable and restore text
            buyButton.disabled = false;
            buyButton.classList.remove('opacity-60', 'cursor-not-allowed');
            buyButton.classList.add('hover:from-red-500', 'hover:to-red-400', 'active:scale-95');
            buyButton.style.pointerEvents = '';
            
            const textSpan = buyButton.querySelector('.text-lg, .font-bold, span');
            if (textSpan && textSpan.textContent.includes('HẾT HÀNG')) {
                textSpan.textContent = 'MUA NGAY';
            } else if (textSpan) {
                const textNode = Array.from(buyButton.childNodes).find(node => 
                    node.nodeType === Node.TEXT_NODE || node.nodeName === 'SPAN'
                );
                if (textNode && textNode.textContent.includes('HẾT HÀNG')) {
                    if (textNode.nodeType === Node.TEXT_NODE) {
                        textNode.textContent = 'MUA NGAY';
                    } else {
                        textNode.textContent = 'MUA NGAY';
                    }
                }
            }
            
            console.log('✅ Buy button enabled - Stock available');
        }
    });
}

/**
 * Setup event listeners for Find In Store
 */
function setupFindInStoreListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        const provinceModal = document.getElementById('provinceModal');
        const districtModal = document.getElementById('districtModal');
        
        if (e.target === provinceModal) {
            closeProvinceModal();
        }
        if (e.target === districtModal) {
            closeDistrictModal();
        }
    });
    
    console.log('✅ Find In Store listeners setup complete');
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize page
    initProductDetailPage();
});

