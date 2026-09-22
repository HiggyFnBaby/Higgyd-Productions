import { prisma } from "@/lib/prisma";

// Fixed-window IP rate limiting for public endpoints — see
// ../../docs/owner-decisions-needed.md #7 and ../../docs/threat-model.md.
// DB-backed (RateLimitBucket) rather than an in-memory counter, because a
// serverless deployment (Vercel) runs multiple function instances with no
// shared memory — an in-memory counter would silently under-count and give
// a false sense of protection.
export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// Generous by design — this protects a low-traffic pre-launch lead-magnet
// form from bot floods, not a high-traffic public API. A real, hesitant
// buyer re-submitting the form a couple of times should never be blocked.
export const AUDIT_FORM_RATE_LIMIT: RateLimitConfig = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
};

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

// `key` should already be scoped per-endpoint (e.g. "audit:<ip>") — this
// function has no opinion on what's being limited, only how.
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const windowStart = new Date(Math.floor(Date.now() / config.windowMs) * config.windowMs);

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  return { allowed: bucket.count <= config.max, count: bucket.count, limit: config.max };
}

// Best-effort client IP extraction. Trusts the first hop's
// X-Forwarded-For entry, which is standard for platforms like Vercel that
// sit in front of the app — not spoofable by the request's own client in
// that setup, though a self-hosted deployment behind a different proxy
// chain should verify this assumption before relying on it.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
