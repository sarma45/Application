import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required for AES-256 encryption");
  }
  // Support hex-encoded 64-char (32 bytes) keys or raw string-derived keys
  const normalizedKey = key.length === 64 && /^[0-9a-fA-F]+$/.test(key)
    ? Buffer.from(key, "hex")
    : crypto.scryptSync(key, "aiverse-salt", KEY_LENGTH);
  return normalizedKey;
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function isEncrypted(text: string): boolean {
  return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/.test(text);
}

export function encryptField(text: string | null | undefined): string | null {
  if (!text) return null;
  if (isEncrypted(text)) return text;
  return encrypt(text);
}

export function decryptField(text: string | null | undefined): string | null {
  if (!text) return null;
  if (!isEncrypted(text)) return text;
  return decrypt(text);
}