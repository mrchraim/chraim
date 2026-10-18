<#
  Deploy this site to Cloudflare Pages (free plan).
  Arabic step-by-step guide: DEPLOY_AR.md

  Usage:
    powershell -ExecutionPolicy Bypass -File tools\deploy-cloudflare.ps1
    powershell -ExecutionPolicy Bypass -File tools\deploy-cloudflare.ps1 -ProjectName chraim -Branch main

  Notes:
    * Uses only free-tier features (Cloudflare Pages free plan).
    * Builds a clean "dist/" first, so archive/, vendor/, _dev/, tools/,
      supabase/ and docs are NEVER uploaded.
    * Refuses to deploy if the link audit finds a broken link.
#>
[CmdletBinding()]
param(
  [string]$ProjectName = "chraim",
  [string]$Branch      = "main",
  [string]$OutDir      = "dist",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Info($m) { Write-Host "[i] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "[+] $m" -ForegroundColor Green }
function Fail($m) { Write-Host "[x] $m" -ForegroundColor Red; exit 1 }

# --- 0) tools ---------------------------------------------------------------
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Fail "python not found in PATH."
}

# npm.ps1 is blocked by the default ExecutionPolicy -> always prefer npx.cmd
$npx = $null
foreach ($cand in @("npx.cmd", "npx.cmd.exe", "npx.exe", "npx")) {
  $c = Get-Command $cand -ErrorAction SilentlyContinue
  if ($c) { $npx = $c.Source; break }
}
if (-not $npx) { Fail "npx not found. Install Node.js from https://nodejs.org first." }

# --- 1) clean build ---------------------------------------------------------
if (-not $SkipBuild) {
  Info "Building clean output folder: $OutDir"
  & python "tools\build-dist.py" --out $OutDir --clean
  if ($LASTEXITCODE -ne 0) { Fail "build-dist.py failed." }
}

if (-not (Test-Path (Join-Path $OutDir "index.html"))) {
  Fail "no index.html in '$OutDir' - nothing to deploy."
}

# --- 2) link audit (safety gate) -------------------------------------------
Info "Auditing links inside $OutDir ..."
& python "tools\audit-links.py" --root $OutDir
if ($LASTEXITCODE -ne 0) { Fail "link audit failed - refusing to deploy." }
Ok "link audit passed"

# --- 3) Cloudflare auth ----------------------------------------------------
Info "Checking Cloudflare login (wrangler whoami) ..."
& $npx --yes wrangler@latest whoami
if ($LASTEXITCODE -ne 0) {
  Info "Run this once to log in, then re-run this script:"
  Write-Host "      $npx --yes wrangler@latest login" -ForegroundColor Yellow
  Fail "wrangler is not authenticated."
}
Ok "Cloudflare authenticated"

# --- 4) deploy -------------------------------------------------------------
Info "Deploying '$OutDir' to Cloudflare Pages project '$ProjectName' (branch: $Branch) ..."
& $npx --yes wrangler@latest pages deploy $OutDir --project-name=$ProjectName --branch=$Branch
if ($LASTEXITCODE -ne 0) {
  Info "If the project does not exist yet, create it once with:"
  Write-Host "      $npx --yes wrangler@latest pages project create $ProjectName" -ForegroundColor Yellow
  Fail "deploy failed."
}

Ok "Deployed (free plan)."
Write-Host "    https://$ProjectName.pages.dev" -ForegroundColor Green
Write-Host "    Next: Cloudflare Dashboard -> Workers & Pages -> $ProjectName -> Custom domains (also free)." -ForegroundColor Gray
