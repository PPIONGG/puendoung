# 🔌 API Documentation

รายการ API endpoints ทั้งหมดของเพื่อนด้วง พร้อมตัวอย่าง request/response

---

## 📋 รูปแบบ Response

### Success
```json
{
  "data": { ... },
  "meta": { ... }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

---

## 🌍 Public APIs (ไม่ต้อง Login)

### Health Check
```
GET /health
```
Response: `{ "status": "ok" }`

---

### Products

#### List Products
```
GET /api/products?category=live-specimens&isLive=true&sort=newest&page=1&limit=24
```

Query params:
- `category` - slug ของหมวดหมู่
- `isLive` - `true` สำหรับสินค้ามีชีวิต
- `availability` - `ready`, `preorder`, etc.
- `q` - คำค้นหา
- `sort` - `newest`, `price_asc`, `price_desc`
- `page`, `limit` - pagination

Response:
```json
{
  "data": [ { "id": "...", "name": "ด้วงกว่างสามเขา", "price": 85000, ... } ],
  "meta": { "page": 1, "limit": 24, "total": 50, "totalPages": 3 }
}
```

#### Get Product Detail
```
GET /api/products/:slug
```

Response:
```json
{
  "data": {
    "id": "...",
    "slug": "rhinoceros-beetle-male",
    "name": "ด้วงกว่างสามเขา ตัวผู้",
    "price": 85000,
    "stockQuantity": 5,
    "isLiveSpecimen": true,
    "speciesName": "Trypoxylus dichotomus",
    "sex": "male",
    "lifeStage": "adult",
    "careLevel": "intermediate",
    "temperatureRange": "22-28°C",
    ...
  }
}
```

---

### Categories

```
GET /api/categories
```

Response:
```json
{
  "data": [
    { "id": "...", "slug": "live-specimens", "name": "ด้วงมีชีวิต" },
    ...
  ]
}
```

---

### Cart Validation

```
POST /api/cart/validate
Content-Type: application/json

{
  "items": [
    { "productId": "...", "quantity": 2 }
  ]
}
```

Response:
```json
{
  "data": {
    "items": [ ... ],
    "subtotal": 170000,
    "shippingAmount": 0,
    "discountAmount": 0,
    "total": 170000,
    "hasLiveSpecimen": true
  }
}
```

---

### Orders

#### Create Order
```
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>  // optional (สำหรับลูกค้าที่ login)

{
  "customerName": "สมชาย ใจดี",
  "customerPhone": "0812345678",
  "customerEmail": "somchai@example.com",
  "shippingName": "สมชาย ใจดี",
  "shippingPhone": "0812345678",
  "shippingAddress": "123 ถนนสุขุมวิท",
  "shippingProvince": "กรุงเทพฯ",
  "shippingDistrict": "วัฒนา",
  "shippingPostalCode": "10110",
  "shippingMethod": "express",
  "shippingNotes": "",
  "items": [
    { "productId": "...", "quantity": 1 }
  ],
  "couponCode": "WELCOME50"  // optional
}
```

Response:
```json
{
  "data": {
    "id": "...",
    "orderNumber": "PD20240421-ABCD",
    "lookupToken": "a1b2c3d4e5f6...",
    "totalAmount": 80000,
    "status": "pending_payment",
    ...
  }
}
```

#### Get Order (Tracking)
```
GET /api/orders/:orderNumber?phone=0812345678
```

**❗ ต้องมีอย่างใดอย่างหนึ่ง:**
- `Authorization: Bearer <token>` (ถ้าเป็นเจ้าของ)
- `session` cookie (ถ้าเป็น admin)
- `?phone=` หรือ `?email=` (ถ้าเป็น guest)

Guest response (redacted - ไม่มี PII):
```json
{
  "data": {
    "orderNumber": "PD20240421-ABCD",
    "status": "pending_payment",
    "totalAmount": 80000,
    "items": [ ... ],
    "shipments": [ ... ]
  }
}
```

---

### Order Timeline

```
GET /api/orders/:orderNumber/timeline?phone=0812345678
```

Auth requirements เหมือน `GET /orders/:orderNumber`

Response:
```json
{
  "data": [
    { "id": "...", "status": "pending_payment", "note": "Order created", "createdAt": "..." },
    { "id": "...", "status": "paid", "note": "Status changed to paid", "createdAt": "..." }
  ]
}
```

---

### Payments

#### Create Payment
```
POST /api/payments/create
Content-Type: application/json

{ "orderNumber": "PD20240421-ABCD" }
```

Response:
```json
{
  "data": { "paymentId": "...", "status": "pending" }
}
```

#### Mock Payment (Local Only)
```
POST /api/payments/mock-pay
Content-Type: application/json

{ "paymentId": "..." }
```

**❗ ใช้ได้เฉพาะ `NODE_ENV !== "production"`**

---

### Coupons

#### Validate Coupon
```
POST /api/coupons/validate
Content-Type: application/json

{
  "code": "WELCOME50",
  "subtotal": 85000
}
```

Response:
```json
{
  "data": {
    "code": "WELCOME50",
    "name": "ส่วนลด 50 บาท",
    "discount": 5000
  }
}
```

---

### Sitemap

```
GET /sitemap.xml
```

Return: XML sitemap สำหรับ SEO

---

## 🔐 Customer Auth APIs

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "สมชาย",
  "phone": "0812345678"
}
```

Response:
```json
{
  "data": {
    "user": { "id": "...", "email": "user@example.com", "name": "สมชาย" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Me
```
GET /api/auth/me
Authorization: Bearer <accessToken>
```

### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{ "refreshToken": "eyJ..." }
```

### Logout
```
POST /api/auth/logout
Content-Type: application/json

{ "refreshToken": "eyJ..." }  // optional
```

---

## 🔒 Admin APIs (ต้อง Login เป็น Admin)

### Admin Auth

#### Login
```
POST /api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@puendoung.test",
  "password": "admin1234"
}
```

**Response จะ set cookie `session` แทน JSON token**

#### Get Current Admin
```
GET /api/admin/auth/me
Cookie: session=<admin_jwt>
```

#### Logout
```
POST /api/admin/auth/logout
```

---

### Admin Products

```
GET    /api/admin/products?page=1&limit=24&q=keyword
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id   // จริง ๆ คือ archive
```

---

### Admin Orders

```
GET    /api/admin/orders?page=1&limit=24&status=pending_payment
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status
POST   /api/admin/orders/:id/shipments
PATCH  /api/admin/shipments/:id
```

---

### Admin Stats

```
GET /api/admin/stats
```

Response:
```json
{
  "data": {
    "totalOrders": 150,
    "pendingOrders": 12,
    "todayOrders": 5,
    "totalRevenue": 12500000,
    "totalProducts": 45,
    "lowStockProducts": 3
  }
}
```

**หมายเหตุ:** `totalRevenue` นับเฉพาะ order ที่ `paymentStatus = "paid"` เท่านั้น

---

## 🔑 Authentication Summary

| ส่วน | วิธีการ | Header/Cookie |
|------|---------|--------------|
| Customer API | JWT Access Token | `Authorization: Bearer <token>` |
| Customer Refresh | JWT Refresh Token | Body JSON |
| Admin API | Signed Cookie | `Cookie: session=<jwt>` |

---

## ⚠️ HTTP Status Codes

| Code | ความหมาย |
|------|----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (ไม่ได้ login) |
| 403 | Forbidden (login แล้วแต่ไม่มีสิทธิ์) |
| 404 | Not Found |
| 409 | Conflict (stock ไม่พอ, slug ซ้ำ) |
| 422 | Validation Error (Zod) |
| 429 | Rate Limited |
| 500 | Internal Server Error |
