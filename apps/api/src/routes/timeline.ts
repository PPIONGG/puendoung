import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { checkOrderAccess } from "../lib/orderAuth.js";

export default async function (app: FastifyInstance) {
  app.get("/orders/:orderNumber/timeline", async (request, reply) => {
    const { orderNumber } = request.params as { orderNumber: string };
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        customerId: true,
        customerPhone: true,
        customerEmail: true,
      },
    });
    if (!order) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Order not found" } });
    }

    const access = await checkOrderAccess(request, order);

    if (!access.isAuthorized) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Please provide phone or email to view timeline" } });
    }

    const timeline = await prisma.orderTimeline.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });

    if (access.isGuestLookup) {
      // Redact internal notes for guest lookups
      return {
        data: timeline.map((t) => ({
          id: t.id,
          status: t.status,
          createdAt: t.createdAt,
          note: t.createdBy ? undefined : t.note,
        })),
      };
    }

    return { data: timeline };
  });
}
