import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);

  const agents = await prisma.agent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    include: {
      creator: { select: { email: true, username: true, id: true } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = agents.length > limit;
  const items = hasMore ? agents.slice(0, limit) : agents;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor });
}
