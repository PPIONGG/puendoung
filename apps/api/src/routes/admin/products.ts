import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../prisma.js";

const productSchema = z.object({
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).optional(),
  sku: z.string().max(200).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).default([]),
  isLiveSpecimen: z.boolean().default(false),
  speciesName: z.string().max(200).optional(),
  sex: z.enum(["male", "female", "pair", "unknown", "not_applicable"]).optional(),
  lifeStage: z.enum(["egg", "larva", "pupa", "adult", "not_applicable"]).optional(),
  careLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  temperatureRange: z.string().max(100).optional(),
  humidityRange: z.string().max(100).optional(),
  substrateNotes: z.string().max(2000).optional(),
  feedingNotes: z.string().max(2000).optional(),
  shippingNotes: z.string().max(2000).optional(),
  availabilityStatus: z.enum(["ready", "preorder", "breeding", "molting", "out_of_stock", "unavailable"]).default("out_of_stock"),
});

export default async function (app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/products", async (request) => {
    const { page = "1", limit = "24", q } = request.query as any;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
        include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
      }),
      prisma.product.count({ where }),
    ]);
    return { data: items, meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } };
  });

  app.post("/products", async (request, reply) => {
    const body = productSchema.parse(request.body);
    const existing = await prisma.product.findUnique({ where: { slug: body.slug } });
    if (existing) {
      return reply.status(409).send({ error: { code: "SLUG_EXISTS", message: "Slug already exists" } });
    }
    const product = await prisma.product.create({
      data: {
        ...body,
        images: { create: body.images.map((img, idx) => ({ ...img, sortOrder: idx })) },
      },
      include: { images: true },
    });
    await prisma.inventoryMovement.create({
      data: { productId: product.id, quantity: body.stockQuantity, reason: "seed", notes: "Initial stock" },
    });
    return reply.status(201).send({ data: product });
  });

  app.patch("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = productSchema.partial().parse(request.body);
    const { categoryId, images, ...scalarRest } = parsed;
    const updateData: any = { ...scalarRest };
    if (categoryId !== undefined) updateData.category = { connect: { id: categoryId } };

    if (images !== undefined) {
      updateData.images = {
        deleteMany: {},
        create: images.map((img, idx) => ({ ...img, sortOrder: idx })),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true },
    });
    return { data: product };
  });

  app.delete("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.product.update({ where: { id }, data: { status: "archived" } });
    return { data: { success: true } };
  });
}
