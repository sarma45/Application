import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { adminActionSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
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
    const parsed = adminActionSchema.safeParse({ action: formData.get("action") });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { action } = parsed.data;

    const status = action === "approve" ? "APPROVED" : "REJECTED";

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
