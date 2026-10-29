#!/usr/bin/env python3
from pathlib import Path
import json, sys
root = Path(__file__).resolve().parents[1]
errors = []
workflow = (root / ".github/workflows/quality-gates.yml").read_text(encoding="utf-8")
config = json.loads((root / ".lighthouserc.json").read_text(encoding="utf-8"))
axe = (root / "tools/run-axe-audit.cjs").read_text(encoding="utf-8")
for phrase in ["build-and-unit:", "links-security:", "browser-a11y:", "npm audit --audit-level=high", "gitleaks/gitleaks-action", "npx lhci autorun", "node tools/run-axe-audit.cjs"]:
    if phrase not in workflow: errors.append(f"workflow missing: {phrase}")
assertions = config["ci"]["assert"]["assertions"]
for key, minimum in [("categories:performance", 0.80), ("categories:accessibility", 0.90), ("categories:best-practices", 0.90), ("categories:seo", 0.90)]:
    try:
        if assertions[key][1]["minScore"] != minimum: errors.append(f"wrong threshold for {key}")
    except Exception:
        errors.append(f"missing threshold for {key}")
for route in ["/", "/privacy.html", "/terms.html"]:
    if route not in axe: errors.append(f"axe missing route: {route}")
if errors:
    print("SELF-CHECK FAILED")
    print("\\n".join(f"- {e}" for e in errors))
    sys.exit(1)
print("SELF-CHECK PASS: workflow gates, Lighthouse thresholds and axe routes are present.")
