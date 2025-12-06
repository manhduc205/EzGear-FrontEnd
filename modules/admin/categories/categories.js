let categories = [];
let filteredCategories = [];
let editingId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;
    
    await loadSidebar();
    loadUserInfo();
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

// Render categories table
function renderCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    
    if (filteredCategories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
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
        const createdDate = category.createdAt ? formatDateTime(category.createdAt) : 'N/A';
        
        return `
            <tr>
                <td>${category.id}</td>
                <td><strong>${category.name}</strong></td>
                <td><code>${category.slug || 'N/A'}</code></td>
                <td style="text-align: center;">${category.sortOrder || 0}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editCategory(${category.id})" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteCategory(${category.id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
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
    document.getElementById('addModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    editingId = null;
}

// Edit category
function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Sửa Danh Mục';
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySlug').value = category.slug || '';
    document.getElementById('sortOrder').value = category.sortOrder || 0;
    document.getElementById('isActive').checked = category.isActive;
    document.getElementById('addModal').style.display = 'flex';
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
        isActive: document.getElementById('isActive').checked
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
