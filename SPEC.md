# เพื่อนด้วง - Senior Agent Coding Spec

เอกสารนี้คือสเปกหลักสำหรับให้ coding agent สร้างโปรเจกต์จริงจังระดับ production-minded สำหรับเว็บ e-commerce ชื่อ **เพื่อนด้วง** ร้านขายด้วงและสินค้าเกี่ยวกับการเลี้ยงด้วงแบบครบวงจร เช่น ตัวด้วง บ้านด้วง ดิน อาหาร อุปกรณ์ และคู่มือการเลี้ยง

เป้าหมายไม่ใช่ทำเว็บ demo หรือ template ร้านค้าทั่วไป แต่ต้องวาง foundation ให้ต่อยอดเป็นระบบขายจริงได้ในอนาคต มี flow ครบพอสำหรับธุรกิจจริง มี backend, database, Docker, admin workflow, order/payment design และรองรับการ deploy production ได้

## 1. Product Vision

เพื่อนด้วงเป็น e-commerce เฉพาะทางสำหรับคนเลี้ยงด้วงในไทย โดยต้องให้ความรู้สึกว่าเป็นร้านที่เชี่ยวชาญจริง ไม่ใช่เว็บขายของทั่วไป

ระบบต้องรองรับสินค้า 2 กลุ่มใหญ่:

- สินค้าสิ่งมีชีวิต: ตัวด้วง หนอน ดักแด้ หรือสัตว์เลี้ยงที่เกี่ยวข้อง
- สินค้าทั่วไป: บ้านด้วง กล่องเลี้ยง ดิน อาหาร เจลลี่ ไม้ อุปกรณ์ และสินค้าเสริม

ความแตกต่างสำคัญคือสินค้าสิ่งมีชีวิตต้องมีข้อมูลการดูแล การขนส่ง และสถานะความพร้อมขายละเอียดกว่าสินค้าทั่วไป เช่น ระดับความยาก อุณหภูมิ ความชื้น ช่วงวัย เพศ และหมายเหตุการจัดส่ง

## 2. Target Users

### ลูกค้าทั่วไป

- เลือกซื้อด้วงหรืออุปกรณ์เลี้ยงด้วง
- อ่านข้อมูลการเลี้ยงก่อนตัดสินใจ
- ดูสถานะสินค้าและข้อจำกัดการจัดส่ง
- เพิ่มสินค้าลงตะกร้าและสั่งซื้อ
- ติดตามสถานะคำสั่งซื้อ

### ผู้ดูแลร้าน

- จัดการสินค้า หมวดหมู่ ราคา รูปภาพ และสต็อก
- จัดการข้อมูลเฉพาะของด้วง เช่น species, life stage, sex, care level
- ตรวจสอบคำสั่งซื้อและสถานะชำระเงิน
- อัปเดตสถานะจัดส่ง
- ดูรายการลูกค้าและประวัติคำสั่งซื้อ

## 3. Recommended Tech Stack

ให้ agent ใช้ stack นี้ เว้นแต่มีเหตุผลชัดเจนจากข้อจำกัดของโปรเจกต์:

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Fastify + TypeScript
- Database: PostgreSQL
- ORM / Migration: Prisma
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Icons: lucide-react
- Local development: Docker Compose
- Package manager: npm หรือ pnpm เลือกอย่างใดอย่างหนึ่งและใช้ให้สม่ำเสมอ
- API validation: Zod หรือ JSON Schema
- Testing: Vitest สำหรับ unit/service tests และ Playwright สำหรับ critical user flows ถ้าทำ frontend flow ครบ

หมายเหตุ:

- DBeaver เป็น database client ไม่ใช่ database server ดังนั้นระบบต้องเชื่อม PostgreSQL ผ่าน `DATABASE_URL`
- Docker Compose ควรมี PostgreSQL สำหรับ local development
- ต้องรองรับกรณีใช้ PostgreSQL ภายนอกด้วยการตั้งค่า env

### 3.1 MVP Local-First Defaults

Phase 1 ต้องรันได้ทั้งหมดในเครื่อง local โดยยังไม่ต้องใช้บริการภายนอก

Default สำหรับ MVP:

- ภาษาเว็บหลัก: ไทย
- สกุลเงิน: THB
- หน่วยเงินใน database: integer หน่วยสตางค์
- Timezone: Asia/Bangkok
- Checkout: รองรับ guest checkout ก่อน
- Payment: ใช้ mock payment provider เท่านั้น
- Admin account: สร้างผ่าน seed สำหรับ local development
- Product images: ใช้ URL หรือ static seed images ก่อน ยังไม่บังคับทำระบบ upload เต็ม
- Email/SMS: ยังไม่ต้องส่งจริงใน Phase 1 แต่โครงสร้างต้องต่อเพิ่มได้

Agent ห้ามต่อ payment provider จริง, cloud storage, production database หรือ external service โดยไม่ได้ระบุเพิ่มเติมในสเปกหรือคำสั่งผู้ใช้

## 4. Architecture Goals

สร้างระบบแบบ full-stack ที่แยกหน้าที่ชัดเจน:

```text
apps/
  web/        React frontend
  api/        Fastify backend
packages/
  shared/     shared types/constants ถ้าจำเป็น
prisma/
  schema.prisma
  migrations/
docker-compose.yml
.env.example
README.md
```

หลักการออกแบบ:

- Frontend เรียก backend ผ่าน API เท่านั้น
- Backend เป็นเจ้าของ business logic เช่น stock, order, payment status
- Database ใช้ migration ไม่แก้ schema แบบ manual
- แยก domain logic ออกจาก route handler เมื่อเหมาะสม
- ออกแบบ payment เป็น provider adapter เพื่อรองรับ mock payment ตอน dev และ provider จริงภายหลัง
- หลีกเลี่ยง hardcode config; ใช้ env variables

### 4.1 Required Developer Commands

โปรเจกต์ต้องมี script ที่อ่านแล้วเข้าใจง่ายใน `package.json` หรือ workspace scripts:

- `dev`: รัน frontend และ backend สำหรับ development
- `build`: build ทุก app/package ที่จำเป็น
- `typecheck`: ตรวจ TypeScript
- `lint`: ตรวจ lint ถ้ามี lint setup
- `test`: รัน test ทั้งหมดที่มี
- `db:migrate`: รัน Prisma migration
- `db:seed`: seed ข้อมูลตัวอย่าง
- `db:studio`: เปิด Prisma Studio ถ้าใช้ได้
- `docker:up`: เปิด service local เช่น PostgreSQL
- `docker:down`: ปิด service local

README ต้องอธิบายลำดับคำสั่งสำหรับคนเริ่มจาก repo ว่างจนเปิดเว็บได้

## 5. Core Commerce Flows

### 5.1 Browse Catalog

ลูกค้าต้องสามารถ:

- ดูรายการสินค้า
- ค้นหาสินค้า
- filter ตามหมวดหมู่
- filter สินค้าพร้อมส่ง / พรีออเดอร์ / หมด
- filter เฉพาะสินค้าสิ่งมีชีวิตหรือสินค้าทั่วไป
- sort ตามสินค้าใหม่ ราคา หรือความนิยมในอนาคต

หน้ารายการสินค้าต้องแสดง:

- รูปสินค้า
- ชื่อสินค้า
- ราคา
- สถานะพร้อมขาย
- badge สำหรับสินค้าสิ่งมีชีวิต
- stock หรือข้อความแจ้งสถานะ เช่น "พร้อมส่ง", "กำลังเพาะ", "หมดชั่วคราว"

### 5.2 Product Detail

หน้ารายละเอียดสินค้าต้องแสดงข้อมูลครบพอให้ตัดสินใจซื้อ:

- ชื่อสินค้า
- รูปภาพหลายรูป
- ราคา
- รายละเอียดสินค้า
- หมวดหมู่
- สถานะสินค้า
- จำนวนคงเหลือ
- ปุ่มเพิ่มลงตะกร้า

สำหรับสินค้าสิ่งมีชีวิต ต้องแสดงเพิ่มเติม:

- ชื่อชนิด / species
- เพศ ถ้ามีข้อมูล
- ช่วงวัย เช่น larva, pupa, adult
- ระดับความยากในการเลี้ยง
- ช่วงอุณหภูมิที่เหมาะสม
- ช่วงความชื้นที่เหมาะสม
- คำแนะนำการเลี้ยงเบื้องต้น
- หมายเหตุการจัดส่งสิ่งมีชีวิต

### 5.3 Cart

ลูกค้าต้องสามารถ:

- เพิ่มสินค้าเข้าตะกร้า
- เพิ่ม/ลดจำนวนสินค้า
- ลบสินค้าออกจากตะกร้า
- เห็นยอดรวมสินค้า
- เห็น warning ถ้าสินค้าเป็นสิ่งมีชีวิตและมีข้อจำกัดการจัดส่ง
- ไป checkout ได้

Business rules:

- ห้ามเพิ่มเกินจำนวน stock
- ถ้าสินค้าหมดหรือไม่พร้อมขาย ต้องห้าม checkout
- ตะกร้าต้อง revalidate ราคาและ stock จาก backend ก่อนสร้าง order

### 5.4 Checkout

Checkout ต้องมีข้อมูล:

- ชื่อลูกค้า
- เบอร์โทร
- อีเมล ถ้ามี
- ที่อยู่จัดส่ง
- หมายเหตุถึงร้าน
- วิธีจัดส่ง
- รายการสินค้าและยอดรวม

Business rules:

- Backend ต้องเป็นผู้คำนวณยอดรวมสุดท้าย
- ต้อง snapshot ราคาและชื่อสินค้าใน order item เพื่อเก็บประวัติ
- ต้องรองรับ guest checkout ใน MVP ได้ แต่ควรออกแบบให้เพิ่ม user account ภายหลัง
- สำหรับสินค้าสิ่งมีชีวิต ให้แสดง shipping warning ก่อนยืนยัน order

### 5.5 Order Lifecycle

Order status ควรรองรับ:

- `pending_payment`: สร้างคำสั่งซื้อแล้ว รอชำระเงิน
- `paid`: ชำระเงินแล้ว
- `preparing`: ร้านกำลังเตรียมสินค้า
- `shipped`: จัดส่งแล้ว
- `delivered`: ส่งสำเร็จ
- `cancelled`: ยกเลิก
- `refunded`: คืนเงินแล้ว

Payment status ควรรองรับ:

- `unpaid`
- `pending`
- `paid`
- `failed`
- `expired`
- `refunded`

Stock rules:

- เมื่อสร้าง order ให้ reserve stock ชั่วคราว
- ถ้า order หมดอายุหรือยกเลิกก่อนจ่ายเงิน ให้คืน stock
- เมื่อ payment สำเร็จ ให้ lock stock เป็นยอดขายจริง
- ต้องป้องกัน oversell ด้วย transaction หรือ database-level guard

### 5.6 Payment Flow

MVP สามารถใช้ mock payment ได้ แต่โครงสร้างต้องพร้อมต่อ payment จริง

Payment provider ที่ควรรองรับในอนาคต:

- Omise สำหรับบัตรเครดิต/PromptPay ในไทย
- Stripe ถ้าต้องการรองรับต่างประเทศ
- Manual bank transfer ถ้าร้านต้องตรวจสลิปเอง

ให้สร้าง payment abstraction:

```text
PaymentProvider
  createPaymentIntent(order)
  handleWebhook(payload, signature)
  refundPayment(paymentId)
```

ระบบต้องออกแบบให้:

- payment webhook idempotent
- ไม่อัปเดต order เป็น paid จาก frontend โดยตรง
- frontend แสดงผลตามสถานะจาก backend
- payment event ทุกครั้งถูกบันทึกใน database

### 5.7 Shipping Flow

ระบบต้องรองรับข้อมูลจัดส่ง:

- ชื่อผู้รับ
- เบอร์โทร
- ที่อยู่
- tracking number
- shipping provider
- shipping notes
- วันที่ส่ง

สำหรับสินค้าสิ่งมีชีวิต:

- ต้องมี `shippingNotes`
- ต้องสามารถแจ้งข้อจำกัด เช่น ส่งเฉพาะบางวัน หรือเลี่ยงวันที่อากาศร้อน
- ต้องรองรับสถานะ "hold shipment" สำหรับกรณีร้านยังไม่ควรส่ง

### 5.8 Pricing, Shipping & Discount Rules

Backend ต้องเป็นผู้คำนวณยอดเงินทั้งหมด

Order totals ควรแยก:

- `subtotalAmount`: ยอดรวมสินค้า
- `shippingAmount`: ค่าส่ง
- `discountAmount`: ส่วนลด
- `taxAmount`: ภาษี ถ้ามีการเปิดใช้ในอนาคต
- `totalAmount`: ยอดสุดท้ายที่ต้องชำระ

Rules:

- ราคาใน frontend ใช้เพื่อแสดงผลเท่านั้น
- ก่อนสร้าง order ต้องดึงราคาล่าสุดจาก database
- Order item ต้อง snapshot ราคาต่อชิ้น ณ เวลาสั่งซื้อ
- Shipping method ต้อง validate ที่ backend
- ถ้ามีสินค้าสิ่งมีชีวิตใน cart ต้องเลือก shipping method ที่รองรับ live specimen เท่านั้น
- Coupon/discount ยังเป็น future feature ได้ แต่ data model ไม่ควรปิดทาง
- VAT/tax ยังไม่ต้องคำนวณใน MVP ถ้ายังไม่มีข้อมูลธุรกิจ แต่ต้องไม่ hardcode วิธีคิดภาษีผิด ๆ

## 6. Product Data Model

Product ต้องรองรับข้อมูล e-commerce ปกติและข้อมูลเฉพาะของด้วง

Fields หลัก:

- `id`
- `slug`
- `name`
- `description`
- `price`
- `compareAtPrice`
- `sku`
- `stockQuantity`
- `categoryId`
- `status`
- `images`
- `createdAt`
- `updatedAt`

Fields สำหรับสินค้าสิ่งมีชีวิต:

- `isLiveSpecimen`: เป็นสิ่งมีชีวิตหรือไม่
- `speciesName`: ชื่อชนิดหรือชื่อสายพันธุ์
- `sex`: male, female, pair, unknown, not_applicable
- `lifeStage`: egg, larva, pupa, adult, not_applicable
- `careLevel`: beginner, intermediate, advanced
- `temperatureRange`: ช่วงอุณหภูมิที่เหมาะสม
- `humidityRange`: ช่วงความชื้นที่เหมาะสม
- `substrateNotes`: คำแนะนำเรื่องดินหรือวัสดุเลี้ยง
- `feedingNotes`: คำแนะนำอาหาร
- `shippingNotes`: หมายเหตุการขนส่ง
- `availabilityStatus`: ready, preorder, breeding, molting, out_of_stock, unavailable

Product status:

- `draft`
- `active`
- `archived`

Availability status:

- `ready`: พร้อมส่ง
- `preorder`: พรีออเดอร์
- `breeding`: กำลังเพาะ
- `molting`: ยังไม่พร้อมเพราะลอกคราบหรือช่วงอ่อนไหว
- `out_of_stock`: หมดชั่วคราว
- `unavailable`: ไม่เปิดขาย

## 7. Database Entities

ต้องมี entity หลักอย่างน้อย:

- `User`
- `CustomerProfile`
- `AdminUser` หรือใช้ role ใน `User`
- `Category`
- `Product`
- `ProductImage`
- `Cart` หรือใช้ client cart แล้ว validate ฝั่ง server
- `Order`
- `OrderItem`
- `Payment`
- `PaymentEvent`
- `Shipment`
- `InventoryMovement`

ควรมี entity สำหรับอนาคต:

- `Address`
- `Coupon`
- `Review`
- `CareArticle`
- `ProductCareGuide`

หลักการ:

- เก็บเงินเป็นหน่วยย่อย เช่น satang/cents ด้วย integer
- ใช้ enum สำหรับ status สำคัญ
- ทุกตารางหลักควรมี `createdAt` และ `updatedAt`
- ข้อมูล order item ต้อง snapshot ชื่อสินค้า ราคา และ metadata สำคัญ ณ เวลาซื้อ

### 7.1 Transaction & Inventory Integrity

Order และ stock เป็นส่วนที่ต้องถูกต้องมากกว่าสวยงาม

Requirements:

- สร้าง order และ reserve stock ใน database transaction เดียวกัน
- ป้องกัน oversell ด้วย conditional update หรือ transaction guard
- `Order.orderNumber` ต้อง unique และไม่เปลี่ยนหลังสร้าง
- `OrderItem` ต้องเก็บ product snapshot เช่น name, sku, unit price, live specimen metadata ที่สำคัญ
- `InventoryMovement` ต้องบันทึกเหตุผล เช่น seed, sale, reserve, release, manual_adjustment
- ถ้า reserve stock ต้องมี `reservedUntil` หรือกลไกหมดอายุ
- ห้ามลบ order จริงแบบ hard delete ใน admin; ให้ cancel/archive เพื่อเก็บ audit trail

## 8. API Requirements

Backend ต้องมี REST API เป็นอย่างน้อย:

### Public APIs

- `GET /health`
- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/categories`
- `POST /api/cart/validate`
- `POST /api/orders`
- `GET /api/orders/:orderNumber`
- `POST /api/payments/create`
- `POST /api/payments/webhook/:provider`

### Admin APIs

- `POST /api/admin/auth/login`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id` หรือ archive แทน delete
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- `PATCH /api/admin/shipments/:id`

API rules:

- Validate request body ทุก endpoint ที่รับ input
- Return error format ที่ consistent
- ไม่ส่ง stack trace ให้ client ใน production
- Admin endpoints ต้องมี authentication
- Payment webhook ต้องตรวจ signature เมื่อใช้ provider จริง

### 8.1 API Response & Error Contract

API ต้องตอบรูปแบบสม่ำเสมอเพื่อให้ frontend handle ง่าย

Success response:

```json
{
  "data": {},
  "meta": {}
}
```

Error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

Rules:

- ใช้ HTTP status code ให้ถูกต้อง เช่น 400, 401, 403, 404, 409, 422, 500
- validation error ต้องระบุ field ที่ผิดเมื่อเหมาะสม
- conflict เช่น stock ไม่พอ ควรใช้ 409
- production error ห้ามส่ง stack trace
- ทุก request ควรมี request id ใน log และ response header ถ้าทำได้

## 9. Frontend Requirements

Frontend ต้องเป็นเว็บที่ใช้งานได้จริงตั้งแต่หน้าแรก ไม่ใช่ landing page

หน้าหลักที่ต้องมี:

- Home/catalog page
- Product listing page
- Product detail page
- Cart page
- Checkout page
- Order confirmation page
- Order tracking page
- Admin login page
- Admin product management page
- Admin order management page

UX states ที่ต้องมี:

- loading
- empty
- error
- success
- form validation
- disabled state ระหว่าง submit

Design direction:

- ให้ความรู้สึกน่าเชื่อถือ อบอุ่น และเฉพาะทาง
- ไม่ใช้ UI แบบ generic SaaS จนเกินไป
- สินค้าต้องเป็นพระเอกของหน้า
- แสดงข้อมูลการเลี้ยงแบบอ่านง่าย
- Mobile responsive เพราะลูกค้าจำนวนมากจะเข้าจากมือถือ

### 9.1 UI System

ให้ใช้ Tailwind CSS และ shadcn/ui เป็น UI foundation หลัก

Requirements:

- ใช้ shadcn/ui สำหรับ component พื้นฐาน เช่น Button, Input, Select, Dialog, Sheet, Dropdown, Tabs, Table, Badge, Card, Alert, Form, Toast
- ใช้ Tailwind CSS สำหรับ layout, spacing, responsive design และ theme tokens
- ใช้ lucide-react สำหรับ icon ในปุ่มและ UI controls
- สร้าง reusable components สำหรับ product card, price display, availability badge, live specimen badge, order status badge และ admin table
- ใช้ form library/validation ที่เข้ากับ stack เช่น React Hook Form + Zod ถ้าเหมาะสม
- หลีกเลี่ยงการเขียน component custom ซ้ำ shadcn/ui โดยไม่จำเป็น
- UI ต้องดูเป็นร้าน e-commerce จริง ไม่ใช่ dashboard เปล่า ๆ หรือ landing page
- Admin UI สามารถใช้ layout แบบ dashboard ได้ แต่ storefront ต้องให้สินค้าและข้อมูลการเลี้ยงเป็นจุดเด่น

Design constraints:

- ใช้ theme ที่อบอุ่น น่าเชื่อถือ และอ่านง่าย
- หลีกเลี่ยง palette สีเดียวทั้งเว็บ
- ปุ่มหลัก, badge, status และ alert ต้องสื่อสถานะชัดเจน
- Product card ต้องมีขนาดคงที่พอสมควรเพื่อไม่ให้ layout กระโดด
- Dialog/sheet ต้องใช้งานได้ดีบนมือถือ
- ตาราง admin ต้องรองรับข้อมูลยาวและมี empty/loading state

### 9.2 Localization, Accessibility & SEO

เว็บต้องเหมาะกับผู้ใช้ไทยตั้งแต่แรก

Localization:

- แสดงราคาเป็นบาทไทย เช่น `฿850`
- รองรับเบอร์โทรไทยใน checkout
- ใช้ข้อความภาษาไทยเป็นหลัก
- วันเวลาแสดงตาม Asia/Bangkok
- order status ควรมี label ภาษาไทยสำหรับ frontend

Accessibility:

- ใช้ semantic HTML
- ปุ่มและ input ต้องมี label ที่ชัดเจน
- รูปสินค้าต้องมี alt text
- ใช้งาน keyboard ได้ใน form หลัก
- สีและ contrast ต้องอ่านได้

SEO:

- Product detail page ต้องมี title/description ที่เหมาะสม
- URL สินค้าควรใช้ slug
- เตรียม metadata สำหรับสินค้าและหมวดหมู่
- Phase 1 ยังไม่ต้องทำ advanced SEO แต่ห้ามปิดทางการเพิ่ม sitemap/structured data ในอนาคต

## 10. Admin Workflow

Admin ต้องสามารถ:

- สร้างสินค้าใหม่
- แก้ไขสินค้า
- อัปโหลดหรือใส่ URL รูปสินค้า
- ตั้งสถานะสินค้า
- ตั้งจำนวน stock
- ตั้งข้อมูลเฉพาะสำหรับสินค้าสิ่งมีชีวิต
- ดูรายการ order
- เปลี่ยนสถานะ order
- เพิ่ม tracking number
- ดู payment status

Business expectation:

- Admin ไม่ควรต้องแก้ database เองผ่าน DBeaver เพื่อบริหารร้าน
- DBeaver ใช้ตรวจสอบ database ได้ แต่ระบบจริงต้องมี admin UI

## 11. Security, Privacy & Compliance Requirements

Security ต้องถูกออกแบบตั้งแต่ต้น ไม่ใช่เพิ่มทีหลังตอนจะ deploy เพราะระบบนี้เกี่ยวข้องกับข้อมูลลูกค้า ที่อยู่ เบอร์โทร คำสั่งซื้อ และการชำระเงินจริงในอนาคต

ให้ยึดแนวทางหลักจาก:

- OWASP Top 10 สำหรับความเสี่ยงเว็บแอป
- OWASP ASVS เป็น checklist สำหรับตรวจ security controls
- PCI DSS เมื่อต่อระบบรับบัตรเครดิตหรือช่องทางชำระเงินที่เกี่ยวข้องกับ cardholder data
- PDPA ของไทยสำหรับข้อมูลส่วนบุคคลของลูกค้า

### 11.1 Security Principles

Agent ต้องออกแบบตามหลักนี้:

- Default deny: ถ้าไม่ได้อนุญาตชัดเจน ต้องถือว่าเข้าถึงไม่ได้
- Least privilege: user/admin/service แต่ละตัวได้สิทธิ์เท่าที่ต้องใช้
- Server-side authority: ราคา stock order และ payment status ต้องตัดสินที่ backend เท่านั้น
- Defense in depth: อย่าพึ่งการป้องกันชั้นเดียว เช่น frontend validation อย่างเดียว
- Secure by default: ค่า default ใน production ต้องปลอดภัยกว่า development
- Auditability: action สำคัญต้องตรวจสอบย้อนหลังได้

### 11.2 Data Classification

แยกประเภทข้อมูลเพื่อรู้ว่าต้องป้องกันแค่ไหน:

Public data:

- ชื่อสินค้า
- รายละเอียดสินค้า
- รูปสินค้า
- ราคา
- หมวดหมู่
- care guide ที่เปิดสาธารณะ

Customer personal data:

- ชื่อ-นามสกุล
- เบอร์โทร
- อีเมล
- ที่อยู่จัดส่ง
- ประวัติคำสั่งซื้อ
- note ที่ลูกค้าเขียนถึงร้าน

Sensitive operational data:

- admin account
- password hash
- session token
- API keys
- database credentials
- payment webhook secret
- payment provider secret key

Payment data:

- ห้ามเก็บเลขบัตรเครดิตเต็ม
- ห้ามเก็บ CVV
- ห้ามให้ card data วิ่งผ่าน backend ของเราโดยตรงใน MVP
- ให้ใช้ hosted checkout หรือ provider tokenization เมื่อรับชำระเงินจริง

### 11.3 Authentication

สำหรับ MVP ต้องมี admin authentication เป็นอย่างน้อย

Requirements:

- Hash password ด้วย Argon2id หรือ bcrypt ที่ตั้งค่าเหมาะสม
- ห้ามเก็บ password เป็น plain text
- ห้าม log password หรือ token
- Login endpoint ต้องมี rate limit
- Error message ตอน login ต้องไม่บอกละเอียดเกินไป เช่น ไม่บอกว่า email ถูกแต่ password ผิด
- Admin session ต้องหมดอายุได้
- ต้องมี logout

สำหรับอนาคต:

- รองรับ customer account
- รองรับ password reset ผ่าน email แบบ token หมดอายุ
- รองรับ 2FA สำหรับ admin ถ้าร้านเริ่มขายจริงหรือมีหลายผู้ดูแล

### 11.4 Session & Token Security

ถ้าใช้ cookie:

- ใช้ `HttpOnly`
- ใช้ `Secure` ใน production
- ใช้ `SameSite=Lax` หรือ `Strict` ตาม flow
- ตั้ง `Path` ให้แคบที่สุดที่ทำได้
- ไม่เก็บ session token ใน localStorage ถ้าเลี่ยงได้

ถ้าใช้ JWT:

- ตั้ง expiry สั้นพอสมควร
- แยก access token / refresh token ถ้าจำเป็น
- ต้องมีวิธี revoke หรือ rotate token สำหรับ admin
- อย่าใส่ข้อมูลส่วนตัวหรือ secret ลงใน JWT payload

### 11.5 Authorization

ทุก admin API ต้องตรวจสิทธิ์ที่ backend

Requirements:

- Public user ห้ามเข้าถึง admin endpoints
- User คนหนึ่งห้ามดู order ของคนอื่น เว้นแต่เป็น admin
- Admin action สำคัญต้องถูก audit log เช่น เปลี่ยนราคา เปลี่ยน stock เปลี่ยน order status
- ห้ามเชื่อ role หรือ userId ที่ส่งมาจาก frontend
- ใช้ middleware/hook สำหรับ auth guard และ role guard

### 11.6 Input Validation & Injection Protection

ทุก endpoint ที่รับ input ต้อง validate

Requirements:

- ใช้ Zod หรือ JSON Schema สำหรับ body/query/params
- ใช้ Prisma query API ไม่ต่อ SQL string เองถ้าไม่จำเป็น
- ถ้าต้อง raw SQL ต้องใช้ parameterized query
- จำกัดความยาว text fields เช่น name, address, note
- sanitize หรือ escape content ก่อน render
- validate file/image URL ถ้ามี image upload หรือ remote image URL
- ห้ามรับ arbitrary file path จาก user

### 11.7 CSRF, CORS & Browser Security

Requirements:

- ตั้ง CORS ผ่าน env allowlist เช่น `WEB_ORIGIN`
- ห้ามใช้ `Access-Control-Allow-Origin: *` กับ endpoint ที่มี credential
- ถ้าใช้ cookie session ต้องมี CSRF protection สำหรับ state-changing requests
- ใช้ security headers ผ่าน `@fastify/helmet`
- ตั้ง Content Security Policy เมื่อเริ่ม production
- ป้องกัน clickjacking ด้วย `frame-ancestors` หรือ `X-Frame-Options`

### 11.8 Payment Security

Payment status ต้องมาจาก backend/provider เท่านั้น

MVP:

- ใช้ mock payment provider ได้
- Mock payment ต้องอยู่หลัง backend endpoint
- บันทึก `Payment` และ `PaymentEvent`
- ห้ามให้ frontend ส่งคำสั่ง "mark paid" โดยตรงโดยไม่มี backend validation

Production:

- ใช้ hosted checkout หรือ tokenized payment fields จาก provider
- ห้ามเก็บเลขบัตรเครดิตเต็มหรือ CVV
- ตรวจ webhook signature ทุกครั้ง
- webhook handler ต้อง idempotent
- เก็บ provider event id เพื่อกันการ process ซ้ำ
- log payment event แบบไม่เปิดเผยข้อมูลบัตรหรือ secret
- ต้องมีคู่มือ PCI checklist ใน README เมื่อเริ่มรับบัตรจริง

### 11.9 Personal Data & PDPA Readiness

ระบบต้องพร้อมสำหรับการดูแลข้อมูลส่วนบุคคลของลูกค้าในไทย

ต้องทำ:

- มี Privacy Policy ก่อนเปิดใช้งานจริง
- แจ้งว่าจะเก็บข้อมูลอะไร เพื่ออะไร เก็บนานแค่ไหน และแชร์กับใครบ้าง
- เก็บข้อมูลเท่าที่จำเป็นต่อการขายและจัดส่ง
- มีวิธีให้ลูกค้าขอแก้ไขหรือลบข้อมูลตามความเหมาะสม
- กำหนด data retention เช่น order records เก็บตามความจำเป็นทางบัญชี/ธุรกิจ
- จำกัดคนที่เข้าถึงข้อมูลลูกค้าใน admin
- เตรียม incident response plan สำหรับกรณีข้อมูลรั่ว รวมถึงขั้นตอนประเมินและแจ้งเหตุภายในกรอบเวลาที่ PDPA กำหนดเมื่อเข้าเกณฑ์

ข้อมูลลูกค้าที่ไม่ควรแสดงเต็มโดยไม่จำเป็น:

- เบอร์โทร
- ที่อยู่
- email
- payment reference

### 11.10 Secrets & Environment Variables

Requirements:

- `.env` ต้องอยู่ใน `.gitignore`
- ต้องมี `.env.example` ที่ไม่มี secret จริง
- แยก env สำหรับ development, staging, production
- ใช้ secret ที่สุ่มยาวพอ เช่น session secret, JWT secret, webhook secret
- ห้าม hardcode credential ใน source code
- ห้าม commit database dump ที่มีข้อมูลลูกค้าจริง

### 11.11 Logging, Monitoring & Audit Trail

ต้อง log สิ่งที่ช่วย debug และตรวจสอบเหตุการณ์ได้ แต่ไม่ละเมิดข้อมูลส่วนตัว

ควร log:

- login success/failure แบบไม่เก็บ password
- admin action สำคัญ
- order created
- payment event received
- payment state transition
- webhook verification failure
- validation error summary
- server error พร้อม request id

ห้าม log:

- password
- session token
- access token
- payment secret
- เลขบัตรเครดิต/CVV
- database URL
- raw personal data ที่ไม่จำเป็น

### 11.12 Infrastructure & Deployment Security

ก่อน production ต้องมี:

- HTTPS เท่านั้น
- database ไม่เปิด public ถ้าไม่จำเป็น
- backup database เป็นรอบ
- migration strategy
- dependency update process
- vulnerability scan เช่น `npm audit` หรือเครื่องมือที่เหมาะสม
- production error monitoring
- health check endpoint
- process restart policy
- non-root Docker user ถ้าทำได้

### 11.13 File Upload & Product Images

ถ้ารองรับ upload รูป:

- จำกัดชนิดไฟล์ เช่น jpg, png, webp
- จำกัดขนาดไฟล์
- เปลี่ยนชื่อไฟล์ใหม่ ไม่ใช้ชื่อจาก user ตรง ๆ
- ไม่ให้ upload script/html/svg ที่เสี่ยง XSS เว้นแต่ sanitize จริงจัง
- เก็บไฟล์แยกจาก application code
- ใน production ควรใช้ object storage เช่น S3-compatible storage

### 11.14 Business & Legal Readiness

ก่อนเปิดขายจริงต้องตรวจ:

- ข้อมูลร้าน ช่องทางติดต่อ และเงื่อนไขการขาย
- นโยบายคืนเงิน/คืนสินค้า
- นโยบายจัดส่ง โดยเฉพาะสินค้าสิ่งมีชีวิต
- เงื่อนไขการรับประกันกรณีสินค้ามีชีวิตเสียหายระหว่างขนส่ง
- Privacy Policy
- Terms of Service
- Cookie notice ถ้ามี analytics/marketing cookies
- กฎของ payment provider และขนส่งที่เลือกใช้
- ความถูกต้องตามกฎหมายของชนิดด้วงหรือสัตว์มีชีวิตที่ขาย ห้ามขายชนิดที่ผิดกฎหมายหรือมีข้อจำกัดโดยไม่ได้รับอนุญาต

### 11.15 Security Acceptance Criteria

MVP ต้องผ่านอย่างน้อย:

- `.env` ไม่ถูก commit
- มี `.env.example`
- admin password ถูก hash
- admin endpoints ต้อง login ก่อน
- CORS ตั้งค่าจาก env
- rate limit login endpoint
- request validation สำหรับ endpoints สำคัญ
- order total คำนวณที่ backend
- stock validation ทำที่ backend
- payment status เปลี่ยนผ่าน backend/payment event เท่านั้น
- logs ไม่แสดง password/token/secret
- README มี security notes สำหรับ local และ production

## 12. Deployment Readiness

ถึง MVP จะรัน local ก่อน แต่ต้องวางให้ deploy ได้จริงในอนาคต

ต้องมี:

- `Dockerfile` สำหรับ frontend/backend ตามโครงที่เลือก
- `docker-compose.yml` สำหรับ local dev
- `.env.example`
- production env checklist ใน README
- health check endpoint
- migration command
- seed command สำหรับข้อมูลตัวอย่าง

ควรออกแบบให้ deploy ได้บน:

- VPS ที่รัน Docker
- Render / Railway / Fly.io
- Cloud provider อื่นที่รองรับ container

## 13. Development Phases

### Phase 1: Local Full MVP Foundation

ต้องทำให้ได้:

- Scaffold monorepo หรือ project structure
- React frontend
- Fastify backend
- PostgreSQL ผ่าน Docker Compose
- Prisma schema + migration
- Seed data สินค้าตัวอย่าง
- Catalog, product detail, cart, checkout
- Order creation
- Mock payment flow
- Basic admin product/order management
- README พร้อมคำสั่งรัน

### Phase 2: Real Commerce Hardening

เพิ่ม:

- Auth ลูกค้า
- Payment provider จริง
- Webhook verification
- Stock reservation expiration job
- Email notification
- Better admin dashboard
- Product image storage
- Coupon/discount
- Order timeline

### Phase 3: Production Launch

เพิ่ม:

- Production Docker setup
- CI/CD
- Database backup
- Observability/logging
- Error monitoring
- SEO
- Sitemap
- Performance optimization
- Legal/privacy/terms pages

### 13.4 Testing & Quality Gates

ต้องมี verification ที่ครอบคลุม flow สำคัญ ไม่ใช่แค่เปิดหน้าเว็บแล้วดูด้วยตา

ควรมี test สำหรับ:

- price calculation
- stock reservation และ oversell prevention
- order status transition
- mock payment success/failure
- payment webhook idempotency ในโครง provider
- admin auth guard
- API validation error
- product filtering/searching

ขั้นต่ำก่อนจบงาน:

- `build` ผ่าน
- `typecheck` ผ่าน
- `test` ผ่านถ้ามี test suite
- migration และ seed รันกับ PostgreSQL local ได้
- เปิด frontend แล้วทำ flow catalog -> cart -> checkout -> order confirmation ได้
- admin login แล้วจัดการสินค้า/order ขั้นพื้นฐานได้

## 14. Agent Working Instructions

ให้ agent ทำงานแบบ senior engineer:

1. สำรวจ repo ก่อนเสมอ
2. ถ้า repo ว่าง ให้ scaffold project ตาม architecture ที่กำหนด
3. วางแผนสั้น ๆ ก่อนแก้ไฟล์
4. สร้างระบบแบบ end-to-end ไม่หยุดแค่ UI mock
5. ใช้ migration สำหรับ database schema
6. Seed ข้อมูลตัวอย่างที่สะท้อนธุรกิจเพื่อนด้วงจริง
7. เขียน validation และ error handling
8. ทำ README ที่คนอื่นรันตามได้
9. รัน verification commands ก่อนจบงาน
10. สรุปสิ่งที่ทำ command ที่รัน และสิ่งที่ยังเหลือ

ห้าม:

- สร้างแค่หน้า landing page
- hardcode database credentials ใน source code
- ข้าม backend แล้วเก็บ order เฉพาะใน frontend
- อัปเดต payment status จาก frontend โดยตรง
- ลบหรือ revert ไฟล์ที่ไม่เกี่ยวข้อง
- ทิ้ง TODO สำคัญโดยไม่บอกเหตุผล

## 15. Acceptance Criteria

งานถือว่าเสร็จในระดับ MVP เมื่อ:

- รันโปรเจกต์ local ได้ด้วยคำสั่งจาก README
- Docker Compose เปิด PostgreSQL ได้
- Migration สร้าง schema ได้
- Seed data สร้างสินค้าเพื่อนด้วงตัวอย่างได้
- ลูกค้าดูสินค้า เพิ่มลงตะกร้า checkout และสร้าง order ได้
- ระบบ mock payment ทำให้ order เปลี่ยนสถานะเป็น paid ได้ผ่าน backend flow
- Admin login ได้
- Admin เพิ่ม/แก้สินค้าได้
- Admin ดู order และเปลี่ยนสถานะ order/shipping ได้
- มี validation และ error state ที่ใช้งานได้
- build ผ่าน
- test หรือ verification command สำคัญผ่าน

## 16. Example Seed Products

ให้ seed สินค้าตัวอย่างที่สะท้อนร้านจริง เช่น:

- ด้วงกว่างสามเขา ตัวผู้
- หนอนด้วงกว่าง L3
- บ้านด้วงอะคริลิก
- ดินหมักสำหรับด้วง
- เจลลี่ผลไม้สำหรับด้วง
- ไม้ผุสำหรับวางไข่

สินค้าสิ่งมีชีวิตต้องมี `isLiveSpecimen = true` และใส่ care/shipping fields ให้ครบ

## 17. Owner Decisions Before Production

ก่อนเปิดขายจริง เจ้าของโปรเจกต์ต้องตัดสินใจหรือเตรียมข้อมูลเหล่านี้:

- Payment provider ที่จะใช้จริง เช่น Omise, Stripe, bank transfer หรือหลายช่องทาง
- Shipping provider ที่รองรับการส่งสินค้าสิ่งมีชีวิตหรือเงื่อนไขเฉพาะของร้าน
- นโยบายจัดส่งสินค้ามีชีวิต เช่น ส่งวันไหน งดส่งช่วงไหน รับประกันแบบใด
- รายชื่อชนิดด้วง/สัตว์ที่ขายได้ถูกต้องตามกฎหมายและกฎของแพลตฟอร์มชำระเงิน/ขนส่ง
- รูปแบบภาษี/ใบเสร็จ/เอกสารบัญชี ถ้าธุรกิจต้องใช้
- นโยบายคืนเงิน คืนสินค้า และเคลมสินค้าเสียหาย
- Privacy Policy และ Terms of Service
- ช่องทางติดต่อร้าน เช่น LINE, Facebook, email, phone
- เป้าหมาย deploy เช่น VPS, Railway, Render, Fly.io หรือ cloud อื่น
- วิธีเก็บรูปสินค้า production เช่น object storage หรือบริการ cloud

Agent สามารถทำ MVP โดยใช้ค่า default local-first ได้ แต่ห้ามสมมติเรื่อง production เหล่านี้ว่าเสร็จแล้ว

## 18. Final Agent Prompt

ใช้ prompt นี้เพื่อสั่ง agent เริ่มสร้างโค้ด:

```text
อ่าน SPEC.md แล้วสร้างโปรเจกต์ "เพื่อนด้วง" ตามสเปกแบบ end-to-end

ให้ทำงานเหมือน senior full-stack engineer:
- สำรวจ repo ก่อน
- ถ้า repo ว่าง ให้ scaffold โครงสร้างเต็ม
- ใช้ React + TypeScript + Vite สำหรับ frontend
- ใช้ Tailwind CSS + shadcn/ui + lucide-react สำหรับ UI system
- ใช้ Fastify + TypeScript สำหรับ backend
- ใช้ PostgreSQL + Prisma สำหรับ database/migration
- ใช้ Docker Compose สำหรับ local development
- สร้าง e-commerce flow จริง: catalog, product detail, cart, checkout, order, mock payment, admin
- ออกแบบ product model ให้รองรับสินค้าสิ่งมีชีวิต เช่น ด้วง หนอน ดักแด้
- เพิ่ม seed data ที่เกี่ยวกับร้านเพื่อนด้วงจริง
- เพิ่ม README, .env.example และคำสั่ง setup/run/test
- รัน build/typecheck/test หรือ verification commands ที่เหมาะสม

ห้ามหยุดแค่ skeleton หรือ landing page
เมื่อจบงาน ให้สรุปไฟล์ที่สร้าง วิธีรัน command ที่ตรวจสอบ และ TODO ที่เหลือ
```
