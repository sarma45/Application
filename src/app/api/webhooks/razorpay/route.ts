import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyRazorpayWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const razorpaySignature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();

  if (!razorpaySignature || !verifyRazorpayWebhookSignature(rawBody, razorpaySignature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event = body.event;
  if (event !== "payment.captured" && event !== "order.paid") {
    return NextResponse.json({ received: true });
  }

  const paymentEntity = body.payload?.payment?.entity;
  const orderEntity = body.payload?.order?.entity;
  const paymentId = paymentEntity?.id;
  const orderId = orderEntity?.id || paymentEntity?.order_id;

  if (!paymentId || !orderId) {
    logger.warn("Razorpay webhook missing payment/order data", { event, body });
    return NextResponse.json({ received: true });
  }

  try {
    const existing = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentId },
    });

    if (existing) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    const pendingPayment = await prisma.payment.findFirst({
      where: { providerPaymentId: orderId, status: "PENDING" },
    });

    if (pendingPayment) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: { status: "COMPLETED", providerPaymentId: paymentId },
        });

        const creditsToGrant = pendingPayment.creditsGranted || 0;
        if (creditsToGrant > 0) {
          await tx.wallet.update({
            where: { userId: pendingPayment.userId },
            data: {
              balance: { increment: creditsToGrant },
              lifetimeEarned: { increment: creditsToGrant },
            },
          });

          await tx.transaction.create({
            data: {
              userId: pendingPayment.userId,
              type: "PURCHASE",
              amount: creditsToGrant,
              balanceAfter: 0,
              referenceType: "payment",
              referenceId: pendingPayment.id,
              description: `Razorpay purchase: ${creditsToGrant} credits`,
            },
          });
        }
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Razorpay webhook error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
