# 🔒 Security Checklist

รายการตรวจสอบความปลอดภัยก่อนเปิดใช้งานเพื่อนด้วงบน production

---

## 🚨 สิ่งที่ต้องทำก่อนเปิดร้าน (Critical)

### Environment Variables
- [ ] `SESSION_SECRET` ยาว 32+ ตัวอักษร สุ่มจริง ๆ (ไม่ใช่ `change-me`)
- [ ] `POSTGRES_PASSWORD` strong password (ไม่ใช่ `puendoung`)
- [ ] `ADMIN_PASSWORD` ไม่ใช่ default (`admin1234`)
- [ ] `.env` อยู่ใน `.gitignore` และไม่ถูก commit
- [ ] `.env.example` ไม่มี secret จริง

### Authentication
- [ ] Admin session ใช้ signed JWT (ไม่ใช่ raw user ID)
- [ ] Admin session มี expiry (24 ชม.)
- [ ] Logout ล้าง cookie ได้
- [ ] Customer password ถูก hash ด้วย bcrypt
- [ ] Login endpoint มี rate limit
- [ ] Error message login ไม่บอกว่า email ถูกแต่ password ผิด

### Authorization
- [ ] Admin endpoints ต้อง login ก่อน
- [ ] Customer ดู order ตัวเองได้เท่านั้น (ไม่ใช่ของคนอื่น)
- [ ] Guest lookup order ต้องใช้ phone/email ยืนยัน
- [ ] ไม่เชื่อ role ที่ส่งมาจาก frontend

### Data Protection
- [ ] ไม่เก็บรหัสผ่าน plain text
- [ ] ไม่ log password, token, secret
- [ ] ไม่ส่ง stack trace ให้ client ใน production
- [ ] PII (เบอร์โทร, ที่อยู่) redacted สำหรับ guest

### Payment
- [ ] Mock payment endpoint ปิดใน production
- [ ] Payment status เปลี่ยนผ่าน backend/webhook เท่านั้น
- [ ] Frontend ไม่สามารถ mark order เป็น paid ได้
- [ ] Webhook idempotent (กัน duplicate processing)
- [ ] ไม่เก็บเลขบัตรเครดิตหรือ CVV

### Input Validation
- [ ] ทุก endpoint ที่รับ input ใช้ Zod validate
- [ ] จำกัดความยาว text fields
- [ ] ใช้ Prisma query API (ไม่ต่อ SQL string เอง)
- [ ] Sanitize output ก่อน render

### Infrastructure
- [ ] HTTPS เท่านั้น (ไม่มี HTTP)
- [ ] Database ไม่ expose port ภายนอก
- [ ] มี firewall (ufw) เปิดแค่ port จำเป็น (80, 443, 22)
- [ ] มี automated backup
- [ ] ใช้ non-root user ใน Docker container

---

## ✅ สิ่งที่ทำแล้วในโปรเจกต์นี้

| รายการ | สถานะ |
|--------|--------|
| Password hashing (bcrypt) | ✅ |
| Admin signed session (JWT) | ✅ |
| Rate limiting | ✅ |
| Input validation (Zod) | ✅ |
| CORS ตั้งค่าจาก env | ✅ |
| Security headers (Helmet) | ✅ |
| Mock payment restricted | ✅ |
| Order lookup with verification | ✅ |
| Stock transaction-safe | ✅ |
| Payment idempotency | ✅ |
| Cookie HttpOnly + Secure | ✅ |
| .env in .gitignore | ✅ |

---

## ⚠️ สิ่งที่ต้องทำเพิ่มเติมในอนาคต

- [ ] Content Security Policy (CSP) headers
- [ ] Web Application Firewall (WAF)
- [ ] Penetration testing
- [ ] 2FA สำหรับ admin
- [ ] Audit log ทุก admin action
- [ ] Database encryption at rest
- [ ] PCI DSS compliance (เมื่อรับบัตรจริง)
