/* CHRAIM — استرجاع بسيط وحتمي فوق assets/search-index.json.
   لا تبعيات، لا شبكة، لا حالة. قابل للاختبار مباشرة في Node. */

const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

const STOPWORDS = new Set([
  // عربية
  "في", "من", "على", "الى", "إلى", "عن", "مع", "هذا", "هذه", "ذلك", "التي",
  "الذي", "هل", "ما", "ماذا", "كيف", "كيفاش", "اين", "أين", "متى", "لماذا",
  "و", "او", "أو", "ثم", "كل", "بعد", "قبل", "عند", "كان", "يكون", "هو", "هي",
  "ديالي", "ديالك", "بتاعي", "بدي", "بغيت", "اريد", "أريد", "عطيني",
  // فرنسية
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "pour",
  "dans", "sur", "avec", "est", "sont", "que", "qui", "quel", "quelle",
]);

export function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(TASHKEEL, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value) {
  const raw = normalize(value).split(/[^\p{L}\p{N}]+/u);
  const out = [];
  for (let token of raw) {
    if (token.length < 2 || STOPWORDS.has(token)) continue;
    // أداة التعريف: "الفوج" -> "فوج" (فقط للكلمات الطويلة بما يكفي)
    if (token.length > 4 && token.startsWith("ال")) token = token.slice(2);
    if (token.length < 2 || STOPWORDS.has(token)) continue;
    if (!out.includes(token)) out.push(token);
  }
  return out;
}

const FIELD_WEIGHTS = { t: 4, k: 2, g: 1 };

export function scoreEntry(entry, tokens) {
  if (!tokens.length) return 0;
  const fields = {
    t: tokenize(entry.t),
    k: tokenize(entry.k),
    g: tokenize(entry.g),
  };

  let score = 0;
  for (const token of tokens) {
    let prefixHit = false;

    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      const words = fields[field];
      if (words.includes(token)) {
        score += weight;
      } else if (token.length >= 4 && words.some((w) => w.startsWith(token))) {
        prefixHit = true;
      }
    }

    // التطابق الجزئي مُرجِّح فقط (+1 لكل كلمة، لا يتضاعف بالحقول).
    // وحده لا يكفي لتجاوز العتبة، حتى لا يطابق "الجامعي" -> "الجامعية".
    if (prefixHit) score += 1;
  }
  return score;
}

/**
 * @param {Array<{t:string,u:string,k:string,g:string}>} index
 * @param {string} query
 * @param {{limit?:number, minScore?:number}} [options]
 * @returns {Array<{ref:string,title:string,group:string,score:number}>}
 */
export function retrieve(index, query, options = {}) {
  const { limit = 5, minScore = 2 } = options;
  if (!Array.isArray(index)) return [];

  const tokens = tokenize(query);
  if (!tokens.length) return [];

  return index
    .map((entry) => ({
      ref: entry.u,
      title: entry.t,
      group: entry.g,
      score: scoreEntry(entry, tokens),
    }))
    .filter((hit) => hit.ref && hit.score >= minScore)
    .sort((a, b) => b.score - a.score || String(a.ref).localeCompare(String(b.ref)))
    .slice(0, limit);
}
