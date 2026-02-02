// Branches Management JavaScript
const GHN_API = `${window.API_BASE_URL}/api/ghn/location`;

let branches = [];
let filteredBranches = [];

// Location Picker State
let selectedProvince = { id: null, name: '' };
let selectedDistrict = { id: null, name: '' };
let selectedWard = { code: '', name: '' };
let currentTab = 'province';

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
    
    // Reset location picker
    selectedProvince = { id: null, name: '' };
    selectedDistrict = { id: null, name: '' };
    selectedWard = { code: '', name: '' };
    document.getElementById('selectedLocation').textContent = 'Chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã';
    document.getElementById('provinceId').value = '';
    document.getElementById('districtId').value = '';
    document.getElementById('wardCode').value = '';
    
    document.getElementById('branchModal').classList.add('active');
}

// Edit branch
function editBranch(id) {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;
    
    document.getElementById('modalTitle').textContent = 'Sửa Chi Nhánh';
    document.getElementById('branchId').value = branch.id;
    document.getElementById('branchName').value = branch.name;
    document.getElementById('branchCode').value = branch.code || '';
    document.getElementById('branchAddress').value = branch.addressLine || '';
    document.getElementById('branchPhone').value = branch.phone || '';
    
    // Set location data if available
    if (branch.provinceId && branch.districtId && branch.wardCode) {
        document.getElementById('provinceId').value = branch.provinceId;
        document.getElementById('districtId').value = branch.districtId;
        document.getElementById('wardCode').value = branch.wardCode;
        document.getElementById('selectedLocation').textContent = 'Đã chọn khu vực';
        
        selectedProvince = { id: branch.provinceId, name: '' };
        selectedDistrict = { id: branch.districtId, name: '' };
        selectedWard = { code: branch.wardCode, name: '' };
    }
    
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
    const code = document.getElementById('branchCode').value.trim();
    const addressLine = document.getElementById('branchAddress').value.trim();
    const phone = document.getElementById('branchPhone').value.trim();
    const provinceId = parseInt(document.getElementById('provinceId').value);
    const districtId = parseInt(document.getElementById('districtId').value);
    const wardCode = document.getElementById('wardCode').value.trim();
    
    if (!name || !code || !addressLine || !phone) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }
    
    if (!provinceId || !districtId || !wardCode) {
        showToast('Vui lòng chọn khu vực', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const url = id ? `${BASE_URL}/branches/${id}` : `${BASE_URL}/branches`;
        const method = id ? 'PUT' : 'POST';
        
        const body = {
            name,
            code,
            provinceId,
            districtId,
            wardCode,
            addressLine,
            phone,
            isActive: true
        };
        
        console.log('Saving branch:', body);
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save branch');
        }
        
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

// ==================== GHN LOCATION PICKER ====================

function openLocationModal() {
    document.getElementById('locationModal').classList.add('active');
    currentTab = 'province';
    loadProvinces();
}

function closeLocationModal() {
    document.getElementById('locationModal').classList.remove('active');
}

function switchTab(tab) {
    currentTab = tab;
    
    document.getElementById('provinceList').style.display = 'none';
    document.getElementById('districtList').style.display = 'none';
    document.getElementById('wardList').style.display = 'none';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'province') {
        document.getElementById('provinceList').style.display = 'block';
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
    } else if (tab === 'district') {
        document.getElementById('districtList').style.display = 'block';
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
    } else if (tab === 'ward') {
        document.getElementById('wardList').style.display = 'block';
        document.querySelector('.tab-btn:nth-child(3)').classList.add('active');
    }
}

async function loadProvinces() {
    const list = document.getElementById('provinceList');
    list.classList.add('loading');
    list.innerHTML = '';
    
    try {
        const response = await fetch(`${GHN_API}/provinces`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Không thể tải danh sách tỉnh/thành phố');
        
        const data = await response.json();
        console.log('📍 Provinces loaded:', data);
        
        const provinces = data.payload?.data || data.data || data;
        
        list.classList.remove('loading');
        list.innerHTML = '';
        
        if (!provinces || provinces.length === 0) {
            list.innerHTML = '<div class="empty-location"><i class="fas fa-inbox"></i><p>Không có dữ liệu</p></div>';
            return;
        }
        
        provinces.forEach(province => {
            const div = document.createElement('div');
            div.className = 'location-item';
            div.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>${province.ProvinceName}</span>`;
            div.onclick = () => selectProvince(province);
            list.appendChild(div);
        });
    } catch (error) {
        console.error('❌ Error loading provinces:', error);
        list.classList.remove('loading');
        list.innerHTML = '<div class="empty-location"><i class="fas fa-exclamation-triangle"></i><p>Lỗi tải dữ liệu</p></div>';
    }
}

function selectProvince(province) {
    selectedProvince = { id: province.ProvinceID, name: province.ProvinceName };
    selectedDistrict = { id: null, name: '' };
    selectedWard = { code: '', name: '' };
    
    console.log('✅ Selected province:', selectedProvince);
    
    document.getElementById('provinceLabel').textContent = province.ProvinceName;
    document.getElementById('districtTabBtn').disabled = false;
    
    loadDistricts(province.ProvinceID);
    switchTab('district');
}

async function loadDistricts(provinceId) {
    const list = document.getElementById('districtList');
    list.classList.add('loading');
    list.innerHTML = '';
    
    try {
        const response = await fetch(`${GHN_API}/districts?provinceId=${provinceId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Không thể tải danh sách quận/huyện');
        
        const data = await response.json();
        console.log('📍 Districts loaded:', data);
        
        const districts = data.payload?.data || data.data || data;
        
        list.classList.remove('loading');
        list.innerHTML = '';
        
        if (!districts || districts.length === 0) {
            list.innerHTML = '<div class="empty-location"><i class="fas fa-inbox"></i><p>Không có dữ liệu</p></div>';
            return;
        }
        
        districts.forEach(district => {
            const div = document.createElement('div');
            div.className = 'location-item';
            div.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>${district.DistrictName}</span>`;
            div.onclick = () => selectDistrict(district);
            list.appendChild(div);
        });
    } catch (error) {
        console.error('❌ Error loading districts:', error);
        list.classList.remove('loading');
        list.innerHTML = '<div class="empty-location"><i class="fas fa-exclamation-triangle"></i><p>Lỗi tải dữ liệu</p></div>';
    }
}

function selectDistrict(district) {
    selectedDistrict = { id: district.DistrictID, name: district.DistrictName };
    selectedWard = { code: '', name: '' };
    
    console.log('✅ Selected district:', selectedDistrict);
    
    document.getElementById('districtLabel').textContent = district.DistrictName;
    document.getElementById('wardTabBtn').disabled = false;
    
    loadWards(district.DistrictID);
    switchTab('ward');
}

async function loadWards(districtId) {
    const list = document.getElementById('wardList');
    list.classList.add('loading');
    list.innerHTML = '';
    
    try {
        const response = await fetch(`${GHN_API}/wards?districtId=${districtId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Không thể tải danh sách phường/xã');
        
        const data = await response.json();
        console.log('📍 Wards loaded:', data);
        
        const wards = data.payload?.data || data.data || data;
        
        list.classList.remove('loading');
        list.innerHTML = '';
        
        if (!wards || wards.length === 0) {
            list.innerHTML = '<div class="empty-location"><i class="fas fa-inbox"></i><p>Không có dữ liệu</p></div>';
            return;
        }
        
        wards.forEach(ward => {
            const div = document.createElement('div');
            div.className = 'location-item';
            div.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>${ward.WardName}</span>`;
            div.onclick = () => selectWard(ward, div);
            list.appendChild(div);
        });
    } catch (error) {
        console.error('❌ Error loading wards:', error);
        list.classList.remove('loading');
        list.innerHTML = '<div class="empty-location"><i class="fas fa-exclamation-triangle"></i><p>Lỗi tải dữ liệu</p></div>';
    }
}

function selectWard(ward, element) {
    selectedWard = { code: ward.WardCode, name: ward.WardName };
    
    console.log('✅ Selected ward:', selectedWard);
    
    document.querySelectorAll('#wardList .location-item').forEach(d => d.classList.remove('selected'));
    element.classList.add('selected');
    
    document.getElementById('wardLabel').textContent = ward.WardName;
    document.getElementById('confirmLocationBtn').disabled = false;
}

function confirmLocation() {
    if (!selectedProvince.id || !selectedDistrict.id || !selectedWard.code) {
        showToast('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã', 'warning');
        return;
    }
    
    document.getElementById('provinceId').value = selectedProvince.id;
    document.getElementById('districtId').value = selectedDistrict.id;
    document.getElementById('wardCode').value = selectedWard.code;
    
    const locationText = `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
    document.getElementById('selectedLocation').textContent = locationText;
    
    closeLocationModal();
    showToast('Đã chọn khu vực', 'success');
}
