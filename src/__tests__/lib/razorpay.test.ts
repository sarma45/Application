import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  setRazorpayClient,
} from "@/lib/razorpay";

describe("Razorpay", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
    setRazorpayClient(null);
  });

  it("creates an order successfully with injected client", async () => {
    const mockOrderCreate = vi.fn().mockResolvedValue({
      id: "order_test_123",
      amount: 1999,
      currency: "USD",
    });

    setRazorpayClient({
      orders: { create: mockOrderCreate },
    });

    const order = await createRazorpayOrder(19.99);
    expect(order).not.toBeNull();
    expect(order!.id).toBe("order_test_123");
    expect(order!.amount).toBe(1999);
    expect(order!.currency).toBe("USD");
    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1999, currency: "USD" })
    );
  });

  it("handles order creation failure gracefully", async () => {
    const mockOrderCreate = vi.fn().mockRejectedValue(new Error("API error"));

    setRazorpayClient({
      orders: { create: mockOrderCreate },
    });

    const order = await createRazorpayOrder(19.99);
    expect(order).toBeNull();
  });

  it("verifies payment signature correctly", async () => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret";
    const crypto = await import("crypto");
    const expectedSig = crypto
      .createHmac("sha256", "test_secret")
      .update("order_1|pay_1")
      .digest("hex");

    const result = await verifyRazorpayPayment("order_1", "pay_1", expectedSig);
    expect(result).toBe(true);
  });

  it("rejects invalid payment signature", async () => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret";
    const result = await verifyRazorpayPayment("order_1", "pay_1", "invalid_sig");
    expect(result).toBe(false);
  });

  it("returns false when secret key is not set", async () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    const result = await verifyRazorpayPayment("order_1", "pay_1", "sig");
    expect(result).toBe(false);
  });
});
