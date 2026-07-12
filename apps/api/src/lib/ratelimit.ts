/**
 * Upstash Redis rate limiting middleware.
 */
import type { Context, Next } from "hono";

let ratelimiter: any = null;

async function init() {
  if (ratelimiter !== null) return;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const tokenKey = "UPSTASH_REDIS_REST_TOKEN";
  const token = process.env[tokenKey];

  if (!url || !token) {
    console.debug("[RateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled");
    ratelimiter = false;
    return;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "graha",
    });
    console.debug("[RateLimit] Upstash Redis initialized");
  } catch (err) {
    console.debug("[RateLimit] Failed to initialize:", err);
    ratelimiter = false;
  }
}

function getIdentifier(c: Context): string {
  const h = c.req.header.bind(c.req);
  const forwarded = h("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const secret = h("x-graha-secret");
  if (secret) return `secret:${secret}`;
  return h("cf-connecting-ip") || "unknown";
}

export async function rateLimit(c: Context, next: Next): Promise<Response | void> {
  if (c.req.path === "/health") return next();

  await init();
  if (!ratelimiter) return next();

  const identifier = getIdentifier(c);

  try {
    const { success, remaining, reset } = await ratelimiter.limit(identifier);

    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(reset));

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json(
        { success: false, error: "Too many requests. Please try again.", retryAfter },
        429
      );
    }

    await next();
  } catch (err) {
    console.debug("[RateLimit] Error:", err);
    await next();
  }
}
