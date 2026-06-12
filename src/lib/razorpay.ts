import { logger } from "./logger";

export interface RazorpayClient {
  orders: {
    create(params: { amount: number; currency: string; receipt: string }): Promise<{
      id: string;
      amount: number;
      currency: string;
    }>;
  };
}

let _client: RazorpayClient | null = null;

export function setRazorpayClient(client: RazorpayClient | null) {
  _client = client;
}

export function getRazorpayClient(): RazorpayClient {
  if (_client) return _client;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)");
  }

  const Razorpay = require("razorpay");
  _client = new Razorpay({ key_id: keyId, key_secret: keySecret }) as unknown as RazorpayClient;
  return _client;
}

export async function createRazorpayOrder(amountUsd: number): Promise<{
  id: string;
  amount: number;
  currency: string;
} | null> {
  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amountUsd * 100),
      currency: "USD",
      receipt: `receipt_${Date.now()}`,
    });
    return { id: order.id, amount: order.amount, currency: order.currency };
  } catch (err) {
    logger.error("Razorpay order creation failed", { error: err });
    return null;
  }
}

export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const crypto = await import("crypto");
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
