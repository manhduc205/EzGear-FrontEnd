/* ===================================
   🚀 ADMIN COMMON - JAVASCRIPT IMPROVEMENTS
   ===================================
   
   File này giải thích các cải tiến về logic JavaScript
   ================================== */

// ============================================
// 1. LOGO CLICK HANDLER - Click logo về Dashboard
// ============================================
function setupLogoClickHandler() {
    setTimeout(() => {
        const logoHeader = document.querySelector('.sidebar-header');
        if (logoHeader) {
            // Thêm cursor pointer
            logoHeader.style.cursor = 'pointer';
            
            // Thêm event listener
            logoHeader.addEventListener('click', () => {
                // Phát hiện cấu trúc thư mục
                const pathParts = window.location.pathname.split('/');
                const parentFolder = pathParts[pathParts.length - 2];
                
                // Danh sách các subfolder
                const subFolders = [
                    'stock-transfer', 'branches', 'categories', 'brands',
                    'add-product', 'manage-products', 'vouchers', 'warehouses',
                    'stocks', 'stock-transactions', 'purchase-orders'
                ];
                
                // Kiểm tra có phải subfolder không
                const isInSubDir = subFolders.includes(parentFolder);
                
                // Tạo link đúng
                const dashboardLink = isInSubDir ? '../dashboard.html' : './dashboard.html';
                
                // Chuyển hướng
                window.location.href = dashboardLink;
            });
        }
    }, 100); // Đợi sidebar load xong
}

// ============================================
// 2. IMPROVED LOGOUT - Logout với UI đẹp
// ============================================
async function handleLogout() {
    // Tạo custom confirmation dialog
    const confirmDialog = createLogoutDialog();
    document.body.appendChild(confirmDialog);
    
    // Xử lý nút Cancel
    const cancelBtn = document.getElementById('cancelLogout');
    cancelBtn.addEventListener('click', () => {
        confirmDialog.remove();
    });
    
    // Xử lý nút Confirm
    const confirmBtn = document.getElementById('confirmLogout');
    confirmBtn.addEventListener('click', async () => {
        await processLogout(confirmBtn);
    });
}

// Tạo dialog HTML
function createLogoutDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        animation: fadeIn 0.3s ease;
    `;
    
    dialog.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 16px; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center;">
            <div style="width: 60px; height: 60px; margin: 0 auto 20px;
                        background: linear-gradient(135deg, #c8102e, #ff4757);
                        border-radius: 50%; display: flex; align-items: center;
                        justify-content: center;">
                <i class="fas fa-sign-out-alt" style="color: white; font-size: 24px;"></i>
            </div>
            <h3 style="margin-bottom: 10px; color: #1a1a2e;">Đăng xuất</h3>
            <p style="color: #666; margin-bottom: 25px;">
                Bạn có chắc muốn đăng xuất khỏi hệ thống?
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="cancelLogout" class="btn btn-secondary">Hủy</button>
                <button id="confirmLogout" class="btn btn-danger">Đăng xuất</button>
            </div>
        </div>
    `;
    
    return dialog;
}

// Xử lý logout
async function processLogout(confirmBtn) {
    // Hiển thị loading
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    confirmBtn.disabled = true;
    
    try {
        // Lấy thông tin từ localStorage
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId');
        
        // Gọi API logout nếu có đủ thông tin
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
        
        // Xóa localStorage
        localStorage.clear();
        
        // Hiển thị success
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Thành công!';
        confirmBtn.style.background = 'linear-gradient(135deg, #2ed573, #26d066)';
        
        // Chuyển hướng sau 800ms
        setTimeout(() => {
            redirectToAuth();
        }, 800);
        
    } catch (error) {
        console.error('Logout error:', error);
        
        // Hiển thị error nhưng vẫn logout
        confirmBtn.innerHTML = '<i class="fas fa-times"></i> Lỗi!';
        confirmBtn.style.background = '#ff4757';
        
        setTimeout(() => {
            localStorage.clear();
            redirectToAuth();
        }, 1000);
    }
}

// Redirect về trang auth với path detection
function redirectToAuth() {
    const pathParts = window.location.pathname.split('/');
    const parentFolder = pathParts[pathParts.length - 2];
    
    const subFolders = [
        'stock-transfer', 'branches', 'categories', 'brands',
        'add-product', 'manage-products', 'vouchers', 'warehouses',
        'stocks', 'stock-transactions', 'purchase-orders'
    ];
    
    const isInSubDir = subFolders.includes(parentFolder);
    const authLink = isInSubDir ? '../../auth/auth.html' : '../auth/auth.html';
    
    window.location.href = authLink;
}

// ============================================
// 3. IMPROVED SIDEBAR LOADER - Load sidebar với icon
// ============================================
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    // ... existing code ...
    
    sidebar.innerHTML = `
        <div class="sidebar-header" title="Nhấn để về Dashboard">
            <div class="sidebar-logo">
                <i class="fas fa-bolt"></i> EzGear
            </div>
            <div class="sidebar-subtitle">
                <i class="fas fa-crown"></i> Admin Panel
            </div>
        </div>
        <!-- ... menu items ... -->
    `;
}

// ============================================
// 4. SETUP LOGOUT HANDLER - Gắn event cho nút logout
// ============================================
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// ============================================
// 5. MAIN INITIALIZATION - Khởi tạo khi DOM ready
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Load sidebar
    await loadSidebar();
    
    // Check authentication
    await checkAdminAuth();
    
    // Load user info
    loadUserInfo();
    
    // Setup logo click handler
    setupLogoClickHandler();
    
    // Setup logout handler
    setupLogoutHandler();
});

/* ===================================
   📝 KEY IMPROVEMENTS SUMMARY
   ===================================
   
   1. ✅ Logo click to dashboard với path detection
   2. ✅ Beautiful logout dialog thay confirm()
   3. ✅ Loading state cho logout process
   4. ✅ Error handling tốt hơn (vẫn logout khi API lỗi)
   5. ✅ Success/Error feedback với animation
   6. ✅ Path detection tự động cho navigation
   7. ✅ Event listener setup trong DOMContentLoaded
   8. ✅ Async/await cho API calls
   9. ✅ Fallback behavior khi có lỗi
   10. ✅ Clean code với functions riêng biệt
   
   ================================== */
