/* ==================== PRODUCT MODULE JS ==================== */
/* Xử lý logic cho: Danh sách sản phẩm, Chi tiết sản phẩm */

// ==================== API CALLS ====================

/**
 * API: Lấy tất cả sản phẩm
 * @param {Object} params - Query params (page, limit, category, search, etc.)
 * @returns {Promise} - Response data
 */
async function getAllProductsAPI(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${window.BASE_URL}/api/products${queryString ? '?' + queryString : ''}`;
  
  return await httpRequest(url, {
    method: 'GET'
  });
}

/**
 * API: Lấy sản phẩm theo ID
 * @param {number} productId - Product ID
 * @returns {Promise} - Response data
 */
async function getProductByIdAPI(productId) {
  const url = `${window.BASE_URL}/api/products/${productId}`;
  
  return await httpRequest(url, {
    method: 'GET'
  });
}

/**
 * API: Tạo sản phẩm mới (Admin)
 * @param {Object} productData - Product data
 * @returns {Promise} - Response data
 */
async function createProductAPI(productData) {
  const url = `${window.BASE_URL}/api/products`;
  
  return await httpRequest(url, {
    method: 'POST',
    body: JSON.stringify(productData)
  });
}

/**
 * API: Cập nhật sản phẩm (Admin)
 * @param {number} productId - Product ID
 * @param {Object} productData - Product data
 * @returns {Promise} - Response data
 */
async function updateProductAPI(productId, productData) {
  const url = `${window.BASE_URL}/api/products/${productId}`;
  
  return await httpRequest(url, {
    method: 'PUT',
    body: JSON.stringify(productData)
  });
}

/**
 * API: Xóa sản phẩm (Admin)
 * @param {number} productId - Product ID
 * @returns {Promise} - Response data
 */
async function deleteProductAPI(productId) {
  const url = `${window.BASE_URL}/api/products/${productId}`;
  
  return await httpRequest(url, {
    method: 'DELETE'
  });
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render danh sách sản phẩm
 * @param {Array} products - Mảng sản phẩm
 * @param {HTMLElement} container - Container element
 */
function renderProductList(products, container) {
  if (!container) return;
  
  if (!products || products.length === 0) {
    container.innerHTML = '<p class="no-products">Không tìm thấy sản phẩm nào</p>';
    return;
  }
  
  container.innerHTML = products.map(product => `
    <div class="product-card" data-id="${product.id}">
      <div class="product-image">
        <img src="${product.image || '/assets/img/no-image.png'}" alt="${product.name}">
        ${product.discount ? `<span class="badge-discount">-${product.discount}%</span>` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-category">${product.category || 'Chưa phân loại'}</p>
        <div class="product-price">
          ${product.discount ? `<span class="price-old">${formatPrice(product.price)}</span>` : ''}
          <span class="price-current">${formatPrice(product.salePrice || product.price)}</span>
        </div>
        <div class="product-actions">
          <button class="btn-view" onclick="viewProductDetail(${product.id})">
            <i class="fas fa-eye"></i> Xem
          </button>
          <button class="btn-add-cart" onclick="addToCart(${product.id})">
            <i class="fas fa-cart-plus"></i> Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Render chi tiết sản phẩm
 * @param {Object} product - Product data
 * @param {HTMLElement} container - Container element
 */
function renderProductDetail(product, container) {
  if (!container || !product) return;
  
  container.innerHTML = `
    <div class="product-detail">
      <div class="product-images">
        <div class="main-image">
          <img src="${product.image || '/assets/img/no-image.png'}" alt="${product.name}">
        </div>
        <div class="thumbnail-images">
          ${product.images ? product.images.map((img, index) => `
            <img src="${img}" alt="${product.name} ${index + 1}" onclick="changeMainImage('${img}')">
          `).join('') : ''}
        </div>
      </div>
      
      <div class="product-info">
        <h1 class="product-name">${product.name}</h1>
        <p class="product-category">${product.category || 'Chưa phân loại'}</p>
        
        <div class="product-price">
          ${product.discount ? `
            <span class="price-old">${formatPrice(product.price)}</span>
            <span class="badge-discount">-${product.discount}%</span>
          ` : ''}
          <span class="price-current">${formatPrice(product.salePrice || product.price)}</span>
        </div>
        
        <div class="product-description">
          <h3>Mô tả sản phẩm</h3>
          <p>${product.description || 'Chưa có mô tả'}</p>
        </div>
        
        <div class="product-quantity">
          <label>Số lượng:</label>
          <div class="quantity-selector">
            <button onclick="decreaseQuantity()">-</button>
            <input type="number" id="quantity" value="1" min="1" max="${product.stock || 99}">
            <button onclick="increaseQuantity()">+</button>
          </div>
          <span class="stock-status">${product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}</span>
        </div>
        
        <div class="product-actions">
          <button class="btn-add-cart btn-primary" onclick="addToCartFromDetail(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> Thêm vào giỏ hàng
          </button>
          <button class="btn-buy-now btn-secondary" onclick="buyNow(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
            <i class="fas fa-shopping-bag"></i> Mua ngay
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==================== EVENT HANDLERS ====================

/**
 * Load danh sách sản phẩm
 */
async function loadProducts(params = {}) {
  const container = document.getElementById('product-list');
  const loader = document.getElementById('loader');
  
  if (loader) loader.style.display = 'block';
  
  try {
    const data = await getAllProductsAPI(params);
    renderProductList(data.products || data, container);
    
    // Render pagination nếu có
    if (data.pagination) {
      renderPagination(data.pagination);
    }
  } catch (err) {
    console.error('Load products error:', err);
    showToast('Không thể tải danh sách sản phẩm', 'error');
    if (container) {
      container.innerHTML = '<p class="error-message">Không thể tải danh sách sản phẩm</p>';
    }
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

/**
 * Load chi tiết sản phẩm
 * @param {number} productId - Product ID
 */
async function loadProductDetail(productId) {
  const container = document.getElementById('product-detail');
  const loader = document.getElementById('loader');
  
  if (loader) loader.style.display = 'block';
  
  try {
    const product = await getProductByIdAPI(productId);
    renderProductDetail(product, container);
  } catch (err) {
    console.error('Load product detail error:', err);
    showToast('Không thể tải thông tin sản phẩm', 'error');
    if (container) {
      container.innerHTML = '<p class="error-message">Không thể tải thông tin sản phẩm</p>';
    }
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

/**
 * Xem chi tiết sản phẩm
 * @param {number} productId - Product ID
 */
function viewProductDetail(productId) {
  redirectWithParams(CONFIG.ROUTES.PRODUCT_DETAIL, { id: productId });
}

/**
 * Thêm vào giỏ hàng
 * @param {number} productId - Product ID
 * @param {number} quantity - Số lượng
 */
async function addToCart(productId, quantity = 1) {
  if (!TokenHelper.isLoggedIn()) {
    alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = CONFIG.ROUTES.LOGIN;
    return;
  }
  
  try {
    // Gọi API thêm vào giỏ (implement trong cart.js)
    showToast('Đã thêm sản phẩm vào giỏ hàng', 'success');
  } catch (err) {
    console.error('Add to cart error:', err);
    showToast('Không thể thêm vào giỏ hàng', 'error');
  }
}

/**
 * Thêm vào giỏ từ trang detail
 * @param {number} productId - Product ID
 */
function addToCartFromDetail(productId) {
  const quantityInput = document.getElementById('quantity');
  const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
  addToCart(productId, quantity);
}

/**
 * Mua ngay
 * @param {number} productId - Product ID
 */
function buyNow(productId) {
  const quantityInput = document.getElementById('quantity');
  const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
  
  // Lưu thông tin sản phẩm để checkout
  setStorage('quickBuy', { productId, quantity });
  window.location.href = CONFIG.ROUTES.CHECKOUT;
}

/**
 * Tăng số lượng
 */
function increaseQuantity() {
  const input = document.getElementById('quantity');
  if (input) {
    const max = parseInt(input.max) || 99;
    const current = parseInt(input.value) || 1;
    if (current < max) {
      input.value = current + 1;
    }
  }
}

/**
 * Giảm số lượng
 */
function decreaseQuantity() {
  const input = document.getElementById('quantity');
  if (input) {
    const min = parseInt(input.min) || 1;
    const current = parseInt(input.value) || 1;
    if (current > min) {
      input.value = current - 1;
    }
  }
}

/**
 * Đổi ảnh chính
 * @param {string} imageUrl - URL ảnh
 */
function changeMainImage(imageUrl) {
  const mainImg = document.querySelector('.main-image img');
  if (mainImg) {
    mainImg.src = imageUrl;
  }
}

/**
 * Render pagination
 * @param {Object} pagination - Pagination data
 */
function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!container || !pagination) return;
  
  const { currentPage, totalPages } = pagination;
  
  let html = '<div class="pagination">';
  
  // Previous button
  if (currentPage > 1) {
    html += `<button onclick="loadProducts({ page: ${currentPage - 1} })">« Trước</button>`;
  }
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="active">${i}</button>`;
    } else {
      html += `<button onclick="loadProducts({ page: ${i} })">${i}</button>`;
    }
  }
  
  // Next button
  if (currentPage < totalPages) {
    html += `<button onclick="loadProducts({ page: ${currentPage + 1} })">Sau »</button>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

// ==================== AUTO-INIT ====================

document.addEventListener('DOMContentLoaded', function() {
  // Nếu đang ở trang danh sách sản phẩm
  if (document.getElementById('product-list')) {
    loadProducts();
  }
  
  // Nếu đang ở trang chi tiết sản phẩm
  if (document.getElementById('product-detail')) {
    const productId = getQueryParam('id');
    if (productId) {
      loadProductDetail(productId);
    } else {
      showToast('Không tìm thấy sản phẩm', 'error');
    }
  }
  
  // Search functionality
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const searchInput = this.querySelector('input[name="search"]');
      const keyword = searchInput ? searchInput.value.trim() : '';
      if (keyword) {
        loadProducts({ search: keyword });
      }
    });
  }
  
  // Filter by category
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const category = this.dataset.category;
      loadProducts({ category });
    });
  });
});
