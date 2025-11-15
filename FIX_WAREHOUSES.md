# 🔧 SỬA LỖI WAREHOUSES KHÔNG LOAD ĐƯỢC DỮ LIỆU

## ⚠️ VẤN ĐỀ

**WarehouseController** yêu cầu role `ADMIN` và `SYSTEM_ADMIN`:
```java
@PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
```

Nhưng JWT của bạn trả về role có prefix `ROLE_`:
- `ROLE_ADMIN`
- `ROLE_SYS_ADMIN`
- `ROLE_SYSTEM_ADMIN`

Spring Security mặc định thêm prefix `ROLE_` vào role.

---

## ✅ GIẢI PHÁP

### **Option 1: Sửa Backend WarehouseController (KHUYẾN NGHỊ)**

Thay đổi `@PreAuthorize` để match với format role thực tế:

```java
package com.manhduc205.ezgear.controllers;

import com.manhduc205.ezgear.dtos.WarehouseDTO;
import com.manhduc205.ezgear.models.Warehouse;
import com.manhduc205.ezgear.services.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYS_ADMIN', 'ROLE_SYSTEM_ADMIN')") // ✅ SỬA ĐÂY
public class WarehouseController {

    private final WarehouseService warehouseService;

    @PostMapping
    public ResponseEntity<Warehouse> create(@RequestBody WarehouseDTO dto) {
        return ResponseEntity.ok(warehouseService.createWarehouse(dto));
    }

    @GetMapping
    public ResponseEntity<List<Warehouse>> getAll() {
        return ResponseEntity.ok(warehouseService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Warehouse> getById(@PathVariable Long id) {
        return warehouseService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Warehouse> update(@PathVariable Long id, @RequestBody WarehouseDTO dto) {
        return ResponseEntity.ok(warehouseService.updateWarehouse(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        warehouseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### **Option 2: Sửa JWT để trả về role không có prefix**

Nếu muốn giữ `@PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")`, bạn cần sửa JWT generator để **không thêm prefix `ROLE_`**.

Tìm class generate JWT và sửa:

```java
// Thay vì
claims.put("roles", List.of("ROLE_ADMIN", "ROLE_SYS_ADMIN"));

// Dùng
claims.put("roles", List.of("ADMIN", "SYS_ADMIN", "SYSTEM_ADMIN"));
```

Nhưng cách này **không khuyến nghị** vì sẽ ảnh hưởng đến tất cả controllers khác.

---

## 🧪 KIỂM TRA

### 1. Mở Console (F12) trong trình duyệt
### 2. Vào trang Warehouses: `modules/admin/warehouses.html`
### 3. Xem log:

**Nếu thấy:**
```
Warehouses response status: 403
Warehouses error: {"timestamp":"...","status":403,"error":"Forbidden",...}
```
→ **Đây là lỗi quyền truy cập** (role không match)

**Nếu thấy:**
```
Warehouses response status: 200
Warehouses data: [...]
```
→ **Đã OK**, dữ liệu đã load thành công

### 4. Kiểm tra JWT token

Mở Console và chạy:
```javascript
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', payload);
console.log('Roles:', payload.roles);
```

Bạn sẽ thấy roles như:
```json
{
  "sub": "admin@ezgear.com",
  "roles": ["ROLE_ADMIN", "ROLE_SYS_ADMIN"],
  "iat": 1699776000,
  "exp": 1699862400
}
```

Nếu roles là `["ROLE_ADMIN"]` thì phải sửa backend như **Option 1**.

---

## 📝 TÓM TẮT

**NGUYÊN NHÂN**: 
- Backend yêu cầu: `hasAnyRole('ADMIN', 'SYSTEM_ADMIN')`
- JWT trả về: `["ROLE_ADMIN", "ROLE_SYS_ADMIN"]`
- → Không match!

**GIẢI PHÁP**:
1. ✅ **Sửa WarehouseController**: Đổi thành `hasAnyRole('ROLE_ADMIN', 'ROLE_SYS_ADMIN', 'ROLE_SYSTEM_ADMIN')`
2. Restart Spring Boot backend
3. Refresh trang warehouses.html
4. Kiểm tra console log

---

## 🚀 SAU KHI SỬA

Trang Warehouses sẽ:
- ✅ Load danh sách kho hàng
- ✅ Hiển thị dropdown chi nhánh
- ✅ Thêm/sửa/xóa kho hàng được
- ✅ Tìm kiếm hoạt động

Nếu vẫn lỗi, cung cấp cho tôi:
1. Console log đầy đủ (F12)
2. Network tab → Request Headers → Authorization
3. Response body của API `/warehouses`
