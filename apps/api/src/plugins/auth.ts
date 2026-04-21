import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { verifyToken, verifyAdminSessionToken } from "../lib/jwt.js";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function registerAuth(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionToken = request.cookies.session;
    if (!sessionToken) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }
    let decoded: { userId: string };
    try {
      decoded = verifyAdminSessionToken(sessionToken);
    } catch {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid or expired session" } });
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user || user.role !== "admin") {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }
    (request as any).user = user;
  });

  app.decorate("authenticateCustomer", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "User not found" } });
      }
      (request as any).customer = user;
    } catch {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
    }
  });
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateCustomer: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
