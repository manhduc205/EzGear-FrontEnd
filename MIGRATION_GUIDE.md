# 🚀 HƯỚNG DẪN SỬ DỤNG CẤU TRÚC MỚI

## ✅ ĐÃ HOÀN THÀNH

### 1. Cấu trúc Module ✅
```
modules/
├── auth/          ← Module xác thực
│   ├── login.html
│   ├── register.html
│   ├── auth.css
│   └── auth.js
├── product/       ← Module sản phẩm
├── cart/          ← Module giỏ hàng
├── checkout/      ← Module thanh toán
├── order/         ← Module đơn hàng
├── admin/         ← Module quản trị
└── shared/        ← Components dùng chung
```

### 2. Core Files ✅
```
assets/js/core/
├── config.js      ← Cấu hình tập trung (API_URL, Routes, Constants)
├── api.js         ← API handlers (AuthAPI, ProductAPI, CartAPI, etc.)
└── utils.js       ← Utility functions
```

## 📖 CÁCH SỬ DỤNG

### A. Cấu trúc HTML mới

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <!-- 1. Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto..." rel="stylesheet">
  
  <!-- 2. Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/...">
  
  <!-- 3. CSS riêng của module -->
  <link rel="stylesheet" href="./auth.css">
</head>
<body>
  <!-- Nội dung -->
  
  <!-- 4. Scripts theo thứ tự -->
  <script src="../../assets/js/core/config.js"></script>
  <script src="../../assets/js/core/api.js"></script>
  <script src="./auth.js"></script>
</body>
</html>
```

### B. Sử dụng CONFIG

```javascript
// Lấy cấu hình
const apiUrl = CONFIG.API_BASE_URL;
const loginRoute = CONFIG.ROUTES.LOGIN;

// Redirect
window.location.href = CONFIG.ROUTES.HOME;

// Storage keys
localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
```

### C. Sử dụng API

#### 1. Authentication
```javascript
// Login
const res = await AuthAPI.login(email, password);
TokenHelper.saveTokens(res.accessToken, res.refreshToken, res.userId);

// Register
const res = await AuthAPI.register(fullName, email, password, retypePassword);

// Logout
await AuthAPI.logout(userId, accessToken, refreshToken);
TokenHelper.clearTokens();

// Kiểm tra login
if (TokenHelper.isLoggedIn()) {
  // User đã đăng nhập
}
```

#### 2. Products
```javascript
// Lấy tất cả sản phẩm
const products = await ProductAPI.getAll({ page: 1, limit: 12 });

// Lấy sản phẩm theo ID
const product = await ProductAPI.getById(productId);

// Tạo sản phẩm (Admin)
await ProductAPI.create({
  name: "Product Name",
  price: 100000,
  description: "..."
});

// Cập nhật sản phẩm
await ProductAPI.update(productId, { price: 120000 });

// Xóa sản phẩm
await ProductAPI.delete(productId);
```

#### 3. Cart
```javascript
// Lấy giỏ hàng
const cart = await CartAPI.get();

// Thêm vào giỏ
await CartAPI.addItem(productId, quantity);

// Cập nhật số lượng
await CartAPI.updateItem(itemId, newQuantity);

// Xóa khỏi giỏ
await CartAPI.removeItem(itemId);

// Xóa toàn bộ giỏ
await CartAPI.clear();
```

#### 4. Orders
```javascript
// Lấy danh sách đơn hàng
const orders = await OrderAPI.getAll({ status: 'PENDING' });

// Chi tiết đơn hàng
const order = await OrderAPI.getById(orderId);

// Tạo đơn hàng
await OrderAPI.create({
  items: [...],
  shippingAddress: {...},
  paymentMethod: "COD"
});

// Cập nhật trạng thái (Admin)
await OrderAPI.updateStatus(orderId, 'CONFIRMED');

// Hủy đơn
await OrderAPI.cancel(orderId);
```

#### 5. Users
```javascript
// Lấy thông tin user hiện tại
const user = await UserAPI.getCurrentUser();

// Lấy tất cả users (Admin)
const users = await UserAPI.getAll();

// Cập nhật user
await UserAPI.update(userId, { fullName: "New Name" });
```

### D. Helper Functions (auth.js)

```javascript
// Toggle password visibility
togglePasswordVisibility(toggleBtn, inputField);

// Kiểm tra độ mạnh mật khẩu
const { strength, text, color } = checkPasswordStrength(password);

// Validate email
const isValid = isValidEmail(email);

// Hiển thị validation
showInputValidation(input, isValid, errorMsg, successMsg);

// Set loading button
const originalText = setButtonLoading(btn, true);
// ... do something
setButtonLoading(btn, false, originalText);
```

## 🎯 MIGRATION TỪ CODE CŨ

### Trước (Code cũ):
```javascript
// page/auth/login.html
async function request(url, options = {}) {
  const fullUrl = 'http://localhost:8080/api' + url;
  // ...
}

const res = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

localStorage.setItem('accessToken', res.accessToken);
```

### Sau (Code mới):
```javascript
// modules/auth/login.html
const res = await AuthAPI.login(email, password);
TokenHelper.saveTokens(res.accessToken, res.refreshToken, res.userId);
```

## 📂 ĐƯỜNG DẪN MỚI

### URLs cũ → URLs mới

| Cũ | Mới |
|---|---|
| `page/auth/login.html` | `modules/auth/login.html` |
| `page/auth/register.html` | `modules/auth/register.html` |
| `cart.html` | `modules/cart/index.html` |
| `checkout.html` | `modules/checkout/index.html` |
| `purchaseorder.html` | `modules/order/list.html` |
| `CustomerAddress.html` | `modules/order/address.html` |
| `admin.html` | `modules/admin/dashboard.html` |

## 🔗 LIÊN KẾT GIỮA CÁC TRANG

```javascript
// Redirect về login
window.location.href = CONFIG.ROUTES.LOGIN;

// Redirect về home
window.location.href = CONFIG.ROUTES.HOME;

// Redirect về giỏ hàng
window.location.href = CONFIG.ROUTES.CART;

// Redirect với query params
window.location.href = `${CONFIG.ROUTES.PRODUCT_DETAIL}?id=${productId}`;
```

## 🚨 LƯU Ý QUAN TRỌNG

### 1. Thứ tự load script
```html
<!-- Phải load theo thứ tự này -->
<script src="../../assets/js/core/config.js"></script>  <!-- 1. Config trước -->
<script src="../../assets/js/core/api.js"></script>     <!-- 2. API sau -->
<script src="./auth.js"></script>                       <!-- 3. Module cuối -->
```

### 2. Đường dẫn tương đối
```
modules/auth/login.html
├── CSS: ./auth.css
├── JS: ./auth.js
└── Core: ../../assets/js/core/config.js
```

### 3. API Error Handling
```javascript
try {
  const res = await AuthAPI.login(email, password);
  // Success
} catch (err) {
  console.error('Login error:', err);
  alert('Đăng nhập thất bại: ' + err.message);
}
```

### 4. Token Management
```javascript
// Luôn dùng TokenHelper thay vì localStorage trực tiếp
TokenHelper.saveTokens(access, refresh, userId);  // ✅ Đúng
localStorage.setItem('accessToken', access);       // ❌ Sai
```

## 📝 TODO LIST

### Đã hoàn thành ✅
- [x] Tạo cấu trúc modules/
- [x] Tạo config.js
- [x] Tạo api.js với AuthAPI, ProductAPI, CartAPI, OrderAPI, UserAPI
- [x] Tạo auth module (login.html, register.html, auth.css, auth.js)
- [x] Viết documentation

### Cần làm tiếp 🔄
- [ ] Tạo product module (list.html, detail.html, product.css, product.js)
- [ ] Tạo cart module (index.html, cart.css, cart.js)
- [ ] Tạo checkout module (index.html, checkout.css, checkout.js)
- [ ] Tạo order module (list.html, detail.html, address.html, order.css, order.js)
- [ ] Tạo admin module (dashboard.html, products.html, orders.html, users.html, admin.css, admin.js)
- [ ] Cập nhật index.html để link tới modules mới
- [ ] Test toàn bộ chức năng
- [ ] Xóa code cũ trong page/ và assets/js/

## 🧪 TESTING

### 1. Test Auth Module
```javascript
// Test login
- Mở modules/auth/login.html
- Nhập email/password
- Kiểm tra console có lỗi không
- Kiểm tra redirect về home page

// Test register
- Mở modules/auth/register.html
- Điền form đăng ký
- Kiểm tra password strength indicator
- Kiểm tra confirm password validation
```

### 2. Test API Calls
```javascript
// Mở Console (F12)
// Test các API
await AuthAPI.login('test@example.com', 'password123');
await ProductAPI.getAll();
await CartAPI.get();
```

## 🎉 KẾT QUẢ

### Lợi ích của cấu trúc mới:

1. ✅ **Code gọn gàng hơn**: Tách riêng từng module
2. ✅ **Dễ bảo trì**: Mỗi module độc lập
3. ✅ **Tái sử dụng**: API và Config dùng chung
4. ✅ **Dễ deploy**: Cấu trúc rõ ràng
5. ✅ **Team work**: Nhiều người cùng làm không conflict
6. ✅ **Scalable**: Dễ mở rộng thêm module mới

---

📧 Có thắc mắc? Hãy hỏi trong team chat!
🐛 Tìm thấy bug? Tạo issue trên GitHub!
