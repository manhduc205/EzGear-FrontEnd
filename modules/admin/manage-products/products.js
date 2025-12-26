// Products Management JavaScript
let products = [];
let currentPage = 0;
let totalPages = 0;
const pageSize = 10;
let currentProductId = null;

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts(true);
});

// ================== LOAD DATA ==================
async function loadProducts(showSpinner = true) {
    if (showSpinner) showLoading(true);
    
    try {
        const keyword = document.getElementById('searchInput').value.trim();

        const searchRequest = {
            keyword: keyword || null,
            page: currentPage,
            size: pageSize,
            sortBy: "id",
            sortDir: "desc"
        };
        
        const response = await fetch(`${BASE_URL}/products/admin/search`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(searchRequest)
        });
        
        if (!response.ok) throw new Error('Failed to load products');
        
        const data = await response.json();
        
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

function editProduct(id) {
    // Placeholder for edit functionality
    alert(`Chức năng sửa sản phẩm ID: ${id} đang được phát triển`);
    // window.location.href = `../add-product/add-product.html?id=${id}`;
}

async function deleteProduct(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm: ${name}?`)) return;
    
    showLoading(true);
    try {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showToast('Xóa sản phẩm thành công', 'success');
            loadProducts();
        } else {
            throw new Error('Không thể xóa sản phẩm');
        }
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
        const response = await fetch(`${BASE_URL}/products/${productId}/images`, {
            headers: getAuthHeaders()
        });
        
        let galleryImages = [];
        if (response.ok) {
            const data = await response.json();
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
        const response = await fetch(`${BASE_URL}/products/uploads/${currentProductId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
                // Content-Type is automatically set for FormData
            },
            body: formData
        });
        
        if (response.ok) {
            showToast('Tải ảnh lên thành công', 'success');
            fileInput.value = ''; // Reset input
            // Reload gallery
            const product = products.find(p => p.id === currentProductId);
            await loadGalleryImages(currentProductId, product ? product.imageUrl : null);
        } else {
            throw new Error('Lỗi tải ảnh lên');
        }
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
        const response = await fetch(`${BASE_URL}/products/images/${imageId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showToast('Xóa ảnh thành công', 'success');
            // Reload gallery
            const product = products.find(p => p.id === currentProductId);
            await loadGalleryImages(currentProductId, product ? product.imageUrl : null);
        } else {
            throw new Error('Không thể xóa ảnh');
        }
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        showLoading(false);
    }
}
