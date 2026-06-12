import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const formData = await req.formData();
    const action = formData.get("action") as string;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const status = action === "approve" ? "PUBLISHED" : "REJECTED";

    await prisma.agent.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `agent_${action}`,
        targetType: "Agent",
        targetId: id,
      },
    });

    return NextResponse.redirect(new URL("/admin", req.url));
  } catch (error) {
    console.error("admin action error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
