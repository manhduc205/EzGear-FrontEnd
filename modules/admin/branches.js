// Branches Management JavaScript
let branches = [];
let filteredBranches = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadBranches();
});

// Load all branches
async function loadBranches() {
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/branches`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        console.log('Branches response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Branches error:', errorText);
            throw new Error('Failed to load branches');
        }
        
        const data = await response.json();
        console.log('Branches data:', data);
        
        // Backend trả về mảng trực tiếp, không có wrapper
        branches = Array.isArray(data) ? data : [];
        filteredBranches = [...branches];
        renderBranches();
    } catch (error) {
        console.error('Error loading branches:', error);
        showToast('Lỗi tải dữ liệu chi nhánh: ' + error.message, 'error');
        document.getElementById('branchesTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Không thể tải dữ liệu. Vui lòng kiểm tra API.
                </td>
            </tr>
        `;
    } finally {
        showLoading(false);
    }
}

// Render branches table
function renderBranches() {
    const tbody = document.getElementById('branchesTableBody');
    
    if (filteredBranches.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Chưa có chi nhánh nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredBranches.map(branch => `
        <tr>
            <td><strong>#${branch.id}</strong></td>
            <td><strong>${branch.name}</strong></td>
            <td>${branch.address || 'N/A'}</td>
            <td>${branch.phone || 'N/A'}</td>
            <td>${branch.email || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editBranch(${branch.id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBranch(${branch.id}, '${branch.name}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Search branches
function handleSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!keyword) {
        filteredBranches = [...branches];
    } else {
        filteredBranches = branches.filter(branch => 
            branch.name.toLowerCase().includes(keyword) ||
            (branch.address && branch.address.toLowerCase().includes(keyword)) ||
            (branch.phone && branch.phone.includes(keyword)) ||
            (branch.email && branch.email.toLowerCase().includes(keyword))
        );
    }
    
    renderBranches();
}

// Open add modal
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Thêm Chi Nhánh';
    document.getElementById('branchForm').reset();
    document.getElementById('branchId').value = '';
    document.getElementById('branchModal').classList.add('active');
}

// Edit branch
function editBranch(id) {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;
    
    document.getElementById('modalTitle').textContent = 'Sửa Chi Nhánh';
    document.getElementById('branchId').value = branch.id;
    document.getElementById('branchName').value = branch.name;
    document.getElementById('branchAddress').value = branch.address || '';
    document.getElementById('branchPhone').value = branch.phone || '';
    document.getElementById('branchEmail').value = branch.email || '';
    document.getElementById('branchModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('branchModal').classList.remove('active');
    document.getElementById('branchForm').reset();
}

// Handle form submit
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('branchForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBranch();
        });
    }
});

// Save branch
async function saveBranch() {
    const id = document.getElementById('branchId').value;
    const name = document.getElementById('branchName').value.trim();
    const address = document.getElementById('branchAddress').value.trim();
    const phone = document.getElementById('branchPhone').value.trim();
    const email = document.getElementById('branchEmail').value.trim();
    
    if (!name || !address) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const url = id ? `${BASE_URL}/branches/${id}` : `${BASE_URL}/branches`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, address, phone, email })
        });
        
        if (!response.ok) throw new Error('Failed to save branch');
        
        const data = await response.json();
        
        showToast(id ? 'Cập nhật chi nhánh thành công!' : 'Thêm chi nhánh thành công!', 'success');
        closeModal();
        await loadBranches();
    } catch (error) {
        console.error('Error saving branch:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Delete branch
async function deleteBranch(id, name) {
    const confirm = window.confirm(`Bạn có chắc muốn xóa chi nhánh "${name}"?`);
    if (!confirm) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/branches/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to delete branch');
        
        showToast('Xóa chi nhánh thành công!', 'success');
        await loadBranches();
    } catch (error) {
        console.error('Error deleting branch:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}
