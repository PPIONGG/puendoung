import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { hashPassword, verifyPassword } from "../../plugins/auth.js";
import { signAdminSessionToken } from "../../lib/jwt.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function (app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || user.role !== "admin") {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }
    const valid = await verifyPassword(body.password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }
    const sessionToken = signAdminSessionToken(user.id);
    reply.setCookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return { data: { user: { id: user.id, email: user.email, name: user.name } } };
  });

  app.post("/auth/logout", async (request, reply) => {
    reply.clearCookie("session", { path: "/" });
    return { data: { success: true } };
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    const user = (request as any).user;
    return { data: { user: { id: user.id, email: user.email, name: user.name } } };
  });
}
