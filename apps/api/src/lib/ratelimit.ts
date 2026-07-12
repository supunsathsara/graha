/**
 * Upstash Redis rate limiting middleware.
 */
import type { Context, Next } from "hono";

let defaultLimiter: any = null;
let chartLimiter: any = null;
let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.debug(
      "[RateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled",
    );
    return;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = Redis.fromEnv();

    // General API: 10 requests per minute
    defaultLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "@graha:ratelimit:default",
      timeout: 3000,
    });

    // Chart computation: 20 requests per minute (heavier endpoint)
    chartLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "@graha:ratelimit:chart",
      timeout: 3000,
    });

    console.debug("[RateLimit] Upstash Redis initialized");
  } catch (err) {
    console.debug("[RateLimit] Failed to initialize:", err);
  }
}

function getIdentifier(c: Context): string {
  const h = c.req.header.bind(c.req);
  const forwarded = h("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const secret = h("x-graha-secret");
  if (secret) return `secret:${secret}`;
  return h("cf-connecting-ip") || h("x-real-ip") || "unknown";
}

function getLimiter(path: string) {
  if (path.startsWith("/api/chart/compute")) return chartLimiter;
  return defaultLimiter;
}

export async function rateLimit(
  c: Context,
  next: Next,
): Promise<Response | void> {
  if (c.req.path === "/health") return next();

  await init();

  const limiter = getLimiter(c.req.path);
  if (!limiter) return next();

  const identifier = getIdentifier(c);

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);

    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(reset));

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json(
        {
          success: false,
          error: "Too many requests. Please try again.",
          retryAfter,
        },
        429,
      );
    }

    await next();
  } catch (err) {
    console.debug("[RateLimit] Error:", err);
    await next();
  }
}
