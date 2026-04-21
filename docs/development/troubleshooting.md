# 🔧 แก้ปัญหาเบื้องต้น (Troubleshooting)

---

## ❌ `npm install` ไม่ผ่าน / Error

**ลอง:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**ถ้ายังไม่ได้:**
```bash
# ล้าง npm cache
npm cache clean --force
npm install
```

---

## ❌ Database ไม่ติด (`Can't reach database server`)

**ตรวจสอบ:**
```bash
docker ps  # ดูว่า postgres container รันอยู่ไหม
```

**ถ้าไม่รัน:**
```bash
npm run docker:up
```

**ถ้ารันแต่ไม่ติด:**
```bash
# ลอง restart
docker compose restart postgres

# ถ้ายังไม่ได้ ลอง down แล้ว up ใหม่
docker compose down
docker compose up -d
```

**ตรวจสอบ .env:**
```bash
cat .env | grep DATABASE_URL
# ต้องเป็น postgresql://puendoung:puendoung@localhost:5432/puendoung?schema=public
```

---

## ❌ Migration ล้มเหลว

**ถ้ามี error เกี่ยวกับ interactive:**
```bash
# ใช้ db push แทน (สำหรับ development)
npx prisma db push --accept-data-loss
```

**ถ้าต้องการ reset ทั้งหมด:**
```bash
# ⚠️ ระวัง! จะลบข้อมูลทั้งหมด
npx prisma migrate reset --force
npm run db:seed
```

---

## ❌ `npm run build` ไม่ผ่าน

**ดู error message:**
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

**สาเหตุทั่วไป:**
- Type error: ตรวจสอบ `npm run typecheck`
- Import path ผิด: ตรวจสอบ `.js` extension (ESM)
- Missing dependency: `npm install`

---

## ❌ Frontend ไม่เชื่อมต่อ Backend

**ตรวจสอบ:**
1. Backend รันอยู่ที่ port 3001 ไหม? (`curl http://localhost:3001/health`)
2. `vite.config.ts` มี proxy `/api` ไหม?
3. `.env` มี `WEB_ORIGIN` ถูกต้องไหม?

**ถ้าใช้ production build:**
- Frontend static files ต้อง proxy `/api` ไปที่ backend (ดู `nginx.conf`)

---

## ❌ Admin Login ไม่ได้

**ตรวจสอบ:**
1. Seed รันหรือยัง? (`npm run db:seed`)
2. ใช้ email/password ถูกต้องไหม?
   - Default: `admin@puendoung.test` / `admin1234`
3. Browser ปิด block cookie ไหม?
4. ดู Network tab ใน DevTools ว่า cookie ถูก set ไหม?

---

## ❌ รูปสินค้าไม่แสดง

**สาเหตุ:** ใช้ placeholder images (placehold.co)  
**แก้:** ต้องแก้ไขสินค้าใน admin แล้วใส่ URL รูปจริง

---

## ❌ Stock ไม่ถูกต้อง

**ตรวจสอบ:**
```bash
# เข้า Prisma Studio
npm run db:studio
```

ไปที่ `Product` → ตรวจ `stockQuantity`  
ถ้าผิด อาจต้องแก้ด้วยมือ หรือรัน job expire:
```bash
# ตรวจ order ที่หมดอายุ
curl http://localhost:3001/api/admin/orders?status=pending_payment
```

---

## 📞 ยังแก้ไม่ได้?

1. ดู logs ทั้งหมด:
   ```bash
   npm run dev  # ดู terminal
   ```
2. ตรวจสอบ `apps/api/src/plugins/error.ts` ว่า error อะไร
3. เปิด Prisma Studio ตรวจข้อมูล
4. ถ้าไม่มีทางออก รีเซ็ต:
   ```bash
   docker compose down -v  # ลบ volumes ด้วย
   docker compose up -d
   npm run db:migrate
   npm run db:seed
   ```
