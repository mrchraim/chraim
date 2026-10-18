(function(){
  var CONFIG = window.CHRAIM_CONFIG || { CONSENT_KEY: 'chraim_consent_v2', DEFAULT_CONSENT: { analytics: false, ads: false, timestamp: 0 }, GA4_ID: 'G-XXXXXXXXXX', ADS_CONVERSION_ID: 'AW-XXXXXXXXX' };
  var KEY = CONFIG.CONSENT_KEY;
  function getConsent(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return CONFIG.DEFAULT_CONSENT;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return CONFIG.DEFAULT_CONSENT;
      return obj;
    } catch (e) {
      return CONFIG.DEFAULT_CONSENT;
    }
  }
  function setConsent(obj){
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {}
  }
  function injectGtag(){
    var g = CONFIG.GA4_ID;
    if (!g || g === 'G-XXXXXXXXXX') return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + g;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    var c = getConsent();
    gtag('consent', 'default', { 'ad_storage': c.ads ? 'granted' : 'denied', 'analytics_storage': c.analytics ? 'granted' : 'denied', 'ad_user_data': c.ads ? 'granted' : 'denied', 'ad_personalization': c.ads ? 'granted' : 'denied' });
    gtag('config', g);
    if (CONFIG.ADS_CONVERSION_ID && CONFIG.ADS_CONVERSION_ID !== 'AW-XXXXXXXXX') {
      gtag('config', CONFIG.ADS_CONVERSION_ID);
    }
  }
  function showBanner(){
    if (document.getElementById('chraimConsent')) return;
    var c = getConsent();
    if (c.timestamp > 0 && (Date.now() - c.timestamp < 1000*60*60*24*365)) return; // allow up to 1y
    var wrap = document.createElement('div');
    wrap.id = 'chraimConsent';
    wrap.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:rgba(15,23,42,.98);color:#e6edf3;border-top:1px solid #2d3b52;padding:14px 16px;font-family:inherit;direction:rtl;text-align:right';
    wrap.innerHTML = '<div style="max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><div style="flex:1 1 260px;line-height:1.9">نستخدم ملفات تعريف الارتباط لأغراض التحليل والإعلانات. <a href="/privacy-policy.html" style="color:#e0c078;text-decoration:none">سياسة الخصوصية</a></div><div style="display:flex;gap:10px"><button id="ccDeny" style="padding:10px 16px;border-radius:999px;border:1px solid #3a4d6b;background:transparent;color:#e6edf3;cursor:pointer">رفض</button><button id="ccAllow" style="padding:10px 16px;border-radius:999px;border:1px solid #b99a3c;background:linear-gradient(135deg,#e0c078,#c79a3a);color:#0b1220;font-weight:700;cursor:pointer">قبول</button></div></div>';
    document.body.appendChild(wrap);
    document.getElementById('ccAllow').onclick = function(){
      var o = { analytics: true, ads: true, timestamp: Date.now() };
      setConsent(o);
      wrap.remove();
      injectGtag();
    };
    document.getElementById('ccDeny').onclick = function(){
      var o = { analytics: false, ads: false, timestamp: Date.now() };
      setConsent(o);
      wrap.remove();
      injectGtag();
    };
  }
  var c = getConsent();
  if (c.analytics || c.ads) injectGtag(); else { showBanner(); injectGtag(); }
  document.addEventListener('DOMContentLoaded', function(){ showBanner(); });
})();
