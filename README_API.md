# EzGear Backend API Documentation

Welcome to the **EzGear Backend** project! This repository contains the server-side logic for the EzGear e-commerce platform, built with **Spring Boot**. It provides a comprehensive set of RESTful APIs to manage users, products, orders, inventory, shipping, and more.

## Tech Stack & Architecture

-   **Framework**: Spring Boot (Java)
-   **Databases**:
    -   **MySQL**: Primary relational database for core business data (users, orders, products).
    -   **MongoDB**: Used for logging or flexible data storage (e.g., audit logs).
    -   **Redis**: Caching (products, sessions) and cart management.
    -   **Elasticsearch**: Advanced full-text search engine for products.
-   **Authentication**: JWT (JSON Web Tokens) with Spring Security.
-   **Integrations**:
    -   **Giao Hang Nhanh (GHN)**: Shipping calculation and order syncing.
    -   **VNPay**: Payment gateway integration.
    -   **Cloudinary**: Image storage and management.
    -   **Google/Facebook**: Social login.
    -   **Firebase**: Push notifications.

## Table of Contents

1.  [Authentication & User Management](#authentication--user-management)
2.  [Product Catalog](#product-catalog)
3.  [Order & Cart](#order--cart)
4.  [Inventory & Warehouse](#inventory--warehouse)
5.  [Shipping & Logistics (GHN)](#shipping--logistics-ghn)
6.  [Payments & Invoices](#payments--invoices)
7.  [System & Notifications](#system--notifications)

---

## Authentication & User Management

### Auth Controller (`/auth`)
Handles user registration, login (including social), and logout.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account. | Public |
| `POST` | `/auth/login` | Login with username/password to get JWT tokens. | Public |
| `POST` | `/auth/social/google` | Login or register with Google. | Public |
| `POST` | `/auth/social/facebook` | Login or register with Facebook. | Public |
| `POST` | `/auth/logout` | Logout (invalidate refresh token). | Authenticated |

### User Controller (`/users`)
manage user profiles and accounts.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/details` | Get current user's profile details. | Authenticated |
| `PUT` | `/users/details` | Update current user's profile. | Authenticated |
| `PUT` | `/users/change-password` | Change user password. | Authenticated |
| `GET` | `/users` | Get specific user by ID (Admin). | Admin |
| `GET` | `/users/all` | Get all users (Admin). | Admin |
| `PUT` | `/users/block/{id}` | Block/Unblock a user (Admin). | Admin |

### Customer Address Controller (`/customer-address`)
Manage user shipping addresses.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/customer-address` | Get all addresses for the logged-in user. | Authenticated |
| `POST` | `/customer-address` | Add a new address. | Authenticated |
| `PUT` | `/customer-address/{id}` | Update an existing address. | Authenticated |
| `DELETE` | `/customer-address/{id}` | Delete an address. | Authenticated |
| `PUT` | `/customer-address/default/{id}` | Set an address as default. | Authenticated |

---

## Product Catalog

### Product Controller (`/products`)
Core product management and search.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/products/search/es` | Search products via **Elasticsearch** (advanced search). | Public |
| `GET` | `/products/{slug}` | Get public product details by slug. | Public |
| `GET` | `/products/{slug}/related` | Get related products. | Public |
| `POST` | `/products/admin/search` | Advanced search for Admins (DB based). | Admin |
| `POST` | `/products/admin/sync-es` | Manually sync all products to Elasticsearch. | Admin |
| `POST` | `/products` | Create a new product. | Admin |
| `PUT` | `/products/{id}` | Update an existing product. | Admin |
| `DELETE` | `/products/{id}` | Soft delete a product. | Admin |
| `GET` | `/products/admin/{id}` | Get full product details for Admin editing. | Admin |
| `POST` | `/products/uploads/{id}` | Upload extra images for a product. | Admin |
| `DELETE` | `/products/images/{imageId}` | Delete a specific product image. | Admin |

### Category Controller (`/categories`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Get all product categories. | Public |
| `POST` | `/categories` | Create a new category. | Admin |
| `PUT` | `/categories/{id}` | Update a category. | Admin |
| `DELETE` | `/categories/{id}` | Delete a category. | Admin |

### Brand Controller (`/brands`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/brands` | Get all brands. | Public |
| `POST` | `/brands` | Create a new brand. | Admin |
| `PUT` | `/brands/{id}` | Update a brand. | Admin |
| `DELETE` | `/brands/{id}` | Delete a brand. | Admin |

### Product Sku Controller (`/product-skus`)
Manage product variants (SKUs) based on attributes (e.g., Color, RAM).

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/product-skus/product/{productId}` | Get all SKUs for a product. | Public/Admin |
| `POST` | `/product-skus` | Create a new SKU for a product. | Admin |
| `PUT` | `/product-skus/{id}` | Update an SKU. | Admin |
| `DELETE` | `/product-skus/{id}` | Delete an SKU. | Admin |

### Review Controller (`/reviews`)
Product reviews and ratings.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/reviews/product/{productId}` | Get reviews for a product. | Public |
| `POST` | `/reviews` | Submit a review for a purchased product. | Authenticated |
| `PUT` | `/reviews/{id}` | Update a review. | Owner |
| `DELETE` | `/reviews/{id}` | Delete a review. | Admin/Owner |

---

## Order & Cart

### Cart Controller (`/cart`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart` | Get current user's cart. | Authenticated |
| `POST` | `/cart/add` | Add item/update quantity in cart. | Authenticated |
| `PUT` | `/cart/update/{skuId}` | Update item quantity. | Authenticated |
| `DELETE` | `/cart/remove/{skuId}` | Remove an item from cart. | Authenticated |
| `DELETE` | `/cart/clear` | Clear the entire cart. | Authenticated |
| `POST` | `/cart` | Preview checkout (calculate totals/discounts). | Authenticated |

### Order Controller (`/orders`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders/place` | Place a new order. | Authenticated |
| `GET` | `/orders/my-orders` | Get list of user's orders. | Authenticated |
| `GET` | `/orders/{orderCode}` | Get order details by code. | Authenticated |

### Voucher Controller (`/vouchers`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/vouchers` | List valid vouchers. | Public |
| `POST` | `/vouchers/validate` | Check if a voucher is applicable. | Authenticated |
| `POST` | `/vouchers` | Create a new voucher. | Admin |
| `PUT` | `/vouchers/{id}` | Update a voucher. | Admin |
| `DELETE` | `/vouchers/{id}` | Delete a voucher. | Admin |

---

## Inventory & Warehouse

### Warehouse Controller (`/warehouses`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/warehouses` | List all warehouses. | Authenticated |
| `POST` | `/warehouses` | Create a new warehouse. | Admin |
| `PUT` | `/warehouses/{id}` | Update warehouse info. | Admin |
| `DELETE` | `/warehouses/{id}` | Delete a warehouse. | Admin |

### Product Stock Controller (`/product-stocks`)
Manage quantity of SKUs in specific warehouses.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/product-stocks` | View stock levels. | Admin |
| `POST` | `/product-stocks/transaction` | Manually adjust stock (Import/Export). | Admin |

### Stock Transfer Controller (`/stock-transfers`)
Manage stock movement between warehouses.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/stock-transfers` | Create a transfer request. | Admin |
| `POST` | `/stock-transfers/{id}/approve` | Approve a transfer. | Admin |
| `POST` | `/stock-transfers/{id}/complete` | Mark transfer as completed. | Admin |

### Purchase Order Controller (`/purchase-orders`)
Manage supplier purchase orders.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/purchase-orders` | Create a purchase order. | Admin |
| `GET` | `/purchase-orders` | List purchase orders. | Admin |
| `PUT` | `/purchase-orders/{id}/status` | Update PO status (e.g., Received). | Admin |

### Branch Controller (`/branches`)
Manage physical store branches (if applicable).

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/branches` | List all branches. | Public |
| `POST` | `/branches` | Create a branch. | Admin |
| `PUT` | `/branches/{id}` | Update branch info. | Admin |

---

## Shipping & Logistics (GHN)

### Ghn Shipping Controllers (`/ghn/*`)
Direct integration with Giao Hang Nhanh API.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/ghn/shipping-fee/calculate` | Calculate shipping fee. | Authenticated |
| `GET` | `/ghn/location/provinces` | Get provinces from GHN. | Public |
| `GET` | `/ghn/location/districts` | Get districts from GHN. | Public |
| `GET` | `/ghn/location/wards` | Get wards from GHN. | Public |
| `POST` | `/ghn/order/create` | Create a shipping order in GHN (internal). | Admin/System |

### Shipment Controller (`/shipments`)
Internal shipment tracking.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/shipments/{id}` | Get shipment details. | Authenticated |
| `PUT` | `/shipments/{id}/status` | Update shipment status manually. | Admin |

---

## Payments & Invoices

### Payment Controller (`/payment`)
Handles payment gateway callbacks and processing.

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/payment/vnpay/create-payment` | Generate VNPay payment URL. | Authenticated |
| `GET` | `/payment/vnpay/return` | Handle user return from VNPay (Customer view). | Public |
| `GET` | `/payment/vnpay/callback` | IPN Callback for server-to-server update (System).| Public |

### Invoice Controller (`/invoices`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/invoices/{orderId}` | Get invoice for an order. | Authenticated |
| `POST` | `/invoices/{orderId}/generate` | Generate invoice for an order. | Admin |

---

## System & Notifications

### Notification Controller (`/notifications`)

| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Get user notifications. | Authenticated |
| `PUT` | `/notifications/{id}/read` | Mark notification as read. | Authenticated |
| `POST` | `/notifications/send` | Send a push notification (Admin). | Admin |

