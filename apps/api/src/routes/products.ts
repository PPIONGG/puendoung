import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

const querySchema = z.object({
  category: z.string().optional(),
  status: z.enum(["active"]).optional().default("active"),
  isLive: z.string().optional(),
  availability: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional().default("newest"),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("24"),
});

export default async function (app: FastifyInstance) {
  app.get("/products", async (request, reply) => {
    const query = querySchema.parse(request.query);
    const page = Math.max(1, Number(query.page));
    const limit = Math.min(100, Math.max(1, Number(query.limit)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: query.status,
    };

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.isLive !== undefined) {
      where.isLiveSpecimen = query.isLive === "true" || query.isLive === "1";
    }
    if (query.availability) {
      where.availabilityStatus = query.availability;
    }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const orderBy: any =
      query.sort === "price_asc"
        ? { price: "asc" }
        : query.sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  });

  app.get("/products/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Product not found" } });
    }
    return { data: product };
  });
}
