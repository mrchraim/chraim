const CACHE='chrvvim-shell-v15';
const SHELL=['./','./portal.html','./index.html','./students-guide.html','./rafiq-altalib.html','./announcements.json','./university-directory.html','./academic-offer.html','./academic-updates.html','./official-academic-updates-2026-2027.json','./manifest.json','./chrvvim-plus.css','./frontend-quality.css','./chrvvim-studio.css','./chrvvim-plus.js','./chrvvim-studio.js','./page-i18n.js','./app.js','./campus-data.js','./institutions-database.js','./institutions-resources.js','./institutions-gateway.js','./subjects-data.js','./legal-data.js','./university-data.js','./institutions-database.js','./institutions-database.json','./university-formations.js','./university-formations.json','./subjects.js','./legal.js','./supabase-config.js','./assets/fonts/fonts.css','./assets/back-home.js','./assets/chrvvim-icon.svg','./offline.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.includes('/documents/'))return;   // archived documents: always network (never cached / never stale)
  if(url.pathname==='/admin.html')return;            // admin panel: never cached
  // 0) Live data (announcements) -> network-first so official notices are always fresh,
  //    with the last good copy kept as an offline fallback.
  if(url.pathname.endsWith('/announcements.json')){
    event.respondWith(
      fetch(req).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
        return res;
      }).catch(()=>caches.match(req)).then(r=>r||new Response('{"items":[]}',{headers:{'Content-Type':'application/json; charset=utf-8'}}))
    );
    return;
  }
  // 1) HTML navigations -> network-first, so a new deploy is visible on the very next load.
  //    The cache is kept only as an offline fallback.
  if(req.mode==='navigate'||req.destination==='document'){
    event.respondWith(
      fetch(req).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
        return res;
      }).catch(()=>caches.match(req).then(hit=>hit||caches.match('./portal.html')).then(hit=>hit||caches.match('./offline.html')))
    );
    return;
  }
  // 2) Other same-origin assets -> stale-while-revalidate (instant + self-updating).
  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
        return res;
      }).catch(()=>cached||new Response('',{status:504,statusText:'offline'}));
      return cached||network;
    })
  );
});
