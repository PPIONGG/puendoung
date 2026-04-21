import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../prisma.js";

const updateStatusSchema = z.object({
  status: z.enum(["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled", "refunded"]),
});

const shipmentSchema = z.object({
  trackingNumber: z.string().optional(),
  provider: z.string().optional(),
  notes: z.string().optional(),
  shippedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
});

export default async function (app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/orders", async (request) => {
    const { page = "1", limit = "24", status } = request.query as any;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
        include: { items: true, payments: true, shipments: true },
      }),
      prisma.order.count({ where }),
    ]);
    return { data: items, meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } };
  });

  app.get("/orders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: { include: { events: true } }, shipments: true, timeline: { orderBy: { createdAt: "asc" } } },
    });
    if (!order) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Order not found" } });
    }
    return { data: order };
  });

  app.patch("/orders/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateStatusSchema.parse(request.body);

    const result = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // Prevent duplicate stock returns
      const alreadyFinal = ["cancelled", "refunded"].includes(currentOrder.status);
      const movingToFinal = ["cancelled", "refunded"].includes(body.status);
      const shouldReturnStock = !alreadyFinal && movingToFinal;

      const order = await tx.order.update({
        where: { id },
        data: { status: body.status, paymentStatus: body.status === "paid" ? "paid" : undefined },
      });

      await tx.orderTimeline.create({
        data: { orderId: id, status: body.status, note: `Status changed to ${body.status}` },
      });

      if (shouldReturnStock) {
        for (const item of currentOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              reason: "cancel",
              orderId: id,
              notes: `Stock returned from order ${currentOrder.orderNumber} (${body.status})`,
            },
          });
        }
      }

      return order;
    });

    return { data: result };
  });

  app.post("/orders/:id/shipments", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = shipmentSchema.parse(request.body);
    const shipment = await prisma.shipment.create({
      data: {
        orderId: id,
        trackingNumber: body.trackingNumber,
        provider: body.provider,
        notes: body.notes,
        shippedAt: body.shippedAt ? new Date(body.shippedAt) : undefined,
        deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : undefined,
      },
    });
    await prisma.orderTimeline.create({
      data: { orderId: id, status: "shipped", note: `Shipment created: ${body.trackingNumber || body.provider || ""}` },
    });
    return reply.status(201).send({ data: shipment });
  });

  app.patch("/shipments/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = shipmentSchema.parse(request.body);
    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        ...body,
        shippedAt: body.shippedAt ? new Date(body.shippedAt) : undefined,
        deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : undefined,
      },
    });
    return { data: shipment };
  });
}
