// ==================== CẤU HÌNH ỨNG DỤNG ====================

const CONFIG = {
  // API Configuration
  API_ENDPOINTS: {
    AUTH: '/api/auth',
    PRODUCTS: '/api/products',
    CART: '/api/cart',
    ORDERS: '/api/orders',
    USERS: '/api/users',
    ADDRESSES: '/api/addresses'
  },
  
  // Frontend Routes
  ROUTES: {
    HOME: '/index.html',
    
    // Auth
    LOGIN: '/modules/auth/login.html',
    REGISTER: '/modules/auth/register.html',
    FORGOT_PASSWORD: '/modules/auth/forgot-password.html',
    
    // Product
    PRODUCT_LIST: '/modules/product/list.html',
    PRODUCT_DETAIL: '/modules/product/detail.html',
    
    // Cart & Checkout
    CART: '/modules/cart/cart.html',
    CHECKOUT: '/modules/checkout/index.html',
    
    // Order
    ORDER_LIST: '/modules/order/list.html',
    ORDER_DETAIL: '/modules/order/detail.html',
    ORDER_ADDRESS: '/modules/order/address.html',
    
    // Admin
    ADMIN_DASHBOARD: '/modules/admin/dashboard.html',
    ADMIN_PRODUCTS: '/modules/admin/products.html',
    ADMIN_ORDERS: '/modules/admin/orders.html',
    ADMIN_USERS: '/modules/admin/users.html',
    ADMIN_STOCK: '/modules/admin/stock-transactions.html'
  },
  
  // Local Storage Keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_ID: 'userId',
    USER_INFO: 'userInfo',
    CART: 'cart',
    LANG: 'language'
  },
  
  // Pagination
  PAGINATION: {
    PRODUCTS_PER_PAGE: 12,
    ORDERS_PER_PAGE: 10,
    USERS_PER_PAGE: 15
  },
  
  // Timeout
  REQUEST_TIMEOUT: 30000, // 30 seconds
  AUTO_LOGOUT_TIME: 30 * 60 * 1000, // 30 minutes
  
  // Order Status
  ORDER_STATUS: {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    CANCELLED: 'Đã hủy',
    RETURNED: 'Đã trả hàng'
  },
  
  // Payment Methods
  PAYMENT_METHODS: {
    COD: 'Thanh toán khi nhận hàng',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
    CREDIT_CARD: 'Thẻ tín dụng/Ghi nợ',
    E_WALLET: 'Ví điện tử',
    MOMO: 'Ví MoMo',
    ZALOPAY: 'ZaloPay'
  },
  
  // User Roles
  USER_ROLES: {
    ADMIN: 'ADMIN',
    USER: 'USER',
    MODERATOR: 'MODERATOR'
  },
  
  // Product Categories (có thể lấy từ API)
  PRODUCT_CATEGORIES: {
    LAPTOP: 'Laptop',
    PC: 'PC/Desktop',
    MONITOR: 'Màn hình',
    KEYBOARD: 'Bàn phím',
    MOUSE: 'Chuột',
    HEADPHONE: 'Tai nghe',
    ACCESSORY: 'Phụ kiện'
  }
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
