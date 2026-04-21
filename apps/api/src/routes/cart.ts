import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const cartSchema = z.object({
  items: z.array(cartItemSchema).min(1),
});

export default async function (app: FastifyInstance) {
  app.post("/cart/validate", async (request, reply) => {
    const body = cartSchema.parse(request.body);
    const productIds = body.items.map((i) => i.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: { take: 1 } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const validatedItems = [];
    let subtotal = 0;
    let hasLiveSpecimen = false;
    const errors: string[] = [];

    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        errors.push(`สินค้า ${item.productId} ไม่พบในระบบ`);
        continue;
      }
      if (product.status !== "active") {
        errors.push(`${product.name} ไม่พร้อมขาย`);
        continue;
      }
      if (product.stockQuantity < item.quantity) {
        errors.push(`${product.name} มีสินค้าไม่พอ (เหลือ ${product.stockQuantity})`);
        continue;
      }
      if (product.isLiveSpecimen) hasLiveSpecimen = true;
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      validatedItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        isLiveSpecimen: product.isLiveSpecimen,
        speciesName: product.speciesName,
        sex: product.sex,
        lifeStage: product.lifeStage,
        imageUrl: product.images[0]?.url,
      });
    }

    if (errors.length > 0) {
      return reply.status(409).send({
        error: { code: "CART_INVALID", message: "Cart validation failed", details: errors },
      });
    }

    return {
      data: {
        items: validatedItems,
        subtotal,
        shippingAmount: 0,
        discountAmount: 0,
        taxAmount: 0,
        total: subtotal,
        hasLiveSpecimen,
      },
    };
  });
}
