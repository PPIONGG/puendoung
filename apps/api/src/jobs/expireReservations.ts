import { prisma } from "../prisma.js";

export function startExpireReservationJob(intervalMs = 60000) {
  const run = async () => {
    try {
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: "pending_payment",
          expiredAt: { lt: new Date() },
        },
        include: { items: true },
      });

      for (const order of expiredOrders) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "cancelled", paymentStatus: "expired" },
          });
          await tx.orderTimeline.create({
            data: { orderId: order.id, status: "cancelled", note: "Auto-cancelled: payment expired" },
          });
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            });
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                reason: "release",
                orderId: order.id,
                notes: `Released reservation for expired order ${order.orderNumber}`,
              },
            });
          }
        });
        console.log(`[ExpireJob] Cancelled expired order ${order.orderNumber}`);
      }
    } catch (err) {
      console.error("[ExpireJob] Error:", err);
    }
  };

  run();
  const timer = setInterval(run, intervalMs);
  return () => clearInterval(timer);
}
