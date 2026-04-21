# 🚀 คู่มือ Deploy ขึ้น Production

เอกสารนี้อธิบายขั้นตอนการ deploy เพื่อนด้วงขึ้น server จริง สำหรับผู้ดูแลระบบ

---

## 📋 สิ่งที่ต้องเตรียม

### Server Requirements
- **OS**: Linux (Ubuntu 22.04 LTS แนะนำ)
- **RAM**: 2GB+ (4GB แนะนำ)
- **Disk**: 20GB+ (SSD แนะนำ)
- **Docker**: 24.x + Docker Compose
- **Domain name**: มี SSL certificate (Let's Encrypt)

### สิ่งที่ต้องมีก่อนเริ่ม
1. Server (VPS) พร้อม SSH access
2. Domain name ชี้มาที่ server
3. Docker และ Docker Compose ติดตั้งแล้ว

---

## 🏗️ ขั้นตอน Deploy

### 1. Clone Repository

```bash
git clone <your-repo-url> puendoung
cd puendoung
```

### 2. สร้างไฟล์ `.env`

```bash
cp .env.example .env
nano .env
```

แก้ไขค่าต่อไปนี้:

```env
# Database
POSTGRES_USER=puendoung_prod
POSTGRES_PASSWORD=your_very_strong_password_here
POSTGRES_DB=puendoung
DATABASE_URL=postgresql://puendoung_prod:your_very_strong_password_here@postgres:5432/puendoung?schema=public

# API
WEB_ORIGIN=https://your-domain.com
SESSION_SECRET=generate_random_32_character_string_here

# Admin
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your_admin_password

# Mock Payment (ปิดใน production โดยอัตโนมัติ)
MOCK_PAYMENT_DELAY_MS=0
```

**⚠️ สำคัญ:**
- `SESSION_SECRET` ต้องยาว 32+ ตัวอักษร สุ่มจริง ๆ
- `POSTGRES_PASSWORD` และ `ADMIN_PASSWORD` ต้อง strong
- อย่าใช้ค่า default จาก `.env.example`

### 3. สร้าง SSL Certificate (Let's Encrypt)

```bash
# ติดตั้ง certbot
sudo apt update
sudo apt install certbot

# สร้าง certificate
sudo certbot certonly --standalone -d your-domain.com

# คัดลอกไฟล์ไปที่ project
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
```

### 4. Deploy!

```bash
# สร้างและรัน containers
docker compose -f docker-compose.prod.yml up -d

# รอให้ database พร้อม (ประมาณ 10 วินาที)
sleep 10

# รัน migration
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Seed ข้อมูลเริ่มต้น (ครั้งแรกเท่านั้น)
docker compose -f docker-compose.prod.yml exec api npx tsx prisma/seed.ts
```

### 5. ตรวจสอบว่า Deploy สำเร็จ

```bash
# ตรวจสอบ containers
docker compose -f docker-compose.prod.yml ps

# ดู logs
docker compose -f docker-compose.prod.yml logs -f api

# Health check
curl https://your-domain.com/health
```

---

## 🔄 การอัปเดต (Update)

```bash
cd puendoung
git pull origin main

# Rebuild และรันใหม่
docker compose -f docker-compose.prod.yml up -d --build

# รัน migration ถ้ามี
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

---

## 💾 การสำรองข้อมูล

### อัตโนมัติ (ตั้งค่าแล้ว)
- Backup container รันทุกวันเวลา 02:00 AM
- ไฟล์ backup อยู่ที่ `./backups/`
- เก็บ 30 วันล่าสุด (ต้องตั้ง cron เองเพิ่มเติม)

### สำรองด้วยมือ
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U puendoung_prod -d puendoung -F c -f /backups/manual_$(date +%Y%m%d_%H%M%S).dump
```

### กู้คืนข้อมูล
```bash
# หยุดระบบก่อน
docker compose -f docker-compose.prod.yml down

# ลบ volume เก่า (ระวัง!)
docker volume rm puendoung_postgres_data

# สร้างใหม่และกู้คืน
docker compose -f docker-compose.prod.yml up -d postgres
sleep 10
docker compose -f docker-compose.prod.yml exec -T postgres pg_restore -U puendoung_prod -d puendoung --clean /backups/backup_20240421_020000.dump
```

---

## 📊 Monitoring

### ดู Logs
```bash
# API logs
docker compose -f docker-compose.prod.yml logs -f api

# Database logs
docker compose -f docker-compose.prod.yml logs -f postgres

# Web server logs
docker compose -f docker-compose.prod.yml logs -f web
```

### Health Checks
- API: `https://your-domain.com/health`
- ตรวจสอบอัตโนมัติทุก 30 วินาที (Docker healthcheck)

---

## 🛡️ Security Checklist ก่อนเปิดใช้งาน

- [ ] เปลี่ยน `SESSION_SECRET` เป็นค่าสุ่มจริง ๆ
- [ ] เปลี่ยน `POSTGRES_PASSWORD` เป็น strong password
- [ ] เปลี่ยน `ADMIN_PASSWORD` จาก default
- [ ] ตั้งค่า `WEB_ORIGIN` เป็น domain จริง
- [ ] ตั้งค่า SSL/HTTPS
- [ ] ปิด port ที่ไม่จำเป็น (3001, 5432 ไม่ต้อง expose ภายนอก)
- [ ] ตั้งค่า firewall (ufw)
- [ ] อ่าน [Security Checklist](../security-checklist.md) เพิ่มเติม

---

## 🆘 แก้ปัญหาฉุกเฉิน

### ลืมรหัสผ่าน Admin
```bash
# เข้าไปใน container
docker compose -f docker-compose.prod.yml exec api sh

# รัน script เปลี่ยน password
node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('new_password', 12);
console.log(hash);
"
```

แล้วเอา hash ไปอัปเดต database ผ่าน Prisma Studio:
```bash
docker compose -f docker-compose.prod.yml exec api npx prisma studio
```

### ระบบไม่ตอบสนอง
```bash
# Restart ทั้งหมด
docker compose -f docker-compose.prod.yml restart

# ถ้ายังไม่ได้ ลอง down แล้ว up ใหม่
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Database ล่ม
```bash
# ดู logs
docker compose -f docker-compose.prod.yml logs postgres

# Restart เฉพาะ database
docker compose -f docker-compose.prod.yml restart postgres
```

---

## 📞 Support

- ดู logs ก่อนเสมอ: `docker compose -f docker-compose.prod.yml logs`
- ตรวจสอบ disk space: `df -h`
- ตรวจสอบ memory: `free -m`
