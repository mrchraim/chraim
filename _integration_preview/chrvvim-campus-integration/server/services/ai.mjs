// ==========================================================================
// مساعد صياغة الإعلانات/التنبيهات (الذكاء الاصطناعي) — بلا أي تبعية خارجية.
//
// • يستعمل fetch المدمج في Node للاتصال بمزوّد متوافق: Google Gemini،
//   OpenAI، Groq، OpenRouter، أو أي مزوّد متوافق مع OpenAI (custom).
// • عند غياب مفتاح API يعمل بوضع «الصياغة المحلية» (قالب منظّم) كي تبقى
//   الميزة مفيدةً دون أي مفتاح ودون أي اتصال بالشبكة.
// • لا يرسل أي بيانات شخصية، ولا ينشر شيئاً: الناتج يُملأ في النموذج فقط.
// ==========================================================================
import {
  AI_PROVIDER,
  AI_API_KEY,
  AI_MODEL,
  AI_BASE_URL,
  AI_TIMEOUT_MS,
} from '../config.mjs';

export const AI_KINDS = ['info', 'warning', 'urgent', 'event'];
export const AI_TONES = ['formal', 'friendly', 'urgent', 'neutral'];
export const AI_LANGS = ['ar', 'fr', 'en'];
export const TITLE_MAX = 180;
export const BODY_MAX = 5000;

const LANG_NAME = { ar: 'العربية', fr: 'le français', en: 'English' };

/** مزوّدات معروفة وافتراضياتها. النوع kind يحدّد شكل الطلب. */
const PROVIDERS = {
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash', kind: 'gemini' },
  openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', kind: 'openai' },
  groq: { base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', kind: 'openai' },
  openrouter: { base: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct:free', kind: 'openai' },
  custom: { base: '', model: '', kind: 'openai' },
};

/**
 * يحوّل متغيرات البيئة الخام إلى إعداد مزوّد واضح وقابل للاختبار.
 * @param {Record<string, unknown>} env
 */
export function resolveProviderConfig(env = {}) {
  const raw = String(env.AI_PROVIDER || '').trim().toLowerCase();
  const apiKey = String(env.AI_API_KEY || '').trim();
  // افتراضياً: إن وُجد مفتاح بلا مزوّد نستعمل Gemini (الأسهل بلا تكلفة).
  const provider = raw || (apiKey ? 'gemini' : 'none');
  const known = PROVIDERS[provider] || null;
  const baseUrl = (String(env.AI_BASE_URL || '').trim() || known?.base || '').replace(/\/+$/, '');
  const model = String(env.AI_MODEL || '').trim() || known?.model || '';
  const parsedTimeout = Number.parseInt(String(env.AI_TIMEOUT_MS ?? '20000'), 10);
  const timeoutMs = Math.min(60000, Math.max(3000, Number.isNaN(parsedTimeout) ? 20000 : parsedTimeout));
  const kind = known?.kind || (provider === 'gemini' ? 'gemini' : 'openai');
  const configured = provider !== 'none' && Boolean(apiKey) && Boolean(baseUrl) && Boolean(model);
  return { provider, apiKey, baseUrl, model, timeoutMs, kind, configured };
}

/** الإعداد الحالي من متغيرات بيئة الخادم. */
export function envConfig() {
  return resolveProviderConfig({
    AI_PROVIDER, AI_API_KEY, AI_MODEL, AI_BASE_URL, AI_TIMEOUT_MS,
  });
}

/** يوحّد مدخلات الطلب ويضبط القيم الافتراضية. */
export function normalizeInput(input = {}) {
  const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
  return {
    topic: String(input.topic || '').trim().slice(0, 200),
    kind: pick(input.kind, AI_KINDS, 'info'),
    tone: pick(input.tone, AI_TONES, 'formal'),
    language: pick(input.language, AI_LANGS, 'ar'),
    notes: String(input.notes || '').trim().slice(0, 600),
  };
}

const KIND_LABEL = {
  ar: { info: 'تحديث', warning: 'تنبيه', urgent: 'تنبيه عاجل', event: 'فعالية' },
  fr: { info: 'Mise à jour', warning: 'Attention', urgent: 'Urgent', event: 'Événement' },
  en: { info: 'Update', warning: 'Notice', urgent: 'Urgent', event: 'Event' },
};
const TONE_LABEL = {
  ar: { formal: 'رسمي', friendly: 'ودّي', urgent: 'عاجل', neutral: 'محايد' },
  fr: { formal: 'formel', friendly: 'convivial', urgent: 'urgent', neutral: 'neutre' },
  en: { formal: 'formal', friendly: 'friendly', urgent: 'urgent', neutral: 'neutral' },
};

/**
 * يبني رسالتَي النظام والمستخدم للمزوّد. لا يحتوي أي بيانات شخصية.
 */
export function buildMessages(input) {
  const { topic, kind, tone, language, notes } = normalizeInput(input);
  const lang = LANG_NAME[language] || LANG_NAME.ar;
  const kindLabel = KIND_LABEL[language]?.[kind] || kind;
  const toneLabel = TONE_LABEL[language]?.[tone] || tone;

  const system = [
    'أنت محرّر محتوى في بوابة طلابية مغربية مستقلة (CHRVVIM CAMPUS) لكلية العلوم القانونية والسياسية — أكادير.',
    `اكتب إعلاناً موجّهاً للطلبة، نوعه «${kindLabel}» وبنبرة ${toneLabel}، وباللغة التالية: ${lang}.`,
    'القواعد:',
    '1) عنوان واضح ومختصر (أقل من 180 حرفاً) دون علامات ترقيم زائدة.',
    '2) نص منظّم في فقرات قصيرة أو نقاط، بطول معقول (فقرة إلى ثلاث).',
    '3) لا تختلق تواريخ أو أسماء أو أرقاماً أو تفاصيل رسمية غير موجودة في الموضوع.',
    '4) إن كان الموضوع يخصّ الجداول أو الوثائق أو المواعيد الرسمية فأضف في النهاية سطراً يذكّر بالتحقق من الإعلان الرسمي للكلية.',
    '5) لا تكتب أي بيانات شخصية.',
    '6) أعد النتيجة بصيغة JSON فقط بالشكل {"title": "...", "body": "..."} دون أي شرح إضافي.',
  ].join('\n');

  const lines = [`الموضوع: ${topic}`];
  if (notes) lines.push(`ملاحظات إضافية يجب مراعاتها: ${notes}`);
  lines.push(`النوع المطلوب: ${kindLabel}`, `النبرة: ${toneLabel}`, `اللغة: ${lang}`);
  return { system, user: lines.join('\n') };
}

/** يستخرج {title, body} من نص قد يحيط به سياج markdown أو نص إضافي. */
export function parseDraft(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const candidates = [cleaned];
  const brace = cleaned.match(/\{[\s\S]*\}/);
  if (brace && brace[0] !== cleaned) candidates.push(brace[0]);
  for (const candidate of candidates) {
    try {
      const obj = JSON.parse(candidate);
      if (obj && typeof obj === 'object' && (typeof obj.title === 'string' || typeof obj.body === 'string')) {
        return { title: String(obj.title || ''), body: String(obj.body || '') };
      }
    } catch { /* جرّب المرشّح التالي */ }
  }
  return null;
}

/** يقصّ الطول ويوحّد المسافات ضمن حدود مخطط الإعلان. */
export function sanitizeDraft(draft) {
  const title = String(draft?.title || '').replace(/\s+/g, ' ').trim().slice(0, TITLE_MAX);
  const body = String(draft?.body || '').replace(/\r\n/g, '\n').trim().slice(0, BODY_MAX);
  return { title, body };
}

// --- الصياغة المحلية (بلا شبكة) -------------------------------------------
const TEMPLATES = {
  ar: {
    greeting: 'إلى طلبة كلية العلوم القانونية والسياسية — أكادير،',
    lead: 'نعلمكم بخصوص:',
    notes: 'تفاصيل إضافية',
    advice: {
      info: 'يرجى الاطّلاع والاعتماد على هذا الإعلان في تنظيم دراستكم.',
      warning: 'يرجى الانتباه واتخاذ ما يلزم تفادياً لأي التباس.',
      urgent: 'يرجى التصرّف في أقرب وقت ممكن؛ الأمر يتطلب سرعة.',
      event: 'ندعوكم للحضور والمساهمة، مع احترام التوقيت.',
    },
    closing: 'وفي حال أي تعارض، اعتمدوا دائماً الإعلان الرسمي للكلية. لأي استفسار، تواصلوا مع إدارة المؤسسة.',
  },
  fr: {
    greeting: 'Aux étudiants de la Faculté des Sciences Juridiques et Politiques — Agadir,',
    lead: 'Nous vous informons au sujet de :',
    notes: 'Détails complémentaires',
    advice: {
      info: 'Merci de prendre connaissance de cette information pour organiser vos études.',
      warning: 'Restez attentifs et prenez les dispositions nécessaires.',
      urgent: 'Merci d’agir dans les plus brefs délais ; la situation est urgente.',
      event: 'Vous êtes invités à y participer en respectant les horaires.',
    },
    closing: 'En cas de divergence, la version officielle de la faculté prévaut toujours. Pour toute question, contactez l’administration.',
  },
  en: {
    greeting: 'To the students of the Faculty of Legal and Political Sciences — Agadir,',
    lead: 'We would like to inform you about:',
    notes: 'Additional details',
    advice: {
      info: 'Please review this information to organise your studies.',
      warning: 'Please pay attention and take the necessary precautions.',
      urgent: 'Please act as soon as possible; this is time-sensitive.',
      event: 'You are invited to attend and take part, respecting the schedule.',
    },
    closing: 'In case of any discrepancy, the official faculty announcement always prevails. For any question, contact the administration.',
  },
};

/**
 * صياغة محلية منظّمة بلا أي اتصال بالشبكة (تُستعمل عند غياب المفتاح أو فشل المزوّد).
 */
export function localDraft(input) {
  const { topic, kind, language, notes } = normalizeInput(input);
  const L = KIND_LABEL[language] || KIND_LABEL.ar;
  const c = TEMPLATES[language] || TEMPLATES.ar;
  const cleanTopic = topic.replace(/\s+/g, ' ').trim() || (language === 'fr' ? 'Information' : language === 'en' ? 'Information' : 'إعلان');
  const title = `${L[kind] || L.info}: ${cleanTopic}`.slice(0, TITLE_MAX);

  const parts = [c.greeting, '', `${c.lead} ${cleanTopic}.`];
  if (notes) parts.push('', `${c.notes}: ${notes.replace(/\s+/g, ' ')}`);
  parts.push('', c.advice[kind] || c.advice.info, '', c.closing);
  const body = parts.join('\n').trim().slice(0, BODY_MAX);
  return { title, body };
}

/** يبني طلب المزوّد (URL + headers + body) حسب نوعه. مفصول ليكون قابلاً للاختبار. */
export function buildProviderRequest(cfg, messages) {
  if (cfg.kind === 'gemini') {
    const url = `${cfg.baseUrl}/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
    return {
      url,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: messages.system }] },
          contents: [{ role: 'user', parts: [{ text: messages.user }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 2048, responseMimeType: 'application/json' },
        }),
      },
      extract: (data) => (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join(''),
    };
  }
  const url = `${cfg.baseUrl}/chat/completions`;
  return {
    url,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.6,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: messages.system },
          { role: 'user', content: messages.user },
        ],
      }),
    },
    extract: (data) => data?.choices?.[0]?.message?.content || '',
  };
}

/** ينفّذ نداء المزوّد مع مهلة زمنية، ويعيد النص الخام. */
async function callProvider(cfg, messages, fetchImpl) {
  const { url, init, extract } = buildProviderRequest(cfg, messages);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    const res = await fetchImpl(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`provider HTTP ${res.status}`);
    return extract(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * يولّد مسودة إعلان. يتراجع تلقائياً إلى الصياغة المحلية عند أي فشل،
 * بحيث لا تتعطّل اللوحة أبداً.
 * @returns {Promise<{title:string, body:string, source:'ai'|'fallback', provider:string, model:string, warning?:string}>}
 */
export async function generateDraft(input, cfg = envConfig(), deps = {}) {
  const fetchImpl = deps.fetch || globalThis.fetch;
  const safeInput = normalizeInput(input);
  const fallback = (warning) => ({
    ...localDraft(safeInput),
    source: 'fallback',
    provider: 'local',
    model: '',
    ...(warning ? { warning: String(warning).slice(0, 200) } : {}),
  });

  if (!cfg.configured || typeof fetchImpl !== 'function') return fallback();
  try {
    const raw = await callProvider(cfg, buildMessages(safeInput), fetchImpl);
    const parsed = parseDraft(raw);
    if (!parsed) throw new Error('EMPTY_RESPONSE');
    const clean = sanitizeDraft(parsed);
    if (clean.title.length < 3 || clean.body.length < 3) throw new Error('SHORT_RESPONSE');
    return { ...clean, source: 'ai', provider: cfg.provider, model: cfg.model };
  } catch (error) {
    return fallback(error?.message || error);
  }
}
