# 💻 คู่มือการพัฒนา

เอกสารนี้สำหรับนักพัฒนาที่ต้องการแก้ไขหรือเพิ่ม feature ในเพื่อนด้วง

---

## 🚀 เริ่มต้นพัฒนา

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment

```bash
cp .env.example .env
```

ค่า default ใน `.env.example` ใช้สำหรับ local development ได้เลย ไม่ต้องแก้ (ยกเว้นถ้าต้องการ)

### 3. รัน Database

```bash
npm run docker:up
```

### 4. รัน Migration และ Seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. รัน Dev Server

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Prisma Studio: `npm run db:studio` → http://localhost:5555

---

## 📁 โครงสร้างโปรเจกต์

```
puendoung/
├── apps/
│   ├── web/              # React Frontend
│   │   ├── src/
│   │   │   ├── components/    # UI Components
│   │   │   ├── pages/         # หน้าต่าง ๆ
│   │   │   ├── lib/           # API client + utilities
│   │   │   ├── store/         # Zustand stores
│   │   │   └── hooks/         # Custom hooks
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── api/              # Fastify Backend
│       ├── src/
│       │   ├── lib/           # Helpers (jwt, orderAuth)
│       │   ├── plugins/       # Auth, Error handling
│       │   ├── jobs/          # Background jobs
│       │   └── routes/        # API endpoints
│       │       └── admin/     # Admin APIs
│       └── Dockerfile
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
│
├── docs/                 # เอกสารนี้!
├── docker-compose.yml    # Local development
├── docker-compose.prod.yml # Production
└── .github/workflows/    # CI/CD
```

---

## 🧑‍💻 การพัฒนา Frontend

### เพิ่มหน้าใหม่

1. สร้างไฟล์ใน `apps/web/src/pages/YourPage.tsx`
2. เพิ่ม route ใน `apps/web/src/App.tsx`
3. ใช้ `usePageTitle("ชื่อหน้า")` ใน component

### เรียก API

```typescript
import { api } from "../lib/api";

// ใน component
const products = await api.getProducts({ category: "live-specimens" });
```

### ใช้ UI Components

```tsx
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

<Card>
  <CardContent>
    <Input placeholder="ชื่อ" />
    <Button>บันทึก</Button>
  </CardContent>
</Card>
```

---

## 🧑‍💻 การพัฒนา Backend

### เพิ่ม API Endpoint

1. สร้างไฟล์ใน `apps/api/src/routes/your-feature.ts`
2. ลงทะเบียนใน `apps/api/src/index.ts`
3. ใช้ Zod validate request body

```typescript
// apps/api/src/routes/your-feature.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

const schema = z.object({
  name: z.string().min(1),
});

export default async function (app: FastifyInstance) {
  app.post("/your-feature", async (request, reply) => {
    const body = schema.parse(request.body);
    // ... business logic
    return { data: result };
  });
}
```

### ต้องการ Database Query?

```typescript
// ใช้ Prisma Client
const user = await prisma.user.findUnique({ where: { id: "..." } });

// Transaction
await prisma.$transaction([
  prisma.order.update({ ... }),
  prisma.product.update({ ... }),
]);
```

### เพิ่ม Background Job?

สร้างใน `apps/api/src/jobs/` แล้วเรียกใน `index.ts`:

```typescript
import { startYourJob } from "./jobs/yourJob.js";
startYourJob(60000); // รันทุก 60 วินาที
```

---

## 🧪 การเขียน Tests

### Unit Tests

สร้างไฟล์ `*.test.ts` ใน `apps/api/src/tests/`:

```typescript
import { describe, it, expect } from "vitest";

describe("Feature Name", () => {
  it("should do something", () => {
    expect(1 + 1).toBe(2);
  });
});
```

รัน test:
```bash
npm run test
```

### Integration Tests (ต้องการ Database)

แนะนำให้ใช้ test database แยก:
```env
# .env.test
DATABASE_URL="postgresql://puendoung:puendoung@localhost:5432/puendoung_test?schema=public"
```

---

## 📝 การแก้ไข Database Schema

1. แก้ไข `prisma/schema.prisma`
2. สร้าง migration:
   ```bash
   npx prisma migrate dev --name add_new_field
   ```
3. อัปเดต Prisma Client:
   ```bash
   npx prisma generate
   ```
4. อัปเดต seed script ถ้าจำเป็น
5. รัน seed ใหม่:
   ```bash
   npm run db:seed
   ```

---

## 🔍 Debugging

### Frontend
- ใช้ Chrome DevTools → React Developer Tools
- ดู Network tab ตรวจ API calls
- Redux DevTools ไม่ต้อง (ใช้ Zustand ไม่ได้ integrate)

### Backend
- Logs จะแสดงอัตโนมัติใน terminal
- ใช้ `request.log.info()` หรือ `request.log.error()`
- Prisma query logs: ดูได้ใน terminal ตอน dev mode

### Database
- Prisma Studio: `npm run db:studio`
- หรือใช้ psql: `docker exec -it puendoung-postgres psql -U puendoung`

---

## 🎨 Coding Conventions

### Naming
- Components: PascalCase (`ProductCard.tsx`)
- Functions/variables: camelCase (`getProducts`)
- Constants: UPPER_SNAKE_CASE (`MAX_ITEMS`)
- Database tables: camelCase (`orderItem`)

### TypeScript
- ใช้ `strict: true`
- หลีกเลี่ยง `any` ถ้าเป็นไปได้
- ใช้ Zod สำหรับ runtime validation

### Error Handling
- API errors ใช้ format: `{ error: { code, message, details } }`
- Frontend แสดง `error.message` ให้ user
- ไม่ส่ง stack trace ให้ client ใน production

---

## 📚 เอกสารอ้างอิง

- [Prisma Docs](https://www.prisma.io/docs)
- [Fastify Docs](https://www.fastify.io/docs/latest/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)
