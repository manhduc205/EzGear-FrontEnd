// Products Management JavaScript
let products = [];
let filteredProducts = [];
let currentPage = 0;
let totalPages = 0;
const pageSize = 10;

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
});

// Load all products with pagination
async function loadProducts() {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/product-skus/search`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                page: currentPage,
                size: pageSize
            })
        });
        
        if (!response.ok) throw new Error('Failed to load products');
        
        const data = await response.json();
        console.log('Products data:', data);
        
        if (data.success && data.payload) {
            products = data.payload.content || [];
            totalPages = data.payload.totalPages || 0;
            filteredProducts = [...products];
            renderProducts();
            updatePagination();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Lỗi tải dữ liệu sản phẩm', 'error');
        document.getElementById('productsTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Không thể tải dữ liệu
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

// Render products table
function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Chưa có sản phẩm nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(sku => `
        <tr>
            <td>
                <img src="${sku.product?.imageUrl || 'https://via.placeholder.com/50'}" 
                     alt="${sku.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/50'">
            </td>
            <td>
                <strong>${sku.product?.name || 'N/A'}</strong><br>
                <small style="font-family: 'Courier New', monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-weight: 600;">SKU: ${sku.sku}</small>
            </td>
            <td>${sku.product?.category?.name || 'N/A'}</td>
            <td>${sku.product?.brand?.name || 'N/A'}</td>
            <td>${sku.product?.warrantyMonths || 0} tháng</td>
            <td>
                <span class="status-badge ${sku.isActive ? 'active' : 'inactive'}">
                    ${sku.isActive ? 'Hoạt động' : 'Ngừng bán'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewProduct(${sku.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${sku.id}, '${sku.name}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update pagination
function updatePagination() {
    const paginationDiv = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages > 1) {
        paginationDiv.style.display = 'block';
        pageInfo.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === totalPages - 1;
    } else {
        paginationDiv.style.display = 'none';
    }
}

// Previous page
function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        loadProducts();
    }
}

// Next page
function nextPage() {
    if (currentPage < totalPages - 1) {
        currentPage++;
        loadProducts();
    }
}

// Search products
function handleSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!keyword) {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(sku => 
            sku.name.toLowerCase().includes(keyword) ||
            sku.sku.toLowerCase().includes(keyword) ||
            (sku.product?.name && sku.product.name.toLowerCase().includes(keyword))
        );
    }
    
    renderProducts();
}

// View product details
async function viewProduct(id) {
    showLoading(true);
    
    try {
        // Backend không có GET /{id}, nên phải search bằng id
        // Hoặc lấy trực tiếp từ products array
        const sku = filteredProducts.find(p => p.id === id);
        
        if (!sku) {
            throw new Error('Product not found');
        }
        
        displayProductDetail(sku);
        document.getElementById('productDetailModal').classList.add('active');
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Lỗi tải chi tiết sản phẩm: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display product detail in modal
function displayProductDetail(sku) {
    const product = sku.product || {};
    const attributes = sku.attributes || [];
    
    let attributesHtml = '';
    if (attributes.length > 0) {
        attributesHtml = `
            <div class="detail-section">
                <h3><i class="fas fa-cogs"></i> Thông Số Kỹ Thuật</h3>
                <div class="attributes-grid">
                    ${attributes.map(attr => `
                        <div class="attribute-item">
                            <span class="attr-name">${attr.attributeName || 'N/A'}:</span>
                            <span class="attr-value">${attr.value || 'N/A'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    const detailHtml = `
        <div class="product-detail-container">
            <div class="detail-header">
                <div class="product-image-large">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/300'}" 
                         alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="product-info">
                    <h2>${product.name || 'N/A'}</h2>
                    <div class="sku-code">
                        <i class="fas fa-barcode"></i> SKU: <strong>${sku.sku}</strong>
                    </div>
                    ${sku.barcode ? `
                        <div class="sku-code">
                            <i class="fas fa-qrcode"></i> Barcode: <strong>${sku.barcode}</strong>
                        </div>
                    ` : ''}
                    <div class="price-tag">
                        <i class="fas fa-tags"></i> Giá: <strong>${formatCurrency(sku.price || 0)}</strong>
                    </div>
                    <div class="product-meta">
                        <span class="meta-item">
                            <i class="fas fa-folder"></i> ${product.category?.name || 'N/A'}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-copyright"></i> ${product.brand?.name || 'N/A'}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-shield-alt"></i> ${product.warrantyMonths || 0} tháng
                        </span>
                    </div>
                    <div class="status-info">
                        <span class="status-badge ${sku.isActive ? 'active' : 'inactive'}">
                            ${sku.isActive ? 'Đang hoạt động' : 'Ngừng bán'}
                        </span>
                    </div>
                </div>
            </div>
            
            ${product.description ? `
                <div class="detail-section">
                    <h3><i class="fas fa-align-left"></i> Mô Tả Sản Phẩm</h3>
                    <div class="description-content">${product.description}</div>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h3><i class="fas fa-box"></i> Thông Tin Vật Lý</h3>
                <div class="info-grid">
                    ${sku.weightGram ? `
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-weight"></i> Trọng lượng:</span>
                            <span class="info-value">${sku.weightGram} gram</span>
                        </div>
                    ` : ''}
                    ${sku.lengthCm || sku.widthCm || sku.heightCm ? `
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-ruler-combined"></i> Kích thước:</span>
                            <span class="info-value">${sku.lengthCm || 0} × ${sku.widthCm || 0} × ${sku.heightCm || 0} cm</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${attributesHtml}
            
            <div class="detail-section">
                <h3><i class="fas fa-info-circle"></i> Thông Tin Bổ Sung</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Ngày tạo:</span>
                        <span class="info-value">${formatDateTime(sku.createdAt || new Date())}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Cập nhật lần cuối:</span>
                        <span class="info-value">${formatDateTime(sku.updatedAt || new Date())}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('productDetailContent').innerHTML = detailHtml;
}

// Close detail modal
function closeDetailModal() {
    document.getElementById('productDetailModal').classList.remove('active');
}

// Delete product SKU
async function deleteProduct(id, name) {
    const confirm = window.confirm(`Bạn có chắc muốn xóa SKU "${name}"?`);
    if (!confirm) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/product-skus/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Xóa sản phẩm thành công!', 'success');
            await loadProducts();
        } else {
            throw new Error(data.message || data.error || 'Failed to delete');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}
