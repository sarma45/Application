import { ok } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function POST() {
  const response = ok({ message: "Signed out successfully" });
  response.headers.set(
    "Set-Cookie",
    "next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict"
  );
  return response;
}
