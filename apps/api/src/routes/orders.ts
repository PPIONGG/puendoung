import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { checkOrderAccess } from "../lib/orderAuth.js";
import crypto from "crypto";

function generateLookupToken() {
  return crypto.randomBytes(16).toString("hex");
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PD${y}${m}${d}-${rand}`;
}

const createOrderSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(9).max(20),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingName: z.string().min(1).max(100),
  shippingPhone: z.string().min(9).max(20),
  shippingAddress: z.string().min(1).max(500),
  shippingProvince: z.string().min(1).max(100),
  shippingDistrict: z.string().min(1).max(100),
  shippingPostalCode: z.string().min(1).max(20),
  shippingMethod: z.string().min(1),
  shippingNotes: z.string().max(500).optional(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
  couponCode: z.string().optional(),
});

export default async function (app: FastifyInstance) {
  app.post("/orders", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { verifyToken } = await import("../lib/jwt.js");
        const decoded = verifyToken(authHeader.slice(7));
        const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { customerProfile: true } });
        if (user) (request as any).customer = user;
      } catch { /* ignore invalid token for guest checkout */ }
    }
    const body = createOrderSchema.parse(request.body);

    const result = await prisma.$transaction(async (tx) => {
      const productIds = body.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { images: { take: 1 } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const orderItems = [];
      const stockUpdates = [];

      for (const item of body.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
        if (product.status !== "active") throw new Error(`PRODUCT_NOT_ACTIVE:${product.name}`);
        if (product.stockQuantity < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.stockQuantity}`);
        }
        if (product.isLiveSpecimen) {
          const allowed = ["ready", "preorder"];
          if (!allowed.includes(product.availabilityStatus)) {
            throw new Error(`LIVE_NOT_AVAILABLE:${product.name}`);
          }
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;
        orderItems.push({
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
        stockUpdates.push(
          tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: item.quantity } },
          })
        );
      }

      let discountAmount = 0;
      let couponId: string | undefined;
      if (body.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: body.couponCode.toUpperCase() } });
        if (coupon && coupon.isActive && (!coupon.expiresAt || new Date() <= coupon.expiresAt) && (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) && subtotal >= coupon.minAmount) {
          discountAmount = coupon.type === "fixed_amount" ? coupon.value : Math.floor((subtotal * coupon.value) / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
          couponId = coupon.id;
        }
      }

      const customer = (request as any).customer;
      const customerId = customer?.customerProfile?.id || customer?.id || undefined;

      const orderNumber = generateOrderNumber();
      const lookupToken = generateLookupToken();
      const order = await tx.order.create({
        data: {
          orderNumber,
          lookupToken,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          customerEmail: body.customerEmail || null,
          shippingName: body.shippingName,
          shippingPhone: body.shippingPhone,
          shippingAddress: body.shippingAddress,
          shippingProvince: body.shippingProvince,
          shippingDistrict: body.shippingDistrict,
          shippingPostalCode: body.shippingPostalCode,
          shippingMethod: body.shippingMethod,
          shippingNotes: body.shippingNotes || null,
          subtotalAmount: subtotal,
          shippingAmount: 0,
          discountAmount,
          taxAmount: 0,
          totalAmount: subtotal - discountAmount,
          status: "pending_payment",
          paymentStatus: "unpaid",
          expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          items: { create: orderItems },
          timeline: { create: { status: "pending_payment", note: "Order created" } },
          customerId: customerId || null,
          couponId: couponId || null,
        },
      });

      await Promise.all(stockUpdates);

      for (const item of body.items) {
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            reason: "reserve",
            orderId: order.id,
            notes: `Reserved for order ${orderNumber}`,
          },
        });
      }

      return order;
    }, { isolationLevel: "Serializable" });

    return reply.status(201).send({ data: { ...result, lookupToken: result.lookupToken } });
  });

  app.get("/orders/:orderNumber", async (request, reply) => {
    const { orderNumber } = request.params as { orderNumber: string };
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true, orderNumber: true, lookupToken: true, customerId: true, customerName: true,
        customerPhone: true, customerEmail: true, shippingName: true, shippingPhone: true,
        shippingAddress: true, shippingProvince: true, shippingDistrict: true,
        shippingPostalCode: true, shippingMethod: true, shippingNotes: true,
        subtotalAmount: true, discountAmount: true, shippingAmount: true, taxAmount: true,
        totalAmount: true, status: true, paymentStatus: true, createdAt: true, updatedAt: true,
        expiredAt: true, items: true,
        payments: { select: { id: true, provider: true, amount: true, status: true, createdAt: true } },
        shipments: true,
      },
    });
    if (!order) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Order not found" } });
    }

    const access = await checkOrderAccess(request, order);

    if (!access.isAuthorized) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Please provide phone or email to track this order" } });
    }

    if (access.isAdmin || access.isOwner) {
      return { data: order };
    }

    // Guest lookup: redacted response (no PII)
    const redacted = {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      items: order.items,
      shipments: order.shipments.map((s: any) => ({ id: s.id, trackingNumber: s.trackingNumber, provider: s.provider, shippedAt: s.shippedAt, deliveredAt: s.deliveredAt })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
    return { data: redacted };
  });
}
