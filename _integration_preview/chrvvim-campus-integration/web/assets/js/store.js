// ==========================================================================
// الحالة المحلية للمستخدم (تُخزَّن في localStorage فقط، ولا تُرسل للخادم).
// ==========================================================================
import { store } from './util.js';

const KEYS = {
  theme: 'chrvvim.theme',
  lang: 'chrvvim.lang',
  myGroups: 'chrvvim.myGroups',
  favorites: 'chrvvim.favorites',
};

function detectTheme() {
  const saved = store.get(KEYS.theme);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function detectLang() {
  const saved = store.get(KEYS.lang);
  if (['ar', 'fr', 'en'].includes(saved)) return saved;
  const nav = (navigator.language || 'ar').slice(0, 2).toLowerCase();
  return ['ar', 'fr', 'en'].includes(nav) ? nav : 'ar';
}

export const state = {
  theme: detectTheme(),
  lang: detectLang(),
  myGroups: store.get(KEYS.myGroups, {}) || {},
  favorites: new Set(store.get(KEYS.favorites, []) || []),
  view: 'grid', // عرض الجدول: grid | list
  source: 'static',
  data: null,
};

export function setTheme(theme) {
  state.theme = theme;
  store.set(KEYS.theme, theme);
  applyTheme();
}

export function applyTheme() {
  document.documentElement.classList.toggle('dark', state.theme === 'dark');
}

export function setLang(lang) {
  state.lang = lang;
  store.set(KEYS.lang, lang);
}

export function setMyGroup(semester, trackId, group) {
  const key = `${semester}:${trackId}`;
  if (group) state.myGroups[key] = group;
  else delete state.myGroups[key];
  store.set(KEYS.myGroups, state.myGroups);
}

export function getMyGroup(semester, trackId) {
  return state.myGroups[`${semester}:${trackId}`] || '';
}

export function myGroupEntries() {
  return Object.entries(state.myGroups).map(([key, group]) => {
    const [semester, trackId] = key.split(':');
    return { semester, trackId, group };
  });
}

export function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  store.set(KEYS.favorites, [...state.favorites]);
  return state.favorites.has(id);
}

export function isFavorite(id) {
  return state.favorites.has(id);
}
