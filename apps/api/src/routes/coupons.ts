import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

export default async function (app: FastifyInstance) {
  app.get("/coupons/:code", async (request, reply) => {
    const { code } = request.params as { code: string };
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Invalid coupon" } });
    }
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return reply.status(400).send({ error: { code: "EXPIRED", message: "Coupon expired" } });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return reply.status(400).send({ error: { code: "LIMIT_REACHED", message: "Coupon usage limit reached" } });
    }
    return { data: { code: coupon.code, name: coupon.name, type: coupon.type, value: coupon.value, minAmount: coupon.minAmount, maxDiscount: coupon.maxDiscount } };
  });

  app.post("/coupons/validate", async (request, reply) => {
    const body = z.object({ code: z.string(), subtotal: z.number().int().min(0) }).parse(request.body);
    const coupon = await prisma.coupon.findUnique({ where: { code: body.code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Invalid coupon" } });
    }
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return reply.status(400).send({ error: { code: "EXPIRED", message: "Coupon expired" } });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return reply.status(400).send({ error: { code: "LIMIT_REACHED", message: "Coupon usage limit reached" } });
    }
    if (body.subtotal < coupon.minAmount) {
      return reply.status(400).send({ error: { code: "MIN_AMOUNT", message: `Minimum amount is ${coupon.minAmount}` } });
    }
    let discount = coupon.type === "fixed_amount" ? coupon.value : Math.floor((body.subtotal * coupon.value) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    return { data: { code: coupon.code, name: coupon.name, discount } };
  });
}
