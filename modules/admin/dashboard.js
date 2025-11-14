// Dashboard JavaScript
// BASE_URL is defined in admin-common.js

// Load dashboard data after admin-common.js has authenticated
window.addEventListener('load', async () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // admin-common.js already handles auth check
    // Just load dashboard data
    await loadDashboardData();
    
    loadingOverlay.classList.remove('active');
});

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        // Load products count
        const productsResponse = await fetch(`${BASE_URL}/product-skus/search`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ page: 0, size: 1 })
        });
        
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            if (productsData.success && productsData.payload) {
                document.getElementById('totalProducts').textContent = productsData.payload.totalElements || 0;
            }
        }
        
        // Load brands count
        const brandsResponse = await fetch(`${BASE_URL}/brands`, {
            method: 'GET',
            headers: headers
        });
        
        if (brandsResponse.ok) {
            const brandsData = await brandsResponse.json();
            if (brandsData.success && brandsData.payload) {
                document.getElementById('totalBrands').textContent = brandsData.payload.length || 0;
            }
        }
        
        // Load branches count
        const branchesResponse = await fetch(`${BASE_URL}/branches`, {
            method: 'GET',
            headers: headers
        });
        
        if (branchesResponse.ok) {
            const branchesData = await branchesResponse.json();
            if (Array.isArray(branchesData)) {
                document.getElementById('totalBranches').textContent = branchesData.length || 0;
            }
        }
        
        // Load purchase orders
        await loadRecentOrders();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load recent purchase orders
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${BASE_URL}/purchase-orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        const data = await response.json();
        console.log('📦 Purchase orders response:', data);
        
        if (data.success && data.payload) {
            const orders = Array.isArray(data.payload) ? data.payload : [];
            console.log('📋 Total orders:', orders.length);
            
            if (orders.length > 0) {
                console.log('🔍 First order sample:', orders[0]);
            }
            
            // Count pending orders
            const pendingCount = orders.filter(o => o.status === 'PENDING').length;
            document.getElementById('pendingOrders').textContent = pendingCount;
            document.getElementById('pendingOrdersBadge').textContent = pendingCount;
            
            // Show recent 5 orders
            renderRecentOrders(orders.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading purchase orders:', error);
        document.getElementById('recentOrdersBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    Không thể tải dữ liệu
                </td>
            </tr>
        `;
    }
}

// Render recent orders
function renderRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersBody');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    Chưa có đơn nhập hàng nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        // Handle different date field names from API
        const dateValue = order.createdAt || order.createdDate || order.orderDate || order.created_at;
        let formattedDate = 'N/A';
        
        if (dateValue) {
            try {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('vi-VN');
                }
            } catch (e) {
                console.error('Error parsing date:', dateValue, e);
            }
        }
        
        return `
            <tr>
                <td><strong>#${order.id || order.code || 'N/A'}</strong></td>
                <td>${order.supplierName || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td><strong>${formatCurrency(order.total || order.totalAmount || 0)}</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                    <a href="./purchase-orders.html?id=${order.id}" style="color: #c8102e; text-decoration: none;">
                        <i class="fas fa-eye"></i> Chi tiết
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

// Get status badge
function getStatusBadge(status) {
    const statusMap = {
        'PENDING': { class: 'pending', text: 'Chờ xử lý' },
        'CONFIRMED': { class: 'confirmed', text: 'Đã xác nhận' },
        'RECEIVED': { class: 'received', text: 'Đã nhận hàng' },
        'CANCELLED': { class: 'cancelled', text: 'Đã hủy' }
    };
    
    const statusInfo = statusMap[status] || { class: 'pending', text: status };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(amount);
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
