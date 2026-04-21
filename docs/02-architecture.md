# 🏗️ สถาปัตยกรรมระบบ

เอกสารนี้อธิบายโครงสร้างของเพื่อนด้วง การสื่อสารระหว่างส่วนต่าง ๆ และ flow ข้อมูลสำคัญ

---

## 📐 ภาพรวม Architecture

```
┌─────────────────┐      HTTP/REST      ┌─────────────────┐      SQL      ┌─────────────────┐
│   React (Web)   │ ◄─────────────────► │  Fastify (API)  │ ◄───────────► │   PostgreSQL    │
│   Port: 5173    │                     │   Port: 3001    │               │   Port: 5432    │
└─────────────────┘                     └─────────────────┘               └─────────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
  Static Files                            Prisma ORM
  (Vite Build)                            (Schema + Migration)
```

---

## 🖥️ Frontend (React + Vite)

### โครงสร้าง
```
apps/web/src/
├── main.tsx          # Entry point
├── App.tsx           # Router + Layout
├── index.css         # Tailwind + theme
├── components/       # Reusable UI
│   ├── ui/           # Button, Input, Card, Badge
│   ├── Layout.tsx    # Header + Footer + Cart count
│   ├── AdminLayout.tsx
│   └── JsonLd.tsx    # SEO structured data
├── pages/            # หน้าต่าง ๆ
│   ├── HomePage.tsx
│   ├── ProductListPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── OrderTrackPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── AccountPage.tsx
│   └── Admin*.tsx
├── lib/
│   ├── api.ts        # เรียก backend API
│   └── utils.ts      # formatPrice, status labels
├── store/
│   ├── cartStore.ts  # Zustand: ตะกร้า
│   └── authStore.ts  # Zustand: ข้อมูล login
└── hooks/
    └── usePageTitle.ts
```

### State Management
ใช้ **Zustand** (ไม่ใช่ Redux) เพราะง่ายกว่า:
- `cartStore`: เก็บสินค้าในตะกร้า บันทึกลง localStorage
- `authStore`: เก็บ JWT token + ข้อมูล user

### Routing
```
/                          → หน้าแรก
/products                  → รายการสินค้า
/products/:slug            → รายละเอียดสินค้า
/cart                      → ตะกร้า
/checkout                  → ชำระเงิน
/orders/:orderNumber       → ติดตาม order
/login, /register, /account → สมาชิก
/admin/login               → แอดมิน login
/admin                     → Dashboard
/admin/products            → จัดการสินค้า
/admin/orders              → จัดการ order
/privacy, /terms           → เอกสารกฎหมาย
```

---

## ⚙️ Backend (Fastify + TypeScript)

### โครงสร้าง
```
apps/api/src/
├── index.ts            # Entry point: register plugins + routes
├── config.ts           # อ่าน environment variables
├── prisma.ts           # Prisma client singleton
├── lib/
│   ├── jwt.ts          # JWT sign/verify helpers
│   └── orderAuth.ts    # Order authorization helper
├── plugins/
│   ├── auth.ts         # Admin + Customer auth middleware
│   └── error.ts        # Global error handler
├── jobs/
│   └── expireReservations.ts  # Background job: cancel expired orders
└── routes/
    ├── health.ts       # GET /health
    ├── products.ts     # Public product APIs
    ├── categories.ts
    ├── cart.ts         # Cart validation
    ├── orders.ts       # Order creation + lookup
    ├── payments.ts     # Payment + webhook
    ├── auth.ts         # Customer auth
    ├── coupons.ts
    ├── timeline.ts
    ├── sitemap.ts
    └── admin/
        ├── auth.ts
        ├── products.ts
        ├── orders.ts
        └── stats.ts
```

### Authentication Flows

#### Customer (JWT)
```
1. สมัคร/Login → Backend ส่ง accessToken + refreshToken
2. Frontend เก็บ accessToken ใน localStorage
3. ทุก request ต่อ API แนบ Header: Authorization: Bearer <token>
4. Token หมดอายุ 15 นาที → ใช้ refreshToken ขอใหม่
```

#### Admin (Signed Cookie)
```
1. Login → Backend สร้าง JWT admin_session token
2. เก็บใน HttpOnly Cookie (ชื่อ "session")
3. หมดอายุ 24 ชม.
4. ทุก admin request ตรวจ cookie นี้
5. Logout → clear cookie
```

---

## 🗄️ Database (PostgreSQL + Prisma)

### สถาปัตยกรรม
- **Prisma Schema** เป็น single source of truth
- ใช้ **Migration** ไม่แก้ schema ด้วยมือ
- ทุกตารางหลักมี `createdAt` + `updatedAt`

### Entity หลัก (ดูรายละเอียดใน [03-database.md](./03-database.md))

```
User ──► CustomerProfile ──► Address
  │                            │
  └──► AdminAction            └──► Order ──► OrderItem ──► Product
                                    │
                                    ├──► Payment ──► PaymentEvent
                                    ├──► Shipment
                                    ├──► OrderTimeline
                                    └──► Coupon
```

---

## 🔄 Data Flow สำคัญ

### 1. สร้าง Order (พร้อม Stock Reservation)

```
[ลูกค้า] POST /api/orders {items, address, ...}
              ↓
[API] 1. Validate request (Zod)
      2. ตรวจสินค้าทุกชิ้น (มีของไหม? active ไหม?)
      3. BEGIN TRANSACTION
         4. ตัด stock แต่ละสินค้า (decrement)
         5. สร้าง Order + OrderItem (snapshot ราคา)
         6. สร้าง InventoryMovement (reason: "reserve")
         7. สร้าง OrderTimeline (status: pending_payment)
         8. COMMIT
              ↓
[Response] {orderNumber, lookupToken, ...}
```

**ถ้า transaction fail ระหว่างทาง?**  
PostgreSQL จะ rollback ทั้งหมดอัตโนมัติ stock ไม่หาย

### 2. ชำระเงิน (Payment Flow)

```
[ลูกค้า] POST /api/payments/create {orderNumber}
              ↓
[API] สร้าง Payment record (status: pending)
              ↓
[ลูกค้า] POST /api/payments/mock-pay {paymentId}  ← จำลองเท่านั้น
              ↓
[API] เรียก Webhook: POST /api/payments/webhook/mock
      (idempotent - กัน duplicate)
              ↓
[API] 1. ตรวจ providerEventId ซ้ำ?
      2. อัปเดต Payment → paid (conditional update)
      3. อัปเดต Order → paid
      4. ถ้ามี coupon → increment usageCount
      5. สร้าง InventoryMovement (reason: "sale")
      6. บันทึก PaymentEvent
              ↓
[Response] {status: "paid"}
```

### 3. ยกเลิก Order (Admin Cancel / Auto Expire)

```
Trigger: Admin กด cancel หรือ Background job เจอ order หมดอายุ
              ↓
[API/Batch] 1. ตรวจว่า order เคยถูก cancel แล้วหรือยัง
            2. BEGIN TRANSACTION
               3. อัปเดต Order → cancelled
               4. คืน stock ทุก item (increment)
               5. สร้าง InventoryMovement (reason: "cancel")
               6. สร้าง OrderTimeline
               7. COMMIT
```

### 4. Guest Order Lookup (ด้วย Phone/Email)

```
[ลูกค้า] GET /api/orders/PD20240421-ABCD
              ↓
[API] 1. หา order
      2. ตรวจ auth:
         - Admin session? → ผ่าน
         - Customer JWT เจ้าของ? → ผ่าน
         - ไม่มี auth → ตรวจ phone/email จาก query
      3. ถ้า guest lookup ผ่าน → คืน redacted data
         (ซ่อน PII: ชื่อ ที่อยู่ เบอร์ อีเมล)
```

---

## 🏗️ Design Decisions (ทำไมถึงเลือกแบบนี้)

### ทำไมแยก Monorepo?
- Frontend กับ Backend แยกกันชัดเจน
- แต่ใช้ repo เดียว deploy ง่าย
- ใช้ npm workspaces จัดการ dependencies

### ทำไมใช้ Fastify ไม่ใช่ Express?
- Fastify เร็วกว่า (benchmark สูงกว่า)
- Plugin system ดีกว่า
- Built-in validation support

### ทำไม stock เก็บเป็น Integer (ไม่ใช่ Float)?
- ไม่มีปัญหาทศนิยมผิดเพี้ยน
- เปรียบเทียบง่าย (`stockQuantity < item.quantity`)
- คำนวณเร็วกว่า

### ทำไมใช้ JWT สำหรับ customer แต่ cookie สำหรับ admin?
- Customer: ใช้หลายอุปกรณ์ (มือถือ/คอม) → JWT สะดวกกว่า
- Admin: ใช้คอมเดียว ต้องปลอดภัยสูง → HttpOnly Cookie กัน XSS

---

## 📊 Infrastructure Diagram (Production)

```
                    ┌─────────────┐
                    │   Nginx     │  ← Reverse Proxy, SSL
                    │  (Docker)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
     │   Web     │  │    API    │  │  Backup   │
     │  (React)  │  │ (Fastify) │  │  (cron)   │
     └───────────┘  └─────┬─────┘  └───────────┘
                          │
                    ┌─────▼─────┐
                    │ PostgreSQL │
                    │  (Docker)  │
                    └─────────────┘
```

---

## 🚨 จุดที่ต้องระวัง (Gotchas)

1. **Order Number ไม่ใช่ UUID** → มี pattern เป็นวันที่ + random 4 ตัว อาจถูก brute force → แก้ไขโดยใช้ lookup token + phone verification

2. **Stock ต้องถูกต้องเสมอ** → ทุก operation ที่เกี่ยวกับ stock ต้องอยู่ใน transaction

3. **Payment Webhook อาจส่งซ้ำ** → ทำ idempotent ด้วย providerEventId + conditional update

4. **Guest checkout ไม่มี userId** → order.customerId เป็น null ได้ ต้องจัดการกรณีนี้ทุกที่

5. **Mock Payment ห้ามเปิดใน production** → endpoint จะ return 404 ถ้า NODE_ENV=production
