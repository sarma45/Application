import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { uploadFile } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Supported: CSV, XLSX, PDF, DOCX, TXT" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const key = `uploads/${session.user.id}/${Date.now()}-${file.name}`;

    const url = await uploadFile(key, buffer, file.type);

    await prisma.file.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageKey: key,
        publicUrl: url,
      },
    });

    logger.info("File uploaded", {
      userId: session.user.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      key,
    });

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      url,
    });
  } catch (error) {
    logger.error("File upload error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
