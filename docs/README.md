# 📚 เอกสารประกอบโปรเจกต์เพื่อนด้วง

เอกสารชุดนี้อธิบายระบบเพื่อนด้วงตั้งแต่พื้นฐานจนถึงรายละเอียด technical สำหรับทีมพัฒนา ผู้ดูแลระบบ และเจ้าของธุรกิจ

## 📖 สารบัญ

### 🎯 สำหรับคนใหม่
- [ภาพรวมระบบ](./01-overview.md) - เข้าใจเพื่อนด้วงใน 10 นาที
- [สถาปัตยกรรมระบบ](./02-architecture.md) - โครงสร้างและการทำงานของแต่ละส่วน
- [ฐานข้อมูล](./03-database.md) - ตาราง ความสัมพันธ์ และ business rules

### 🔌 API & Integration
- [API Documentation](./api/README.md) - รายการ endpoints พร้อมตัวอย่าง

### 🚀 Deploy & Ops
- [คู่มือ Deploy](./deployment/README.md) - ติดตั้งบน server จริง
- [การสำรองข้อมูล](./deployment/backup.md) - กู้คืนข้อมูลเมื่อฉุกเฉิน

### 💻 Development
- [คู่มือการพัฒนา](./development/README.md) - เริ่มต้นเขียนโค้ด
- [การเพิ่ม feature ใหม่](./development/adding-features.md) - ขั้นตอนมาตรฐาน

### 🔒 ความปลอดภัย
- [Security Checklist](./security-checklist.md) - ตรวจสอบก่อนเปิดใช้งานจริง

---

## 🏪 เพื่อนด้วงคืออะไร?

**เพื่อนด้วง** คือ e-commerce สำหรับร้านขายด้วงและอุปกรณ์เลี้ยงด้วงครบวงจร เป้าหมายคือรองรับการขายจริงในอนาคต ไม่ใช่แค่เว็บ demo

### สินค้าหลัก 2 กลุ่ม
1. **สินค้าสิ่งมีชีวิต**: ตัวด้วง หนอน ดักแด้ - ต้องมีข้อมูลการดูแล อุณหภูมิ ความชื้น ช่วงวัย
2. **สินค้าทั่วไป**: บ้านด้วง ดิน อาหาร เจลลี่ อุปกรณ์

### ผู้ใช้ระบบ
- **ลูกค้าทั่วไป**: เลือกซื้อสินค้า เพิ่มตะกร้า ชำระเงิน ติดตาม order
- **ผู้ดูแลร้าน (Admin)**: จัดการสินค้า ตรวจสอบ order อัปเดตสถานะจัดส่ง

---

## 🛠️ Tech Stack สรุป

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui pattern (custom) |
| Backend | Fastify + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (customer) + Signed Cookie (admin) |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 📞 ต้องการความช่วยเหลือ?

- ดู [คู่มือแก้ปัญหา](./development/troubleshooting.md)
- ตรวจสอบ [Security Checklist](./security-checklist.md) ก่อน production
- อ่าน [คู่มือ Deploy](./deployment/README.md) ถ้าต้องการขึ้น server จริง
