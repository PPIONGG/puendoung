import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { prisma } from "./prisma.js";
import { registerAuth } from "./plugins/auth.js";
import { registerErrorHandler } from "./plugins/error.js";
import healthRoutes from "./routes/health.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import authRoutes from "./routes/auth.js";
import adminAuthRoutes from "./routes/admin/auth.js";
import adminProductRoutes from "./routes/admin/products.js";
import adminOrderRoutes from "./routes/admin/orders.js";
import adminStatsRoutes from "./routes/admin/stats.js";
import couponRoutes from "./routes/coupons.js";
import timelineRoutes from "./routes/timeline.js";
import sitemapRoutes from "./routes/sitemap.js";
import { startExpireReservationJob } from "./jobs/expireReservations.js";

const app = fastify({ logger: true });

await app.register(helmet);
await app.register(cors, {
  origin: config.WEB_ORIGIN,
  credentials: true,
});
await app.register(cookie, { secret: config.SESSION_SECRET });
await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

registerErrorHandler(app);
registerAuth(app);

app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ error: { code: "NOT_FOUND", message: "Resource not found" } });
});

app.register(healthRoutes);
app.register(productRoutes, { prefix: "/api" });
app.register(categoryRoutes, { prefix: "/api" });
app.register(cartRoutes, { prefix: "/api" });
app.register(orderRoutes, { prefix: "/api" });
app.register(paymentRoutes, { prefix: "/api" });
app.register(authRoutes, { prefix: "/api" });
app.register(adminAuthRoutes, { prefix: "/api/admin" });
app.register(adminProductRoutes, { prefix: "/api/admin" });
app.register(adminOrderRoutes, { prefix: "/api/admin" });
app.register(adminStatsRoutes, { prefix: "/api/admin" });
app.register(couponRoutes, { prefix: "/api" });
app.register(timelineRoutes, { prefix: "/api" });
app.register(sitemapRoutes);

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

try {
  await app.listen({ port: Number(config.API_PORT), host: config.API_HOST });
  app.log.info(`Server listening on ${config.API_HOST}:${config.API_PORT}`);
  startExpireReservationJob();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
