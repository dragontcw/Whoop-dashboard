import crypto from "crypto";

// Encrypts/decrypts small JSON payloads (the Whoop token set) so we can safely
// store them in an httpOnly browser cookie instead of standing up a database.
// This is fine for a single-user personal dashboard.

function getKey() {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error(
      "COOKIE_SECRET is not set. Add it to your .env.local / Vercel project settings."
    );
  }
  // Derive a stable 32-byte key from whatever string the user provides.
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptJSON(data) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack iv + authTag + ciphertext into one base64url string.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decryptJSON(token) {
  try {
    const key = getKey();
    const buf = Buffer.from(token, "base64url");
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch (err) {
    return null;
  }
}
