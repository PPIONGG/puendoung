import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signAccessToken(payload: object) {
  return jwt.sign(payload, config.SESSION_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, config.SESSION_SECRET, { expiresIn: "7d" });
}

export function signAdminSessionToken(userId: string) {
  return jwt.sign({ userId, type: "admin_session" }, config.SESSION_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.SESSION_SECRET) as jwt.JwtPayload;
}

export function verifyAdminSessionToken(token: string): { userId: string } & jwt.JwtPayload {
  const decoded = jwt.verify(token, config.SESSION_SECRET, { clockTolerance: 60 }) as jwt.JwtPayload;
  if (decoded.type !== "admin_session") throw new Error("Invalid token type");
  if (typeof decoded.userId !== "string") throw new Error("Invalid token payload");
  return decoded as { userId: string } & jwt.JwtPayload;
}
