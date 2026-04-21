# 🗄️ เอกสารฐานข้อมูล

เอกสารนี้อธิบายโครงสร้างฐานข้อมูลของเพื่อนด้วง ตารางหลัก ความสัมพันธ์ และ business rules ที่เกี่ยวข้อง

---

## 📊 ER Diagram (คร่าว ๆ)

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    User     │◄─────►│ CustomerProfile  │◄─────►│   Address   │
│  (auth)     │  1:1  │ (ข้อมูลลูกค้า)   │  1:N  │ (ที่อยู่)   │
└──────┬──────┘       └────────┬─────────┘       └─────────────┘
       │                       │
       │                       │
       │              ┌────────▼────────┐
       │              │      Order      │
       │              │  (คำสั่งซื้อ)   │
       │              └────────┬────────┘
       │                       │
       │         ┌─────────────┼─────────────┐
       │         │             │             │
┌──────▼───┐  ┌──▼────┐   ┌───▼────┐   ┌───▼─────┐
│AdminAction│  │Payment│   │Shipment│   │OrderItem│
└───────────┘  └──┬────┘   └────────┘   └────┬────┘
                  │                            │
           ┌──────▼──────┐              ┌──────▼──────┐
           │ PaymentEvent│              │   Product   │
           └─────────────┘              └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │ ProductImage│
                                        └─────────────┘
```

---

## 📋 ตารางหลัก

### 1. `User` - บัญชีผู้ใช้

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| email | String (unique) | อีเมลใช้ login |
| password | String | bcrypt hash |
| role | Enum | `customer` / `admin` |
| name | String? | ชื่อแสดง |
| createdAt | DateTime | วันที่สร้าง |
| updatedAt | DateTime | วันที่แก้ไข |

**Business Rule:**
- 1 User มีได้ 1 CustomerProfile เท่านั้น (1:1)
- Admin ต้องมี role = `admin`
- Password เก็บเป็น hash ด้วย bcrypt (cost factor 12)

---

### 2. `CustomerProfile` - ข้อมูลลูกค้า

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| userId | String (unique) | FK → User |
| phone | String? | เบอร์โทร |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Business Rule:**
- ถูกสร้างอัตโนมัติตอนลูกค้าสมัครสมาชิก
- Guest checkout ไม่มี CustomerProfile (order.customerId = null)

---

### 3. `Order` - คำสั่งซื้อ (❗สำคัญมาก)

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| orderNumber | String (unique) | เลขอ้างอิง (PDYYYYMMDD-XXXX) |
| **lookupToken** | String (unique) | รหัสลับสำหรับติดตาม order |
| customerName | String | ชื่อลูกค้า |
| customerPhone | String | เบอร์โทร |
| customerEmail | String? | อีเมล |
| shippingName | String | ชื่อผู้รับ |
| shippingPhone | String | เบอร์ผู้รับ |
| shippingAddress | String | ที่อยู่ |
| shippingProvince | String | จังหวัด |
| shippingDistrict | String | อำเภอ/เขต |
| shippingPostalCode | String | รหัสไปรษณีย์ |
| shippingMethod | String | วิธีจัดส่ง |
| shippingNotes | String? | หมายเหตุ |
| subtotalAmount | Int | ยอดรวมสินค้า (สตางค์) |
| shippingAmount | Int | ค่าส่ง (สตางค์) |
| discountAmount | Int | ส่วนลด (สตางค์) |
| taxAmount | Int | ภาษี (สตางค์) |
| totalAmount | Int | ยอดสุดท้าย (สตางค์) |
| status | Enum | สถานะ order |
| paymentStatus | Enum | สถานะชำระเงิน |
| expiredAt | DateTime? | หมดอายุ (24 ชม.) |
| customerId | String? | FK → CustomerProfile |
| couponId | String? | FK → Coupon |

#### Order Status Flow
```
pending_payment ──► paid ──► preparing ──► shipped ──► delivered
       │
       ▼
   cancelled
       │
       ▼
   refunded
```

#### หน่วยเงิน (❗สำคัญ)
- **ทุกช่องเงินเก็บเป็นสตางค์ (integer)**
- ตัวอย่าง: ฿850.00 → เก็บเป็น `85000`
- ไม่ใช้ float/decimal เพราะกลัวคำนวณผิด

---

### 4. `OrderItem` - รายการสินค้าใน Order

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| orderId | String | FK → Order |
| productId | String | FK → Product |
| name | String | **ชื่อตอนซื้อ (snapshot)** |
| sku | String? | **SKU ตอนซื้อ** |
| unitPrice | Int | **ราคาต่อชิ้นตอนซื้อ** |
| quantity | Int | จำนวน |
| subtotal | Int | ราคารวม (unitPrice × quantity) |
| isLiveSpecimen | Boolean | เป็นสิ่งมีชีวิตไหม |
| speciesName | String? | ชนิด (snapshot) |
| sex | Enum? | เพศ (snapshot) |
| lifeStage | Enum? | ช่วงวัย (snapshot) |
| imageUrl | String? | รูปสินค้า (snapshot) |

**ทำไมต้อง snapshot?**  
เพราะถ้าสินค้าเปลี่ยนชื่อ/ราคาในภายหลัง ประวัติ order ต้องยังบันทึกข้อมูลตอนซื้อไว้

---

### 5. `Product` - สินค้า

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| slug | String (unique) | URL-friendly name |
| name | String | ชื่อสินค้า |
| description | String? | รายละเอียด |
| price | Int | ราคา (สตางค์) |
| compareAtPrice | Int? | ราคาก่อนลด |
| sku | String? (unique) | รหัสสินค้า |
| stockQuantity | Int | จำนวนคงเหลือ |
| categoryId | String? | FK → Category |
| status | Enum | `draft` / `active` / `archived` |
| isLiveSpecimen | Boolean | เป็นสิ่งมีชีวิต? |
| speciesName | String? | ชื่อชนิด |
| sex | Enum? | `male` / `female` / `pair` / `unknown` |
| lifeStage | Enum? | `egg` / `larva` / `pupa` / `adult` |
| careLevel | Enum? | `beginner` / `intermediate` / `advanced` |
| temperatureRange | String? | ช่วงอุณหภูมิ |
| humidityRange | String? | ช่วงความชื้น |
| substrateNotes | String? | คำแนะนำดิน |
| feedingNotes | String? | คำแนะนำอาหาร |
| shippingNotes | String? | หมายเหตุขนส่ง |
| availabilityStatus | Enum | สถานะพร้อมขาย |

#### Product Status
- `draft` - ยังไม่เปิดขาย
- `active` - ขายได้
- `archived` - เอาออกจากหน้าร้าน (แต่ไม่ลบ)

#### Availability Status (สำหรับสิ่งมีชีวิต)
- `ready` - พร้อมส่ง
- `preorder` - พรีออเดอร์
- `breeding` - กำลังเพาะ
- `molting` - ลอกคราบ
- `out_of_stock` - หมดชั่วคราว
- `unavailable` - ไม่เปิดขาย

---

### 6. `InventoryMovement` - การเคลื่อนไหวสต็อก

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| productId | String | FK → Product |
| quantity | Int | จำนวน (ลบ = ออก, บวก = เข้า) |
| reason | Enum | เหตุผล |
| orderId | String? | เกี่ยวข้องกับ order ไหน |
| notes | String? | หมายเหตุ |
| createdAt | DateTime | |

#### Inventory Reasons
| Reason | ความหมาย | quantity |
|--------|----------|----------|
| `seed` | เริ่มต้นสต็อก | + |
| `sale` | ขายแล้ว (payment success) | - |
| `reserve` | จองตอนสร้าง order | - |
| `release` | คืนตอน order หมดอายุ | + |
| `cancel` | คืนตอน admin cancel/refund | + |
| `manual_adjustment` | แก้ไขมือ | ± |

**Business Rule:**  
สต็อกจริง = sum(quantity) ของ InventoryMovement ทั้งหมดที่เกี่ยวข้อง  
(แต่ตอนนี้ยังไม่ได้ทำ trigger auto-sync ใช้ product.stockQuantity เป็นหลัก)

---

### 7. `Payment` - การชำระเงิน

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| orderId | String | FK → Order |
| provider | String | ผู้ให้บริการ (`mock`, `omise`, `stripe`) |
| providerRef | String? | เลขอ้างอิจจาก provider |
| amount | Int | ยอดเงิน (สตางค์) |
| status | Enum | สถานะ |

#### Payment Status
- `unpaid` - ยังไม่ชำระ
- `pending` - กำลังดำเนินการ
- `paid` - ชำระแล้ว
- `failed` - ไม่สำเร็จ
- `expired` - หมดเวลา
- `refunded` - คืนเงินแล้ว

---

### 8. `PaymentEvent` - บันทึกเหตุการณ์ชำระเงิน

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| paymentId | String | FK → Payment |
| eventType | String | ประเภทเหตุการณ์ |
| payload | JSON? | ข้อมูลดิบจาก provider |
| providerEventId | String? | ID จาก provider (ใช้กัน duplicate) |
| createdAt | DateTime | |

**Business Rule:**  
- บันทึกทุก event จาก provider แม้จะซ้ำก็ตาม  
- ใช้ `providerEventId` ตรวจซ้ำก่อน process จริง

---

### 9. `Coupon` - คูปองส่วนลด

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| code | String (unique) | รหัสคูปอง |
| name | String | ชื่อคูปอง |
| description | String? | รายละเอียด |
| type | Enum | `fixed_amount` / `percentage` |
| value | Int | มูลค่า (สตางค์ หรือ %) |
| minAmount | Int | ยอดขั้นต่ำ |
| maxDiscount | Int? | ส่วนลดสูงสุด (กรณี %) |
| usageLimit | Int? | จำกัดจำนวนใช้ |
| usageCount | Int | จำนวนที่ใช้ไปแล้ว |
| startsAt | DateTime? | เริ่มใช้ได้ |
| expiresAt | DateTime? | หมดอายุ |
| isActive | Boolean | เปิดใช้งาน? |

---

### 10. `OrderTimeline` - ไทม์ไลน์ของ Order

| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | String (CUID) | Primary key |
| orderId | String | FK → Order |
| status | String | สถานะตอนนั้น |
| note | String? | หมายเหตุ |
| createdBy | String? | ใครทำ (userId) |
| createdAt | DateTime | |

**Business Rule:**  
- สร้างอัตโนมัติทุกครั้งที่ order เปลี่ยนสถานะ  
- Admin เปลี่ยนสถานะ → บันทึก timeline ทันที

---

## 🔗 ความสัมพันธ์สำคัญ

### 1. Order → OrderItem (1:N)
- 1 Order มีหลาย OrderItem
- ลบ Order → OrderItem ถูกลบ cascade

### 2. Product → OrderItem (1:N)
- 1 Product อยู่ได้หลาย OrderItem (ในประวัติ)
- ลบ Product → OrderItem ไม่ถูกลบ (ต้องเก็บประวัติ)

### 3. Order → Payment (1:N)
- 1 Order อาจมีหลาย Payment attempt
- แต่ปกติจะมี 1 Payment ต่อ order

### 4. Order → Shipment (1:N)
- 1 Order อาจแยกส่งหลายครั้ง (กรณีสินค้าไม่พร้อมพร้อมกัน)

---

## 🚨 Constraints & Rules

### Unique Constraints
- `User.email`
- `Product.slug`
- `Product.sku`
- `Order.orderNumber`
- `Order.lookupToken`
- `Coupon.code`
- `RefreshToken.token`

### Foreign Key Behaviors
- OrderItem → Order: `onDelete: Cascade`
- Payment → Order: `onDelete: Cascade`
- PaymentEvent → Payment: `onDelete: Cascade`
- Shipment → Order: `onDelete: Cascade`
- OrderTimeline → Order: `onDelete: Cascade`
- InventoryMovement → Product: `onDelete: Restrict` (ห้ามลบถ้ามี movement)

### Enums (PostgreSQL Native)
ทุก status ใช้ enum ของ PostgreSQL:
- `UserRole`: `customer`, `admin`
- `ProductStatus`: `draft`, `active`, `archived`
- `AvailabilityStatus`: `ready`, `preorder`, `breeding`, `molting`, `out_of_stock`, `unavailable`
- `OrderStatus`: `pending_payment`, `paid`, `preparing`, `shipped`, `delivered`, `cancelled`, `refunded`
- `PaymentStatus`: `unpaid`, `pending`, `paid`, `failed`, `expired`, `refunded`
- `InventoryReason`: `seed`, `sale`, `reserve`, `release`, `manual_adjustment`, `cancel`
- `CouponType`: `fixed_amount`, `percentage`

---

## 📝 การเพิ่ม/แก้ไข Schema

1. แก้ไข `prisma/schema.prisma`
2. รัน `npx prisma migrate dev --name <ชื่อ_migration>`
3. ตรวจสอบ migration SQL ที่สร้างขึ้นใน `prisma/migrations/`
4. รัน `npx prisma generate` (ถ้า client ไม่อัปเดต)
5. อัปเดต seed script ถ้าจำเป็น

**❌ ห้ามแก้ database โดยตรงผ่าน SQL โดยไม่ผ่าน migration**
