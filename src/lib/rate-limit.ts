// Simple in-process sliding-window rate limiter.
// Works within a warm Vercel function instance. Multiple cold instances each
// get their own window — not globally shared, but still blocks burst abuse.

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 15; // requests per IP per minute per endpoint

export function rateLimit(ip: string, endpoint: string): { ok: boolean; remaining: number } {
  const key = `${ip}::${endpoint}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_PER_WINDOW) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: MAX_PER_WINDOW - entry.count };
}

export function getIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
