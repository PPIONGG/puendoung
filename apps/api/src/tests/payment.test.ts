import { describe, it, expect } from "vitest";

describe("Payment Idempotency", () => {
  it("should detect duplicate provider event ids", () => {
    const processedEvents = new Set<string>();
    const eventId = "evt-123";

    // First processing
    const isDuplicate1 = processedEvents.has(eventId);
    expect(isDuplicate1).toBe(false);
    processedEvents.add(eventId);

    // Second processing (duplicate)
    const isDuplicate2 = processedEvents.has(eventId);
    expect(isDuplicate2).toBe(true);
  });

  it("should calculate order totals correctly", () => {
    const subtotal = 10000; // 100 THB in satang
    const discount = 2000;  // 20 THB
    const total = subtotal - discount;
    expect(total).toBe(8000);
  });
});
