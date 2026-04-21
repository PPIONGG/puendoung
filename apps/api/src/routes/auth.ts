import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { hashPassword, verifyPassword } from "../plugins/auth.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../lib/jwt.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
  phone: z.string().min(9).max(20),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function (app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(409).send({ error: { code: "EMAIL_EXISTS", message: "Email already registered" } });
    }

    const hashed = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
        role: "customer",
        name: body.name,
        customerProfile: {
          create: { phone: body.phone },
        },
      },
      include: { customerProfile: true },
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, type: "refresh" });
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
    });

    return reply.status(201).send({ data: { user: { id: user.id, email: user.email, name: user.name }, accessToken, refreshToken } });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || user.role !== "customer") {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }
    const valid = await verifyPassword(body.password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, type: "refresh" });
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
    });

    return { data: { user: { id: user.id, email: user.email, name: user.name }, accessToken, refreshToken } };
  });

  app.post("/auth/refresh", async (request, reply) => {
    const body = z.object({ refreshToken: z.string() }).parse(request.body);
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: body.refreshToken }, include: { user: true } });
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return reply.status(401).send({ error: { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" } });
    }
    try {
      verifyToken(body.refreshToken);
    } catch {
      return reply.status(401).send({ error: { code: "INVALID_TOKEN", message: "Invalid token" } });
    }

    const accessToken = signAccessToken({ userId: tokenRecord.userId, role: tokenRecord.user.role });
    return { data: { accessToken } };
  });

  app.get("/auth/me", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { customerProfile: { include: { addresses: true } } },
      });
      if (!user) {
        return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "User not found" } });
      }
      return { data: { user: { id: user.id, email: user.email, name: user.name, phone: user.customerProfile?.phone, addresses: user.customerProfile?.addresses } } };
    } catch {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
    }
  });

  app.post("/auth/logout", async (request, reply) => {
    const body = z.object({ refreshToken: z.string().optional() }).parse(request.body);
    if (body.refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: body.refreshToken } });
    }
    return { data: { success: true } };
  });
}
