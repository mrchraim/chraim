(function(){
  var KEY = 'chraim_consent_v2';
  function get(){ try { var r=localStorage.getItem(KEY); return r?JSON.parse(r):null; } catch(e){ return null; } }
  function set(o){ try { localStorage.setItem(KEY,JSON.stringify(o)); } catch(e){} }
  window.CHRV_CONSENT = { get: get, set: set, KEY: KEY };
})();
