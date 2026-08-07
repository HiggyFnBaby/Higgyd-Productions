import crypto from "node:crypto";

// Delivery tokens are HMAC-signed AND checked against a server-side
// Delivery row with its own expiresAt — either check failing denies access.
// See ../../docs/threat-model.md #5-6 for why both layers matter: a leaked
// token still expires server-side without needing to rotate the secret, and
// a forged token fails signature verification regardless of DB state.

function secret() {
  const value = process.env.DELIVERY_SECRET;
  if (!value) throw new Error("DELIVERY_SECRET is not set — see .env.example.");
  return value;
}

export function generateDownloadToken(projectId: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${projectId}.${nonce}`;
  const signature = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyDownloadToken(token: string, expectedProjectId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [projectId, nonce, signature] = parts;
  if (projectId !== expectedProjectId) return false;

  const payload = `${projectId}.${nonce}`;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const DELIVERY_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
