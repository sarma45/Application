import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { ok, unauthorized } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return unauthorized();
  }
  return ok({ session });
}
