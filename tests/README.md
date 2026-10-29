# Validation notes

Run `python tools/verify_deployment_config.py` from the repository root.
The CI workflow itself must be validated by a real GitHub Actions run.
Lighthouse and axe results are runtime/browser checks and cannot be proven by static validation alone.
