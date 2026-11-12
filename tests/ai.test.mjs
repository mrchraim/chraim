import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { onRequestPost } from "../functions/api/ai.js";

const INDEX = [
  { t: "دليل المؤسسات التفصيلي", u: "etablissements/index.html", k: "مؤسسات كليات مدارس", g: "دليل" },
  { t: "منصة الامتحانات", u: "platform/index.html", k: "امتحانات فروض ملخصات", g: "منصة" },
];

const req = (body) =>
  new Request("https://chraim.pages.dev/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.7" },
    body: JSON.stringify(body),
  });

const env = (over = {}) => ({
  OMNIROUTE_KEY: "test-key",
  OMNIROUTE_URL: "http://omniroute.test",
  SEARCH_INDEX: INDEX,
  ALLOW_UNLIMITED: "1",
  ...over,
});

const okUpstream = (content = "الجواب [دليل المؤسسات](etablissements/index.html)") =>
  new Response(JSON.stringify({ model: "x", choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "x-omniroute-decision": "auto:provider-a:412ms" },
  });

let fetchSpy;
beforeEach(() => {
  fetchSpy = vi.fn(async () => okUpstream());
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/ai", () => {
  it("يرفض التشغيل بلا مفتاح", async () => {
    const res = await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: env({ OMNIROUTE_KEY: "" }) });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("not_configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("يرفض السؤال القصير قبل الشبكة", async () => {
    const res = await onRequestPost({ request: req({ q: "؟" }), env: env() });
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("يرفض قبل استدعاء النموذج حين لا يوجد مصدر", async () => {
    const res = await onRequestPost({ request: req({ q: "منحة الأكل الجامعي" }), env: env() });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.refusal).toBe("no_source");
    expect(body.answer).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled(); // لا تكلفة، لا اختلاق
  });

  it("يستدعي OmniRoute بـmodel=auto ويمرّر المفتاح للخارج فقط", async () => {
    const res = await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: env() });
    const body = await res.json();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://omniroute.test/v1/chat/completions");
    expect(init.headers.authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body).model).toBe("auto");
    expect(JSON.parse(init.body).temperature).toBe(0);

    expect(body.answer).toContain("دليل المؤسسات");
    expect(body.sources[0]).toEqual({ ref: "etablissements/index.html", title: "دليل المؤسسات التفصيلي" });
    expect(body.routing).toBe("auto:provider-a:412ms");
    expect(JSON.stringify(body)).not.toContain("test-key");
  });

  it("يحوّل صمت النموذج إلى رفض صريح", async () => {
    fetchSpy.mockResolvedValueOnce(okUpstream("لا أعرف"));
    const res = await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: env() });
    const body = await res.json();
    expect(body.answer).toBeNull();
    expect(body.refusal).toBe("model_refused");
  });

  it("يعيد 502 لا 200 عند فشل البوابة", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    const res = await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: env() });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("upstream_error");
  });

  it("يعيد 504 عند انقطاع الاتصال", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("aborted"));
    const res = await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: env() });
    expect(res.status).toBe(504);
  });

  it("يفشل مغلقاً حين لا يوجد مخزن تحديد المعدّل", async () => {
    const res = await onRequestPost({
      request: req({ q: "دليل المؤسسات" }),
      env: env({ ALLOW_UNLIMITED: undefined }),
    });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe("rate_limit_unavailable");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("يحدّ الطلبات لكل IP في نفس الساعة", async () => {
    const store = new Map();
    const RATE_KV = {
      get: async (k) => store.get(k) ?? null,
      put: async (k, v) => void store.set(k, v),
    };
    const tight = env({ ALLOW_UNLIMITED: undefined, RATE_KV, AI_RATE_LIMIT_PER_HOUR: "2" });

    expect((await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: tight })).status).toBe(200);
    expect((await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: tight })).status).toBe(200);

    const blocked = await onRequestPost({ request: req({ q: "دليل المؤسسات" }), env: tight });
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error).toBe("rate_limited");
    expect(blocked.headers.get("retry-after")).toMatch(/^\d+$/);
  });
});
