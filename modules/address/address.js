/* ==================== ADDRESS MODULE JS ==================== */
/* Quản lý địa chỉ khách hàng - GearVN Theme */

// ==================== API ENDPOINTS ====================
const GHN_API_BASE = `${window.BASE_URL}/api/ghn/location`;
const ADDRESS_API = `${window.BASE_URL}/api/customer-addresses`;

// ==================== STATE MANAGEMENT ====================
let selectedProvince = { id: '', name: '' };
let selectedDistrict = { id: '', name: '' };
let selectedWard = { code: '', name: '' };
let selectedAddressType = "Nhà Riêng";

// ==================== DOM ELEMENTS ====================
const modal = document.getElementById("pickerModal");
const openPicker = document.getElementById("openPicker");
const closeModal = document.getElementById("closeModal");
const confirmBtn = document.getElementById("confirmBtn");
const locationText = document.getElementById("locationText");
const selectedAddress = document.getElementById("selectedAddress");
const addressForm = document.getElementById("addressForm");
const cancelBtn = document.getElementById("cancelBtn");
const submitBtn = document.getElementById("submitBtn");
const backBtn = document.getElementById("backBtn");
const typeButtons = document.querySelectorAll(".type-btn");

const provinceTab = document.getElementById("provinceTab");
const districtTab = document.getElementById("districtTab");
const wardTab = document.getElementById("wardTab");

const tabButtons = document.querySelectorAll(".tabs button");

// ==================== MODAL CONTROL ====================

/**
 * Mở modal chọn địa chỉ
 */
function openModal() {
    modal.classList.remove("hidden");
    if (!provinceTab.children.length) {
        loadProvinces();
    }
}

/**
 * Đóng modal
 */
function closeModalHandler() {
    modal.classList.add("hidden");
}

/**
 * Xác nhận chọn địa chỉ
 */
function confirmSelection() {
    if (selectedProvince.name && selectedDistrict.name && selectedWard.name) {
        locationText.textContent = `${selectedProvince.name}, ${selectedDistrict.name}, ${selectedWard.name}`;
        locationText.classList.remove('placeholder');
        selectedAddress.textContent = `${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;
        confirmBtn.disabled = false;
        closeModalHandler();
    } else {
        showToast('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã', 'warning');
    }
}

// ==================== TAB CONTROL ====================

/**
 * Hiển thị tab
 * @param {string} tabId - ID của tab cần hiển thị
 */
function showTab(tabId) {
    // Ẩn tất cả tab content
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
    
    // Bỏ active tất cả tab buttons
    tabButtons.forEach(btn => btn.classList.remove("active"));
    
    // Hiển thị tab được chọn
    document.getElementById(tabId).classList.remove("hidden");
    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
}

/**
 * Enable tab button
 * @param {string} tabId - ID của tab
 */
function enableTab(tabId) {
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) btn.disabled = false;
}

// ==================== LOADING ====================

/**
 * Hiển thị loading trong tab
 * @param {HTMLElement} tab - Tab element
 */
function showLoading(tab) {
    tab.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
}

// ==================== API CALLS ====================

/**
 * Lấy danh sách tỉnh/thành phố
 */
async function loadProvinces() {
    showLoading(provinceTab);
    
    try {
        const response = await fetch(`${GHN_API_BASE}/provinces`);
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách tỉnh/thành phố');
        }
        
        const data = await response.json();
        console.log('📍 Provinces loaded:', data);
        
        // Backend trả về ApiResponse với payload
        const provinces = data.payload?.data || data.data || data;
        
        provinceTab.innerHTML = '';
        
        if (!provinces || provinces.length === 0) {
            provinceTab.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Không có dữ liệu</div>';
            return;
        }
        
        provinces.forEach(province => {
            const div = document.createElement("div");
            div.textContent = province.ProvinceName;
            div.onclick = () => selectProvince(province);
            provinceTab.appendChild(div);
        });
        
    } catch (error) {
        console.error('❌ Error loading provinces:', error);
        showToast('Lỗi tải danh sách tỉnh/thành phố', 'error');
        // Load sample data nếu API lỗi
        loadSampleProvinces();
    }
}

/**
 * Chọn tỉnh/thành phố
 * @param {Object} province - Province object
 */
function selectProvince(province) {
    selectedProvince = { id: province.ProvinceID, name: province.ProvinceName };
    selectedDistrict = { id: '', name: '' };
    selectedWard = { code: '', name: '' };
    
    console.log('✅ Selected province:', selectedProvince);
    
    loadDistricts(province.ProvinceID);
    enableTab('districtTab');
    showTab('districtTab');
    
    // Disable ward tab khi chọn tỉnh mới
    document.querySelector('[data-tab="wardTab"]').disabled = true;
    confirmBtn.disabled = true;
}

/**
 * Lấy danh sách quận/huyện
 * @param {number} provinceId - Province ID
 */
async function loadDistricts(provinceId) {
    showLoading(districtTab);
    
    try {
        const response = await fetch(`${GHN_API_BASE}/districts?provinceId=${provinceId}`);
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách quận/huyện');
        }
        
        const data = await response.json();
        console.log('📍 Districts loaded:', data);
        
        const districts = data.payload?.data || data.data || data;
        
        districtTab.innerHTML = "";
        
        if (!districts || districts.length === 0) {
            districtTab.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Không có dữ liệu</div>';
            return;
        }
        
        districts.forEach(district => {
            const div = document.createElement("div");
            div.textContent = district.DistrictName;
            div.onclick = () => selectDistrict(district);
            districtTab.appendChild(div);
        });
        
    } catch (error) {
        console.error('❌ Error loading districts:', error);
        showToast('Lỗi tải danh sách quận/huyện', 'error');
        loadSampleDistricts(provinceId);
    }
}

/**
 * Chọn quận/huyện
 * @param {Object} district - District object
 */
function selectDistrict(district) {
    selectedDistrict = { id: district.DistrictID, name: district.DistrictName };
    selectedWard = { code: '', name: '' };
    
    console.log('✅ Selected district:', selectedDistrict);
    
    loadWards(district.DistrictID);
    enableTab('wardTab');
    showTab('wardTab');
    
    confirmBtn.disabled = true;
}

/**
 * Lấy danh sách phường/xã
 * @param {number} districtId - District ID
 */
async function loadWards(districtId) {
    showLoading(wardTab);
    
    try {
        const response = await fetch(`${GHN_API_BASE}/wards?districtId=${districtId}`);
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách phường/xã');
        }
        
        const data = await response.json();
        console.log('📍 Wards loaded:', data);
        
        const wards = data.payload?.data || data.data || data;
        
        wardTab.innerHTML = "";
        
        if (!wards || wards.length === 0) {
            wardTab.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Không có dữ liệu</div>';
            return;
        }
        
        wards.forEach(ward => {
            const div = document.createElement("div");
            div.textContent = ward.WardName;
            div.onclick = () => selectWard(ward, div);
            wardTab.appendChild(div);
        });
        
    } catch (error) {
        console.error('❌ Error loading wards:', error);
        showToast('Lỗi tải danh sách phường/xã', 'error');
        loadSampleWards(districtId);
    }
}

/**
 * Chọn phường/xã
 * @param {Object} ward - Ward object
 * @param {HTMLElement} element - DOM element được click
 */
function selectWard(ward, element) {
    selectedWard = { code: ward.WardCode, name: ward.WardName };
    
    console.log('✅ Selected ward:', selectedWard);
    
    // Highlight selected ward
    document.querySelectorAll("#wardTab div").forEach(d => d.classList.remove("selected"));
    element.classList.add("selected");
    
    // Enable confirm button
    confirmBtn.disabled = false;
}

// ==================== SAMPLE DATA (FALLBACK) ====================

const sampleData = {
    "Hà Nội": {
        "Quận Ba Đình": ["Phường Ngọc Hà", "Phường Kim Mã", "Phường Điện Biên"],
        "Quận Cầu Giấy": ["Phường Dịch Vọng", "Phường Nghĩa Tân", "Phường Mai Dịch"]
    },
    "TP. Hồ Chí Minh": {
        "Quận 1": ["Phường Bến Nghé", "Phường Đa Kao", "Phường Nguyễn Thái Bình"],
        "Quận Bình Thạnh": ["Phường 11", "Phường 12", "Phường 13"]
    },
    "Đà Nẵng": {
        "Quận Hải Châu": ["Phường Thạch Thang", "Phường Hải Châu I"],
        "Quận Sơn Trà": ["Phường Mân Thái", "Phường Nại Hiên Đông"]
    }
};

function loadSampleProvinces() {
    provinceTab.innerHTML = "";
    Object.keys(sampleData).forEach(province => {
        const div = document.createElement("div");
        div.textContent = province;
        div.onclick = () => {
            selectedProvince = { id: province, name: province };
            selectedDistrict = { id: '', name: '' };
            selectedWard = { code: '', name: '' };
            loadSampleDistricts(province);
            enableTab('districtTab');
            showTab('districtTab');
        };
        provinceTab.appendChild(div);
    });
}

function loadSampleDistricts(province) {
    districtTab.innerHTML = "";
    Object.keys(sampleData[province]).forEach(district => {
        const div = document.createElement("div");
        div.textContent = district;
        div.onclick = () => {
            selectedDistrict = { id: district, name: district };
            selectedWard = { code: '', name: '' };
            loadSampleWards(province, district);
            enableTab('wardTab');
            showTab('wardTab');
        };
        districtTab.appendChild(div);
    });
}

function loadSampleWards(province, district) {
    wardTab.innerHTML = "";
    sampleData[province][district].forEach(ward => {
        const div = document.createElement("div");
        div.textContent = ward;
        div.onclick = () => {
            selectedWard = { code: ward, name: ward };
            document.querySelectorAll("#wardTab div").forEach(d => d.classList.remove("selected"));
            div.classList.add("selected");
            confirmBtn.disabled = false;
        };
        wardTab.appendChild(div);
    });
}

// ==================== FORM HANDLING ====================

/**
 * Xử lý submit form
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate địa chỉ
    if (!selectedProvince.name || !selectedDistrict.name || !selectedWard.name) {
        showToast('Vui lòng chọn đầy đủ địa chỉ', 'warning');
        return;
    }
    
    // Get form data
    const receiverName = document.getElementById('receiverName').value.trim();
    const receiverPhone = document.getElementById('receiverPhone').value.trim();
    const addressLine = document.getElementById('addressLine').value.trim();
    const isDefault = document.getElementById('defaultAddress').checked;
    
    // Validate phone
    if (!/^[0-9]{10,11}$/.test(receiverPhone)) {
        showToast('Số điện thoại không hợp lệ', 'error');
        return;
    }
    
    const token = TokenHelper.getAccessToken();
    if (!token) {
        showToast('Vui lòng đăng nhập để thêm địa chỉ', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 1500);
        return;
    }
    
    // Prepare request body
    const body = {
        receiverName,
        receiverPhone,
        locationCode: selectedWard.code,
        addressLine,
        label: selectedAddressType,
        isDefault
    };
    
    console.log('📤 Submitting address:', body);
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        
        const response = await fetch(ADDRESS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        console.log('📥 Response:', data);
        
        if (response.ok || data.success) {
            showToast('Thêm địa chỉ thành công!', 'success');
            
            // Reset form sau 1 giây
            setTimeout(() => {
                resetForm();
                // Có thể redirect về trang danh sách địa chỉ
                // window.location.href = './list.html';
            }, 1000);
        } else {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('❌ Error submitting address:', error);
        showToast('Lỗi khi thêm địa chỉ: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Hoàn thành';
    }
}

/**
 * Reset form về trạng thái ban đầu
 */
function resetForm() {
    addressForm.reset();
    
    // Reset selected data
    selectedProvince = { id: '', name: '' };
    selectedDistrict = { id: '', name: '' };
    selectedWard = { code: '', name: '' };
    
    // Reset UI
    locationText.textContent = 'Chọn Tỉnh/Thành phố, Quận/Huyện, Phường/Xã';
    locationText.classList.add('placeholder');
    selectedAddress.textContent = '';
    
    // Reset address type
    typeButtons.forEach(b => b.classList.remove("active"));
    document.querySelector('.type-btn[data-type="Nhà Riêng"]').classList.add("active");
    selectedAddressType = "Nhà Riêng";
    
    // Reset tabs
    document.querySelector('[data-tab="districtTab"]').disabled = true;
    document.querySelector('[data-tab="wardTab"]').disabled = true;
    confirmBtn.disabled = true;
}

/**
 * Xử lý nút hủy
 */
function handleCancel() {
    if (confirm('Bạn có chắc muốn hủy thêm địa chỉ?')) {
        resetForm();
        // Có thể redirect về trang trước
        // window.history.back();
    }
}

/**
 * Xử lý nút quay lại
 */
function handleBack() {
    if (confirm('Bạn có chắc muốn quay lại? Dữ liệu đã nhập sẽ không được lưu.')) {
        window.history.back();
    }
}

// ==================== EVENT LISTENERS ====================

// Modal
openPicker.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalHandler);
confirmBtn.addEventListener('click', confirmSelection);

// Tabs
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!btn.disabled) {
            showTab(btn.dataset.tab);
        }
    });
});

// Address type
typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedAddressType = btn.dataset.type;
    });
});

// Form
addressForm.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', handleCancel);
backBtn.addEventListener('click', handleBack);

// Close modal khi click outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalHandler();
    }
});

// ==================== INITIALIZATION ====================

/**
 * Initialize module
 */
function init() {
    console.log('🏠 Address module initialized');
    
    // Kiểm tra đăng nhập
    if (!TokenHelper.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để thêm địa chỉ', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 1500);
        return;
    }
    
    // Load provinces khi mở modal lần đầu (lazy loading)
    // loadProvinces();
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
