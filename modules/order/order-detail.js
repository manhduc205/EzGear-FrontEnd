/* ==================== ORDER DETAIL MODULE JS ==================== */

// State
let orderDetailState = {
    order: null,
    isLoading: false
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert base64 string to File object
 */
function base64ToFile(base64String, filename) {
    // Extract base64 data and mime type
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Order-detail.js DOMContentLoaded');
    console.log('📍 window.API_BASE_URL:', window.API_BASE_URL);
    console.log('📍 TokenHelper available:', typeof TokenHelper !== 'undefined');
    initOrderDetailPage();
    initHeaderUser();

    const refreshBtn = document.getElementById('refreshShipmentBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (orderDetailState.order) {
                loadShipmentHistory(orderDetailState.order);
            }
        });
    }
});

function initHeaderUser() {
    const userInfo = TokenHelper.getUserInfo();
    if (userInfo) {
        const usernameDisplay = document.getElementById('usernameDisplay');
        const sidebarName = document.getElementById('sidebarName');
        
        if (usernameDisplay) usernameDisplay.textContent = userInfo.username;
        if (sidebarName) sidebarName.textContent = userInfo.username;
    } else {
        // Redirect if not logged in
        window.location.href = '../auth/auth.html';
    }
}

// ==================== DETAIL PAGE LOGIC ====================
function initOrderDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get('orderCode');
    
    console.log('📋 URL Params:', window.location.search);
    console.log('📋 Order Code from URL:', orderCode);
    
    if (!orderCode) {
        console.error('❌ No orderCode in URL');
        alert('Không tìm thấy mã đơn hàng');
        window.location.href = './order.html';
        return;
    }
    
    console.log('✅ Loading order detail for:', orderCode);
    loadOrderDetail(orderCode);
}

async function loadOrderDetail(orderCode) {
    console.log('🔄 loadOrderDetail() called with:', orderCode);
    showLoading(true);
    try {
        if (!TokenHelper.isLoggedIn()) {
            console.error('❌ User not logged in');
            window.location.href = '../auth/auth.html';
            return;
        }

        // Call API to get order detail
        const baseUrl = window.API_BASE_URL || 'http://localhost:8080';
        const url = `${baseUrl}/api/orders/${orderCode}`;
        
        console.log('🌐 Fetching order detail from:', url);
        console.log('🔑 Token exists:', !!TokenHelper.getAccessToken());
        
        const response = await httpRequest(url, { method: 'GET' });
        console.log('📥 Response received:', response);
        console.log('📥 Response type:', typeof response);
        
        // Handle response structure
        let order = null;
        if (response.payload) {
            console.log('✅ Using response.payload');
            order = response.payload;
        } else if (response.data) {
            console.log('✅ Using response.data');
            order = response.data;
        } else {
            console.log('✅ Using response directly');
            order = response;
        }
        
        console.log('📦 Final order object:', order);
        
        if (!order) {
            console.error('❌ Order is null/undefined');
            throw new Error('Order not found');
        }
        
        orderDetailState.order = order;
        console.log('💾 Order saved to state');
        
        console.log('🎨 Rendering order detail...');
        renderOrderDetail(order);
        checkAndShowActions(order);
        
    } catch (error) {
        console.error('❌ Error loading order detail:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        showLoading(false);
        
        // Show detailed error message
        let errorMsg = 'Không thể tải chi tiết đơn hàng';
        
        if (error.message === 'Lỗi hệ thống' || error.message.includes('SERVER_ERROR')) {
            errorMsg = `
⚠️ Lỗi từ server khi tải đơn hàng

Có thể do:
- Đơn hàng không tồn tại
- Server đang gặp sự cố
- Dữ liệu đơn hàng bị lỗi

Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
            `.trim();
        } else {
            errorMsg = error.message || errorMsg;
        }
        
        console.log('🚨 Showing error to user:', errorMsg);
        alert(errorMsg);
        
        // Redirect back to order list after 2 seconds
        console.log('🔙 Redirecting to order list in 2s...');
        setTimeout(() => {
            window.location.href = './order.html';
        }, 2000);
    } finally {
        showLoading(false);
    }
}

function renderOrderDetail(order) {
    // 1. Basic Info
    document.getElementById('orderIdDisplay').textContent = '#' + order.orderCode;
    document.getElementById('orderStatusText').textContent = getStatusLabel(order.status);
    document.getElementById('createdAtText').textContent = formatDate(order.createdAt);
    
    const statusTextElement = document.getElementById('orderStatusText');
    statusTextElement.className = `badge bg-light text-dark border text-uppercase fw-bold ${getStatusClass(order.status)}`;
    
    // 2. Update Stepper
    updateStepper(order);
    
    // 3. Shipping Address
    renderShippingAddress(order);
    
    // 4. Order Items
    renderOrderItems(order.items || []);
    
    // 5. Payment Summary
    renderPaymentSummary(order);
}

function updateStepper(order) {
    // Reset all steps
    const steps = {
        'placed': document.getElementById('step-placed'),
        'confirmed': document.getElementById('step-confirmed'),
        'shipping': document.getElementById('step-shipping'),
        'completed': document.getElementById('step-completed'),
        'rated': document.getElementById('step-rated')
    };

    Object.values(steps).forEach(step => {
        if(step) {
            step.classList.remove('active', 'completed');
            // Reset date
            const dateEl = step.querySelector('.step-date');
            if(dateEl) dateEl.textContent = '...';
        }
    });

    // Set dates if available
    if (order.createdAt) {
        document.getElementById('dateCreated').textContent = formatDate(order.createdAt);
        steps.placed.classList.add('completed');
    }

    // Determine active step based on status
    const status = order.status;
    
    // Logic flow: placed -> confirmed -> shipping -> completed -> rated
    if (status === 'WAITING_PAYMENT' || status === 'PENDING_CONFIRMATION') {
        steps.placed.classList.add('active');
    } 
    else if (status === 'PENDING_SHIPMENT' || status === 'CONFIRMED') {
        steps.placed.classList.add('completed');
        steps.confirmed.classList.add('active');
    }
    else if (status === 'SHIPPING' || status === 'PENDING_DELIVERY') {
        steps.placed.classList.add('completed');
        steps.confirmed.classList.add('completed');
        steps.shipping.classList.add('active');
    }
    else if (status === 'COMPLETED') {
        steps.placed.classList.add('completed');
        steps.confirmed.classList.add('completed');
        steps.shipping.classList.add('completed');
        steps.completed.classList.add('active');
        // If rated, move active to rated (logic to be added if 'isRated' flag exists)
    }
    else if (status === 'CANCELLED') {
        // Handle cancelled state if needed
    }
}

function renderShippingAddress(order) {
    document.getElementById('receiverName').textContent = order.receiverName || '';
    document.getElementById('receiverPhone').textContent = order.receiverPhone || '';
    document.getElementById('receiverAddress').textContent = order.receiverAddress || '';
}

function renderOrderItems(items) {
    const container = document.getElementById('orderItemsList');
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-center text-muted p-4">Không có sản phẩm nào</p>';
        return;
    }
    
    const itemsHtml = items.map(item => {
        const productName = item.productName || 'Sản phẩm';
        const skuName = item.skuName || 'Tiêu chuẩn';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const originalPrice = item.originalPrice || 0;
        const imageUrl = item.imageUrl || '../../assets/img/placeholder.svg';
        
        return `
            <div class="d-flex align-items-center py-3 border-bottom">
                <img src="${imageUrl}" class="rounded border me-3" alt="${productName}" 
                     style="width: 80px; height: 80px; object-fit: cover;"
                     onerror="this.src='../../assets/img/placeholder.svg'">
                <div class="flex-grow-1">
                    <div class="fw-bold text-dark">${productName}</div>
                    <div class="text-muted small">Phân loại: ${skuName}</div>
                    <div class="text-muted small">x${quantity}</div>
                </div>
                <div class="text-end">
                    <div class="text-danger fw-bold">${formatCurrency(price)}</div>
                    ${originalPrice > price ? `<div class="text-muted small text-decoration-line-through">${formatCurrency(originalPrice)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = itemsHtml;
}

function renderPaymentSummary(order) {
    document.getElementById('paymentMethod').textContent = order.paymentMethod || 'Thanh toán khi nhận hàng';
    
    document.getElementById('subTotal').textContent = formatCurrency(order.merchandiseSubtotal || 0);
    document.getElementById('shippingFee').textContent = formatCurrency(order.shippingFee || 0);
    document.getElementById('voucherDiscount').textContent = `-${formatCurrency(order.voucherDiscount || 0)}`;
    document.getElementById('finalTotal').textContent = formatCurrency(order.grandTotal || 0);
}

// ==================== SHIPMENT HISTORY ====================
async function loadShipmentHistory(order) {
    try {
        const orderId = order.id || order.orderId || order.orderCode; // fallback orderCode if API accepts
        if (!orderId) return;

        const url = `${window.API_BASE_URL || 'http://localhost:8080'}/api/shipment-history/tracking/${orderId}`;
        const response = await httpRequest(url, { method: 'GET' });

        const data = response.payload || response.data || response;
        renderShipmentHistory(data);
    } catch (err) {
        console.error('Shipment history error:', err);
        const timeline = document.getElementById('shipmentTimeline');
        if (timeline) {
            timeline.innerHTML = `<div class="timeline-empty text-muted">Không có dữ liệu vận chuyển</div>`;
        }
    }
}

function renderShipmentHistory(data) {
    if (!data) return;
    const timeline = data.timeline || [];

    document.getElementById('trackingCode').textContent = data.trackingCode || '—';
    document.getElementById('expectedDelivery').textContent = data.expectedDeliveryTime ? formatDate(data.expectedDeliveryTime) : '—';
    document.getElementById('shipmentStatus').textContent = data.currentStatus || '—';

    const container = document.getElementById('shipmentTimeline');
    if (!container) return;

    if (!timeline.length) {
        container.innerHTML = `<div class="timeline-empty text-muted">Chưa có cập nhật giao hàng</div>`;
        return;
    }

    const html = timeline.map(item => {
        const completed = item.completed === true;
        return `
            <div class="timeline-item ${completed ? 'done' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${item.title || 'Cập nhật'}</div>
                    <div class="timeline-desc">${item.description || ''}</div>
                    <div class="timeline-time">${item.time ? formatDate(item.time) : ''}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function calculateSubTotal(items) {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
        const price = item.price || item.unitPrice || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
    }, 0);
}

// ==================== UTILS ====================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) overlay.classList.add('active');
        else overlay.classList.remove('active');
    }
}

// formatCurrency and formatDate are now imported from utils.js

function getStatusLabel(status) {
    const map = {
        'WAITING_PAYMENT': 'Chờ thanh toán',
        'PENDING_SHIPMENT': 'Chờ lấy hàng',
        'SHIPPING': 'Đang giao hàng',
        'COMPLETED': 'Hoàn thành',
        'CANCELLED': 'Đã hủy'
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        'WAITING_PAYMENT': 'status-pending',
        'PENDING_SHIPMENT': 'status-pending',
        'SHIPPING': 'status-shipping',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled'
    };
    return map[status] || '';
}

// ==================== REVIEW & INVOICE FEATURES ====================

// State for reviews
let reviewsState = {
    productReviews: {}
};

// Show action buttons if order is completed
function checkAndShowActions(order) {
    if (order.status === 'COMPLETED') {
        const actionsSection = document.getElementById('orderActionsSection');
        if (actionsSection) {
            actionsSection.classList.remove('d-none');
        }
    }
}

// Open review modal
function openReviewModal() {
    const order = orderDetailState.order;
    if (!order || !order.items) {
        alert('Không có sản phẩm để đánh giá');
        return;
    }
    
    renderReviewProducts(order.items);
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    
    // Hide header when modal opens
    const headerElement = document.querySelector('.shop-header');
    if (headerElement) {
        headerElement.style.display = 'none';
    }
    
    // Show header again when modal closes
    document.getElementById('reviewModal').addEventListener('hidden.bs.modal', function () {
        const headerElement = document.querySelector('.shop-header');
        if (headerElement) {
            headerElement.style.display = '';
        }
    }, { once: true });
    
    modal.show();
}

// Render products for review
function renderReviewProducts(items) {
    const container = document.getElementById('reviewProductsList');
    reviewsState.productReviews = {};
    
    
    const html = items.map((item, index) => {
        // ✅ Backend now returns both skuId and productId
        // Available fields: [skuId, productId, productName, skuName, imageUrl, quantity, originalPrice, price]
        const skuId = item.skuId;       // ← Backend trả về skuId trực tiếp
        const productId = item.productId;
        
        
        // Validate that we have an ID
        if (!skuId) {
            console.error('❌ No ID found in item:', item);
        }
        
        reviewsState.productReviews[skuId] = { 
            skuId: skuId,                   // ✅ productId from order = skuId for reviews
            productId: productId,           // ✅ Same value for reference
            productName: item.productName || 'Unknown Product',
            skuName: item.skuName || '',
            rating: 0, 
            comment: '',
            images: []
        };
        
        return `
            <div class="review-item">
                <div class="review-item-header">
                    <img src="${item.imageUrl || '../../assets/img/placeholder.svg'}" 
                         class="review-item-img" 
                         alt="${item.productName}"
                         onerror="this.src='../../assets/img/placeholder.svg'">
                    <div class="review-item-info">
                        <div class="fw-bold">${item.productName || 'Sản phẩm'}</div>
                        <div class="text-muted small">${item.skuName || ''}</div>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">Đánh giá sản phẩm</label>
                    <div class="review-stars" data-product-id="${skuId}">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <i class="fas fa-star" data-star="${star}" onclick="setRating('${skuId}', ${star})"></i>
                        `).join('')}
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">Nhận xét</label>
                    <textarea class="form-control review-textarea" 
                              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                              onchange="setReviewComment('${skuId}', this.value)"></textarea>
                </div>
                <div class="mb-2 d-flex justify-content-between align-items-center">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="toggleProductReviews('${skuId}')">
                        <i class="fas fa-comments me-1"></i>Xem đánh giá
                    </button>
                    <small class="text-muted">Đã mua: ${item.quantity || 1}</small>
                </div>
                <div id="productReviews_${skuId}" class="product-reviews-container collapse"></div>
                <div>
                    <label class="form-label small fw-bold">Hình ảnh/Video (Tùy chọn)</label>
                    <div class="border-2 border-dashed rounded p-3" style="border: 2px dashed #dee2e6;">
                        <input type="file" id="reviewImages_${skuId}" multiple accept="image/*,video/*" 
                               class="d-none" onchange="handleReviewImagesChange('${skuId}', event)">
                        <button type="button" onclick="document.getElementById('reviewImages_${skuId}').click()" 
                                class="btn btn-sm btn-outline-secondary w-100">
                            <i class="fas fa-camera me-2"></i>Thêm ảnh/video
                        </button>
                        <div id="reviewImagesPreview_${skuId}" class="mt-2 d-flex flex-wrap gap-2"></div>
                    </div>
                    <small class="text-muted">Tối đa 5 tệp, mỗi tệp không quá 5MB</small>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Handle image upload for review
function handleReviewImagesChange(productId, event) {
    const files = Array.from(event.target.files);
    const review = reviewsState.productReviews[productId];
    
    // Validate file count
    if (review.images.length + files.length > 5) {
        alert('Chỉ được tải lên tối đa 5 tệp');
        return;
    }
    
    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
        if (file.size > maxSize) {
            alert(`Tệp ${file.name} vượt quá 5MB`);
            return;
        }
    }
    
    // Convert files to base64
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            review.images.push(e.target.result);
            renderReviewImagesPreview(productId);
        };
        reader.readAsDataURL(file);
    });
}

// Toggle and lazy-load product reviews
async function toggleProductReviews(skuId) {
    const container = document.getElementById(`productReviews_${skuId}`);
    if (!container) return;

    if (container.classList.contains('show')) {
        // collapse
        container.classList.remove('show');
        container.innerHTML = '';
        return;
    }

    // expand and load
    container.classList.add('show');
    container.innerHTML = `<div class="py-3 text-center text-muted">Đang tải đánh giá...</div>`;
    try {
        const reviews = await fetchProductReviews(skuId, 0, 5);
        renderProductReviewsList(skuId, reviews || []);
    } catch (err) {
        container.innerHTML = `<div class="py-3 text-center text-danger">Không thể tải đánh giá</div>`;
        console.error('Load product reviews error:', err);
    }
}

// Fetch reviews for a product (page, limit)
async function fetchProductReviews(productId, page = 0, limit = 5) {
    const url = `${window.API_BASE_URL || 'http://localhost:8080'}/api/reviews/product/${productId}?page=${page}&limit=${limit}`;
    const res = await httpRequest(url, { method: 'GET' });
    const payload = res.payload || res.data || res;
    // If payload is a Page-like object, try to get content
    if (payload && payload.content) return payload.content;
    return Array.isArray(payload) ? payload : [];
}

// Render reviews into container
function renderProductReviewsList(skuId, reviews) {
    const container = document.getElementById(`productReviews_${skuId}`);
    if (!container) return;
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `<div class="py-3 text-center text-muted">Chưa có đánh giá cho sản phẩm này</div>`;
        return;
    }

    const html = reviews.map(r => {
        const stars = renderStars(r.rating);
        const imagesHtml = (r.imageUrls || []).slice(0,4).map(url => `
            <a href="${url}" target="_blank"><img src="${url}" class="review-thumb me-2"/></a>
        `).join('');
        return `
            <div class="d-flex mb-3">
                <div class="me-3">
                    <div class="avatar-circle">${(r.userName||'U').charAt(0).toUpperCase()}</div>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between">
                        <div class="fw-bold small">${escapeHtml(r.userName || 'Khách hàng')}</div>
                        <div class="text-muted small">${formatDateShort(r.createdAt)}</div>
                    </div>
                    <div class="mb-1">${stars}</div>
                    <div class="mb-2">${escapeHtml(r.comment || '')}</div>
                    <div class="review-images">${imagesHtml}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="p-3 border rounded bg-white">${html}</div>`;
}

// Utility: render stars
function renderStars(rating) {
    const full = Math.max(0, Math.min(5, Math.floor(rating || 0)));
    let out = '';
    for (let i=1;i<=5;i++) {
        out += `<i class="fas fa-star ${i<=full? 'text-warning' : 'text-muted'} me-1"></i>`;
    }
    return out;
}

// Utility: short date
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
}

// Utility: escape HTML to avoid XSS
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Minimal styles for review thumbnails and avatar
(function injectReviewStyles(){
    const css = `
    .review-thumb{width:56px;height:56px;object-fit:cover;border-radius:6px}
    .avatar-circle{width:36px;height:36px;border-radius:50%;background:#f1f3f5;color:#495057;display:flex;align-items:center;justify-content:center;font-weight:600}
    .product-reviews-container{margin-top:8px}
    `;
    const style = document.createElement('style'); style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
})();

// Render preview images
function renderReviewImagesPreview(productId) {
    const container = document.getElementById(`reviewImagesPreview_${productId}`);
    const review = reviewsState.productReviews[productId];
    
    if (!container || !review.images.length) {
        if (container) container.innerHTML = '';
        return;
    }
    
    const html = review.images.map((img, index) => `
        <div class="position-relative" style="width: 80px; height: 80px;">
            <img src="${img}" class="img-thumbnail w-100 h-100" style="object-fit: cover;">
            <button type="button" onclick="removeReviewImage('${productId}', ${index})" 
                    class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0" 
                    style="width: 20px; height: 20px; border-radius: 50%; margin: -5px;">
                <i class="fas fa-times" style="font-size: 10px;"></i>
            </button>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Remove image from review
function removeReviewImage(productId, index) {
    const review = reviewsState.productReviews[productId];
    review.images.splice(index, 1);
    renderReviewImagesPreview(productId);
}

// Set star rating
function setRating(productId, rating) {
    reviewsState.productReviews[productId].rating = rating;
    
    const starsContainer = document.querySelector(`[data-product-id="${productId}"]`);
    const stars = starsContainer.querySelectorAll('i');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Set review comment
function setReviewComment(productId, comment) {
    reviewsState.productReviews[productId].comment = comment;
}

// Submit reviews
async function submitReviews() {
    const orderComment = document.getElementById('orderReviewComment').value;
    
    // Validate that at least one product has been rated
    const hasReviews = Object.values(reviewsState.productReviews).some(r => r.rating > 0);
    if (!hasReviews) {
        alert('Vui lòng đánh giá ít nhất một sản phẩm');
        return;
    }
    
    // Validate order ID exists
    if (!orderDetailState.order || !orderDetailState.order.id) {
        alert('Không tìm thấy thông tin đơn hàng');
        console.error('❌ Order ID is missing:', orderDetailState.order);
        return;
    }
    
    try {
        showLoading(true);
        
        // Prepare reviews data (filter only rated products)
        const reviewsToSubmit = Object.entries(reviewsState.productReviews)
            .filter(([_, review]) => review.rating > 0)
            .map(([productId, review]) => {
                // ✅ Sử dụng skuId thật từ review object, KHÔNG dùng productId key
                const skuId = review.skuId;
                
                // Validate skuId from item data
                if (!skuId || isNaN(skuId) || skuId <= 0) {
                    console.error('❌ Invalid SKU ID from item:', {
                        key: productId,
                        skuId: review.skuId,
                        productId: review.productId,
                        productName: review.productName,
                        skuName: review.skuName,
                        reviewObject: review
                    });
                    
                    alert(`Không thể gửi đánh giá cho sản phẩm "${review.productName}" vì thiếu SKU ID. Vui lòng liên hệ hỗ trợ.`);
                    throw new Error(
                        `SKU ID is missing or invalid for product: ${review.productName || productId}.`
                    );
                }
                
                return {
                    productId: review.productId,  // ✅ Dùng productId thật
                    skuId: parseInt(skuId),       // ✅ Dùng skuId thật
                    rating: review.rating,
                    comment: review.comment || '',
                    orderId: orderDetailState.order.id,
                    images: review.images || []
                };
            });
        
        
        const url = `${window.API_BASE_URL || 'http://localhost:8080'}/api/reviews`;
        
        // Submit each review with FormData
        const promises = reviewsToSubmit.map((review, index) => {
            const formData = new FormData();
            
            // Validate required fields before appending
            if (!review.skuId || review.skuId <= 0) {
                throw new Error(`Invalid SKU ID for review ${index + 1}: ${review.skuId}`);
            }
            if (!review.rating || review.rating < 1 || review.rating > 5) {
                throw new Error(`Invalid rating for review ${index + 1}: ${review.rating}`);
            }
            if (!review.orderId || review.orderId <= 0) {
                console.error('❌ CRITICAL: Order ID is missing or invalid:', {
                    review: review,
                    orderDetailState: orderDetailState.order,
                    orderId: review.orderId
                });
                throw new Error(`Invalid Order ID for review ${index + 1}: ${review.orderId}`);
            }
            
            
            // Append basic fields - ensure all are strings
            formData.append('skuId', String(review.skuId));
            formData.append('rating', String(review.rating));
            formData.append('comment', review.comment || '');
            formData.append('orderId', String(review.orderId));
            
            
            // Append images (convert base64 to File)
            if (review.images && review.images.length > 0) {
                review.images.forEach((base64Image, imgIndex) => {
                    try {
                        // Generate filename with timestamp and index
                        const timestamp = Date.now();
                        const filename = `review_${review.skuId}_${timestamp}_${imgIndex}.jpg`;
                        const imageFile = base64ToFile(base64Image, filename);
                        formData.append('files', imageFile);  // ✅ Backend dùng 'files' không phải 'images'
                    } catch (error) {
                        console.error('❌ Error converting image:', error);
                    }
                });
            }
            
            
            return httpRequest(url, {
                method: 'POST',
                body: formData
            });
        });
        
        await Promise.all(promises);
        
        alert('✓ Cảm ơn bạn đã đánh giá!');
        bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
        
        // Reload order to update reviewed status
        if (orderDetailState.order.orderCode) {
            loadOrderDetail(orderDetailState.order.orderCode);
        }
        
    } catch (error) {
        console.error('Submit review error:', error);
        alert('Lỗi khi gửi đánh giá: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
        showLoading(false);
    }
}

// Open invoice modal and load invoice
async function openInvoiceModal() {
    const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    
    // Hide header when modal opens
    const headerElement = document.querySelector('.shop-header');
    if (headerElement) {
        headerElement.style.display = 'none';
    }
    
    // Show header again when modal closes
    document.getElementById('invoiceModal').addEventListener('hidden.bs.modal', function () {
        const headerElement = document.querySelector('.shop-header');
        if (headerElement) {
            headerElement.style.display = '';
        }
    }, { once: true });
    
    modal.show();
    
    await loadInvoice();
}

// Load invoice data
async function loadInvoice() {
    const order = orderDetailState.order;
    if (!order) {
        document.getElementById('invoiceContent').innerHTML = 
            '<div class="alert alert-danger">Không tìm thấy thông tin đơn hàng</div>';
        return;
    }
    
    try {
        // First try to get invoice by order ID
        const url = `${window.API_BASE_URL || 'http://localhost:8080'}/api/invoices/order/${order.id}`;
        
        const response = await httpRequest(url, { method: 'GET' });
        const invoice = response.payload || response.data || response;
        
        renderInvoice(invoice, order);
        
    } catch (error) {
        console.error('Load invoice error:', error);
        document.getElementById('invoiceContent').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Chưa có hóa đơn cho đơn hàng này. Hóa đơn sẽ được tạo sau khi đơn hàng hoàn thành.
            </div>
        `;
    }
}

// Render invoice
function renderInvoice(invoice, order) {
    const container = document.getElementById('invoiceContent');
    
    const html = `
        <div class="invoice-container">
            <div class="invoice-header">
                <div class="row">
                    <div class="col-md-6">
                        <div class="invoice-logo">
                            <i class="fas fa-bolt"></i> EzGear
                        </div>
                        <div class="text-muted">Thiết bị gaming chuyên nghiệp</div>
                        <div class="text-muted small mt-2">
                            Địa chỉ: Hà Nội, Việt Nam<br>
                            Email: support@ezgear.vn<br>
                            Hotline: 1900-xxxx
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <div class="invoice-title">HÓA ĐƠN ĐIỆN TỬ</div>
                        <div class="text-muted">Mã hóa đơn: <strong>${invoice.invoiceNumber || invoice.id || '---'}</strong></div>
                        <div class="text-muted">Ngày tạo: <strong>${formatDate(invoice.createdAt || order.createdAt)}</strong></div>
                        <div class="text-muted">Mã đơn hàng: <strong>${order.orderCode}</strong></div>
                    </div>
                </div>
            </div>
            
            <div class="invoice-info-grid">
                <div class="invoice-info-box">
                    <div class="fw-bold text-danger mb-2">THÔNG TIN KHÁCH HÀNG</div>
                    <div><strong>Họ tên:</strong> ${order.receiverName || '---'}</div>
                    <div><strong>Số điện thoại:</strong> ${order.receiverPhone || '---'}</div>
                    <div><strong>Địa chỉ:</strong> ${order.receiverAddress || '---'}</div>
                </div>
                <div class="invoice-info-box">
                    <div class="fw-bold text-danger mb-2">THÔNG TIN THANH TOÁN</div>
                    <div><strong>Phương thức:</strong> ${order.paymentMethod || 'COD'}</div>
                    <div><strong>Trạng thái:</strong> ${order.paymentStatus || '---'}</div>
                    <div><strong>Đã thanh toán:</strong> ${formatCurrency(invoice.paidAmount || order.grandTotal || 0)}</div>
                </div>
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Sản phẩm</th>
                        <th class="text-center">Số lượng</th>
                        <th class="text-end">Đơn giá</th>
                        <th class="text-end">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${(order.items || []).map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>
                                <div class="fw-bold">${item.productName || 'Sản phẩm'}</div>
                                <div class="text-muted small">${item.skuName || ''}</div>
                            </td>
                            <td class="text-center">${item.quantity || 1}</td>
                            <td class="text-end">${formatCurrency(item.price || 0)}</td>
                            <td class="text-end">${formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="invoice-summary">
                <div class="invoice-summary-row">
                    <span>Tổng tiền hàng:</span>
                    <span>${formatCurrency(order.merchandiseSubtotal || 0)}</span>
                </div>
                <div class="invoice-summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>${formatCurrency(order.shippingFee || 0)}</span>
                </div>
                <div class="invoice-summary-row">
                    <span>Giảm giá voucher:</span>
                    <span class="text-danger">-${formatCurrency(order.voucherDiscount || 0)}</span>
                </div>
                <div class="invoice-summary-row">
                    <span>Thuế VAT (${invoice.taxRate || 0}%):</span>
                    <span>${formatCurrency(invoice.taxAmount || 0)}</span>
                </div>
                <div class="invoice-summary-row total">
                    <span>TỔNG CỘNG:</span>
                    <span>${formatCurrency(invoice.totalAmount || order.grandTotal || 0)}</span>
                </div>
            </div>
            
            <div class="invoice-footer">
                <p class="mb-1"><strong>Cảm ơn quý khách đã mua hàng tại EzGear!</strong></p>
                <p class="text-muted small mb-0">
                    Hóa đơn này được tạo tự động bởi hệ thống. 
                    Mọi thắc mắc xin liên hệ hotline: 1900-xxxx
                </p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Print invoice
function printInvoice() {
    window.print();
}

// -------------------- Reviews Section Integration --------------------
// If page contains #reviews-section, initialize reviews UI for the first product in the order
function initReviewsSection() {
    const section = document.getElementById('reviews-section');
    if (!section) return;

    // Wait until order is loaded
    if (!orderDetailState.order) {
        // try again shortly
        setTimeout(initReviewsSection, 300);
        return;
    }

    const items = orderDetailState.order.items || [];
    if (!items.length) {
        return;
    }

    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'mb-4 d-flex gap-2 align-items-center';

    if (items.length > 1) {
        const select = document.createElement('select');
        select.className = 'form-select w-auto';
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.skuId || item.productId;
            opt.textContent = `${item.productName} — ${item.skuName || ''}`;
            select.appendChild(opt);
        });
        select.addEventListener('change', (e) => loadReviewsForSku(e.target.value));
        selectorContainer.appendChild(select);
    } else {
        const title = document.createElement('div');
        title.className = 'text-sm text-muted';
        title.textContent = items[0].productName || '';
        selectorContainer.appendChild(title);
    }

    const reviewsSection = document.getElementById('reviews-section');
    reviewsSection.insertBefore(selectorContainer, document.getElementById('reviews-list'));

    // initial load for first item
    const firstSku = items[0].skuId || items[0].productId;
    loadReviewsForSku(firstSku);
}

async function loadReviewsForSku(skuId, page = 0, limit = 5, filter = {}) {
    const listEl = document.getElementById('reviews-list');
    const pagEl = document.getElementById('reviews-pagination');
    if (!listEl) return;

    listEl.innerHTML = `<div class="text-center py-8 text-muted">Đang tải đánh giá...</div>`;

    try {
        const res = await fetchProductReviews(skuId, page, limit);
        // res may be Page-like {content, totalPages, totalElements} or an array
        let reviews = [];
        let totalPages = 1;
        let totalElements = 0;

        if (!res) {
            reviews = [];
        } else if (Array.isArray(res)) {
            reviews = res;
            totalPages = 1;
            totalElements = res.length;
        } else if (res.content) {
            reviews = res.content;
            totalPages = res.totalPages || 1;
            totalElements = res.totalElements || (reviews.length);
        } else {
            reviews = [];
        }

        renderReviewsSection(reviews, { skuId, page, limit, totalPages, totalElements });
    } catch (err) {
        listEl.innerHTML = `<div class="text-center py-8 text-danger">Không thể tải đánh giá</div>`;
        console.error('Load reviews failed', err);
    }
}

function renderReviewsSection(reviews, meta) {
    const listEl = document.getElementById('reviews-list');
    const pagEl = document.getElementById('reviews-pagination');
    if (!listEl) return;

    if (!reviews || reviews.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-12">
                <span class="material-icons text-6xl text-gray-300">rate_review</span>
                <p class="text-gray-500 mt-4">Chưa có đánh giá nào cho sản phẩm này</p>
                <p class="text-sm text-gray-400 mt-2">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
            </div>`;
        if (pagEl) pagEl.innerHTML = '';
        return;
    }

    const html = reviews.map(r => {
        const stars = renderStars(r.rating);
        const imagesHtml = (r.imageUrls || []).map(url => `<a href="${url}" target="_blank"><img src="${url}" class="review-thumb me-2"/></a>`).join('');
        return `
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <div class="d-flex gap-3 mb-2 align-items-start">
                    <div class="avatar-circle me-2">${(r.userName||'U').charAt(0).toUpperCase()}</div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="fw-bold">${escapeHtml(r.userName || 'Khách hàng')}</div>
                            <div class="text-muted small">${formatDateShort(r.createdAt)}</div>
                        </div>
                        <div class="mb-2 mt-2">${stars}</div>
                        <div class="mb-2 text-muted">${escapeHtml(r.comment || '')}</div>
                        <div class="review-images">${imagesHtml}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('\n');

    listEl.innerHTML = `<div class="space-y-4">${html}</div>`;

    // pagination
    if (pagEl) {
        const totalPages = meta.totalPages || 1;
        const current = meta.page || 0;
        if (totalPages <= 1) {
            pagEl.innerHTML = '';
            return;
        }
        let pagHtml = '<div class="d-flex gap-2 align-items-center">';
        if (current > 0) pagHtml += `<button class="btn btn-sm btn-outline-secondary" onclick="loadReviewsForSku(${meta.skuId}, ${current-1}, ${meta.limit})">Prev</button>`;
        pagHtml += `<div class="text-muted small">Trang ${current+1} / ${totalPages}</div>`;
        if (current < totalPages-1) pagHtml += `<button class="btn btn-sm btn-outline-secondary" onclick="loadReviewsForSku(${meta.skuId}, ${current+1}, ${meta.limit})">Next</button>`;
        pagHtml += '</div>';
        pagEl.innerHTML = pagHtml;
    }
}

// Initialize reviews section after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initReviewsSection, 200);
});
