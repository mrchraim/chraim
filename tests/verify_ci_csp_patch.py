#!/usr/bin/env python3
"""Offline structural checks for the CHRAIM CI/CSP repair bundle."""
from pathlib import Path
import sys

try:
    import yaml
except ImportError:
    print("PyYAML is required: python -m pip install pyyaml", file=sys.stderr)
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[1]
workflow = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
headers = (ROOT / "_headers").read_text(encoding="utf-8")
parsed = yaml.safe_load(workflow)
assert isinstance(parsed, dict) and isinstance(parsed.get("jobs"), dict)
for job in ("build", "code-quality", "security-and-links", "lighthouse-audit", "accessibility-audit"):
    assert job in parsed["jobs"], f"Missing job: {job}"
assert "npm ci || npm install" not in workflow
assert "continue-on-error: true" not in workflow
assert "temporaryPublicStorage: false" in workflow
assert "temporaryPublicStorage: true" not in workflow
assert workflow.count("actions/setup-python@v5") >= 4
assert workflow.count("actions/download-artifact@v4") == 3
assert "python tools/audit-links.py --root dist" in workflow
assert "python tools/audit-security.py" in workflow
assert "python tools/verify_deployment_config.py" in workflow
assert "npx --yes @axe-core/cli http://127.0.0.1:8001/ --exit" in workflow
assert "Content-Security-Policy:" in headers
assert "Content-Security-Policy-Report-Only:" in headers
assert "object-src 'none'" in headers and "frame-ancestors 'none'" in headers
assert "Cache-Control: public, max-age=3600, must-revalidate" in headers
assert "Cache-Control: public, max-age=31536000, immutable" not in headers
print("PASS: workflow YAML parses and all expected jobs exist")
print("PASS: locked install and fail-on-error quality gates are retained")
print("PASS: Lighthouse public temporary storage is disabled")
print("PASS: build artifact is reused by security, Lighthouse and axe jobs")
print("PASS: CSP enforced and report-only policies are present")
print("PASS: stable-name assets use conservative cache headers")
print("NOTE: this validates configuration structure only; GitHub Actions and browser checks must run in the repository.")
