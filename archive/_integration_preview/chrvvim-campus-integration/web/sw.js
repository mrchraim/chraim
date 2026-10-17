// ==========================================================================
// Service Worker — عمل دون اتصال وتخزين مؤقت ذكي.
// استراتيجية: الملفات الثابتة cache-first، وواجهات API network-first.
// ==========================================================================
const CACHE = 'chrvvim-v9';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/css/institutions.css',
  './assets/img/founder.jpeg',
  './assets/js/util.js',
  './assets/js/i18n.js',
  './assets/js/store.js',
  './assets/js/data.js',
  './assets/js/views.js',
  './assets/js/gate.js',
  './assets/js/subjects-engine.js',
  './assets/js/subjects-view.js',
  './assets/js/legal-engine.js',
  './assets/js/legal-view.js',
  './assets/js/supabase.js',
  './assets/js/institutions.js',
  './assets/js/institutions-view.js',
  './assets/js/digital-library.js',
  './assets/js/assistant.js',
  './assets/js/app.js',
  './data/site-config.json',
  './data/academic-guide.json',
  './data/academic-documents.json',
  './data/founder-profile.json',
  './data/announcements.json',
  './data/subjects-correspondence.json',
  './data/legal-library.json',
  './data/institutions.json',
  './data/live-config.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // واجهات API: الشبكة أولاً ثم الذاكرة.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
        return res;
      }).catch(() => caches.match(request)),
    );
    return;
  }

  // التنقل: الشبكة ثم الصفحة المخزنة ثم الصفحة الرئيسية.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match('./index.html'))),
    );
    return;
  }

  // بقية الملفات: stale-while-revalidate — نعرض المخزّن فوراً ونحدّثه في الخلفية.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
