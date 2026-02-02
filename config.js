// ================================
// 🔧 EZGEAR FRONTEND CONFIG
// ================================
// File cấu hình tập trung cho toàn bộ dự án - CHỈNH SỬA PHẦN NÀY KHI DEPLOY!

// ✅ DEVELOPMENT & PRODUCTION URLs
// CHỈ CHỈNH SỬA 2 DÒNG NÀY KHI DEPLOY
const PRODUCTION_API_URL = "https://api.ezgear.online";
const PRODUCTION_WEB_URL = "https://ezgear.online";

// ✅ AUTO-DETECT ENVIRONMENT
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDevelopment = isLocalhost;
const isProduction = !isDevelopment;

// ✅ SET API BASE URL
window.API_BASE_URL = isDevelopment ? "http://localhost:8080" : PRODUCTION_API_URL;
window.WEB_BASE_URL = isDevelopment ? window.location.origin : PRODUCTION_WEB_URL;

// ✅ APP INFO
window.APP_CONFIG = {
    APP_NAME: "EzGear",
    VERSION: "1.0.0",
    ENVIRONMENT: isDevelopment ? "development" : "production",
    API_BASE_URL: window.API_BASE_URL,
    WEB_BASE_URL: window.WEB_BASE_URL
};

// ✅ FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBfG7WTsf9EyoZ09skrvPsELtbW3RxNjf8",
    authDomain: "ezgear.firebaseapp.com",
    projectId: "ezgear",
    storageBucket: "ezgear.firebasestorage.app",
    messagingSenderId: "853056724838",
    appId: "1:853056724838:web:180d4ae48b495bb423b2a7",
    measurementId: "G-0TDPS0FZ2E"
};
window.firebaseConfig = firebaseConfig;

// ✅ VAPID KEY (Push Notifications)
window.VAPID_KEY = "BA3pJMZ8le5pyh8Ww12de3Y4IUgpXvJOl1SVppdx_ykS3tv8DtdTxFdM8UYd-cK3E73wZ7DYr22lFp9awYBw594";

// ✅ API SUBSCRIBE URL (Cho Service Worker)
window.API_SUBSCRIBE_URL = `${window.API_BASE_URL}/api/notifications/subscribe`;

// ✅ SOCIAL LOGIN CREDENTIALS (UPDATE THESE WITH ACTUAL VALUES!)
window.SOCIAL_CONFIG = {
    FACEBOOK_APP_ID: "1382594643258140",
    GOOGLE_CLIENT_ID: "853056724838-4o1t1r44msbjifccc7qro38drbrp6h1b.apps.googleusercontent.com"
};

// ✅ COMPLETE API ENDPOINTS
window.API_ENDPOINTS = {
    // ===== AUTH =====
    LOGIN: `${window.API_BASE_URL}/api/auth/login`,
    LOGOUT: `${window.API_BASE_URL}/api/auth/logout`,
    REGISTER: `${window.API_BASE_URL}/api/auth/register`,
    REFRESH_TOKEN: `${window.API_BASE_URL}/api/auth/refresh-token`,
    VERIFY_EMAIL: `${window.API_BASE_URL}/api/auth/verify-email`,
    
    // ===== USER =====
    USER_PROFILE: `${window.API_BASE_URL}/api/users/profile`,
    USER_UPDATE: `${window.API_BASE_URL}/api/users/update`,
    USER_CHANGE_PASSWORD: `${window.API_BASE_URL}/api/users/change-password`,
    
    // ===== PRODUCTS =====
    PRODUCTS_LIST: `${window.API_BASE_URL}/api/products`,
    PRODUCTS_DETAIL: `${window.API_BASE_URL}/api/products/:id`,
    PRODUCTS_SEARCH: `${window.API_BASE_URL}/api/products/search`,
    PRODUCTS_FILTER: `${window.API_BASE_URL}/api/products/filter`,
    PRODUCTS_CATEGORIES: `${window.API_BASE_URL}/api/categories`,
    PRODUCTS_BRANDS: `${window.API_BASE_URL}/api/brands`,
    PRODUCTS_BY_CATEGORY: `${window.API_BASE_URL}/api/products/category/:id`,
    
    // ===== CART =====
    CART_GET: `${window.API_BASE_URL}/api/cart`,
    CART_ADD: `${window.API_BASE_URL}/api/cart/add`,
    CART_UPDATE: `${window.API_BASE_URL}/api/cart/update/:cartItemId`,
    CART_REMOVE: `${window.API_BASE_URL}/api/cart/remove/:cartItemId`,
    CART_CLEAR: `${window.API_BASE_URL}/api/cart/clear`,
    CART_VALIDATE: `${window.API_BASE_URL}/api/cart/validate`,
    
    // ===== ORDERS =====
    ORDERS_LIST: `${window.API_BASE_URL}/api/orders`,
    ORDERS_DETAIL: `${window.API_BASE_URL}/api/orders/:id`,
    ORDERS_PLACE: `${window.API_BASE_URL}/api/orders/place`,
    ORDERS_CANCEL: `${window.API_BASE_URL}/api/orders/:id/cancel`,
    ORDERS_RETURN: `${window.API_BASE_URL}/api/orders/:id/return`,
    ORDERS_CONFIRM_RECEIPT: `${window.API_BASE_URL}/api/orders/:id/confirm-receipt`,
    ORDERS_TRACKING: `${window.API_BASE_URL}/api/orders/:id/tracking`,
    
    // ===== ADDRESSES =====
    CUSTOMER_ADDRESSES: `${window.API_BASE_URL}/api/customer-addresses`,
    CUSTOMER_ADDRESS_ADD: `${window.API_BASE_URL}/api/customer-addresses/add`,
    CUSTOMER_ADDRESS_UPDATE: `${window.API_BASE_URL}/api/customer-addresses/:id`,
    CUSTOMER_ADDRESS_DELETE: `${window.API_BASE_URL}/api/customer-addresses/:id`,
    CUSTOMER_ADDRESS_SET_DEFAULT: `${window.API_BASE_URL}/api/customer-addresses/:id/set-default`,
    
    // ===== SHIPPING =====
    SHIPPING_PROVINCES: `${window.API_BASE_URL}/api/shipping/provinces`,
    SHIPPING_DISTRICTS: `${window.API_BASE_URL}/api/shipping/districts/:provinceId`,
    SHIPPING_WARDS: `${window.API_BASE_URL}/api/shipping/wards/:districtId`,
    SHIPPING_SERVICES: `${window.API_BASE_URL}/api/shipping/available-services`,
    SHIPPING_FEE: `${window.API_BASE_URL}/api/shipping/fee`,
    
    // ===== VOUCHERS =====
    VOUCHER_LIST: `${window.API_BASE_URL}/api/vouchers`,
    VOUCHER_VALIDATE: `${window.API_BASE_URL}/api/vouchers/validate`,
    VOUCHER_AVAILABLE: `${window.API_BASE_URL}/api/vouchers/available`,
    VOUCHER_APPLY: `${window.API_BASE_URL}/api/vouchers/apply`,
    VOUCHER_REMOVE: `${window.API_BASE_URL}/api/vouchers/remove`,
    
    // ===== PAYMENTS =====
    PAYMENT_VNPAY_URL: `${window.API_BASE_URL}/api/payments/vnpay/create-payment-url`,
    PAYMENT_VNPAY_RETURN: `${window.API_BASE_URL}/api/payments/vnpay/return`,
    PAYMENT_VNPAY_IPN: `${window.API_BASE_URL}/api/payments/vnpay/ipn`,
    PAYMENT_STATUS: `${window.API_BASE_URL}/api/payments/:id/status`,
    
    // ===== NOTIFICATIONS =====
    NOTIFICATIONS_LIST: `${window.API_BASE_URL}/api/notifications`,
    NOTIFICATIONS_MARK_READ: `${window.API_BASE_URL}/api/notifications/:id/mark-read`,
    NOTIFICATIONS_SUBSCRIBE: `${window.API_BASE_URL}/api/notifications/subscribe`,
    NOTIFICATIONS_UNSUBSCRIBE: `${window.API_BASE_URL}/api/notifications/unsubscribe`,
    
    // ===== ADMIN =====
    ADMIN_DASHBOARD: `${window.API_BASE_URL}/api/admin/dashboard`,
    ADMIN_PRODUCTS_LIST: `${window.API_BASE_URL}/api/admin/products`,
    ADMIN_PRODUCTS_CREATE: `${window.API_BASE_URL}/api/admin/products/create`,
    ADMIN_PRODUCTS_UPDATE: `${window.API_BASE_URL}/api/admin/products/:id`,
    ADMIN_PRODUCTS_DELETE: `${window.API_BASE_URL}/api/admin/products/:id`,
    ADMIN_CATEGORIES_LIST: `${window.API_BASE_URL}/api/admin/categories`,
    ADMIN_BRANDS_LIST: `${window.API_BASE_URL}/api/admin/brands`,
    ADMIN_ORDERS_LIST: `${window.API_BASE_URL}/api/admin/orders`,
    ADMIN_ORDERS_UPDATE: `${window.API_BASE_URL}/api/admin/orders/:id`,
    ADMIN_STOCKS_LIST: `${window.API_BASE_URL}/api/admin/stocks`,
    ADMIN_STOCKS_UPDATE: `${window.API_BASE_URL}/api/admin/stocks/:id`,
    ADMIN_REPORTS: `${window.API_BASE_URL}/api/admin/reports`,
    ADMIN_VOUCHERS_LIST: `${window.API_BASE_URL}/api/admin/vouchers`,
    ADMIN_VOUCHERS_CREATE: `${window.API_BASE_URL}/api/admin/vouchers/create`,
    ADMIN_USERS_LIST: `${window.API_BASE_URL}/api/admin/users`,
    ADMIN_BRANCHES_LIST: `${window.API_BASE_URL}/api/admin/branches`,
    ADMIN_WAREHOUSES_LIST: `${window.API_BASE_URL}/api/admin/warehouses`
};

// ✅ DEBUG LOG
console.log(`%c🚀 EzGear Config Loaded`, `color: #27ae60; font-size: 14px; font-weight: bold;`);
console.log(`Environment: ${window.APP_CONFIG.ENVIRONMENT}`);
console.log(`API Base URL: ${window.API_BASE_URL}`);
console.log(`Web Base URL: ${window.WEB_BASE_URL}`);