import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPayment } from "@/lib/razorpay";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { orderId, paymentId, signature } = body;

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const valid = await verifyRazorpayPayment(orderId, paymentId, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentId },
    });

    if (payment) {
      return NextResponse.json({ ok: true, message: "Already processed" });
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
              lifetimeSpent: { increment: creditsToGrant },
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Razorpay webhook error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
