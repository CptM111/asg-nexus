/**
 * ASG Nexus — End-to-End Encryption Utilities
 * Uses AES-256-GCM for symmetric encryption of chat messages.
 * Key exchange is simulated server-side; in production, use ECDH on the client.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT = "asg-nexus-e2e-salt-v1";

/** Derive a deterministic conversation key from two participant IDs */
export function deriveConversationKey(id1: string, id2: string): Buffer {
  const sorted = [id1, id2].sort().join(":");
  return scryptSync(sorted, SALT, KEY_LENGTH);
}

/** Encrypt a plaintext message */
export function encryptMessage(plaintext: string, key: Buffer): { ciphertext: string; iv: string } {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, authTag]);
  return {
    ciphertext: combined.toString("base64"),
    iv: iv.toString("hex"),
  };
}

/** Decrypt a ciphertext message */
export function decryptMessage(ciphertext: string, iv: string, key: Buffer): string {
  try {
    const combined = Buffer.from(ciphertext, "base64");
    const authTag = combined.slice(-16);
    const encrypted = combined.slice(0, -16);
    const ivBuffer = Buffer.from(iv, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return "[Decryption failed]";
  }
}

/** Hash a string for logging (one-way) */
export function hashForLog(input: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}
