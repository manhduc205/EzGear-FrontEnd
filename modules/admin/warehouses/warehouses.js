let warehouses = [];
let filteredWarehouses = [];
let branches = [];
let editingId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;
    
    await loadSidebar();
    loadUserInfo();
    await loadBranches();
    await loadWarehouses();
});

// Load branches for dropdown
async function loadBranches() {
    try {
        const response = await fetch(`${BASE_URL}/branches`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load branches');
        
        branches = await response.json();
        console.log('Loaded branches:', branches);
        populateBranchesDropdown();
    } catch (error) {
        console.error('Error loading branches:', error);
        showToast('Lỗi tải danh sách chi nhánh', 'error');
    }
}

// Populate branches dropdown
function populateBranchesDropdown() {
    const branchSelect = document.getElementById('branchId');
    branchSelect.innerHTML = '<option value="">-- Chọn chi nhánh --</option>';
    
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.id;
        option.textContent = branch.name;
        branchSelect.appendChild(option);
    });
}

// Load all warehouses
async function loadWarehouses() {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/warehouses`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        console.log('Warehouses response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Warehouses error:', errorText);
            throw new Error('Failed to load warehouses');
        }
        
        const data = await response.json();
        console.log('Warehouses data:', data);
        
        warehouses = Array.isArray(data) ? data : [];
        filteredWarehouses = [...warehouses];
        renderWarehouses();
    } catch (error) {
        console.error('Error loading warehouses:', error);
        showToast('Lỗi tải dữ liệu kho hàng: ' + error.message, 'error');
        document.getElementById('warehousesTableBody').innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff6b6b;"></i>
                    <p style="color: #666; margin-top: 10px;">Không thể tải dữ liệu. Vui lòng kiểm tra kết nối API.</p>
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

// Render warehouses table
function renderWarehouses() {
    const tbody = document.getElementById('warehousesTableBody');
    
    if (filteredWarehouses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-warehouse" style="font-size: 2rem; color: #ccc;"></i>
                    <p style="color: #999; margin-top: 10px;">Chưa có kho hàng nào</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredWarehouses.map(warehouse => {
        const branch = branches.find(b => b.id === warehouse.branchId);
        const branchName = branch ? branch.name : '<span style="color: #999;">N/A</span>';
        const statusClass = warehouse.isActive ? 'badge-success' : 'badge-danger';
        const statusText = warehouse.isActive ? 'Hoạt động' : 'Ngưng hoạt động';
        
        return `
            <tr>
                <td>${warehouse.id}</td>
                <td><strong>${warehouse.name}</strong></td>
                <td>${warehouse.address}</td>
                <td>${branchName}</td>
                <td>${warehouse.phone || '<span style="color: #999;">N/A</span>'}</td>
                <td>${warehouse.email || '<span style="color: #999;">N/A</span>'}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editWarehouse(${warehouse.id})" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteWarehouse(${warehouse.id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search warehouses
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredWarehouses = warehouses.filter(warehouse => {
        const branch = branches.find(b => b.id === warehouse.branchId);
        const branchName = branch ? branch.name.toLowerCase() : '';
        
        return warehouse.name.toLowerCase().includes(searchTerm) ||
               warehouse.address.toLowerCase().includes(searchTerm) ||
               branchName.includes(searchTerm) ||
               (warehouse.phone && warehouse.phone.includes(searchTerm)) ||
               (warehouse.email && warehouse.email.toLowerCase().includes(searchTerm));
    });
    
    renderWarehouses();
}

// Open add modal
function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Thêm Kho Hàng';
    document.getElementById('warehouseForm').reset();
    document.getElementById('warehouseId').value = '';
    document.getElementById('isActive').checked = true;
    document.getElementById('addModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    editingId = null;
}

// Edit warehouse
function editWarehouse(id) {
    const warehouse = warehouses.find(w => w.id === id);
    if (!warehouse) return;
    
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Sửa Kho Hàng';
    document.getElementById('warehouseId').value = warehouse.id;
    document.getElementById('warehouseName').value = warehouse.name;
    document.getElementById('warehouseAddress').value = warehouse.address;
    document.getElementById('branchId').value = warehouse.branchId || '';
    document.getElementById('warehousePhone').value = warehouse.phone || '';
    document.getElementById('warehouseEmail').value = warehouse.email || '';
    document.getElementById('warehouseNotes').value = warehouse.notes || '';
    document.getElementById('isActive').checked = warehouse.isActive;
    document.getElementById('addModal').style.display = 'flex';
}

// Save warehouse (Create or Update)
async function saveWarehouse(event) {
    event.preventDefault();
    
    const id = document.getElementById('warehouseId').value;
    const warehouseData = {
        name: document.getElementById('warehouseName').value.trim(),
        address: document.getElementById('warehouseAddress').value.trim(),
        branchId: parseInt(document.getElementById('branchId').value),
        phone: document.getElementById('warehousePhone').value.trim() || null,
        email: document.getElementById('warehouseEmail').value.trim() || null,
        notes: document.getElementById('warehouseNotes').value.trim() || null,
        isActive: document.getElementById('isActive').checked
    };
    
    if (!warehouseData.name) {
        showToast('Vui lòng nhập tên kho hàng', 'error');
        return;
    }
    
    if (!warehouseData.address) {
        showToast('Vui lòng nhập địa chỉ', 'error');
        return;
    }
    
    if (!warehouseData.branchId) {
        showToast('Vui lòng chọn chi nhánh', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const url = id ? `${BASE_URL}/warehouses/${id}` : `${BASE_URL}/warehouses`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(warehouseData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save warehouse');
        }
        
        showToast(id ? 'Cập nhật kho hàng thành công' : 'Thêm kho hàng thành công', 'success');
        closeModal();
        await loadWarehouses();
    } catch (error) {
        console.error('Error saving warehouse:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Delete warehouse
async function deleteWarehouse(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa kho hàng này?')) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/warehouses/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete warehouse');
        }
        
        showToast('Xóa kho hàng thành công', 'success');
        await loadWarehouses();
    } catch (error) {
        console.error('Error deleting warehouse:', error);
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
