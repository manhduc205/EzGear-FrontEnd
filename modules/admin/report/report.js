/**
 * ===================================
 * 📊 REPORT & STATISTICS MODULE
 * EzGear Admin Dashboard
 * ===================================
 */

// ===== CONFIGURATION =====
const API_BASE_URL = 'http://127.0.0.1:8080/api';

// ===== GLOBAL VARIABLES =====
let revenueChart = null;
let categoryChart = null;
let topProductsData = [];
let deadStockData = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Show loading
        showLoadingOverlay(true);
        
        // Set current date
        setCurrentDate();
        
        // Initialize tabs
        initTabs();
        
        // Load all data
        await loadAllData();
        
        // Hide loading
        showLoadingOverlay(false);
        
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Có lỗi khi tải dữ liệu!', 'error');
        showLoadingOverlay(false);
    }
});

// ===== LOADING OVERLAY =====
function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// ===== SET CURRENT DATE =====
function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('vi-VN', options);
    }
}

// ===== TAB NAVIGATION =====
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// ===== LOAD ALL DATA =====
async function loadAllData() {
    try {
        await Promise.all([
            loadSummary(),
            loadRevenueChart(),
            loadCategoryChart(),
            loadTopProducts(),
            loadDeadStock(),
            loadQuickStats()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// ===== API CALLS =====

/**
 * Fetch data with authentication
 */
async function fetchData(endpoint) {
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        // Return mock data for development
        return getMockData(endpoint);
    }
}

/**
 * Mock data for development
 */
function getMockData(endpoint) {
    const mockData = {
        '/statistics/summary': {
            todayRevenue: 156780000,
            newOrders: 48,
            lowStockItems: 12,
            cancelRate: 3.2
        },
        '/statistics/revenue-chart': [
            { label: '14/01', value: 125000000, value2: 37500000 },
            { label: '15/01', value: 98000000, value2: 29400000 },
            { label: '16/01', value: 145000000, value2: 43500000 },
            { label: '17/01', value: 112000000, value2: 33600000 },
            { label: '18/01', value: 178000000, value2: 53400000 },
            { label: '19/01', value: 156000000, value2: 46800000 },
            { label: '20/01', value: 189000000, value2: 56700000 }
        ],
        '/statistics/category-share': [
            { label: 'Laptop Gaming', value: 35 },
            { label: 'Phụ kiện', value: 25 },
            { label: 'Bàn phím', value: 15 },
            { label: 'Chuột Gaming', value: 12 },
            { label: 'Tai nghe', value: 8 },
            { label: 'Khác', value: 5 }
        ],
        '/statistics/top-products': [
            { productId: 1, name: 'ASUS TUF Gaming F15', sku: 'TUF-F15-001', soldQty: 156, revenue: 389900000 },
            { productId: 2, name: 'Razer DeathAdder V3', sku: 'RZR-DAV3-002', soldQty: 234, revenue: 164300000 },
            { productId: 3, name: 'Logitech G Pro X', sku: 'LGT-GPX-003', soldQty: 189, revenue: 113100000 },
            { productId: 4, name: 'MSI Katana GF66', sku: 'MSI-KTN-004', soldQty: 98, revenue: 224700000 },
            { productId: 5, name: 'SteelSeries Arctis 7', sku: 'STS-ARC7-005', soldQty: 145, revenue: 87000000 },
            { productId: 6, name: 'Corsair K70 RGB', sku: 'CRS-K70-006', soldQty: 112, revenue: 78400000 },
            { productId: 7, name: 'HyperX Cloud II', sku: 'HPX-CLD2-007', soldQty: 178, revenue: 71200000 },
            { productId: 8, name: 'Lenovo Legion 5', sku: 'LNV-LG5-008', soldQty: 67, revenue: 175000000 },
            { productId: 9, name: 'Glorious Model O', sku: 'GLR-MDO-009', soldQty: 201, revenue: 60300000 },
            { productId: 10, name: 'Ducky One 2 Mini', sku: 'DCK-O2M-010', soldQty: 134, revenue: 53600000 }
        ],
        '/statistics/dead-stock': [
            { productId: 5, name: 'Chuột Genius DX-120', sku: 'GNS-DX120', stockQty: 45, daysNoSale: 120 },
            { productId: 12, name: 'Bàn phím Newmen E340', sku: 'NWM-E340', stockQty: 32, daysNoSale: 98 },
            { productId: 18, name: 'Tai nghe JBL T110', sku: 'JBL-T110', stockQty: 28, daysNoSale: 85 },
            { productId: 23, name: 'Lót chuột Razer Basic', sku: 'RZR-BASIC', stockQty: 67, daysNoSale: 75 },
            { productId: 31, name: 'Webcam Logitech C270', sku: 'LGT-C270', stockQty: 15, daysNoSale: 62 },
            { productId: 45, name: 'USB Hub 4 Port', sku: 'USB-HB4P', stockQty: 89, daysNoSale: 55 }
        ],
        '/statistics/inventory': {
            total: 1250,
            inStock: 1089,
            lowStock: 98,
            outOfStock: 63
        }
    };
    
    // Find matching endpoint
    for (const key in mockData) {
        if (endpoint.startsWith(key)) {
            return mockData[key];
        }
    }
    
    return null;
}

// ===== LOAD SUMMARY =====
async function loadSummary() {
    const data = await fetchData('/statistics/summary');
    
    if (data) {
        // Today Revenue
        const revenueElement = document.getElementById('todayRevenue');
        if (revenueElement) {
            animateValue(revenueElement, 0, data.todayRevenue, 1500, formatCurrency);
        }
        
        // New Orders
        const ordersElement = document.getElementById('newOrders');
        if (ordersElement) {
            animateValue(ordersElement, 0, data.newOrders, 1000);
        }
        
        // Low Stock Items
        const lowStockElement = document.getElementById('lowStockItems');
        if (lowStockElement) {
            animateValue(lowStockElement, 0, data.lowStockItems, 1000);
        }
        
        // Cancel Rate
        const cancelElement = document.getElementById('cancelRate');
        if (cancelElement) {
            animateValue(cancelElement, 0, data.cancelRate, 1000, (val) => val.toFixed(1) + '%');
        }
    }
}

// ===== ANIMATE VALUE =====
function animateValue(element, start, end, duration, formatter = (val) => Math.floor(val).toString()) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeOutQuart;
        
        element.textContent = formatter(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ===== LOAD REVENUE CHART =====
async function loadRevenueChart() {
    const data = await fetchData('/statistics/revenue-chart?days=7');
    
    if (data && data.length > 0) {
        renderRevenueChart(data);
    }
}

// ===== RENDER REVENUE CHART =====
function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const labels = data.map(item => item.label);
    const revenueData = data.map(item => item.value);
    const profitData = data.map(item => item.value2);
    
    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu',
                    data: revenueData,
                    backgroundColor: 'rgba(200, 16, 46, 0.8)',
                    borderColor: '#c8102e',
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                },
                {
                    label: 'Lợi nhuận',
                    data: profitData,
                    backgroundColor: 'rgba(0, 184, 148, 0.8)',
                    borderColor: '#00b894',
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 46, 0.95)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 15,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        color: '#666'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        color: '#888',
                        callback: function(value) {
                            return formatShortCurrency(value);
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// ===== LOAD CATEGORY CHART =====
async function loadCategoryChart() {
    const data = await fetchData('/statistics/category-share');
    
    if (data && data.length > 0) {
        renderCategoryChart(data);
    }
}

// ===== RENDER CATEGORY CHART =====
function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const labels = data.map(item => item.label);
    const values = data.map(item => item.value);
    
    // Custom colors
    const colors = [
        '#c8102e', // Red
        '#0984e3', // Blue
        '#00b894', // Green
        '#6c5ce7', // Purple
        '#f39c12', // Orange
        '#e17055', // Coral
        '#00cec9', // Teal
        '#fd79a8'  // Pink
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 46, 0.95)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 15,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Render custom legend
    renderCategoryLegend(data, colors);
}

// ===== RENDER CATEGORY LEGEND =====
function renderCategoryLegend(data, colors) {
    const legendContainer = document.getElementById('categoryLegend');
    if (!legendContainer) return;
    
    legendContainer.innerHTML = data.map((item, index) => `
        <div class="category-item">
            <span class="category-color" style="background: ${colors[index]}"></span>
            <span>${item.label}: ${item.value}%</span>
        </div>
    `).join('');
}

// ===== LOAD TOP PRODUCTS =====
async function loadTopProducts() {
    const data = await fetchData('/statistics/top-products?limit=10');
    
    if (data) {
        topProductsData = data;
        renderTopProductsTable(data);
    }
}

// ===== RENDER TOP PRODUCTS TABLE =====
function renderTopProductsTable(data) {
    const tbody = document.getElementById('topProductsBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>Không có dữ liệu</h4>
                        <p>Chưa có sản phẩm nào được bán</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map((product, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'normal';
        const initial = product.name.charAt(0).toUpperCase();
        
        return `
            <tr>
                <td>
                    <span class="rank-badge ${rankClass}">${index + 1}</span>
                </td>
                <td>
                    <div class="product-name">
                        <div class="product-avatar">${initial}</div>
                        <div class="product-info">
                            <h4>${escapeHtml(product.name)}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="sku-badge">${escapeHtml(product.sku)}</span>
                </td>
                <td>
                    <div class="sold-qty">
                        <i class="fas fa-check-circle"></i>
                        <span>${product.soldQty.toLocaleString('vi-VN')}</span>
                    </div>
                </td>
                <td>
                    <span class="revenue-amount">${formatCurrency(product.revenue)}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== LOAD DEAD STOCK =====
async function loadDeadStock() {
    const data = await fetchData('/statistics/dead-stock');
    
    if (data) {
        deadStockData = data;
        renderDeadStockTable(data);
    }
}

// ===== RENDER DEAD STOCK TABLE =====
function renderDeadStockTable(data) {
    const tbody = document.getElementById('deadStockBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fas fa-smile"></i>
                        <h4>Tuyệt vời!</h4>
                        <p>Không có hàng tồn kho chết</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(product => {
        const stockClass = product.stockQty > 50 ? 'critical' : product.stockQty > 20 ? 'low' : '';
        const initial = product.name.charAt(0).toUpperCase();
        
        return `
            <tr>
                <td>
                    <div class="product-name">
                        <div class="product-avatar" style="background: linear-gradient(135deg, #ff6b35, #f7931e);">${initial}</div>
                        <div class="product-info">
                            <h4>${escapeHtml(product.name)}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="sku-badge">${escapeHtml(product.sku)}</span>
                </td>
                <td>
                    <div class="stock-qty ${stockClass}">
                        <i class="fas fa-cube"></i>
                        <span>${product.stockQty}</span>
                    </div>
                </td>
                <td>
                    <span class="days-badge">
                        <i class="fas fa-clock"></i>
                        ${product.daysNoSale} ngày
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== LOAD QUICK STATS =====
async function loadQuickStats() {
    const data = await fetchData('/statistics/inventory');
    
    if (data) {
        const totalEl = document.getElementById('totalProducts');
        const inStockEl = document.getElementById('inStockProducts');
        const lowStockEl = document.getElementById('lowStockProducts');
        const outOfStockEl = document.getElementById('outOfStockProducts');
        
        if (totalEl) animateValue(totalEl, 0, data.total, 1000);
        if (inStockEl) animateValue(inStockEl, 0, data.inStock, 1000);
        if (lowStockEl) animateValue(lowStockEl, 0, data.lowStock, 1000);
        if (outOfStockEl) animateValue(outOfStockEl, 0, data.outOfStock, 1000);
    }
}

// ===== FILTER FUNCTIONS =====

/**
 * Apply filters to tables
 */
function applyFilters() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    
    // Filter Top Products
    let filteredTopProducts = [...topProductsData];
    
    if (searchValue) {
        filteredTopProducts = filteredTopProducts.filter(p => 
            p.name.toLowerCase().includes(searchValue) ||
            p.sku.toLowerCase().includes(searchValue)
        );
    }
    
    renderTopProductsTable(filteredTopProducts);
    
    // Filter Dead Stock based on status
    let filteredDeadStock = [...deadStockData];
    
    if (searchValue) {
        filteredDeadStock = filteredDeadStock.filter(p => 
            p.name.toLowerCase().includes(searchValue) ||
            p.sku.toLowerCase().includes(searchValue)
        );
    }
    
    // Filter by days based on time filter
    const daysThreshold = parseInt(timeFilter);
    if (statusFilter === 'dead-stock') {
        filteredDeadStock = filteredDeadStock.filter(p => p.daysNoSale >= daysThreshold);
    }
    
    renderDeadStockTable(filteredDeadStock);
    
    showToast('Đã áp dụng bộ lọc!', 'success');
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('timeFilter').value = '7';
    
    // Re-render original data
    renderTopProductsTable(topProductsData);
    renderDeadStockTable(deadStockData);
    
    showToast('Đã reset bộ lọc!', 'success');
}

/**
 * Export data to Excel (placeholder)
 */
function exportData() {
    showToast('Đang xuất dữ liệu...', 'info');
    
    // Create CSV content
    const headers = ['STT', 'Tên sản phẩm', 'SKU', 'Đã bán', 'Doanh thu'];
    const rows = topProductsData.map((p, i) => [
        i + 1,
        p.name,
        p.sku,
        p.soldQty,
        p.revenue
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bao-cao-san-pham-${formatDateForFile(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Đã xuất file thành công!', 'success');
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format currency VND
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

/**
 * Format short currency for chart
 */
function formatShortCurrency(value) {
    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + ' tỷ';
    }
    if (value >= 1000000) {
        return (value / 1000000).toFixed(0) + ' tr';
    }
    if (value >= 1000) {
        return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
}

/**
 * Format date for filename
 */
function formatDateForFile(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.className = `toast ${type} active`;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 
                      type === 'error' ? 'fa-exclamation-circle' : 
                      'fa-info-circle';
    const iconColor = type === 'success' ? '#2ed573' : 
                      type === 'error' ? '#ff4757' : 
                      '#0984e3';
    
    toast.innerHTML = `
        <i class="fas ${iconClass}" style="color: ${iconColor}; font-size: 1.2rem;"></i>
        <span>${message}</span>
    `;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ===== REFRESH DATA =====
function refreshData() {
    showLoadingOverlay(true);
    loadAllData().then(() => {
        showLoadingOverlay(false);
        showToast('Đã cập nhật dữ liệu!', 'success');
    });
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ctrl + R to refresh
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }
    
    // Enter to apply filters when in filter inputs
    if (e.key === 'Enter' && (e.target.id === 'searchInput' || e.target.id === 'statusFilter')) {
        applyFilters();
    }
});

// ===== SEARCH INPUT DEBOUNCE =====
let searchTimeout;
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 500);
});

// ===== WINDOW RESIZE HANDLER =====
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (revenueChart) {
            revenueChart.resize();
        }
        if (categoryChart) {
            categoryChart.resize();
        }
    }, 250);
});

// ===== EXPORT FOR GLOBAL ACCESS =====
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.exportData = exportData;
window.refreshData = refreshData;
