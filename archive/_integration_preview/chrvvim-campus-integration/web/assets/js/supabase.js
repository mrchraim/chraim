// ==========================================================================
// عميل Supabase للقراءة فقط (PostgREST عبر HTTPS).
// لا كتابة إطلاقاً: كل الدوال هنا تطلق طلبات GET فقط.
// إن غاب الإعداد أو فشل الاتصال تعود الدوال بقيم فارغة بهدوء،
// فتبقى الواجهة تعمل من الملفات الثابتة (data/*.json).
// ==========================================================================

const CONFIG_PATH = 'data/live-config.json';
let _configPromise = null;
let _config = null;

/** يحمّل إعدادات البيانات الحيّة مرّة واحدة ويخزّنها. */
export async function loadLiveConfig() {
  if (_config) return _config;
  if (!_configPromise) {
    _configPromise = fetch(CONFIG_PATH, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data) => {
        _config = data || null;
        return _config;
      });
  }
  return _configPromise;
}

export async function supabaseConfig() {
  const cfg = await loadLiveConfig();
  const sb = cfg?.supabase;
  if (!sb || !sb.enabled || !sb.url || !sb.key) return null;
  return sb;
}

export async function isLiveEnabled() {
  return Boolean(await supabaseConfig());
}

/**
 * قراءة صفوف من جدول (GET فقط).
 * @param {string} table اسم الجدول المنطقي (يُترجم عبر config.supabase.tables)
 * @param {{select?:string, order?:string, limit?:number, filters?:Record<string,string>}} [opts]
 * @returns {Promise<Array>} مصفوفة الصفوف، أو [] عند أي فشل
 */
export async function liveSelect(table, opts = {}) {
  const cfg = await supabaseConfig();
  if (!cfg) return [];
  const physical = cfg.tables?.[table] || table;
  const url = new URL(`/rest/v1/${encodeURIComponent(physical)}`, cfg.url);
  url.searchParams.set('select', opts.select || '*');
  if (opts.order) url.searchParams.set('order', opts.order);
  if (opts.limit) url.searchParams.set('limit', String(opts.limit));
  for (const [k, v] of Object.entries(opts.filters || {})) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
