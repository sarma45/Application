import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { uploadFile } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const PLAN_LIMITS: Record<string, number> = {
  FREE: 10 * 1024 * 1024,
  PRO: 50 * 1024 * 1024,
  ENTERPRISE: 100 * 1024 * 1024,
};

const ALLOWED_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true;
  return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte));
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "api");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Supported: CSV, XLSX, PDF, DOCX, TXT", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    const plan = user?.plan || "FREE";
    const maxFileSize = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

    if (file.size > maxFileSize) {
      const maxMB = Math.floor(maxFileSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File too large. ${plan} plan limit is ${maxMB}MB.`, code: "PAYLOAD_TOO_LARGE" },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type", code: "BAD_REQUEST" }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name);
    const key = `uploads/${session.user.id}/${Date.now()}-${safeName}`;

    const url = await uploadFile(key, buffer, file.type);

    await prisma.file.create({
      data: {
        userId: session.user.id,
        fileName: safeName,
        fileType: file.type,
        fileSize: file.size,
        storageKey: key,
        publicUrl: url,
      },
    });

    logger.info("File uploaded", {
      userId: session.user.id,
      fileName: safeName,
      fileType: file.type,
      fileSize: file.size,
      key,
    });

    return NextResponse.json({
      ok: true,
      fileName: safeName,
      fileType: file.type,
      fileSize: file.size,
      url,
    });
  } catch (error) {
    logger.error("File upload error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}