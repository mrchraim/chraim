#!/usr/bin/env python3
"""
Jalb dawri dial l-i3lanat (annonces) men l-mawaqi3 r-rasmiya dial kolliyat Ibn Zohr - Agadir.

Kifach khdam:
  1. kaytchecki robots.txt dial kol site (ila mamnou3, kaydouz).
  2. kayjib safha dial l-i3lanat w kaystakhrej r-rawabit.
  3. kaycompari m3a l-nata2ij l-9dima w kaykteb ghir l-jdid f data/announcements.json

Tachghil:
  pip install requests beautifulsoup4
  python scraper.py

Lil tachghil l-moun3taddem (cron, kol 30 d9i9a):
  */30 * * * * cd /path/to/project && python scraper.py >> scraper.log 2>&1
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

USER_AGENT = "IbnZohrStudentsBot/1.0 (student info site; contact: you@example.com)"
DELAY_SECONDS = 3          # istrah bin talab w talab, bach ma n-thaqqlouch 3la s-serveur
TIMEOUT = 20
OUTPUT = Path("data/announcements.json")

# selector = CSS selector dial r-rawabit f s-safha. Ila ma khdamch, kayrje3 l-ga3 r-rawabit.
SOURCES = [
    {
        "id": "flsh-avis",
        "etablissement": "FLSH Agadir",
        "type": "avis",
        "url": "http://www.flsh-agadir.ac.ma/?cat=162",
        "selector": "h2 a",
    },
    {
        "id": "flsh-examens",
        "etablissement": "FLSH Agadir",
        "type": "examens",
        "url": "http://www.flsh-agadir.ac.ma/?cat=282",
        "selector": "h2 a",
    },
    {
        "id": "flsh-emplois",
        "etablissement": "FLSH Agadir",
        "type": "emplois_du_temps",
        "url": "http://www.flsh-agadir.ac.ma/?page_id=249",
        "selector": "a",
    },
    {
        "id": "uiz-avis",
        "etablissement": "Universite Ibn Zohr",
        "type": "avis",
        "url": "https://www.uiz.ac.ma/avis-aux-etudiants",
        "selector": "a",
    },
    # Zid hna l-mawaqi3 l-okhra mn be3d ma t-tchecki l-url dyalhom:
    # {"id": "encga", "etablissement": "ENCG Agadir", "type": "avis",
    #  "url": "https://encga.uiz.ac.ma/", "selector": "a"},
    # {"id": "ensa", "etablissement": "ENSA Agadir", "type": "avis",
    #  "url": "http://www.ensa-agadir.ac.ma/", "selector": "a"},
    # {"id": "esta", "etablissement": "EST Agadir", "type": "avis",
    #  "url": "http://www.esta.ac.ma/", "selector": "a"},
    # {"id": "fmpa", "etablissement": "FMP Agadir", "type": "avis",
    #  "url": "http://fmpa.uiz.ac.ma/", "selector": "a"},
]

# Kalimat l-ghalat (menu, reseaux sociaux...) li n-tjahlouha.
SKIP_TEXTS = {"accueil", "contact", "plan de site", "facebook", "twitter", "youtube", "linkedin", "instagram"}

_robots_cache = {}


def allowed_by_robots(url: str) -> bool:
    parts = urlparse(url)
    base = f"{parts.scheme}://{parts.netloc}"
    if base not in _robots_cache:
        rp = RobotFileParser()
        rp.set_url(urljoin(base, "/robots.txt"))
        try:
            rp.read()
        except Exception:
            # ila ma9drnach nqraw robots.txt, n-dirou l-hadd l-adna: man-jibouch
            _robots_cache[base] = None
            return False
        _robots_cache[base] = rp
    rp = _robots_cache[base]
    return bool(rp and rp.can_fetch(USER_AGENT, url))


def fetch(url: str) -> str:
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
    r.raise_for_status()
    r.encoding = r.apparent_encoding or r.encoding
    return r.text


def extract_items(source: dict, html: str) -> list:
    soup = BeautifulSoup(html, "html.parser")
    items, seen = [], set()
    for a in soup.select(source["selector"]):
        href = a.get("href", "").strip()
        title = " ".join(a.get_text(" ", strip=True).split())
        if not href or href.startswith(("#", "javascript:", "mailto:")):
            continue
        if len(title) < 12 or title.lower() in SKIP_TEXTS:
            continue
        link = urljoin(source["url"], href)
        if link in seen:
            continue
        seen.add(link)
        items.append(
            {
                "source_id": source["id"],
                "etablissement": source["etablissement"],
                "type": source["type"],
                "title": title,
                "url": link,
            }
        )
    return items


def load_existing() -> dict:
    if OUTPUT.exists():
        try:
            data = json.loads(OUTPUT.read_text(encoding="utf-8"))
            return {item["url"]: item for item in data.get("items", [])}
        except Exception:
            pass
    return {}


def main() -> int:
    existing = load_existing()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    new_count, errors = 0, []

    for source in SOURCES:
        url = source["url"]
        try:
            if not allowed_by_robots(url):
                print(f"[skip] {source['id']}: robots.txt kaymn3 l-jalb dyal {url}")
                continue
            html = fetch(url)
            for item in extract_items(source, html):
                if item["url"] not in existing:
                    item["first_seen"] = now
                    existing[item["url"]] = item
                    new_count += 1
            print(f"[ok]   {source['id']}")
        except Exception as e:  # noqa: BLE001
            errors.append({"source": source["id"], "error": str(e)})
            print(f"[err]  {source['id']}: {e}", file=sys.stderr)
        time.sleep(DELAY_SECONDS)

    items = sorted(existing.values(), key=lambda i: i.get("first_seen", ""), reverse=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(
            {"updated_at": now, "errors": errors, "items": items},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Safi: {new_count} jdid, {len(items)} f l-majmou3 -> {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
