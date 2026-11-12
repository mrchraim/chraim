/* CHRAIM — سياسة المساعد الذكي.
   كل الحدود تُقرأ من البيئة، فلا رقم مثبّت في الكود.
   نقاط التنفيذ اثنتان ومقصودتان:
     - عدد الطلبات لكل IP: هنا، عبر Cloudflare KV.
     - سقف الدولار اليومي: في OmniRoute نفسه (حصة المفتاح بالدولار).
   لا ندّعي قياس الدولار هنا؛ OmniRoute هو مصدر الحقيقة للتكلفة. */

const DEFAULTS = {
  rateLimitPerHour: 20,
  dailyUsdCap: 5,
  allowedLangs: ["ar"],
  minScore: 2,
  maxQueryLength: 500,
};

function intFrom(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function listFrom(value, fallback) {
  if (!value) return fallback;
  const parts = String(value)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parts.length ? parts : fallback;
}

export function readPolicy(env = {}) {
  return {
    rateLimitPerHour: intFrom(env.AI_RATE_LIMIT_PER_HOUR, DEFAULTS.rateLimitPerHour),
    dailyUsdCap: intFrom(env.AI_DAILY_USD_CAP, DEFAULTS.dailyUsdCap),
    allowedLangs: listFrom(env.AI_ALLOWED_LANGS, DEFAULTS.allowedLangs),
    minScore: intFrom(env.AI_MIN_SCORE, DEFAULTS.minScore),
    maxQueryLength: intFrom(env.AI_MAX_QUERY_LENGTH, DEFAULTS.maxQueryLength),
  };
}

export async function hashIp(ip, salt = "") {
  const data = new TextEncoder().encode(`${salt}:${ip || "unknown"}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hourBucket(now = new Date()) {
  return now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
}

/**
 * يعيد { ok:true, remaining } أو { ok:false, reason, retryAfter }.
 * عند غياب KV نفشل مغلقين (503) لأن ترك الباب مفتوحاً أسوأ من التعطّل.
 */
export async function checkRateLimit(request, env, policy, now = new Date()) {
  if (!env?.RATE_KV) {
    if (env?.ALLOW_UNLIMITED === "1") return { ok: true, remaining: -1, unlimited: true };
    return { ok: false, reason: "rate_limit_unavailable", retryAfter: 60 };
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const key = `rl:${await hashIp(ip, env.AI_RATE_SALT || "")}:${hourBucket(now)}`;
  const current = Number.parseInt((await env.RATE_KV.get(key)) ?? "0", 10) || 0;

  if (current >= policy.rateLimitPerHour) {
    const retryAfter = 3600 - (now.getUTCMinutes() * 60 + now.getUTCSeconds());
    return { ok: false, reason: "rate_limited", retryAfter };
  }

  await env.RATE_KV.put(key, String(current + 1), { expirationTtl: 3900 });
  return { ok: true, remaining: policy.rateLimitPerHour - current - 1 };
}
