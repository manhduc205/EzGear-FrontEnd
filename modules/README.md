# 📁 CẤU TRÚC DỰ ÁN EZGEAR - FRONTEND

## 🎯 Tổng quan
Dự án được tổ chức theo mô hình **Module-based Architecture** để dễ bảo trì, mở rộng và deploy.

## 📂 Cấu trúc thư mục

```
EzGear-FrontEnd/
│
├── index.html                 # Trang chủ
│
├── assets/                    # Tài nguyên chung
│   ├── css/
│   │   ├── base.css          # CSS cơ bản (reset, typography, colors)
│   │   ├── components.css    # Components dùng chung
│   │   └── grid.css          # Grid system
│   │
│   ├── js/
│   │   └── core/             # Core JavaScript
│   │       ├── api.js        # API handlers (AuthAPI, ProductAPI, CartAPI, etc.)
│   │       ├── config.js     # Cấu hình ứng dụng (API_URL, Routes, Constants)
│   │       └── utils.js      # Utility functions
│   │
│   ├── img/                  # Hình ảnh chung
│   └── fonts/                # Fonts
│
├── modules/                   # Các module chức năng
│   │
│   ├── auth/                 # Module Xác thực
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── forgot-password.html
│   │   ├── auth.css         # CSS riêng cho auth
│   │   └── auth.js          # Logic xử lý auth
│   │
│   ├── product/              # Module Sản phẩm
│   │   ├── list.html        # Danh sách sản phẩm
│   │   ├── detail.html      # Chi tiết sản phẩm
│   │   ├── product.css
│   │   └── product.js
│   │
│   ├── cart/                 # Module Giỏ hàng
│   │   ├── index.html
│   │   ├── cart.css
│   │   └── cart.js
│   │
│   ├── checkout/             # Module Thanh toán
│   │   ├── index.html
│   │   ├── checkout.css
│   │   └── checkout.js
│   │
│   ├── order/                # Module Đơn hàng
│   │   ├── list.html        # Danh sách đơn hàng
│   │   ├── detail.html      # Chi tiết đơn hàng
│   │   ├── address.html     # Quản lý địa chỉ
│   │   ├── order.css
│   │   └── order.js
│   │
│   ├── admin/                # Module Quản trị
│   │   ├── dashboard.html
│   │   ├── products.html
│   │   ├── orders.html
│   │   ├── users.html
│   │   ├── stock-transactions.html
│   │   ├── admin.css
│   │   └── admin.js
│   │
│   └── shared/               # Components dùng chung
│       ├── header.html
│       ├── footer.html
│       └── sidebar.html
│
└── components/               # Components cũ (có thể xóa sau khi migrate)
```

## 🔗 Quy tắc Import

### 1. Thứ tự import trong HTML:
```html
<!-- 1. Fonts -->
<link href="https://fonts.googleapis.com/..." rel="stylesheet">

<!-- 2. Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/...">

<!-- 3. Base CSS -->
<link rel="stylesheet" href="../../assets/css/base.css">

<!-- 4. Module CSS -->
<link rel="stylesheet" href="./auth.css">

<!-- 5. Config JS -->
<script src="../../assets/js/core/config.js"></script>

<!-- 6. API JS -->
<script src="../../assets/js/core/api.js"></script>

<!-- 7. Module JS -->
<script src="./auth.js"></script>
```

### 2. Đường dẫn tương đối:
- Từ module → assets: `../../assets/...`
- Từ module → module khác: `../product/...`
- Trong cùng module: `./auth.css`

## 🎨 CSS Architecture

### Base CSS (assets/css/base.css)
- CSS Reset
- Typography (font-family, font-size, line-height)
- Colors (CSS variables)
- Spacing (margin, padding)
- Common utilities

### Module CSS
Mỗi module có CSS riêng:
- `auth.css` - Login, Register, Forgot Password
- `product.css` - Product List, Product Detail
- `cart.css` - Shopping Cart
- `checkout.css` - Checkout Process
- `order.css` - Order Management
- `admin.css` - Admin Dashboard

## 📜 JavaScript Architecture

### Core JS (assets/js/core/)

#### config.js
```javascript
const CONFIG = {
  API_BASE_URL: "http://localhost:8080/api",
  ROUTES: { ... },
  STORAGE_KEYS: { ... }
}
```

#### api.js
```javascript
// API Handlers
const AuthAPI = { login, register, logout }
const ProductAPI = { getAll, getById, create, update, delete }
const CartAPI = { get, addItem, updateItem, removeItem }
const OrderAPI = { getAll, getById, create, updateStatus }
const UserAPI = { getCurrentUser, getAll, update, delete }

// Helper
const TokenHelper = { saveTokens, clearTokens, isLoggedIn }
```

### Module JS
Mỗi module có logic riêng:
- `auth.js` - Xử lý login/register/logout
- `product.js` - Hiển thị và quản lý sản phẩm
- `cart.js` - Quản lý giỏ hàng
- `checkout.js` - Xử lý thanh toán
- `order.js` - Quản lý đơn hàng
- `admin.js` - Dashboard quản trị

## 🚀 Migration Plan

### Phase 1: Core Setup ✅
- [x] Tạo cấu trúc thư mục modules/
- [x] Tạo config.js tập trung
- [x] Tạo api.js với các API handlers
- [x] Tạo auth module (CSS, JS, HTML)

### Phase 2: Migrate Auth Module ✅
- [x] Di chuyển login.html → modules/auth/
- [x] Di chuyển register.html → modules/auth/
- [x] Tạo auth.css
- [x] Tạo auth.js

### Phase 3: Migrate Other Modules 🔄
- [ ] Product Module
- [ ] Cart Module
- [ ] Checkout Module
- [ ] Order Module
- [ ] Admin Module

### Phase 4: Cleanup 🧹
- [ ] Xóa các file cũ trong page/ và assets/js/
- [ ] Cập nhật các link trong index.html
- [ ] Test toàn bộ chức năng

## 📝 Coding Standards

### Naming Convention
- **Files**: kebab-case (login.html, auth.css, product-detail.html)
- **Functions**: camelCase (handleLogin, getUserInfo)
- **Constants**: UPPER_SNAKE_CASE (API_BASE_URL, STORAGE_KEYS)
- **CSS Classes**: kebab-case (.auth-container, .login-btn)

### Comment Style
```javascript
// ==================== SECTION TITLE ====================

/**
 * Function description
 * @param {type} param - Description
 * @returns {type} - Description
 */
function myFunction(param) { }
```

## 🌐 Deployment

### Development
```bash
# Chạy với Live Server hoặc http-server
npm install -g http-server
http-server -p 3000
```

### Production
1. Cập nhật `CONFIG.API_BASE_URL` trong config.js
2. Minify CSS/JS (optional)
3. Upload lên hosting (Vercel, Netlify, GitHub Pages)

### Environment Variables
```javascript
// config.js
const CONFIG = {
  API_BASE_URL: process.env.API_URL || "http://localhost:8080/api",
  // ...
}
```

## 🔧 Utilities

### TokenHelper
```javascript
TokenHelper.saveTokens(access, refresh, userId)
TokenHelper.clearTokens()
TokenHelper.isLoggedIn()
TokenHelper.getAccessToken()
```

### AuthAPI
```javascript
await AuthAPI.login(email, password)
await AuthAPI.register(fullName, email, password, retypePassword)
await AuthAPI.logout(userId, accessToken, refreshToken)
```

## 📚 Documentation

- API Documentation: [Backend API Docs]
- Component Library: [Coming soon]
- Style Guide: [Coming soon]

## 👥 Contributors

- Frontend Developer: [Your Name]
- Backend Developer: [Backend Team]

## 📄 License

MIT License - EzGear 2025
