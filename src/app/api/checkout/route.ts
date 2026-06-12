import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const creditPackages: Record<number, number> = {
  100: 1.99,
  500: 7.99,
  1500: 19.99,
  5000: 49.99,
};

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const credits = parseInt(formData.get("credits") as string);

    if (!credits || !creditPackages[credits]) {
      return NextResponse.json({ error: "Invalid credit package" }, { status: 400 });
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id, balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: wallet.balance + credits, lifetimeEarned: wallet.lifetimeEarned + credits },
      });

      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: "PURCHASE",
          amount: credits,
          balanceAfter: w.balance,
          referenceType: "CreditPurchase",
        },
      });

      return w;
    });

    return NextResponse.redirect(
      new URL(`/wallet?success=true&credits=${credits}`, req.url)
    );
  } catch (error) {
    console.error("checkout error", error);
    return NextResponse.redirect(
      new URL("/wallet?error=checkout_failed", req.url)
    );
  }
}
