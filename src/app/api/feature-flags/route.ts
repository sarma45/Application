import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { listFeatureFlags, isFeatureEnabled, setFeatureOverride, clearFeatureOverride } from "@/lib/feature-flags";
import { unauthorized, forbidden, serverError } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const flags = listFeatureFlags();
  const results: Record<string, { key: string; enabled: boolean; description: string }> = {};

  for (const flag of flags) {
    results[flag.key] = {
      key: flag.key,
      enabled: await isFeatureEnabled(flag.key, {
        userId: session.user.id,
        role: session.user.role,
        plan: session.user.plan,
      }),
      description: flag.description,
    };
  }

  return NextResponse.json({ ok: true, flags: results });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden("Admin only");

  try {
    const { key, enabled } = await req.json();
    if (!key || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid payload: key and enabled required" }, { status: 400 });
    }

    await setFeatureOverride(key, enabled);
    return NextResponse.json({ ok: true, key, enabled });
  } catch (error) {
    return serverError();
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden("Admin only");

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  await clearFeatureOverride(key);
  return NextResponse.json({ ok: true, key });
}
