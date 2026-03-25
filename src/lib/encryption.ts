// src/lib/encryption.ts
import crypto from "crypto";

const IV_LENGTH = 16; // AES block size
const HKDF_INFO = "stablepay-wallet-encryption-v1";

function getKey(): Buffer {
  const secret = process.env.WALLET_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("WALLET_ENCRYPTION_SECRET is not set");
  }
  // Use HKDF (proper KDF) instead of raw SHA-256 to derive the AES key.
  // HKDF adds domain separation and is designed for key derivation.
  return Buffer.from(
    crypto.hkdfSync("sha256", secret, "", HKDF_INFO, 32)
  );
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Return iv:tag:ciphertext as hex strings
  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return (
    decipher.update(encrypted).toString("utf8") +
    decipher.final("utf8")
  );
}
