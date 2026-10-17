#requires -Version 5.1
<#
  pages-deploy.ps1   (ASCII only)

  Publishes the built CHRVVIM Campus site (chrvvim-campus\web) to GitHub Pages.

  - creates the repository if it does not exist (public, so Pages is free)
  - stages the SITE at the repository ROOT
  - pushes it
  - enables GitHub Pages (branch main, path /)
  - prints the live URL

  The token is read from a file, never printed, and never stored in .git/config.

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File pages-deploy.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File pages-deploy.ps1 -DryRun
#>
param(
  [string]$Repo = 'chrvvim-ai-hub',
  [string]$TokenPath = (Join-Path $env:TEMP 'opencode\gh_token.txt'),
  [string]$SiteDir = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Default Project\chrvvim-campus\web'),
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Fail($m) { Write-Host "ERROR: $m" -ForegroundColor Red; exit 1 }
function Ok($m)   { Write-Host $m -ForegroundColor Green }

if (-not (Test-Path -LiteralPath $TokenPath)) { Fail "token file not found: $TokenPath" }
if (-not (Test-Path -LiteralPath $SiteDir))   { Fail "site folder not found: $SiteDir" }
if (-not (Test-Path -LiteralPath (Join-Path $SiteDir 'index.html'))) { Fail "index.html missing at site root" }

$token = (Get-Content -Raw -Path $TokenPath).Trim()
if ($token.Length -lt 20) { Fail 'token looks too short' }

$headers = @{
  Authorization          = "Bearer $token"
  Accept                 = 'application/vnd.github+json'
  'User-Agent'           = 'chrvvim-pages'
  'X-GitHub-Api-Version' = '2022-11-28'
}

Write-Host 'Authenticating...'
try { $me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -Method Get -TimeoutSec 30 }
catch { Fail 'authentication failed' }
$login = $me.login
Ok "authenticated as: $login"

$repoFull = "$login/$Repo"
$exists = $false
try { Invoke-RestMethod -Uri "https://api.github.com/repos/$repoFull" -Headers $headers -Method Get -TimeoutSec 30 | Out-Null; $exists = $true }
catch {
  $code = 0; if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  if ($code -ne 404) { Fail "could not check repository (HTTP $code)" }
}

if (-not $exists) {
  if ($DryRun) { Write-Host "[dry-run] would create public repository $repoFull" }
  else {
    $body = @{
      name        = $Repo
      private     = $false
      description = 'CHRVVIM Campus - AI HUB (Ibn Zohr University, unofficial)'
      auto_init   = $false
    } | ConvertTo-Json
    try { Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Headers $headers -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 30 | Out-Null; Ok "created repository: $repoFull" }
    catch { Fail 'repository creation failed' }
  }
} else { Write-Host "repository already exists: $repoFull" }

# ---- stage the site at the repo root ----
$stage = Join-Path $env:TEMP 'opencode\pages-stage'
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
Get-ChildItem -LiteralPath $SiteDir -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $stage -Recurse -Force
}
$stagedFiles = (Get-ChildItem -LiteralPath $stage -Recurse -File -Force).Count
Write-Host "staged files: $stagedFiles"
if ($stagedFiles -lt 50) { Fail "unexpectedly few files staged ($stagedFiles)" }

if ($DryRun) { Write-Host '[dry-run] would init + commit + force-push to main and enable Pages'; Ok 'dry-run complete'; exit 0 }

Set-Location $stage
git init -b main | Out-Null
git config user.email 'mrchraim@users.noreply.github.com'
git config user.name  'mrchraim'
git add -A
git commit -m 'deploy: CHRVVIM Campus + AI HUB (GitHub Pages)' | Out-Null

git remote remove origin 2>$null | Out-Null
git remote add origin "https://github.com/$repoFull.git"

$pushUrl = "https://x-access-token:$token@github.com/$repoFull.git"
Write-Host 'Pushing...'
$out = (git push -f $pushUrl "refs/heads/main:refs/heads/main" 2>&1 | Out-String)
$out = $out.Replace($token, '***')
if ($LASTEXITCODE -ne 0) { Write-Host $out; Fail 'git push failed' }
Ok 'pushed'

# ---- enable Pages ----
$pbody = @{ source = @{ branch = 'main'; path = '/' } } | ConvertTo-Json
$pagesUrl = "https://$login.github.io/$Repo/"
try {
  $p = Invoke-RestMethod -Uri "https://api.github.com/repos/$repoFull/pages" -Headers $headers -Method Post -Body $pbody -ContentType 'application/json' -TimeoutSec 30
  Ok "pages enabled"
  if ($p.html_url) { $pagesUrl = $p.html_url }
} catch {
  $code = 0; if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  if ($code -eq 409) { Write-Host 'pages already enabled' }
  else {
    try {
      $p = Invoke-RestMethod -Uri "https://api.github.com/repos/$repoFull/pages" -Headers $headers -Method Put -Body $pbody -ContentType 'application/json' -TimeoutSec 30
      Ok 'pages configured'
      if ($p.html_url) { $pagesUrl = $p.html_url }
    } catch { Fail "could not enable Pages (HTTP $code)" }
  }
}

Write-Host ''
Ok 'DONE'
Write-Host "Repo : https://github.com/$repoFull"
Write-Host "Site : $pagesUrl"
Write-Host ''
Write-Host 'IMPORTANT: revoke the token when finished -> https://github.com/settings/tokens' -ForegroundColor Yellow
