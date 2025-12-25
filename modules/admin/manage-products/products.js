// Products Management JavaScript
let products = [];
let currentPage = 0;
let totalPages = 0;
const pageSize = 10;
let currentEditingSku = null;

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadCategories(),
        loadBrands(),
        loadProducts(true)
    ]);
});

// ================== LOAD FILTERS ==================
async function loadCategories() {
    try {
        const response = await fetch(`${BASE_URL}/categories`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const data = await response.json();
            const list = data.payload || [];
            const select = document.getElementById('filterCategory');
            list.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (e) {
        console.error('Error loading categories:', e);
    }
}

async function loadBrands() {
    try {
        const response = await fetch(`${BASE_URL}/brands`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const data = await response.json();
            const list = data.payload || [];
            const select = document.getElementById('filterBrand');
            list.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.id;
                option.textContent = brand.name;
                select.appendChild(option);
            });
        }
    } catch (e) {
        console.error('Error loading brands:', e);
    }
}

// ================== LOAD DATA ==================
async function loadProducts(showSpinner = true) {
    if (showSpinner) showLoading(true);
    
    try {
        const keyword = document.getElementById('searchInput').value.trim();
        const categoryId = document.getElementById('filterCategory').value;
        const brandId = document.getElementById('filterBrand').value;
        const statusVal = document.getElementById('filterStatus').value;

        const searchRequest = {
            keyword: keyword || null,
            categoryId: categoryId ? parseInt(categoryId) : null,
            brandId: brandId ? parseInt(brandId) : null,
            isActive: statusVal === "" ? null : (statusVal === "true"),
            page: currentPage,
            size: pageSize,
            sortBy: "createdAt",
            sortDir: "desc"
        };
        
        const response = await fetch(`${BASE_URL}/product-skus/admin/search`, {
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
        const productName = item.productName || 'N/A';
        const skuCode = item.skuCode || 'N/A';
        const categoryName = item.categoryName || 'N/A';
        const brandName = item.brandName || 'N/A';
        const warranty = item.warrantyMonths || 0;
        
        const statusClass = item.isActive ? 'active' : 'inactive';
        const statusText = item.isActive ? 'Hoạt động' : 'Không hoạt động';

        return `
        <tr>
            <td>
                <img src="${imageUrl}" alt="${productName}" class="product-image" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>
                <div class="fw-bold">${productName}</div>
                <small class="text-muted"><i class="fas fa-barcode"></i> ${skuCode}</small>
            </td>
            <td>${categoryName}</td>
            <td>${brandName}</td>
            <td>${warranty} tháng</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="openEditModal(${item.id})" title="Sửa nhanh SKU">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button class="btn btn-sm btn-danger" onclick="deleteSku(${item.id}, '${skuCode}')" title="Xóa Biến thể">
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

async function deleteSku(id, code) {
    if (!confirm(`Bạn có chắc muốn xóa biến thể SKU: ${code}?`)) return;
    
    showLoading(true);
    try {
        const response = await fetch(`${BASE_URL}/product-skus/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showToast('Xóa biến thể thành công', 'success');
            loadProducts();
        } else {
            throw new Error('Không thể xóa');
        }
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ================== EDIT MODAL ==================

async function openEditModal(id) {
    showLoading(true);
    let skuId = id;
    let item = products.find(p => p.id === id);
    
    try {
        // Try to fetch full details
        const response = await fetch(`${BASE_URL}/product-skus/${id}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.payload) {
                item = data.payload;
                item.id = skuId; // Ensure ID is preserved
            }
        } else {
            console.warn('Failed to fetch SKU details, using list data');
        }
    } catch (error) {
        console.error('Error fetching SKU details:', error);
        // Fallback to list data is already set
    } finally {
        showLoading(false);
    }

    if (!item) {
        showToast('Không tìm thấy thông tin sản phẩm', 'error');
        return;
    }
    
    currentEditingSku = item;
    
    // Populate form fields
    document.getElementById('editSkuId').value = item.id;
    document.getElementById('editSkuName').value = item.name || item.productName || '';
    document.getElementById('editSkuCode').value = item.sku || item.skuCode || '';
    document.getElementById('editSkuPrice').value = item.price || 0;
    document.getElementById('editSkuBarcode').value = item.barcode || '';
    document.getElementById('editSkuWeight').value = item.weightGram || '';
    document.getElementById('editSkuLength').value = item.lengthCm || '';
    document.getElementById('editSkuWidth').value = item.widthCm || '';
    document.getElementById('editSkuHeight').value = item.heightCm || '';
    
    const isActive = item.isActive === true || item.isActive === 'true';
    document.getElementById('editSkuActive').value = isActive ? 'true' : 'false';
    
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditingSku = null;
}

async function saveEditedSku() {
    if (!currentEditingSku) return;
    
    const id = currentEditingSku.id;
    
    // Construct DTO
    const productSkuDTO = {
        id: id,
        productId: currentEditingSku.productId || currentEditingSku.product?.id,
        sku: document.getElementById('editSkuCode').value.trim(),
        name: document.getElementById('editSkuName').value.trim(),
        price: parseFloat(document.getElementById('editSkuPrice').value),
        barcode: document.getElementById('editSkuBarcode').value.trim() || null,
        weightGram: parseInt(document.getElementById('editSkuWeight').value) || null,
        lengthCm: parseInt(document.getElementById('editSkuLength').value) || null,
        widthCm: parseInt(document.getElementById('editSkuWidth').value) || null,
        heightCm: parseInt(document.getElementById('editSkuHeight').value) || null,
        isActive: document.getElementById('editSkuActive').value === 'true',
        // Preserve fields if they exist in currentEditingSku
        optionName: currentEditingSku.optionName || null,
        skuImage: currentEditingSku.skuImage || currentEditingSku.imageUrl || null
    };
    
    if (!productSkuDTO.sku || !productSkuDTO.name || !productSkuDTO.price) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }

    showLoading(true);
    try {
        // Use POST for update as per API doc
        const response = await fetch(`${BASE_URL}/product-skus/${id}`, {
            method: 'POST', 
            headers: getAuthHeaders(),
            body: JSON.stringify(productSkuDTO)
        });
        
        if (response.ok) {
            showToast('Cập nhật thành công', 'success');
            closeEditModal();
            loadProducts();
        } else {
            const err = await response.json();
            throw new Error(err.message || 'Lỗi cập nhật');
        }
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ================== HELPERS ==================

function showLoading(isLoading) {
    const overlay = document.getElementById('loadingOverlay');
    if(overlay) {
        if(isLoading) overlay.classList.add('active');
        else overlay.classList.remove('active');
    }
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
    const info = document.getElementById('pageInfo');
    const pagination = document.getElementById('pagination');
    
    if(info) info.textContent = `Trang ${currentPage + 1} / ${totalPages}`;
    if(pagination) pagination.style.display = totalPages > 1 ? 'block' : 'none';
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if(prevBtn) prevBtn.disabled = currentPage === 0;
    if(nextBtn) nextBtn.disabled = currentPage === totalPages - 1;
}
