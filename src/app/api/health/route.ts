import { NextResponse } from "next/server";
import { assertEnv } from "@/lib/env";

export const runtime = "edge";

export async function GET() {
  try {
    assertEnv();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Env not ready";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
  return NextResponse.json({ ok: true, ts: Date.now() });
}
