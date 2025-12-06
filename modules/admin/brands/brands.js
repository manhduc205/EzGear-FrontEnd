// Brands Management JavaScript
let brands = [];
let filteredBrands = [];

// Load brands on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadBrands();
    
    // Auto-generate slug from name
    document.getElementById('brandName').addEventListener('input', function() {
        const slug = generateSlug(this.value);
        document.getElementById('brandSlug').value = slug;
    });
});

// Load all brands
async function loadBrands() {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/brands`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load brands');
        
        const data = await response.json();
        console.log('Brands data:', data);
        
        if (data.success && data.payload) {
            brands = data.payload;
            filteredBrands = [...brands];
            renderBrands();
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        showToast('Lỗi tải dữ liệu thương hiệu', 'error');
        document.getElementById('brandsTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Không thể tải dữ liệu
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

// Render brands table
function renderBrands() {
    const tbody = document.getElementById('brandsTableBody');
    
    if (filteredBrands.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Chưa có thương hiệu nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredBrands.map(brand => `
        <tr>
            <td><strong>#${brand.id}</strong></td>
            <td><strong>${brand.name}</strong></td>
            <td><code>${brand.slug}</code></td>
            <td>${brand.createdAt ? formatDateTime(brand.createdAt) : 'N/A'}</td>
            <td>${brand.updatedAt ? formatDateTime(brand.updatedAt) : 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editBrand(${brand.id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBrand(${brand.id}, '${brand.name}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Search brands
function handleSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!keyword) {
        filteredBrands = [...brands];
    } else {
        filteredBrands = brands.filter(brand => 
            brand.name.toLowerCase().includes(keyword) ||
            brand.slug.toLowerCase().includes(keyword)
        );
    }
    
    renderBrands();
}

// Open add modal
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Thêm Thương Hiệu';
    document.getElementById('brandForm').reset();
    document.getElementById('brandId').value = '';
    document.getElementById('brandModal').classList.add('active');
}

// Edit brand
function editBrand(id) {
    const brand = brands.find(b => b.id === id);
    if (!brand) return;
    
    document.getElementById('modalTitle').textContent = 'Sửa Thương Hiệu';
    document.getElementById('brandId').value = brand.id;
    document.getElementById('brandName').value = brand.name;
    document.getElementById('brandSlug').value = brand.slug;
    document.getElementById('brandModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('brandModal').classList.remove('active');
    document.getElementById('brandForm').reset();
}

// Handle form submit
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('brandForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBrand();
        });
    }
});

// Save brand (Create or Update)
async function saveBrand() {
    const id = document.getElementById('brandId').value;
    const name = document.getElementById('brandName').value.trim();
    const slug = document.getElementById('brandSlug').value.trim();
    
    if (!name || !slug) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const url = id ? `${BASE_URL}/brands/${id}` : `${BASE_URL}/brands`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, slug })
        });
        
        if (!response.ok) throw new Error('Failed to save brand');
        
        const data = await response.json();
        
        if (data.success) {
            showToast(id ? 'Cập nhật thương hiệu thành công!' : 'Thêm thương hiệu thành công!', 'success');
            closeModal();
            await loadBrands();
        } else {
            throw new Error(data.message || data.error || 'Failed to save brand');
        }
    } catch (error) {
        console.error('Error saving brand:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Delete brand
async function deleteBrand(id, name) {
    const confirm = window.confirm(`Bạn có chắc muốn xóa thương hiệu "${name}"?`);
    if (!confirm) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/brands/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to delete brand');
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Xóa thương hiệu thành công!', 'success');
            await loadBrands();
        } else {
            throw new Error(data.message || data.error || 'Failed to delete brand');
        }
    } catch (error) {
        console.error('Error deleting brand:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Generate slug from string
function generateSlug(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
