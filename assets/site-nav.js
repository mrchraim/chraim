// CHRAIM — shared top nav (injected). CSP-safe, no inline eval.
(function () {
  /* DEPRECATED (2026-11-13): this icon bar is superseded by the CHRAIM v2 unified chrome (assets/v2.js) and by the portal dashboard shell. Global no-op. */
  return;

  if (window.__chraimSiteNav) return;
  window.__chraimSiteNav = true;
  if (document.querySelector('.appbar, #siteNav')) return;
  const nav = document.createElement('nav');
  nav.id = 'siteNav';
  nav.style.cssText = 'position:sticky;top:0;z-index:80;background:rgba(11,18,32,.92);border-bottom:1px solid rgba(212,175,55,.3);padding:8px 12px;display:flex;gap:8px;overflow-x:auto;backdrop-filter:blur(8px)';
  const links = [
    ['/', '🏠'],
    ['/levels/', '🎓'],
    ['/lessons/', '📚'],
    ['/directory.html', '🗂️'],
    ['/resources.html', '🔗'],
    ['/student.html', '👤']
  ];
  links.forEach(([href, icon]) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = icon;
    a.style.cssText = 'color:#F3E5AB;text-decoration:none;font-size:1.1rem;padding:4px 8px;border-radius:8px';
    nav.appendChild(a);
  });
  document.body.insertBefore(nav, document.body.firstChild);
})();