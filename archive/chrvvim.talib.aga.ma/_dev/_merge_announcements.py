# -*- coding: utf-8 -*-
"""
Merge the incoming scraped announcements (37 official items) into the live
site announcements.json, WITHOUT deleting the 2 existing curated items.

The merged items carry BOTH schemas so every consumer works:
  * live site renderer  -> {id, title, body, kind, starts_at, ends_at, updated_at}
  * prototype pages     -> {etablissement, type, date, title, url}
"""
import io, json, os, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # site dir
LIVE = os.path.join(ROOT, "announcements.json")
BACKUP = os.path.join(ROOT, "_dev", "backups", "announcements.json.pre-merge.bak")
INC = os.path.join(ROOT, "_dev", "incoming-2026-10-17", "announcements.json")

# start from the pristine pre-merge file so re-runs are idempotent
src = BACKUP if os.path.exists(BACKUP) else LIVE
live = json.load(open(src, encoding="utf-8"))
inc = json.load(open(INC, encoding="utf-8"))

old_items = live.get("items", [])
new_raw = inc.get("items", [])

# enrich the curated items so the prototype consumers find the same fields
for it in old_items:
    it.setdefault("etablissement", "CHRVVIM Campus")
    it.setdefault("type", it.get("kind") or "info")
    it.setdefault("date", it.get("updated_at") or "")
    it.setdefault("url", "")

seen_urls = {it.get("url") for it in old_items if it.get("url")}
seen_titles = {it.get("title") for it in old_items if it.get("title")}

added, skipped = [], 0
for i, it in enumerate(new_raw, 1):
    title = (it.get("title") or "").strip()
    url = (it.get("url") or "").strip()
    if not title:
        skipped += 1
        continue
    if url in seen_urls or title in seen_titles:
        skipped += 1
        continue
    seen_urls.add(url)
    seen_titles.add(title)
    date = it.get("date") or ""
    added.append({
        "id": "uiz-%02d" % i,
        "title": title,
        "body": "",
        "kind": it.get("type") or "info",
        "starts_at": "",
        "ends_at": "",
        "updated_at": date,
        # richer official fields shared with the prototype pages
        "date": date,
        "etablissement": it.get("etablissement") or "",
        "type": it.get("type") or "",
        "url": url,
    })

merged = {
    "note": live.get("note", ""),
    "merged_from": "official UIZ / faculty scrape (announcements.json, %s)" % inc.get("updated_at", ""),
    "updated_at": inc.get("updated_at", ""),
    "count": len(old_items) + len(added),
    "items": old_items + added,
}

json.dump(merged, open(LIVE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print("existing kept :", len(old_items))
print("incoming      :", len(new_raw))
print("added         :", len(added), "| skipped(dup/empty):", skipped)
print("total now     :", len(merged["items"]))
