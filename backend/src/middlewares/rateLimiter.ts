import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// ─── IP-Based Rate Limiter Middleware ───
export function rateLimiter(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options;

  // Cleanup map periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(ip);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    const now = Date.now();

    let record = rateLimitStore.get(ip);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(ip, record);
    }

    // Filter out timestamps outside the active sliding window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const msLeft = windowMs - (now - oldestTimestamp);
      const secondsLeft = Math.ceil(msLeft / 1000);

      res.setHeader("Retry-After", secondsLeft);
      return res.status(429).json({
        success: false,
        error: `Too many AI requests. Please wait ${secondsLeft} seconds before trying again.`,
        details: null,
      });
    }

    record.timestamps.push(now);
    
    // Add custom header info
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - record.timestamps.length);

    next();
  };
}
