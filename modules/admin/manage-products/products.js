// Products Management JavaScript
let products = [];
let currentPage = 0;
let totalPages = 0;
const pageSize = 10;
let currentProductId = null;

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts(true);
    await loadCategories();
    await loadBrands();

    // Slug generation for edit form
    const editNameInput = document.getElementById('editName');
    if (editNameInput) {
        editNameInput.addEventListener('input', (e) => {
            const name = e.target.value;
            const slug = name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            
            document.getElementById('editSlug').value = slug;
        });
    }
});

// Load Categories
async function loadCategories() {
    try {
        const data = await httpRequest(`${BASE_URL}/categories`);
        
        if (data.success && data.payload) {
            // Populate Edit Modal Select
            const editSelect = document.getElementById('editCategory');
            if (editSelect) {
                editSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
                data.payload.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    editSelect.appendChild(option);
                });
            }

            // Populate Filter Select
            const filterSelect = document.getElementById('filterCategory');
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">Tất cả danh mục</option>';
                data.payload.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    filterSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load Brands
async function loadBrands() {
    try {
        const data = await httpRequest(`${BASE_URL}/brands`);
        
        if (data.success && data.payload) {
            // Populate Edit Modal Select
            const editSelect = document.getElementById('editBrand');
            if (editSelect) {
                editSelect.innerHTML = '<option value="">-- Chọn thương hiệu --</option>';
                data.payload.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.id;
                    option.textContent = brand.name;
                    editSelect.appendChild(option);
                });
            }

            // Populate Filter Select
            const filterSelect = document.getElementById('filterBrand');
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">Tất cả thương hiệu</option>';
                data.payload.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.id;
                    option.textContent = brand.name;
                    filterSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading brands:', error);
    }
}

// ================== LOAD DATA ==================
async function loadProducts(showSpinner = true) {
    if (showSpinner) showLoading(true);
    
    try {
        const keyword = document.getElementById('searchInput').value.trim();
        const categoryId = document.getElementById('filterCategory').value;
        const brandId = document.getElementById('filterBrand').value;
        const status = document.getElementById('filterStatus').value;

        const searchRequest = {
            keyword: keyword || null,
            categoryId: categoryId ? parseInt(categoryId) : null,
            brandId: brandId ? parseInt(brandId) : null,
            isActive: status === "" ? null : (status === "true"),
            page: currentPage,
            size: pageSize,
            sortBy: "id",
            sortDir: "desc"
        };
        
        const response = await httpRequest(`${BASE_URL}/products/admin/search`, {
            method: 'POST',
            body: JSON.stringify(searchRequest)
        });
        
        const data = response;
        
        if (data.success && data.payload) {
            products = data.payload.content || [];
            totalPages = data.payload.totalPages || 0;
            renderProducts(products);
            updatePagination();
        } else {
            products = [];
            renderProducts([]);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Lỗi tải dữ liệu: ' + error.message, 'error');
        renderProducts([]);
    } finally {
        if (showSpinner) showLoading(false);
    }
}

// ================== RENDER TABLE ==================
function renderProducts(list) {
    const tbody = document.getElementById('productsTableBody');
    
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5">Không tìm thấy sản phẩm nào</td></tr>`;
        return;
    }
    
    tbody.innerHTML = list.map(item => {
        const imageUrl = item.imageUrl || 'https://via.placeholder.com/50';
        const productName = item.name || 'N/A';
        const seriesCode = item.seriesCode ? `<span class="series-badge">${item.seriesCode}</span>` : '<span class="text-muted small">--</span>';
        const categoryName = item.categoryName || 'N/A';
        const brandName = item.brandName || 'N/A';
        const createdAt = item.createdAt ? formatDateTime(item.createdAt) : 'N/A';
        
        const statusClass = item.isActive ? 'active' : 'inactive';
        const statusText = item.isActive ? 'Hoạt động' : 'Không hoạt động';

        return `
        <tr>
            <td>
                <img src="${imageUrl}" alt="${productName}" class="product-image" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>
                <div class="fw-bold">${productName}</div>
            </td>
            <td>${seriesCode}</td>
            <td>${categoryName}</td>
            <td>${brandName}</td>
            <td>${createdAt}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="openGalleryModal(${item.id})" title="Album Ảnh">
                        <i class="fas fa-images"></i>
                    </button>
                    
                    <button class="btn btn-sm btn-warning" onclick="editProduct(${item.id})" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${item.id}, '${productName}')" title="Xóa">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

// ================== ACTIONS ==================

function handleSearch() {
    currentPage = 0;
    loadProducts(false);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterBrand').value = '';
    document.getElementById('filterStatus').value = '';
    handleSearch();
}

function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        loadProducts();
    }
}

function nextPage() {
    if (currentPage < totalPages - 1) {
        currentPage++;
        loadProducts();
    }
}

function updatePagination() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const pagination = document.getElementById('pagination');

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'block';
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === totalPages - 1;
    pageInfo.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
}

async function editProduct(id) {
    showLoading(true);
    try {
        let product = null;
        try {
            // Fetch latest product details from server
            // Updated endpoint based on ProductController: @GetMapping("/admin/{id}")
            const response = await httpRequest(`${BASE_URL}/products/admin/${id}`);
            
            if (response.success && response.payload) {
                product = response.payload;
            }
        } catch (fetchError) {
            console.warn('Failed to fetch product details from server:', fetchError);
            // Fallback will handle this
        }
        
        // Fallback to local data if fetch failed or returned no payload
        if (!product) {
            product = products.find(p => p.id === id);
            if (!product) {
                throw new Error('Không thể tải thông tin sản phẩm');
            }
            showToast('Cảnh báo: Đang hiển thị dữ liệu từ danh sách (có thể thiếu chi tiết)', 'warning');
        }

        document.getElementById('editId').value = product.id;
        document.getElementById('editName').value = product.name || '';
        document.getElementById('editSeriesCode').value = product.seriesCode || '';
        document.getElementById('editSlug').value = product.slug || '';
        document.getElementById('editWarranty').value = product.warrantyMonths || 0;
        
        // Handle both flat ID (DTO) and nested object (Entity) structures
        let categoryId = product.categoryId;
        if (!categoryId && product.category) {
            categoryId = product.category.id;
        }
        
        let brandId = product.brandId;
        if (!brandId && product.brand) {
            brandId = product.brand.id;
        }
        
        document.getElementById('editCategory').value = categoryId || '';
        document.getElementById('editBrand').value = brandId || '';
        document.getElementById('editShortDesc').value = product.shortDesc || '';
        document.getElementById('editIsActive').checked = product.isActive === true;
        
        // Preview current image
        const previewDiv = document.getElementById('currentImagePreview');
        if (product.imageUrl) {
            previewDiv.innerHTML = `<img src="${product.imageUrl}" style="height: 100px; border-radius: 4px; border: 1px solid #ddd;">`;
        } else {
            previewDiv.innerHTML = '';
        }

        document.getElementById('editProductModal').classList.add('active');
    } catch (error) {
        console.error('Error loading product details:', error);
        showToast(error.message || 'Lỗi tải thông tin sản phẩm', 'error');
    } finally {
        showLoading(false);
    }
}

function closeEditModal() {
    document.getElementById('editProductModal').classList.remove('active');
    document.getElementById('editProductForm').reset();
    document.getElementById('currentImagePreview').innerHTML = '';
}

async function updateProduct() {
    const id = document.getElementById('editId').value;
    const name = document.getElementById('editName').value.trim();
    const seriesCode = document.getElementById('editSeriesCode').value.trim();
    const slug = document.getElementById('editSlug').value.trim();
    const warrantyMonths = document.getElementById('editWarranty').value;
    const categoryId = document.getElementById('editCategory').value;
    const brandId = document.getElementById('editBrand').value;
    const shortDesc = document.getElementById('editShortDesc').value.trim();
    const isActive = document.getElementById('editIsActive').checked;
    const imageFile = document.getElementById('editImage').files[0];

    if (!name || !seriesCode || !slug || !categoryId || !brandId) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
        return;
    }

    // Use FormData for @ModelAttribute
    const formData = new FormData();
    formData.append('name', name);
    formData.append('seriesCode', seriesCode);
    formData.append('slug', slug);
    formData.append('warrantyMonths', warrantyMonths);
    formData.append('categoryId', categoryId);
    formData.append('brandId', brandId);
    formData.append('shortDesc', shortDesc);
    formData.append('isActive', isActive);
    
    if (imageFile) {
        formData.append('file', imageFile);
    }

    showLoading(true);
    try {
        await httpRequest(`${BASE_URL}/products/${id}`, {
            method: 'PUT',
            body: formData
        });

        showToast('Cập nhật sản phẩm thành công', 'success');
        closeEditModal();
        loadProducts();
    } catch (error) {
        console.error('Update error:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteProduct(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm: ${name}?`)) return;
    
    showLoading(true);
    try {
        await httpRequest(`${BASE_URL}/products/${id}`, {
            method: 'DELETE'
        });
        
        showToast('Xóa sản phẩm thành công', 'success');
        loadProducts();
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ================== GALLERY MODAL ==================

async function openGalleryModal(id) {
    currentProductId = id;
    const product = products.find(p => p.id === id);
    
    if (!product) return;
    
    document.getElementById('galleryModal').classList.add('active');
    document.getElementById('galleryInput').value = ''; // Reset file input
    
    await loadGalleryImages(id, product.imageUrl);
}

function closeGalleryModal() {
    document.getElementById('galleryModal').classList.remove('active');
    currentProductId = null;
}

async function loadGalleryImages(productId, mainImageUrl) {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div class="text-center w-100"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const data = await httpRequest(`${BASE_URL}/products/${productId}/images`);
        
        let galleryImages = [];
        if (data.success) {
            galleryImages = data.payload || [];
        }
        
        let html = '';
        
        // Add Main Image (Thumbnail)
        if (mainImageUrl) {
            html += `
                <div class="gallery-item is-main">
                    <img src="${mainImageUrl}" alt="Ảnh chính">
                    <div class="main-badge">Ảnh chính</div>
                </div>
            `;
        }
        
        // Add Gallery Images
        galleryImages.forEach(img => {
            html += `
                <div class="gallery-item">
                    <img src="${img.imageUrl}" alt="Ảnh phụ">
                    <button class="delete-btn" onclick="deleteGalleryImage(${img.id})" title="Xóa ảnh">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        if (!mainImageUrl && galleryImages.length === 0) {
            html = '<div class="text-center w-100 text-muted p-3">Chưa có ảnh nào</div>';
        }
        
        grid.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        grid.innerHTML = '<div class="text-danger p-3">Lỗi tải ảnh</div>';
    }
}

async function uploadGalleryImages() {
    if (!currentProductId) return;
    
    const fileInput = document.getElementById('galleryInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showToast('Vui lòng chọn ít nhất một ảnh', 'warning');
        return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    showLoading(true);
    try {
        // httpRequest đã được cập nhật để tự động xóa Content-Type khi body là FormData
        await httpRequest(`${BASE_URL}/products/uploads/${currentProductId}`, {
            method: 'POST',
            body: formData
        });
        
        showToast('Upload ảnh thành công', 'success');
        // Reload gallery
        const product = products.find(p => p.id === currentProductId);
        await loadGalleryImages(currentProductId, product ? product.imageUrl : null);
        
        // Reset file input
        fileInput.value = '';
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteGalleryImage(imageId) {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    
    showLoading(true);
    try {
        await httpRequest(`${BASE_URL}/products/images/${imageId}`, {
            method: 'DELETE'
        });
        
        showToast('Xóa ảnh thành công', 'success');
        // Reload gallery
        const product = products.find(p => p.id === currentProductId);
        await loadGalleryImages(currentProductId, product ? product.imageUrl : null);
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        showLoading(false);
    }
}
