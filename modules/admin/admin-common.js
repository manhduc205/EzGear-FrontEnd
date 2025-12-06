// Admin Common JavaScript
const BASE_URL = 'http://127.0.0.1:8080/api';

// Load sidebar from component
document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar();
    await checkAdminAuth();
    loadUserInfo();
});

// Check admin authentication
async function checkAdminAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = '../../modules/auth/login.html';
        return;
    }
    
    try {
        const isAdmin = await checkAdminRole(token);
        if (!isAdmin) {
            alert('Bạn không có quyền truy cập trang này!');
            window.location.href = '../../index.html';
            return;
        }
    } catch (error) {
        console.error('Error checking role:', error);
        alert('Lỗi xác thực. Vui lòng đăng nhập lại!');
        window.location.href = '../../modules/auth/login.html';
        return;
    }
}

// Check if user has admin role
async function checkAdminRole(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        let roles = [];
        if (payload.roles) {
            roles = typeof payload.roles === 'string' ? [payload.roles] : payload.roles;
        } else if (payload.scope) {
            roles = payload.scope.split(' ');
        }
        
        const hasAdminRole = roles.some(role => 
            role === 'ROLE_ADMIN' || 
            role === 'ROLE_SYS_ADMIN' || 
            role === 'ROLE_SYSTEM_ADMIN' ||
            role === 'ADMIN'
        );
        
        return hasAdminRole;
    } catch (error) {
        console.error('Error decoding token:', error);
        return false;
    }
}

// Load sidebar
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const pathParts = window.location.pathname.split('/');
    const currentPage = pathParts.pop();
    const parentFolder = pathParts.pop();
    
    const isInSubDir = ['stock-transfer', 'branches', 'categories', 'brands', 'add-product', 'manage-products', 'vouchers', 'warehouses', 'stocks', 'stock-transactions', 'purchase-orders'].includes(parentFolder);
    const base = isInSubDir ? '../' : './';
    const stockTransferLink = isInSubDir ? '../stock-transfer/stock-transfer.html' : './stock-transfer/stock-transfer.html';
    const branchesLink = isInSubDir ? '../branches/branches.html' : './branches/branches.html';
    const categoriesLink = isInSubDir ? '../categories/categories.html' : './categories/categories.html';
    const brandsLink = isInSubDir ? '../brands/brands.html' : './brands/brands.html';
    const productsLink = isInSubDir ? '../manage-products/products.html' : './manage-products/products.html';
    const addProductLink = isInSubDir ? '../add-product/add-product.html' : './add-product/add-product.html';
    const vouchersLink = isInSubDir ? '../vouchers/vouchers.html' : './vouchers/vouchers.html';
    const warehousesLink = isInSubDir ? '../warehouses/warehouses.html' : './warehouses/warehouses.html';
    const stocksLink = isInSubDir ? '../stocks/stocks.html' : './stocks/stocks.html';
    const stockTransactionsLink = isInSubDir ? '../stock-transactions/stock-transactions.html' : './stock-transactions/stock-transactions.html';
    const purchaseOrdersLink = isInSubDir ? '../purchase-orders/purchase-orders.html' : './purchase-orders/purchase-orders.html';
    
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="sidebar-logo">EzGear</div>
            <div class="sidebar-subtitle">Admin Panel</div>
        </div>

        <nav class="sidebar-menu">
            <div class="menu-section">
                <div class="menu-section-title">Tổng Quan</div>
                <a href="${base}dashboard.html" class="menu-item ${currentPage === 'dashboard.html' ? 'active' : ''}">
                    <i class="fas fa-chart-line"></i>
                    <span class="menu-item-text">Dashboard</span>
                </a>
            </div>

            <div class="menu-section">
                <div class="menu-section-title">Quản Lý Sản Phẩm</div>
                <a href="${productsLink}" class="menu-item ${currentPage === 'products.html' ? 'active' : ''}">
                    <i class="fas fa-box"></i>
                    <span class="menu-item-text">Sản phẩm</span>
                </a>
                <a href="${addProductLink}" class="menu-item ${currentPage === 'add-product.html' ? 'active' : ''}">
                    <i class="fas fa-plus-circle"></i>
                    <span class="menu-item-text">Thêm sản phẩm</span>
                </a>
                <a href="${brandsLink}" class="menu-item ${currentPage === 'brands.html' ? 'active' : ''}">
                    <i class="fas fa-tag"></i>
                    <span class="menu-item-text">Thương hiệu</span>
                </a>
                <a href="${categoriesLink}" class="menu-item ${currentPage === 'categories.html' ? 'active' : ''}">
                    <i class="fas fa-list"></i>
                    <span class="menu-item-text">Danh mục</span>
                </a>
            </div>

            <div class="menu-section">
                <div class="menu-section-title">Quản Lý Kho</div>
                <a href="${branchesLink}" class="menu-item ${currentPage === 'branches.html' ? 'active' : ''}">
                    <i class="fas fa-building"></i>
                    <span class="menu-item-text">Chi nhánh</span>
                </a>
                <a href="${warehousesLink}" class="menu-item ${currentPage === 'warehouses.html' ? 'active' : ''}">
                    <i class="fas fa-warehouse"></i>
                    <span class="menu-item-text">Kho hàng</span>
                </a>
                <a href="${stockTransactionsLink}" class="menu-item ${currentPage === 'stock-transactions.html' ? 'active' : ''}">
                    <i class="fas fa-exchange-alt"></i>
                    <span class="menu-item-text">Lịch sử giao dịch</span>
                </a>
                <a href="${stocksLink}" class="menu-item ${currentPage === 'stocks.html' ? 'active' : ''}">
                    <i class="fas fa-boxes"></i>
                    <span class="menu-item-text">Tồn kho</span>
                </a>
                <a href="${purchaseOrdersLink}" class="menu-item ${currentPage === 'purchase-orders.html' ? 'active' : ''}">
                    <i class="fas fa-file-invoice"></i>
                    <span class="menu-item-text">Đơn nhập hàng</span>
                    <span class="menu-badge" id="pendingOrdersBadge">0</span>
                </a>
                <a href="${stockTransferLink}" class="menu-item ${currentPage === 'stock-transfer.html' ? 'active' : ''}">
                    <i class="fas fa-dolly"></i>
                    <span class="menu-item-text">Chuyển kho</span>
                </a>
            </div>

            <div class="menu-section">
                <div class="menu-section-title">Khuyến Mãi</div>
                <a href="${vouchersLink}" class="menu-item ${currentPage === 'vouchers.html' ? 'active' : ''}">
                    <i class="fas fa-ticket-alt"></i>
                    <span class="menu-item-text">Voucher</span>
                </a>
            </div>

            <div class="menu-section">
                <div class="menu-section-title">Hệ Thống</div>
                <a href="${base}users.html" class="menu-item ${currentPage === 'users.html' ? 'active' : ''}">
                    <i class="fas fa-users"></i>
                    <span class="menu-item-text">Người dùng</span>
                </a>
                <a href="${base}settings.html" class="menu-item ${currentPage === 'settings.html' ? 'active' : ''}">
                    <i class="fas fa-cog"></i>
                    <span class="menu-item-text">Cài đặt</span>
                </a>
            </div>
        </nav>
    `;
}

// Load user info
function loadUserInfo() {
    const userInfoDiv = document.getElementById('userInfo');
    if (!userInfoDiv) return;
    
    const userEmail = localStorage.getItem('user_email') || 'Admin';
    const initial = userEmail.charAt(0).toUpperCase();
    
    userInfoDiv.innerHTML = `
        <div class="user-avatar">${initial}</div>
        <span>${userEmail.split('@')[0]}</span>
    `;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.className = `toast ${type} active`;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    const iconColor = type === 'success' ? '#2ed573' : type === 'error' ? '#ff4757' : '#ffa502';
    
    toast.innerHTML = `
        <i class="fas ${iconClass}" style="color: ${iconColor}; font-size: 1.2rem;"></i>
        <span>${message}</span>
    `;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Show/hide loading overlay
function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

// Format datetime
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
}

// Handle logout
async function handleLogout() {
    const confirmLogout = confirm('Bạn có chắc muốn đăng xuất?');
    if (!confirmLogout) return;
    
    try {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId');
        
        if (token && refreshToken && userId) {
            await fetch(`${BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: parseInt(userId),
                    accessToken: token,
                    refreshToken: refreshToken
                })
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.clear();
        window.location.href = '../../modules/auth/login.html';
    }
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}
