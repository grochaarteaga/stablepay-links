import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

describe("encryption", () => {
  describe("encrypt / decrypt roundtrip", () => {
    it("decrypts back to the original private key", () => {
      const privateKey =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const ciphertext = encrypt(privateKey);
      expect(decrypt(ciphertext)).toBe(privateKey);
    });

    it("produces different ciphertext each call (random IV)", () => {
      const key = "same-input";
      const c1 = encrypt(key);
      const c2 = encrypt(key);
      expect(c1).not.toBe(c2);
      // Both still decrypt correctly
      expect(decrypt(c1)).toBe(key);
      expect(decrypt(c2)).toBe(key);
    });

    it("ciphertext format is iv:tag:data (three hex segments)", () => {
      const ciphertext = encrypt("test");
      const parts = ciphertext.split(":");
      expect(parts).toHaveLength(3);
      // Each part is valid hex
      parts.forEach((p) => expect(p).toMatch(/^[0-9a-f]+$/));
    });
  });

  describe("decrypt error handling", () => {
    it("throws on malformed ciphertext (wrong number of segments)", () => {
      expect(() => decrypt("onlyone")).toThrow("Invalid ciphertext format");
      expect(() => decrypt("two:parts")).toThrow("Invalid ciphertext format");
    });

    it("throws when auth tag is tampered (GCM integrity check)", () => {
      const ciphertext = encrypt("sensitive");
      const [iv, tag, data] = ciphertext.split(":");
      // Flip first byte of tag
      const badTag = (parseInt(tag.slice(0, 2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0") + tag.slice(2);
      expect(() => decrypt(`${iv}:${badTag}:${data}`)).toThrow();
    });

    it("throws when ciphertext is tampered", () => {
      const ciphertext = encrypt("sensitive");
      const [iv, tag, data] = ciphertext.split(":");
      const badData = (parseInt(data.slice(0, 2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0") + data.slice(2);
      expect(() => decrypt(`${iv}:${tag}:${badData}`)).toThrow();
    });
  });

  describe("key derivation", () => {
    it("different secrets produce different ciphertexts that cannot cross-decrypt", () => {
      const originalSecret = process.env.WALLET_ENCRYPTION_SECRET;
      const ciphertext = encrypt("payload");

      // Temporarily change the secret
      process.env.WALLET_ENCRYPTION_SECRET = "completely-different-secret!!!!!";
      expect(() => decrypt(ciphertext)).toThrow();

      // Restore
      process.env.WALLET_ENCRYPTION_SECRET = originalSecret;
    });
  });
});
