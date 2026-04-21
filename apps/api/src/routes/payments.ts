import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { config } from "../config.js";

const createPaymentSchema = z.object({
  orderNumber: z.string().min(1),
});

export default async function (app: FastifyInstance) {
  app.post("/payments/create", async (request, reply) => {
    const body = createPaymentSchema.parse(request.body);
    const order = await prisma.order.findUnique({
      where: { orderNumber: body.orderNumber },
    });
    if (!order) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Order not found" } });
    }
    if (order.status !== "pending_payment") {
      return reply.status(409).send({ error: { code: "INVALID_STATE", message: "Order is not pending payment" } });
    }
    if (order.expiredAt && new Date() > order.expiredAt) {
      return reply.status(409).send({ error: { code: "EXPIRED", message: "Order expired" } });
    }

    const existing = await prisma.payment.findFirst({
      where: { orderId: order.id, status: { in: ["pending", "paid"] } },
    });
    if (existing) {
      return { data: { paymentId: existing.id, status: existing.status } };
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "mock",
        amount: order.totalAmount,
        status: "pending",
      },
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: "payment_created",
        payload: { orderNumber: order.orderNumber, amount: order.totalAmount },
      },
    });

    return { data: { paymentId: payment.id, status: payment.status } };
  });

  app.post("/payments/webhook/:provider", async (request, reply) => {
    const { provider } = request.params as { provider: string };
    if (provider !== "mock") {
      return reply.status(400).send({ error: { code: "UNKNOWN_PROVIDER", message: "Unknown payment provider" } });
    }

    const body = request.body as any;
    const paymentId = body?.paymentId;
    const success = body?.success === true || body?.success === "true";
    const providerEventId = body?.eventId;

    if (!paymentId) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "Missing paymentId" } });
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
    if (!payment) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Payment not found" } });
    }

    if (success) {
      const result = await prisma.$transaction(async (tx) => {
        // Idempotency: reject duplicate provider event
        if (providerEventId) {
          const existingEvent = await tx.paymentEvent.findFirst({
            where: { paymentId: payment.id, providerEventId, eventType: "payment_success" },
          });
          if (existingEvent) {
            return { status: "already_paid", alreadyProcessed: true };
          }
        }

        // Conditional update: only transition from non-paid statuses
        const updatedPayment = await tx.payment.updateMany({
          where: { id: payment.id, status: { not: "paid" } },
          data: { status: "paid", providerRef: body?.providerRef || "mock-ref" },
        });

        if (updatedPayment.count === 0) {
          return { status: "already_paid", alreadyProcessed: true };
        }

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "paid", paymentStatus: "paid" },
        });

        const order = await tx.order.findUnique({ where: { id: payment.orderId }, select: { couponId: true, orderNumber: true } });
        if (order?.couponId) {
          await tx.coupon.update({ where: { id: order.couponId }, data: { usageCount: { increment: 1 } } });
        }

        // Record the event inside the same transaction
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "payment_success",
            payload: body,
            providerEventId,
          },
        });

        // Create inventory movements inside transaction
        const items = await tx.orderItem.findMany({ where: { orderId: payment.orderId } });
        for (const item of items) {
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              quantity: -item.quantity,
              reason: "sale",
              orderId: payment.orderId,
              notes: `Sale for order ${order?.orderNumber || ""}`,
            },
          });
        }

        return { status: "paid", alreadyProcessed: false };
      });

      return { data: { status: result.status } };
    }

    // Failure path: record event but don't duplicate
    if (providerEventId) {
      const existingEvent = await prisma.paymentEvent.findFirst({
        where: { paymentId: payment.id, providerEventId, eventType: "payment_failure" },
      });
      if (!existingEvent) {
        await prisma.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventType: "payment_failure",
            payload: body,
            providerEventId,
          },
        });
      }
    } else {
      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "payment_failure",
          payload: body,
        },
      });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });

    return { data: { status: "failed" } };
  });

  app.post("/payments/mock-pay", async (request, reply) => {
    if (process.env.NODE_ENV === "production") {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Not found" } });
    }
    const body = request.body as { paymentId: string };
    if (!body?.paymentId) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "Missing paymentId" } });
    }
    const delay = Number(config.MOCK_PAYMENT_DELAY_MS);
    if (delay > 0) await new Promise((r) => setTimeout(r, Math.min(delay, 5000)));

    request.log.info({ paymentId: body.paymentId }, "Mock payment processing");
    const result = await app.inject({
      method: "POST",
      url: "/api/payments/webhook/mock",
      payload: { paymentId: body.paymentId, success: true, eventId: `mock-${Date.now()}` },
    });
    return result.json();
  });
}
