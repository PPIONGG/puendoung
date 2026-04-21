import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../plugins/auth.js";
import { signAccessToken, signRefreshToken, signAdminSessionToken, verifyToken, verifyAdminSessionToken } from "../lib/jwt.js";

describe("Auth", () => {
  it("should hash and verify password correctly", async () => {
    const password = "test1234";
    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(await verifyPassword(password, hashed)).toBe(true);
    expect(await verifyPassword("wrong", hashed)).toBe(false);
  });

  it("should sign and verify access token", () => {
    const token = signAccessToken({ userId: "user-1" });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe("user-1");
  });

  it("should sign and verify admin session token", () => {
    const token = signAdminSessionToken("admin-1");
    const decoded = verifyAdminSessionToken(token);
    expect(decoded.userId).toBe("admin-1");
    expect(decoded.type).toBe("admin_session");
  });

  it("should reject invalid admin session token type", () => {
    const token = signAccessToken({ userId: "user-1" });
    expect(() => verifyAdminSessionToken(token)).toThrow("Invalid token type");
  });
});
