import type { FastifyRequest } from "fastify";
import { prisma } from "../prisma.js";
import { verifyToken, verifyAdminSessionToken } from "./jwt.js";

export interface OrderAccessResult {
  isAuthorized: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isGuestLookup: boolean;
}

export async function checkOrderAccess(
  request: FastifyRequest,
  order: { customerId: string | null; customerPhone: string; customerEmail: string | null }
): Promise<OrderAccessResult> {
  // Check admin session
  const sessionCookie = request.cookies.session;
  if (sessionCookie) {
    try {
      const decoded = verifyAdminSessionToken(sessionCookie);
      const adminUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (adminUser?.role === "admin") {
        return { isAuthorized: true, isAdmin: true, isOwner: false, isGuestLookup: false };
      }
    } catch { /* ignore invalid admin session */ }
  }

  // Check customer JWT
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = verifyToken(authHeader.slice(7));
      const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { customerProfile: true } });
      if (user && order.customerId && user.customerProfile?.id === order.customerId) {
        return { isAuthorized: true, isAdmin: false, isOwner: true, isGuestLookup: false };
      }
    } catch { /* ignore invalid customer token */ }
  }

  // Guest lookup via phone or email in query/body
  const lookupPhone = (request.query as any)?.phone || (request.body as any)?.phone;
  const lookupEmail = (request.query as any)?.email || (request.body as any)?.email;

  const phoneMatch = lookupPhone && normalizePhone(lookupPhone) === normalizePhone(order.customerPhone);
  const emailMatch = lookupEmail && lookupEmail.toLowerCase() === (order.customerEmail || "").toLowerCase();

  if (phoneMatch || emailMatch) {
    return { isAuthorized: true, isAdmin: false, isOwner: false, isGuestLookup: true };
  }

  return { isAuthorized: false, isAdmin: false, isOwner: false, isGuestLookup: false };
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0/, "66");
}
