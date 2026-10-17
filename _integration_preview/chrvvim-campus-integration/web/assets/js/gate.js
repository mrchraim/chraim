// ==========================================================================
// بوابة المتابعة (اختيارية): تظهر فقط عندما يكون gate.enabled = true في
// ملف data/site-config.json. تسمح بعدد محدّد من عمليات البحث المجانية،
// ثم تطلب متابعة حسابات إنستغرام لفتح البحث بلا حدود.
// التصميم متدرّج: إن كانت البوابة معطّلة لا يتغيّر أي شيء في تجربة المستخدم.
// ==========================================================================
import { $, store } from './util.js';
import { t } from './i18n.js';

const K_UNLOCKED = 'chrvvim.gate.unlocked';
const K_COUNT = 'chrvvim.gate.count';
const igUrl = (handle) => `https://www.instagram.com/${encodeURIComponent(handle)}/`;

let config = { enabled: false, free_searches: 1, wait_seconds: 6, accounts: [] };
let pending = null;
const done = {};

export function initGate(cfg) {
  if (cfg && typeof cfg === 'object') config = { ...config, ...cfg };
  const overlay = $('#gate');
  if (!overlay) return;
  $('#gateOk')?.addEventListener('click', () => {
    store.set(K_UNLOCKED, true);
    overlay.classList.remove('on');
    overlay.hidden = true;
    const action = pending; pending = null;
    if (typeof action === 'function') action();
  });
  $('#gateClose')?.addEventListener('click', () => {
    overlay.classList.remove('on');
    overlay.hidden = true;
    pending = null;
  });
}

/** يسمح بالعملية أو يفتح البوابة إن تجاوز المستخدم الحد المجاني. */
export function guard(action) {
  if (!config.enabled) return true;
  if (store.get(K_UNLOCKED, false)) return true;
  const used = Number(store.get(K_COUNT, 0)) || 0;
  const free = Number(config.free_searches) || 0;
  if (used < free) { store.set(K_COUNT, used + 1); return true; }
  pending = action || null;
  open();
  return false;
}

function open() {
  const overlay = $('#gate');
  const list = $('#gateList');
  if (!overlay || !list) return;
  for (const key of Object.keys(done)) delete done[key];
  const accounts = Array.isArray(config.accounts) ? config.accounts : [];
  list.innerHTML = accounts.map((a, i) => `
    <div class="acc" id="gateAcc${i}">
      <div><div class="acc-h">@${escAttr(a.handle)}</div><div class="muted">${escText(a.label || '')}</div></div>
      <a class="btn ig" target="_blank" rel="noopener noreferrer" href="${igUrl(a.handle)}" data-i="${i}">${escText(t('gate.follow'))}</a>
    </div>`).join('');
  list.querySelectorAll('a[data-i]').forEach((btn) => {
    btn.addEventListener('click', () => follow(Number(btn.dataset.i), btn));
  });
  const okBtn = $('#gateOk');
  if (okBtn) okBtn.disabled = true;
  overlay.hidden = false;
  overlay.classList.add('on');
}

function follow(index, btn) {
  if (done[index] || btn.dataset.busy) return;
  btn.dataset.busy = '1';
  let s = Number(config.wait_seconds) || 6;
  btn.textContent = `${t('gate.confirm')} ${s}`;
  const timer = setInterval(() => {
    s -= 1;
    btn.textContent = `${t('gate.confirm')} ${s}`;
    if (s <= 0) {
      clearInterval(timer);
      done[index] = true;
      btn.textContent = t('gate.done');
      $(`#gateAcc${index}`)?.classList.add('done');
      const accounts = Array.isArray(config.accounts) ? config.accounts : [];
      if (Object.keys(done).length === accounts.length) {
        const okBtn = $('#gateOk');
        if (okBtn) okBtn.disabled = false;
      }
    }
  }, 1000);
}

function escText(s) { return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escAttr(s) { return escText(s).replace(/"/g, '&quot;'); }
