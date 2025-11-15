# 🎯 TÁI CẤU TRÚC DỰ ÁN - CẬP NHẬT MỚI NHẤT

## ✅ HOÀN THÀNH

Dự án đã được **TÁI CẤU TRÚC HOÀN TOÀN** theo mô hình module-based với kiến trúc rõ ràng.

---

## 📁 CẤU TRÚC MỚI

### 1. **Core Files** (assets/js/core/)

#### **api.js** - Chỉ chứa BASE_URL
```javascript
window.BASE_URL = "http://localhost:8080";
```

#### **config.js** - Cấu hình ứng dụng
```javascript
const CONFIG = {
  API_ENDPOINTS: { ... },  // API endpoints
  ROUTES: { ... },         // Frontend routes
  STORAGE_KEYS: { ... },   // LocalStorage keys
  PAGINATION: { ... },     // Pagination config
  ORDER_STATUS: { ... },   // Order status
  PAYMENT_METHODS: { ... } // Payment methods
}
```

#### **utils.js** - Utility functions
```javascript
// Token Management
TokenHelper.saveTokens(accessToken, refreshToken, userId)
TokenHelper.clearTokens()
TokenHelper.isLoggedIn()

// HTTP Request
httpRequest(url, options)

// UI Helpers
toggleButtonLoading(btn, isLoading, loadingText)
showToast(message, type, duration)

// Format
formatPrice(price)
formatDate(date, format)

// Validation
isValidEmail(email)
isValidPhone(phone)

// DOM Helpers
getQueryParam(param)
redirectWithParams(url, params)
toggleElement(element, show)

// Storage
setStorage(key, value)
getStorage(key)
removeStorage(key)
```

---

## 📂 CẤU TRÚC MODULE

Mỗi module có cấu trúc riêng:

```
modules/[module-name]/
├── index.html hoặc [page-name].html
├── [module-name].css
└── [module-name].js
```

### Ví dụ: Auth Module

```
modules/auth/
├── login.html
├── register.html
├── auth.css
└── auth.js
```

---

## 🚀 CÁCH IMPLEMENT MODULE MỚI

### Bước 1: Tạo cấu trúc thư mục

```
modules/[module-name]/
```

### Bước 2: Tạo file JS với API calls

```javascript
/* ==================== [MODULE NAME] MODULE JS ==================== */

// ==================== API CALLS ====================

async function get[Something]API(params) {
  const url = `${window.BASE_URL}/api/[endpoint]`;
  return await httpRequest(url, {
    method: 'GET'
  });
}

async function create[Something]API(data) {
  const url = `${window.BASE_URL}/api/[endpoint]`;
  return await httpRequest(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ==================== RENDER FUNCTIONS ====================

function render[Something](data, container) {
  // Render logic here
}

// ==================== EVENT HANDLERS ====================

async function handle[Action](e) {
  e.preventDefault();
  // Handle logic here
}

// ==================== AUTO-INIT ====================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize module
});
```

### Bước 3: Tạo file HTML

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>[Page Title] - EzGear</title>
  
  <!-- Fonts & Icons -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto..." rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/...">
  
  <!-- Styles -->
  <link rel="stylesheet" href="./[module-name].css">
</head>
<body>
  <!-- Content here -->
  
  <!-- Scripts - LUÔN THEO THỨ TỰ NÀY -->
  <script src="../../assets/js/core/api.js"></script>
  <script src="../../assets/js/core/config.js"></script>
  <script src="../../assets/js/core/utils.js"></script>
  <script src="./[module-name].js"></script>
</body>
</html>
```

### Bước 4: Tạo file CSS

```css
/* ==================== [MODULE NAME] MODULE CSS ==================== */

/* Import base nếu cần */
@import url('../../assets/css/base.css');

/* Module styles */
```

---

## 📝 QUY TẮC CODING

### 1. API Calls

**✅ ĐÚNG:**
```javascript
async function getProductsAPI(params = {}) {
  const url = `${window.BASE_URL}/api/products`;
  return await httpRequest(url, { method: 'GET' });
}
```

**❌ SAI:**
```javascript
// KHÔNG viết trực tiếp fetch trong handler
async function loadProducts() {
  const res = await fetch('http://localhost:8080/api/products');
  // ...
}
```

### 2. Import Scripts

**✅ ĐÚNG - Thứ tự:**
```html
<script src="../../assets/js/core/api.js"></script>      <!-- 1. BASE_URL -->
<script src="../../assets/js/core/config.js"></script>   <!-- 2. CONFIG -->
<script src="../../assets/js/core/utils.js"></script>    <!-- 3. Utils -->
<script src="./module.js"></script>                      <!-- 4. Module -->
```

### 3. Sử dụng Utils

**✅ ĐÚNG:**
```javascript
// Dùng TokenHelper từ utils.js
TokenHelper.saveTokens(access, refresh, userId);

// Dùng httpRequest từ utils.js
const data = await httpRequest(url, options);

// Dùng formatPrice từ utils.js
const formatted = formatPrice(100000);
```

**❌ SAI:**
```javascript
// KHÔNG tự implement lại
localStorage.setItem('accessToken', token);  // ❌
const price = amount.toLocaleString();       // ❌
```

---

## 🎨 NAMING CONVENTION

### Files
- HTML: `kebab-case.html` (login.html, product-detail.html)
- CSS: `module-name.css` (auth.css, product.css)
- JS: `module-name.js` (auth.js, cart.js)

### Functions
- API calls: `[action][Resource]API` (getProductsAPI, createOrderAPI)
- Render: `render[Something]` (renderProductList, renderCart)
- Handlers: `handle[Action]` (handleLogin, handleSubmit)
- Helpers: `[verb][Noun]` (toggleLoading, formatPrice)

### Variables
- Constants: `UPPER_SNAKE_CASE` (BASE_URL, CONFIG)
- Variables: `camelCase` (productId, userName)
- Private: `_camelCase` (_internalFunc)

### CSS Classes
- BEM: `block__element--modifier`
- Or: `kebab-case` (product-card, btn-primary)

---

## 📦 MODULES ĐÃ HOÀN THÀNH

### ✅ Auth Module
```
modules/auth/
├── login.html          ✅
├── register.html       ✅
├── auth.css           ✅
└── auth.js            ✅
```

**Features:**
- Login với email/password
- Register với validation
- Logout
- Password strength indicator
- Email validation
- Toggle password visibility

### ✅ Product Module
```
modules/product/
└── product.js         ✅ (Template)
```

**Features:**
- Danh sách sản phẩm với pagination
- Chi tiết sản phẩm
- Thêm vào giỏ hàng
- Mua ngay
- Search & filter

---

## 🔄 MODULES CẦN IMPLEMENT

### 1. Cart Module
```
modules/cart/
├── index.html
├── cart.css
└── cart.js
```

**API Endpoints:**
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart/items` - Thêm sản phẩm
- `PUT /api/cart/items/:id` - Cập nhật số lượng
- `DELETE /api/cart/items/:id` - Xóa sản phẩm

### 2. Checkout Module
```
modules/checkout/
├── index.html
├── checkout.css
└── checkout.js
```

**API Endpoints:**
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/addresses` - Lấy địa chỉ

### 3. Order Module
```
modules/order/
├── list.html
├── detail.html
├── address.html
├── order.css
└── order.js
```

**API Endpoints:**
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `PUT /api/orders/:id/cancel` - Hủy đơn

### 4. Admin Module
```
modules/admin/
├── dashboard.html
├── products.html
├── orders.html
├── users.html
├── admin.css
└── admin.js
```

**API Endpoints:**
- Products CRUD
- Orders management
- Users management
- Dashboard statistics

---

## 🛠️ DEVELOPMENT WORKFLOW

### 1. Tạo module mới

```bash
# Tạo thư mục
mkdir modules/[module-name]

# Tạo files
touch modules/[module-name]/index.html
touch modules/[module-name]/[module-name].css
touch modules/[module-name]/[module-name].js
```

### 2. Implement API calls

```javascript
// Luôn viết API calls trước
async function get[Resource]API(params) { }
async function create[Resource]API(data) { }
async function update[Resource]API(id, data) { }
async function delete[Resource]API(id) { }
```

### 3. Implement UI

```javascript
// Render functions
function render[Something](data, container) { }

// Event handlers
async function handle[Action](e) { }
```

### 4. Test

- Mở file HTML trong browser
- Test các chức năng
- Kiểm tra Console (F12) xem có lỗi không
- Test với backend API

---

## 🚀 DEPLOYMENT

### Development
```bash
# Local development
# Mở trực tiếp file HTML hoặc dùng Live Server
```

### Production

1. **Cập nhật BASE_URL:**
```javascript
// api.js
window.BASE_URL = "https://your-backend-api.com";
```

2. **Minify CSS/JS (Optional)**

3. **Upload lên hosting:**
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

---

## 📚 TÀI LIỆU THAM KHẢO

### Core Files
- `assets/js/core/api.js` - BASE_URL
- `assets/js/core/config.js` - Cấu hình
- `assets/js/core/utils.js` - Utility functions

### Templates
- `modules/auth/auth.js` - Auth template
- `modules/product/product.js` - Product template

### Documentation
- `modules/README.md` - Module structure
- `MIGRATION_GUIDE.md` - Migration guide

---

## 💡 TIPS & TRICKS

### 1. Tái sử dụng code
```javascript
// KHÔNG copy-paste, sử dụng utils
const formatted = formatPrice(price);
const valid = isValidEmail(email);
showToast('Success!', 'success');
```

### 2. Error handling
```javascript
try {
  const data = await someAPI();
  // Success
} catch (err) {
  console.error('Error:', err);
  showToast(err.message, 'error');
}
```

### 3. Loading states
```javascript
const btn = document.querySelector('.submit-btn');
toggleButtonLoading(btn, true, 'Đang xử lý...');
try {
  await someAPI();
} finally {
  toggleButtonLoading(btn, false);
}
```

### 4. Check authentication
```javascript
if (!TokenHelper.isLoggedIn()) {
  sessionStorage.setItem('redirectAfterLogin', window.location.href);
  window.location.href = CONFIG.ROUTES.LOGIN;
  return;
}
```

---

## ❓ FAQ

**Q: Tại sao api.js chỉ có BASE_URL?**
A: Để mỗi module tự quản lý API calls của mình, dễ maintain và không phụ thuộc lẫn nhau.

**Q: Tại sao phải import theo thứ tự?**
A: Vì các file sau phụ thuộc vào file trước. api.js → config.js → utils.js → module.js

**Q: Làm sao để deploy?**
A: Chỉ cần đổi `window.BASE_URL` trong api.js thành URL production.

**Q: Token được lưu ở đâu?**
A: Trong localStorage, quản lý bởi TokenHelper trong utils.js

---

## 🎉 KẾT LUẬN

Dự án đã được tái cấu trúc hoàn toàn với:

✅ **api.js** - Chỉ chứa BASE_URL  
✅ **config.js** - Cấu hình tập trung  
✅ **utils.js** - Helper functions  
✅ **Modules** - Mỗi module tự quản lý API calls  
✅ **Clean code** - Dễ đọc, dễ maintain  
✅ **Scalable** - Dễ mở rộng  

Bây giờ bạn có thể implement các module còn lại theo template đã có! 🚀
