let categories = [];
let filteredCategories = [];
let editingId = null;

// Brand management
let allBrands = [];
let availableBrands = [];
let selectedBrands = [];
let selectedAvailableIds = new Set();
let selectedSelectedIds = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;
    
    await loadSidebar();
    loadUserInfo();
    await loadBrands();
    await loadCategories();
});

// Load all categories
async function loadCategories() {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/categories`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        console.log('Categories response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Categories error:', errorText);
            throw new Error('Failed to load categories');
        }
        
        const data = await response.json();
        console.log('Categories data:', data);
        
        // Backend trả về ApiResponse với payload
        if (data.payload) {
            categories = Array.isArray(data.payload) ? data.payload : [];
        } else {
            categories = Array.isArray(data) ? data : [];
        }
        
        filteredCategories = [...categories];
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Lỗi tải dữ liệu danh mục: ' + error.message, 'error');
        document.getElementById('categoriesTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff6b6b;"></i>
                    <p style="color: #666; margin-top: 10px;">Không thể tải dữ liệu. Vui lòng kiểm tra kết nối API.</p>
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

// Load all brands
async function loadBrands() {
    try {
        const response = await fetch(`${BASE_URL}/brands`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load brands');
        }
        
        const data = await response.json();
        allBrands = data.payload || data || [];
        console.log('Loaded brands:', allBrands.length);
    } catch (error) {
        console.error('Error loading brands:', error);
        showToast('Lỗi tải brands: ' + error.message, 'error');
    }
}

// Render categories table
function renderCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    
    if (filteredCategories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-list" style="font-size: 2rem; color: #ccc;"></i>
                    <p style="color: #999; margin-top: 10px;">Chưa có danh mục nào</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredCategories.map(category => {
        const statusClass = category.isActive ? 'badge-success' : 'badge-danger';
        const statusText = category.isActive ? 'Hoạt động' : 'Ngưng hoạt động';
        
        return `
            <tr>
                <td>${category.id}</td>
                <td><strong>${category.name}</strong></td>
                <td><code>${category.slug || 'N/A'}</code></td>
                <td style="text-align: center;">${category.sortOrder || 0}</td>
                <td style="text-align: center;"><span class="badge ${statusClass}">${statusText}</span></td>
                <td style="text-align: center;">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editCategory(${category.id})" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteCategory(${category.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Search categories
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredCategories = categories.filter(category => {
        return category.name.toLowerCase().includes(searchTerm) ||
               (category.slug && category.slug.toLowerCase().includes(searchTerm));
    });
    
    renderCategories();
}

// Generate slug from name
function generateSlug(name) {
    if (!name) return '';
    
    // Chuyển đổi tiếng Việt không dấu
    const from = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
    const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
    
    let slug = name.toLowerCase();
    
    for (let i = 0; i < from.length; i++) {
        slug = slug.replace(new RegExp(from[i], 'g'), to[i]);
    }
    
    slug = slug
        .replace(/[^a-z0-9\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-')          // Thay khoảng trắng bằng -
        .replace(/-+/g, '-')           // Xóa - trùng lặp
        .replace(/^-|-$/g, '');        // Xóa - ở đầu và cuối
    
    return slug;
}

// Auto generate slug when typing name
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('categoryName');
    const slugInput = document.getElementById('categorySlug');
    
    if (nameInput && slugInput) {
        nameInput.addEventListener('input', function() {
            // Chỉ tự động tạo slug nếu đang thêm mới (không có ID)
            const categoryId = document.getElementById('categoryId').value;
            if (!categoryId) {
                slugInput.value = generateSlug(this.value);
            }
        });
    }
});

// Open add modal
function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Thêm Danh Mục';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('sortOrder').value = '0';
    document.getElementById('isActive').checked = true;
    
    // Reset brand selection
    selectedBrands = [];
    availableBrands = [...allBrands];
    renderBrandLists();
    
    document.getElementById('addModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    editingId = null;
}

// Edit category
async function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Sửa Danh Mục';
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySlug').value = category.slug || '';
    document.getElementById('sortOrder').value = category.sortOrder || 0;
    document.getElementById('isActive').checked = category.isActive;
    
    // Load brands for this category
    await loadCategoryBrands(id);
    
    document.getElementById('addModal').style.display = 'flex';
}

// Load brands for a category
async function loadCategoryBrands(categoryId) {
    try {
        const response = await fetch(`${BASE_URL}/brands/category/${categoryId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load category brands');
        }
        
        const data = await response.json();
        const categoryBrands = data.payload || data || [];
        
        // Set selected brands
        selectedBrands = [...categoryBrands];
        
        // Set available brands (all - selected)
        const selectedIds = new Set(selectedBrands.map(b => b.id));
        availableBrands = allBrands.filter(b => !selectedIds.has(b.id));
        
        renderBrandLists();
    } catch (error) {
        console.error('Error loading category brands:', error);
        // If error, show all as available
        selectedBrands = [];
        availableBrands = [...allBrands];
        renderBrandLists();
    }
}

// Save category (Create or Update)
async function saveCategory(event) {
    event.preventDefault();
    
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    let slug = document.getElementById('categorySlug').value.trim();
    
    // Nếu slug rỗng, tự động tạo từ name
    if (!slug) {
        slug = generateSlug(name);
    }
    
    const categoryData = {
        name: name,
        slug: slug,
        sortOrder: parseInt(document.getElementById('sortOrder').value) || 0,
        isActive: document.getElementById('isActive').checked,
        brandIds: selectedBrands.map(b => b.id) // Add brand IDs
    };
    
    if (!categoryData.name) {
        showToast('Vui lòng nhập tên danh mục', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const url = id ? `${BASE_URL}/categories/${id}` : `${BASE_URL}/categories`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save category');
        }
        
        const result = await response.json();
        console.log('Save category result:', result);
        
        showToast(id ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công', 'success');
        closeModal();
        await loadCategories();
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Delete category
async function deleteCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete category');
        }
        
        showToast('Xóa danh mục thành công', 'success');
        await loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addModal');
    if (event.target === modal) {
        closeModal();
    }
};

// ========== BRAND MULTI-SELECT FUNCTIONS ==========

// Render brand lists
function renderBrandLists() {
    renderAvailableBrands();
    renderSelectedBrands();
    updateBrandCounts();
    selectedAvailableIds.clear();
    selectedSelectedIds.clear();
}

// Render available brands
function renderAvailableBrands() {
    const container = document.getElementById('availableBrandList');
    const searchTerm = document.getElementById('brandSearch').value.toLowerCase();
    
    const filtered = availableBrands.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="brand-list-empty">
                <i class="fas fa-inbox"></i>
                <p>${searchTerm ? 'Không tìm thấy brand' : 'Tất cả brands đã được chọn'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(brand => `
        <div class="brand-item" data-id="${brand.id}">
            <input type="checkbox" 
                   id="avail-${brand.id}" 
                   onchange="toggleAvailableSelection(${brand.id})">
            <div class="brand-item-info">
                <div class="brand-item-logo">${brand.name.charAt(0).toUpperCase()}</div>
                <span class="brand-item-name">${brand.name}</span>
            </div>
        </div>
    `).join('');
}

// Render selected brands
function renderSelectedBrands() {
    const container = document.getElementById('selectedBrandList');
    
    if (selectedBrands.length === 0) {
        container.innerHTML = `
            <div class="brand-list-empty">
                <i class="fas fa-hand-pointer"></i>
                <p>Chưa chọn brand nào</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = selectedBrands.map(brand => `
        <div class="brand-item" data-id="${brand.id}">
            <input type="checkbox" 
                   id="sel-${brand.id}" 
                   onchange="toggleSelectedSelection(${brand.id})">
            <div class="brand-item-info">
                <div class="brand-item-logo">${brand.name.charAt(0).toUpperCase()}</div>
                <span class="brand-item-name">${brand.name}</span>
            </div>
        </div>
    `).join('');
}

// Update brand counts
function updateBrandCounts() {
    document.getElementById('availableBrandCount').textContent = availableBrands.length;
    document.getElementById('selectedBrandCount').textContent = selectedBrands.length;
}

// Toggle available brand selection
function toggleAvailableSelection(brandId) {
    const checkbox = document.getElementById(`avail-${brandId}`);
    if (checkbox.checked) {
        selectedAvailableIds.add(brandId);
    } else {
        selectedAvailableIds.delete(brandId);
    }
}

// Toggle selected brand selection
function toggleSelectedSelection(brandId) {
    const checkbox = document.getElementById(`sel-${brandId}`);
    if (checkbox.checked) {
        selectedSelectedIds.add(brandId);
    } else {
        selectedSelectedIds.delete(brandId);
    }
}

// Add selected brands
function addSelectedBrands() {
    if (selectedAvailableIds.size === 0) {
        showToast('Vui lòng chọn ít nhất một brand', 'warning');
        return;
    }
    
    // Move from available to selected
    const toMove = availableBrands.filter(b => selectedAvailableIds.has(b.id));
    selectedBrands = [...selectedBrands, ...toMove];
    availableBrands = availableBrands.filter(b => !selectedAvailableIds.has(b.id));
    
    renderBrandLists();
}

// Remove selected brands
function removeSelectedBrands() {
    if (selectedSelectedIds.size === 0) {
        showToast('Vui lòng chọn ít nhất một brand để xóa', 'warning');
        return;
    }
    
    // Move from selected to available
    const toMove = selectedBrands.filter(b => selectedSelectedIds.has(b.id));
    availableBrands = [...availableBrands, ...toMove].sort((a, b) => a.name.localeCompare(b.name));
    selectedBrands = selectedBrands.filter(b => !selectedSelectedIds.has(b.id));
    
    renderBrandLists();
}

// Filter brands by search
function filterBrands() {
    renderAvailableBrands();
}

// Select all available brands
function selectAllAvailable() {
    availableBrands.forEach(brand => {
        const checkbox = document.getElementById(`avail-${brand.id}`);
        if (checkbox) {
            checkbox.checked = true;
            selectedAvailableIds.add(brand.id);
        }
    });
}

// Select all selected brands
function selectAllSelected() {
    selectedBrands.forEach(brand => {
        const checkbox = document.getElementById(`sel-${brand.id}`);
        if (checkbox) {
            checkbox.checked = true;
            selectedSelectedIds.add(brand.id);
        }
    });
}
