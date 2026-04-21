# เพื่อนด้วง

E-commerce สำหรับร้านขายด้วงและอุปกรณ์เลี้ยงด้วงครบวงจร สร้างด้วย React + Fastify + PostgreSQL + Prisma

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Fastify + TypeScript
- Database: PostgreSQL + Prisma
- Package Manager: pnpm

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
pnpm install
```

### 2. ตั้งค่า Environment

```bash
cp .env.example .env
```

ตรวจสอบค่าใน `.env` ให้ถูกต้อง (ค่า default ใช้สำหรับ local development)

### 3. รัน PostgreSQL

```bash
pnpm docker:up
```

### 4. รัน migration และ seed

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. รัน development server

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Admin Account (จาก seed)

- Email: `admin@puendoung.test`
- Password: `admin1234`

## คำสั่งที่ใช้บ่อย

```bash
pnpm dev          # รัน frontend + backend
pnpm build        # build ทั้งหมด
pnpm typecheck    # ตรวจ TypeScript
pnpm test         # รัน test
pnpm db:migrate   # รัน migration
pnpm db:seed      # seed ข้อมูล
pnpm db:studio    # เปิด Prisma Studio
pnpm docker:up    # เปิด PostgreSQL
pnpm docker:down  # ปิด PostgreSQL
```

## Project Structure

```
apps/
  web/         React frontend
  api/         Fastify backend
packages/
  shared/      (ว่าง - สำหรับอนาคต)
prisma/
  schema.prisma
  seed.ts
```

## Features

- [x] Catalog / Product listing / Product detail
- [x] Cart / Checkout / Order creation
- [x] Mock payment flow
- [x] Order tracking
- [x] Admin login
- [x] Admin product management
- [x] Admin order management
- [x] Stock reservation + inventory movement
- [x] Seed data สำหรับร้านเพื่อนด้วง

## Phase 2 Features

- [x] Customer Auth (Register / Login / JWT / Refresh Token)
- [x] Customer Account page
- [x] Order Timeline (auto-log status changes)
- [x] Stock Reservation Expiration Job (auto-cancel expired orders every 1 min)
- [x] Coupon / Discount system (fixed amount & percentage)
- [x] Admin Dashboard with stats cards & recent orders
- [x] Admin create shipment with tracking number
- [x] Checkout with coupon validation

## Security Notes

- `.env` อยู่ใน `.gitignore`
- รหัสผ่าน admin ถูก hash ด้วย bcrypt
- Admin endpoints ต้อง login ก่อน
- CORS ตั้งค่าจาก env `WEB_ORIGIN`
- Rate limit ที่ login endpoint
- ไม่เก็บข้อมูลบัตรเครดิตในระบบ (ใช้ mock payment)
