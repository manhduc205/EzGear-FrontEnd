// Admin Common JavaScript
// Sử dụng API_BASE_URL từ config.js
const BASE_URL = window.API_BASE_URL ? `${window.API_BASE_URL}/api` : 'http://127.0.0.1:8080/api';

// Load sidebar and topbar from component
document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar();
    await loadTopbar();
    await checkAdminAuth();
    loadUserInfo();
    setupLogoClickHandler();
    setupLogoutHandler();
});

// Setup logo click handler
function setupLogoClickHandler() {
    // Đợi sidebar load xong
    setTimeout(() => {
        const logoHeader = document.querySelector('.sidebar-header');
        if (logoHeader) {
            logoHeader.style.cursor = 'pointer';
            logoHeader.addEventListener('click', () => {
                const pathParts = window.location.pathname.split('/');
                const parentFolder = pathParts[pathParts.length - 2];
                const isInSubDir = ['stock-transfer', 'branches', 'categories', 'brands', 'add-product', 'manage-products', 'vouchers', 'warehouses', 'stocks', 'stock-transactions', 'purchase-orders', 'orders-management'].includes(parentFolder);
                const dashboardLink = isInSubDir ? '../dashboard.html' : './dashboard.html';
                window.location.href = dashboardLink;
            });
        }
    }, 100);
}

// Setup logout handler
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Check admin authentication
async function checkAdminAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = '/modules/auth/auth.html';
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
        window.location.href = '/modules/auth/auth.html';
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
    
    const isInSubDir = ['stock-transfer', 'branches', 'categories', 'brands', 'add-product', 'manage-products', 'vouchers', 'warehouses', 'stocks', 'stock-transactions', 'purchase-orders', 'report', 'picking', 'orders-management'].includes(parentFolder);
    const base = isInSubDir ? '../' : './';
    const stockTransferLink = isInSubDir ? '../stock-transfer/stock-transfer.html' : './stock-transfer/stock-transfer.html';
    const branchesLink = isInSubDir ? '../branches/branches.html' : './branches/branches.html';
    const categoriesLink = isInSubDir ? '../categories/categories.html' : './categories/categories.html';
    const brandsLink = isInSubDir ? '../brands/brands.html' : './brands/brands.html';
    const productsLink = isInSubDir ? '../manage-products/product-sku.html' : './manage-products/product-sku.html';
    const productParentsLink = isInSubDir ? '../manage-products/products.html' : './manage-products/products.html';
    const addProductLink = isInSubDir ? '../add-product/add-product.html' : './add-product/add-product.html';
    const vouchersLink = isInSubDir ? '../vouchers/vouchers.html' : './vouchers/vouchers.html';
    const warehousesLink = isInSubDir ? '../warehouses/warehouses.html' : './warehouses/warehouses.html';
    const stocksLink = isInSubDir ? '../stocks/stocks.html' : './stocks/stocks.html';
    const stockTransactionsLink = isInSubDir ? '../stock-transactions/stock-transactions.html' : './stock-transactions/stock-transactions.html';
    const purchaseOrdersLink = isInSubDir ? '../purchase-orders/purchase-orders.html' : './purchase-orders/purchase-orders.html';
    const reportLink = isInSubDir ? '../report/report.html' : './report/report.html';
    const pickingLink = isInSubDir ? '../picking/picking.html' : './picking/picking.html';
    const ordersManagementLink = isInSubDir ? '../orders-management/orders-management.html' : './orders-management/orders-management.html';
    
    sidebar.innerHTML = `
        <div class="sidebar-header" title="Nhấn để về Dashboard">
            <div class="sidebar-logo"><i class="fas fa-bolt"></i> EzGear</div>
            <div class="sidebar-subtitle"><i class="fas fa-crown"></i> Admin Panel</div>
        </div>

        <nav class="sidebar-menu">
            <div class="menu-section">
                <div class="menu-section-title">Tổng Quan</div>
                <a href="${base}dashboard.html" class="menu-item ${currentPage === 'dashboard.html' ? 'active' : ''}">
                    <i class="fas fa-home"></i>
                    <span class="menu-item-text">Dashboard</span>
                </a>
                <a href="${reportLink}" class="menu-item ${currentPage === 'report.html' ? 'active' : ''}">
                    <i class="fas fa-chart-pie"></i>
                    <span class="menu-item-text">Báo cáo & Thống kê</span>
                </a>
            </div>

            <div class="menu-section">
                <div class="menu-section-title">Quản Lý Sản Phẩm</div>
                <a href="${productParentsLink}" class="menu-item ${currentPage === 'products.html' ? 'active' : ''}">
                    <i class="fas fa-layer-group"></i>
                    <span class="menu-item-text">Dòng sản phẩm</span>
                </a>
                <a href="${productsLink}" class="menu-item ${currentPage === 'product-sku.html' ? 'active' : ''}">
                    <i class="fas fa-box"></i>
                    <span class="menu-item-text">Biến thể</span>
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
                <a href="${pickingLink}" class="menu-item ${currentPage === 'picking.html' ? 'active' : ''}">
                    <i class="fas fa-clipboard-check"></i>
                    <span class="menu-item-text">Nhặt hàng</span>
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
                <div class="menu-section-title">Đơn Hàng</div>
                <a href="${ordersManagementLink}" class="menu-item ${currentPage === 'orders-management.html' ? 'active' : ''}">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="menu-item-text">Quản lý đơn hàng</span>
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

// Load topbar
async function loadTopbar() {
    const topbarContainer = document.getElementById('topbar-container');
    if (!topbarContainer) return;
    
    // Get page title from data attribute or page name
    const pageTitle = topbarContainer.getAttribute('data-title') || document.title.split('-')[0].trim();
    const pageBreadcrumb = topbarContainer.getAttribute('data-breadcrumb') || '';
    
    topbarContainer.innerHTML = `
        <div class="topbar">
            <div class="topbar-left">
                <h1>${pageTitle}</h1>
                ${pageBreadcrumb ? `<div class="breadcrumb">${pageBreadcrumb}</div>` : ''}
            </div>
            <div class="topbar-right">
                <div class="user-info" id="userInfo"></div>
                <button class="btn-logout" onclick="handleLogout()">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            </div>
        </div>
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
    // Tạo custom confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        animation: fadeIn 0.3s ease;
    `;
    
    confirmDialog.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            animation: slideUp 0.3s ease;
        ">
            <div style="
                width: 60px;
                height: 60px;
                margin: 0 auto 20px;
                background: linear-gradient(135deg, #c8102e, #ff4757);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <i class="fas fa-sign-out-alt" style="color: white; font-size: 24px;"></i>
            </div>
            <h3 style="margin-bottom: 10px; color: #1a1a2e;">Đăng xuất</h3>
            <p style="color: #666; margin-bottom: 25px;">Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="cancelLogout" style="
                    padding: 10px 24px;
                    background: #f0f0f0;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                ">
                    Hủy
                </button>
                <button id="confirmLogout" style="
                    padding: 10px 24px;
                    background: linear-gradient(135deg, #c8102e, #a00d24);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s;
                ">
                    Đăng xuất
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmDialog);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Handle button clicks
    const cancelBtn = document.getElementById('cancelLogout');
    const confirmBtn = document.getElementById('confirmLogout');
    
    cancelBtn.addEventListener('click', () => {
        confirmDialog.remove();
        style.remove();
    });
    
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        
        try {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const userId = localStorage.getItem('userId');
            
            // Gọi API logout nếu có thông tin
            if (token && refreshToken && userId) {
                try {
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
                } catch (apiError) {
                    console.error('API logout error:', apiError);
                    // Tiếp tục logout dù API lỗi
                }
            }
            
            // Xóa toàn bộ localStorage
            localStorage.clear();
            
            // Hiện thông báo thành công
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Thành công!';
            confirmBtn.style.background = 'linear-gradient(135deg, #2ed573, #26d066)';
            
            // Chờ một chút rồi chuyển trang
            setTimeout(() => {
                const pathParts = window.location.pathname.split('/');
                const parentFolder = pathParts[pathParts.length - 2];
                const isInSubDir = ['stock-transfer', 'branches', 'categories', 'brands', 'add-product', 'manage-products', 'vouchers', 'warehouses', 'stocks', 'stock-transactions', 'purchase-orders', 'orders-management'].includes(parentFolder);
                // Always use absolute path to avoid incorrect relative resolution
                window.location.href = '/modules/auth/auth.html';
            }, 800);
            
        } catch (error) {
            console.error('Logout error:', error);
            confirmBtn.innerHTML = '<i class="fas fa-times"></i> Lỗi!';
            confirmBtn.style.background = '#ff4757';
            
            // Vẫn xóa localStorage và chuyển trang sau 1 giây
            setTimeout(() => {
                localStorage.clear();
                const pathParts = window.location.pathname.split('/');
                const parentFolder = pathParts[pathParts.length - 2];
                const isInSubDir = ['stock-transfer', 'branches', 'categories', 'brands', 'add-product', 'manage-products', 'vouchers', 'warehouses', 'stocks', 'stock-transactions', 'purchase-orders', 'orders-management'].includes(parentFolder);
                const authLink = isInSubDir ? '../../auth/auth.html' : '../auth/auth.html';
                window.location.href = authLink;
            }, 1000);
        }
    });
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}
