import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });

  if (!wallet) return notFound("Wallet not found");

  return NextResponse.json({ ok: true, wallet });
}
