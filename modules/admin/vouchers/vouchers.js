/* ==================== VOUCHERS MODULE JS ==================== */

// API Endpoints - Sử dụng từ config.js
const API_BASE = window.API_BASE_URL || 'http://localhost:8080';
const VOUCHER_API = `${API_BASE}/api/voucher`;
const CATEGORY_API = `${API_BASE}/api/categories`;

// State
let vouchers = [];
let categories = [];
let currentVoucher = null;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadVouchers();
});

// ==================== LOAD DATA ====================

/**
 * Load all vouchers
 */
async function loadVouchers() {
    showLoading();
    try {
        const response = await fetch(VOUCHER_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách voucher');
        }

        const data = await response.json();
        vouchers = Array.isArray(data) ? data : (data.payload || data.data || []);
        
        console.log('📋 Vouchers loaded:', vouchers);
        
        renderVouchers(vouchers);
        updateStats();
        
    } catch (error) {
        console.error('❌ Load vouchers error:', error);
        showToast('Lỗi tải danh sách voucher: ' + error.message, 'error');
        document.getElementById('vouchersTableBody').innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i>
                    <p>Không thể tải danh sách voucher</p>
                </td>
            </tr>
        `;
    } finally {
        hideLoading();
    }
}

/**
 * Load categories for filter
 */
async function loadCategories() {
    try {
        const response = await fetch(CATEGORY_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            categories = Array.isArray(data) ? data : (data.payload || data.data || []);
            renderCategoryOptions();
        }
    } catch (error) {
        console.error('❌ Load categories error:', error);
    }
}

/**
 * Render category options in select
 */
function renderCategoryOptions() {
    const select = document.getElementById('categoryIds');
    select.innerHTML = categories.map(cat => `
        <option value="${cat.id}">${cat.name}</option>
    `).join('');
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render vouchers table
 */
function renderVouchers(data) {
    const tbody = document.getElementById('vouchersTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-ticket-alt" style="font-size: 2rem;"></i>
                    <p>Chưa có voucher nào</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(voucher => {
        const usagePercent = voucher.usageLimit > 0 ? (voucher.usedCount / voucher.usageLimit * 100) : 0;
        const status = getVoucherStatus(voucher);
        
        return `
            <tr>
                <td>${voucher.id}</td>
                <td>
                    <span class="voucher-code">${voucher.code}</span>
                </td>
                <td>
                    <span class="voucher-type ${voucher.type.toLowerCase()}">
                        <i class="fas fa-${voucher.type === 'ORDER' ? 'shopping-cart' : 'shipping-fast'}"></i>
                        ${voucher.type === 'ORDER' ? 'Đơn hàng' : 'Vận chuyển'}
                    </span>
                </td>
                <td>
                    <div class="discount-badge">
                        <i class="fas fa-tag"></i>
                        ${voucher.discountType === 'PERCENT' 
                            ? `${voucher.discountValue}%` 
                            : formatPrice(voucher.discountValue)}
                    </div>
                </td>
                <td>${formatPrice(voucher.minOrder)}</td>
                <td>${voucher.maxDiscount ? formatPrice(voucher.maxDiscount) : '—'}</td>
                <td>
                    <div class="usage-stats">
                        <div class="usage-bar">
                            <div class="usage-fill" style="width: ${usagePercent}%"></div>
                        </div>
                        <span class="usage-text">${voucher.usedCount}/${voucher.usageLimit}</span>
                    </div>
                </td>
                <td>
                    <div class="date-range">
                        <span class="date-item">
                            <i class="fas fa-play-circle"></i>
                            ${formatDate(voucher.startAt, 'short')}
                        </span>
                        <span class="date-item">
                            <i class="fas fa-stop-circle"></i>
                            ${formatDate(voucher.endAt, 'short')}
                        </span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${status.toLowerCase()}">
                        <i class="fas fa-${status === 'ACTIVE' ? 'check-circle' : status === 'EXPIRED' ? 'times-circle' : 'pause-circle'}"></i>
                        ${status === 'ACTIVE' ? 'Hoạt động' : status === 'EXPIRED' ? 'Hết hạn' : 'Tạm dừng'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editVoucher(${voucher.id})" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteVoucher(${voucher.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Get voucher status
 */
function getVoucherStatus(voucher) {
    const now = new Date();
    const endDate = new Date(voucher.endAt);
    
    if (endDate < now) {
        return 'EXPIRED';
    }
    return voucher.status;
}

/**
 * Update statistics
 */
function updateStats() {
    const total = vouchers.length;
    const active = vouchers.filter(v => getVoucherStatus(v) === 'ACTIVE').length;
    
    document.getElementById('totalVouchers').textContent = total;
    document.getElementById('activeVouchers').textContent = active;
}

// ==================== MODAL FUNCTIONS ====================

/**
 * Open add modal
 */
function openAddModal() {
    currentVoucher = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Tạo Voucher Mới';
    document.getElementById('voucherForm').reset();
    document.getElementById('voucherId').value = '';
    
    // Set default datetime
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    document.getElementById('startAt').value = formatDateTimeLocal(tomorrow);
    document.getElementById('endAt').value = formatDateTimeLocal(nextMonth);
    
    document.getElementById('categorySelectGroup').style.display = 'none';
    document.getElementById('voucherModal').classList.add('active');
}

/**
 * Edit voucher
 */
async function editVoucher(id) {
    const voucher = vouchers.find(v => v.id === id);
    if (!voucher) return;
    
    currentVoucher = voucher;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh Sửa Voucher';
    
    // Fill form
    document.getElementById('voucherId').value = voucher.id;
    document.getElementById('voucherCode').value = voucher.code;
    document.getElementById('voucherType').value = voucher.type;
    document.getElementById('discountType').value = voucher.discountType;
    document.getElementById('discountValue').value = voucher.discountValue;
    document.getElementById('minOrder').value = voucher.minOrder;
    document.getElementById('maxDiscount').value = voucher.maxDiscount || '';
    document.getElementById('startAt').value = formatDateTimeLocal(new Date(voucher.startAt));
    document.getElementById('endAt').value = formatDateTimeLocal(new Date(voucher.endAt));
    document.getElementById('usageLimit').value = voucher.usageLimit;
    document.getElementById('scope').value = voucher.scope;
    document.getElementById('voucherStatus').value = voucher.status;
    
    handleDiscountTypeChange();
    handleScopeChange();
    
    // Select categories if scope is CATEGORY
    if (voucher.scope === 'CATEGORY' && voucher.categoryIds) {
        const select = document.getElementById('categoryIds');
        Array.from(select.options).forEach(option => {
            option.selected = voucher.categoryIds.includes(parseInt(option.value));
        });
    }
    
    document.getElementById('voucherModal').classList.add('active');
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('voucherModal').classList.remove('active');
    currentVoucher = null;
}

// ==================== FORM HANDLERS ====================

/**
 * Handle discount type change
 */
function handleDiscountTypeChange() {
    const type = document.getElementById('discountType').value;
    const hint = document.getElementById('discountValueHint');
    const input = document.getElementById('discountValue');
    
    if (type === 'PERCENT') {
        hint.textContent = 'Nhập % giảm (VD: 15 cho 15%)';
        input.max = 100;
        input.step = 0.01;
    } else {
        hint.textContent = 'Nhập số tiền giảm (VD: 50000)';
        input.max = '';
        input.step = 1000;
    }
}

/**
 * Handle scope change
 */
function handleScopeChange() {
    const scope = document.getElementById('scope').value;
    const categoryGroup = document.getElementById('categorySelectGroup');
    
    if (scope === 'CATEGORY') {
        categoryGroup.style.display = 'block';
    } else {
        categoryGroup.style.display = 'none';
    }
}

/**
 * Save voucher
 */
async function saveVoucher(event) {
    event.preventDefault();
    
    const id = document.getElementById('voucherId').value;
    const scope = document.getElementById('scope').value;
    
    // Get selected categories
    let categoryIds = null;
    if (scope === 'CATEGORY') {
        const select = document.getElementById('categoryIds');
        categoryIds = Array.from(select.selectedOptions).map(opt => parseInt(opt.value));
        
        if (categoryIds.length === 0) {
            showToast('Vui lòng chọn ít nhất 1 danh mục', 'warning');
            return;
        }
    }
    
    const voucherData = {
        code: document.getElementById('voucherCode').value.toUpperCase(),
        type: document.getElementById('voucherType').value,
        discountType: document.getElementById('discountType').value,
        discountValue: parseFloat(document.getElementById('discountValue').value),
        minOrder: parseFloat(document.getElementById('minOrder').value) || 0,
        maxDiscount: parseFloat(document.getElementById('maxDiscount').value) || null,
        startAt: new Date(document.getElementById('startAt').value).toISOString(),
        endAt: new Date(document.getElementById('endAt').value).toISOString(),
        usageLimit: parseInt(document.getElementById('usageLimit').value) || 100,
        scope: scope,
        status: document.getElementById('voucherStatus').value,
        categoryIds: categoryIds
    };
    
    console.log('💾 Saving voucher:', voucherData);
    
    showLoading();
    try {
        let url, method;
        if (id) {
            url = `${API_BASE}/api/voucher/${id}`;
            method = 'PUT';
        } else {
            url = `${VOUCHER_API}/create`;
            method = 'POST';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(voucherData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Không thể lưu voucher');
        }

        showToast(id ? 'Đã cập nhật voucher' : 'Đã tạo voucher mới', 'success');
        closeModal();
        await loadVouchers();
        
    } catch (error) {
        console.error('❌ Save voucher error:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Delete voucher
 */
async function deleteVoucher(id) {
    const voucher = vouchers.find(v => v.id === id);
    if (!voucher) return;
    
    if (!confirm(`Bạn có chắc muốn xóa voucher "${voucher.code}"?`)) {
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${VOUCHER_API}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể xóa voucher');
        }

        showToast('Đã xóa voucher', 'success');
        await loadVouchers();
        
    } catch (error) {
        console.error('❌ Delete voucher error:', error);
        showToast('Lỗi: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ==================== SEARCH & FILTER ====================

/**
 * Search vouchers
 */
async function searchVouchers() {
    const filterStatus = document.getElementById('filterStatus').value;
    
    const searchData = {
        code: document.getElementById('filterCode').value.trim().toUpperCase() || null,
        type: document.getElementById('filterType').value || null,
        discountType: document.getElementById('filterDiscountType').value || null
    };
    
    // Remove null values
    Object.keys(searchData).forEach(key => {
        if (searchData[key] === null) delete searchData[key];
    });
    
    console.log('🔍 Search params:', searchData);
    
    showLoading();
    try {
        const response = await fetch(`${VOUCHER_API}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenHelper.getAccessToken()}`
            },
            body: JSON.stringify(searchData)
        });

        if (!response.ok) {
            throw new Error('Không thể tìm kiếm voucher');
        }

        const data = await response.json();
        let results = Array.isArray(data) ? data : (data.payload || data.data || []);
        
        // Filter by status on client-side (including EXPIRED check)
        if (filterStatus) {
            results = results.filter(v => getVoucherStatus(v) === filterStatus);
        }
        
        vouchers = results;
        renderVouchers(vouchers);
        updateStats();
        
        showToast(`Tìm thấy ${vouchers.length} voucher`, 'success');
        
    } catch (error) {
        console.error('❌ Search vouchers error:', error);
        showToast('Lỗi tìm kiếm: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('filterCode').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterDiscountType').value = '';
    document.getElementById('filterStatus').value = '';
    
    loadVouchers();
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format datetime for input
 */
function formatDateTimeLocal(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Show loading overlay
 */
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
