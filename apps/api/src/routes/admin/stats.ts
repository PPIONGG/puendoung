import type { FastifyInstance } from "fastify";
import { prisma } from "../../prisma.js";

export default async function (app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/stats", async () => {
    const [
      totalOrders,
      pendingOrders,
      todayOrders,
      totalRevenue,
      totalProducts,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending_payment" } }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "paid" } }),
      prisma.product.count(),
      prisma.product.count({ where: { stockQuantity: { lte: 5 }, status: "active" } }),
    ]);

    return {
      data: {
        totalOrders,
        pendingOrders,
        todayOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalProducts,
        lowStockProducts,
      },
    };
  });
}
