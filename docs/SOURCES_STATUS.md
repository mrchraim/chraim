# CHRVVIM — حالة الوصول إلى المصادر الرسمية

**تم توليده:** 2026-11-16T12:43:26Z · **الأداة:** `tools/verify-official-sources.py` · **المنهجية:** HEAD (ثم GET بمدى صغير 2048 بايت عند الرفض) — **reachability فقط، لا تحقق من المحتوى**.

**النتيجة:** 81 رابطًا — ✅ OK: 68 · ⛔ Forbidden (متوقع لصفحات داخلية): 1 · ❌ Not found: 1 · 🔥 Error/Timeout: 11

> الصفحات الداخلية (مقالات FEGA/FSJPA، تفاصيل المباريات) قد ترفض الروبوتات بـ 403؛ هذا متوقع ولا يعني المحتوى غير موجود — تُفتح في المتصفح.

## ✅ القنوات الحرجة (uiz.ac.ma + preinscription) تستجيب بـ 2xx

| التصنيف | الـ HTTP | الرابط | المصدر (الملف) |
|---|---|---|---|
| ERROR | 502 | `http://cuam.uiz.ac.ma/` | institutions-database.json (record website) |
| ERROR | timeout «network: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: Hostname mismatch, c | `http://ent.flsh-agadir.ac.ma/login` | announcements.json |
| ERROR | timeout «network: [Errno 11001] getaddrinfo failed | `http://www.estd.ac.ma/` | institutions-database.json (record website) |
| ERROR | timeout «network: [Errno 11001] getaddrinfo failed | `http://www.ims.uiz.ma/` | institutions-database.json (record website) |
| ERROR | timeout «network: [SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol (_ssl. | `https://www.chariaasmara.com/` | institutions-database.json (record website) |
| ERROR | timeout «network: [Errno 11001] getaddrinfo failed | `https://www.encg-dakhla.ac.ma/` | institutions-database.json (record website) |
| ERROR | timeout «network: [Errno 11001] getaddrinfo failed | `https://www.ensiasdt.uiz.ac.ma/` | institutions-database.json (record website) |
| ERROR | timeout «network: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: Hostname mismatch, c | `https://www.fpo.ma/` | institutions-database.json (record website) |
| ERROR | timeout «network: [WinError 10061] No connection could be made because the target machine actively | `https://www.fsa.ac.ma/` | institutions-database.json (record website) |
| ERROR | timeout «network: [Errno 11001] getaddrinfo failed | `https://www.fsjes-agadir.org/` | institutions-database.json (record website) |
| ERROR | timeout «network: [Errno 11001] getaddrinfo failed | `https://www.ims.uiz.ac.ma/` | sources-register.json |
| NOT_FOUND | 404 | `https://idpafbyefrywjixskvvu.supabase.co` | sources-register.json |
| FORBIDDEN | 403 «forbidden-for-bots | `https://ensiasd.uiz.ac.ma/2026/09/11/emplois-du-temps-1%CA%B3%E1%B5%89-annee-cycle-ingenieur-cycle-preparatoire-session-dautomne-annee-universitaire-2026-2027/` | sources-register.json |
| OK | 200 | `http://flash.uiz.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `http://fsjes-cuam.uiz.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `http://www.ensa-agadir.ac.ma/pages/admisensa` | announcements.json |
| OK | 200 | `http://www.ensa-agadir.ac.ma/pages/concourslatresultats` | announcements.json |
| OK | 200 | `http://www.ensa-agadir.ac.ma/pages/transfertresultats` | announcements.json |
| OK | 200 | `http://www.esta.ac.ma/?p=40` | announcements.json |
| OK | 200 | `http://www.esta.ac.ma/?page_id=4583` | announcements.json |
| OK | 200 | `http://www.esta.ac.ma/?page_id=469` | announcements.json |
| OK | 200 | `http://www.estg.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `http://www.estl.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36428` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36637` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36651` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36663` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36664` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36665` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36666` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36667` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36668` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36669` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36670` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36884` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36885` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36886` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36898` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36902` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36911` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36917` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36920` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36926` | announcements.json |
| OK | 200 | `http://www.flsh-agadir.ac.ma/?p=36927` | announcements.json |
| OK | 401 «auth required — endpoint alive | `http://www.fpo.ma/` | institutions-database.json (record website) |
| OK | 200 | `http://www.fpt.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `https://ensaup.uiz.ac.ma` | announcements.json |
| OK | 200 | `https://fega.uiz.ac.ma/` | sources-register.json |
| OK | 200 | `https://fmpa.uiz.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `https://fmpa.uiz.ac.ma/avis-au-etudiants-bourse-dexternat/` | announcements.json |
| OK | 200 | `https://fmpa.uiz.ac.ma/avis-important-liste-dattente-3/` | announcements.json |
| OK | 200 | `https://fmpa.uiz.ac.ma/emplois-temps/` | announcements.json |
| OK | 200 | `https://fmpa.uiz.ac.ma/liste-des-etudiants-de-la-2eme-annee-de-pharmacie-td/` | announcements.json |
| OK | 200 | `https://fmpa.uiz.ac.ma/stages-dexternat-4eme-annee-2026-2027/` | announcements.json |
| OK | 200 | `https://forms.gle/b4SrMVVMu3eduof1A` | announcements.json |
| OK | 200 | `https://fsa.uiz.ac.ma/` | sources-register.json |
| OK | 200 | `https://fsjpa.uiz.ac.ma/` | sources-register.json |
| OK | 200 | `https://myfmpa.uiz.ac.ma` | announcements.json |
| OK | 200 | `https://myuiz.uiz.ac.ma/etudiant/login` | announcements.json |
| OK | 200 | `https://preinscription.uiz.ac.ma/institutions` | sources-register.json |
| OK | 200 | `https://www.chariaa-agadir.ac.ma/` | institutions-database.json (record website) |
| OK | 401 «auth required — endpoint alive | `https://www.encg-agadir.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `https://www.ensa-agadir.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `https://www.esta.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `https://www.flsh-agadir.ac.ma/` | institutions-database.json (record website) |
| OK | 200 | `https://www.preinscription.uiz.ac.ma/` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/avis-aux-etudiants` | announcements.json |
| OK | 200 | `https://www.uiz.ac.ma/formation` | university-formations.json |
| OK | 200 | `https://www.uiz.ac.ma/formation/etablissement?field_formation_etablissement_target_id=All&page=1` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/index.php` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/index.php/accueil` | official-academic-updates-2026-2027.json |
| OK | 200 | `https://www.uiz.ac.ma/index.php/node/1665` | institutions-database.json (sources) |
| OK | 200 | `https://www.uiz.ac.ma/jamt-abn-zhr-tkhttm-jwltha-bata-alantlaqt-albydaghwjyt-lklyty-alaqtsad-waltdbyr-wallwm-alqanwnyt` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/jamt-abn-zhr-tty-alantlaqt-albydaghwjyt-llmdrst-alwtnyt-allya-llsnaat-alghdhayyt-waltknwlwjya` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/jamt-abn-zhr-tty-alantlaqt-albydaghwjyt-llmdrst-alwtnyt-lltknwlwjyat-almtqdmt-baldakhlt` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/jamt-abn-zhr-tty-alantlaqt-alrsmyt-lklyt-allwm-waltqnyat-bklmym` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/jamt-abn-zhr-twasl-dynamyt-ttwyr-rdha-aljamy-bata-alantlaqt-albydaghwjyt-lmhd-mhn-alryadt-bakadyr` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/jamt-abn-zhr-tzz-rdha-alhndsy-bata-alantlaqt-albydaghwjyt-llmdrst-alwtnyt-lltknwlwjyat-almtqdmt` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/nos-etablissements` | sources-register.json |
| OK | 200 | `https://www.uiz.ac.ma/presentation` | sources-register.json |
