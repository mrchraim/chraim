// CHRAIM — shared footer (injected). CSP-safe.
(function () {
  if (window.__chraimSiteFooter) return;
  window.__chraimSiteFooter = true;
  if (document.getElementById('chraimSiteFooter')) return;
  var css = '#chraimSiteFooter{margin-top:40px;padding:20px 16px;border-top:1px solid rgba(212,175,55,.2);background:rgba(11,18,32,.6);color:#9aa3b5;font-size:12px;text-align:center}' +
    '#chraimSiteFooter a{color:#D4AF37;text-decoration:none;margin:0 6px}' +
    '#chraimSiteFooter a:hover{text-decoration:underline}';
  var style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  var footer = document.createElement('footer');
  footer.id = 'chraimSiteFooter';
  footer.innerHTML = '<div>صُنع بـ <strong style="color:#D4AF37">CHRAIM</strong> · Mohamed Chraim (@chrvvim)</div>' +
    '<div style="margin-top:6px"><a href="https://github.com/mrchraim" target="_blank" rel="noopener">GitHub</a> · ' +
    '<a href="mailto:cheraimmohamed20@gmail.com">Email</a> · ' +
    '<a href="/privacy.html">الخصوصية</a> · <a href="/terms.html">الشروط</a></div>';
  (document.body || document.documentElement).appendChild(footer);
})();