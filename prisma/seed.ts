import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@puendoung.test";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

  const hashed = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashed,
      role: "admin",
      name: "แอดมินเพื่อนด้วง",
    },
  });
  console.log("Admin user created/updated");

  const categories = [
    { slug: "live-specimens", name: "ด้วงมีชีวิต", description: "ตัวด้วง หนอน ดักแด้", sortOrder: 1 },
    { slug: "housing", name: "บ้านและกล่องเลี้ยง", description: "บ้านด้วง กล่องเลี้ยง", sortOrder: 2 },
    { slug: "substrates", name: "ดินและวัสดุเลี้ยง", description: "ดินหมัก ไม้ผุ", sortOrder: 3 },
    { slug: "food", name: "อาหารและเจลลี่", description: "อาหารด้วง เจลลี่ผลไม้", sortOrder: 4 },
    { slug: "accessories", name: "อุปกรณ์เสริม", description: "อุปกรณ์และอื่น ๆ", sortOrder: 5 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("Categories seeded");

  const catMap = await prisma.category.findMany().then((list) =>
    Object.fromEntries(list.map((c) => [c.slug, c.id]))
  );

  const products: Prisma.ProductCreateInput[] = [
    {
      slug: "rhinoceros-beetle-male",
      name: "ด้วงกว่างสามเขา ตัวผู้",
      description: "ด้วงกว่างสามเขาคุณภาพดี ตัวผู้ขนาดใหญ่ สำหรับเลี้ยงสะสมและประกวด",
      price: 85000,
      sku: "RB-M-001",
      stockQuantity: 5,
      category: { connect: { id: catMap["live-specimens"] } },
      status: "active",
      images: { create: [{ url: "https://placehold.co/600x400?text=Rhinoceros+Beetle", alt: "ด้วงกว่างสามเขา ตัวผู้" }] },
      isLiveSpecimen: true,
      speciesName: "Trypoxylus dichotomus",
      sex: "male",
      lifeStage: "adult",
      careLevel: "intermediate",
      temperatureRange: "22-28°C",
      humidityRange: "60-80%",
      substrateNotes: "ใช้ดินหมักสำหรับด้วงหนา 10-15 ซม.",
      feedingNotes: "เจลลี่ผลไม้ หรือลูกแพร์",
      shippingNotes: "ส่งเฉพาะวันจันทร์-พุธ เพื่อป้องกันติดสุดสัปดาห์",
      availabilityStatus: "ready",
    },
    {
      slug: "rhinoceros-larva-l3",
      name: "หนอนด้วงกว่าง L3",
      description: "หนอนด้วงกว่างระยะ L3 ขนาดใหญ่ พร้อมเข้าดักแด้",
      price: 35000,
      sku: "RB-L3-001",
      stockQuantity: 12,
      category: { connect: { id: catMap["live-specimens"] } },
      status: "active",
      images: { create: [{ url: "https://placehold.co/600x400?text=Larva+L3", alt: "หนอนด้วงกว่าง L3" }] },
      isLiveSpecimen: true,
      speciesName: "Trypoxylus dichotomus",
      sex: "unknown",
      lifeStage: "larva",
      careLevel: "beginner",
      temperatureRange: "22-26°C",
      humidityRange: "60-70%",
      substrateNotes: "ดินหมักอัดแน่นในภาชนะขนาดใหญ่",
      feedingNotes: "ไม่ต้องให้อาหารเพิ่มในดินหมักที่มีสารอาหาร",
      shippingNotes: "ห่อด้วยกระดาษชำระเปียก ส่งด่วน 1-2 วัน",
      availabilityStatus: "ready",
    },
    {
      slug: "acrylic-beetle-house",
      name: "บ้านด้วงอะคริลิก",
      description: "บ้านเลี้ยงด้วงอะคริลิกใส ระบายอากาศดี ดูสวยงาม",
      price: 45000,
      sku: "HOUSE-AC-001",
      stockQuantity: 20,
      category: { connect: { id: catMap["housing"] } },
      status: "active",
      images: { create: [{ url: "https://placehold.co/600x400?text=Acrylic+House", alt: "บ้านด้วงอะคริลิก" }] },
      isLiveSpecimen: false,
      availabilityStatus: "ready",
    },
    {
      slug: "fermented-substrate",
      name: "ดินหมักสำหรับด้วง",
      description: "ดินหมักคุณภาพสูงสำหรับเลี้ยงด้วงทุกช่วงวัย",
      price: 18000,
      sku: "SUB-001",
      stockQuantity: 50,
      category: { connect: { id: catMap["substrates"] } },
      status: "active",
      images: { create: [{ url: "https://placehold.co/600x400?text=Substrate", alt: "ดินหมักสำหรับด้วง" }] },
      isLiveSpecimen: false,
      availabilityStatus: "ready",
    },
    {
      slug: "fruit-jelly-beetle",
      name: "เจลลี่ผลไม้สำหรับด้วง",
      description: "เจลลี่ผลไม้สำเร็จรูปสำหรับอาหารด้วง หลากหลายรสชาติ",
      price: 12000,
      sku: "JELLY-001",
      stockQuantity: 100,
      category: { connect: { id: catMap["food"] } },
      status: "active",
      images: { create: [{ url: "https://placehold.co/600x400?text=Jelly", alt: "เจลลี่ผลไม้สำหรับด้วง" }] },
      isLiveSpecimen: false,
      availabilityStatus: "ready",
    },
    {
      slug: "rotten-wood-egg-lay",
      name: "ไม้ผุสำหรับวางไข่",
      description: "ไม้ผุคุณภาพดีสำหรับด้วงวางไข่",
      price: 9000,
      sku: "WOOD-001",
      stockQuantity: 30,
      category: { connect: { id: catMap["substrates"] } },
      status: "active",
      images: { create: [{ url: "https://placehold.co/600x400?text=Rotten+Wood", alt: "ไม้ผุสำหรับวางไข่" }] },
      isLiveSpecimen: false,
      availabilityStatus: "ready",
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug as string },
      update: {},
      create: p,
    });
  }
  console.log("Products seeded");

  const coupons = [
    { code: "WELCOME50", name: "ส่วนลด 50 บาท", type: "fixed_amount" as const, value: 5000, minAmount: 20000, usageLimit: 100, isActive: true },
    { code: "BEETLE10", name: "ส่วนลด 10%", type: "percentage" as const, value: 10, minAmount: 10000, maxDiscount: 10000, usageLimit: 50, isActive: true },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log("Coupons seeded");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
