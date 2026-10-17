#requires -Version 5.1
<#
  push-to-github.ps1   (ASCII only)
  Create (if needed) and push the CHRVVIM AI HUB repository to GitHub.

  The token is read from a file, never printed, and never written to .git/config
  (the push uses a one-off URL built in memory).

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File push-to-github.ps1 -DryRun
    powershell -NoProfile -ExecutionPolicy Bypass -File push-to-github.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File push-to-github.ps1 -Public
#>
param(
  [string]$Repo = 'chrvvim-ai-hub',
  [string]$TokenPath = (Join-Path $env:TEMP 'opencode\gh_token.txt'),
  [string]$ProjectDir = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Default Project'),
  [string]$Branch = 'main',
  [switch]$Public,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }

$repoDir = Join-Path $ProjectDir 'chrvvim-campus'
if (-not (Test-Path (Join-Path $repoDir '.git'))) { Fail "no git repository at: $repoDir" }
if (-not (Test-Path $TokenPath)) { Fail "token file not found: $TokenPath" }

$token = (Get-Content -Raw -Path $TokenPath).Trim()
if ($token.Length -lt 20) { Fail 'token looks too short' }
if ($token -notmatch '^(ghp_|github_pat_|gho_|ghu_|ghs_)') { Fail 'token prefix not recognized' }

$headers = @{
  Authorization          = "Bearer $token"
  Accept                 = 'application/vnd.github+json'
  'User-Agent'           = 'chrvvim-ai-hub-deploy'
  'X-GitHub-Api-Version' = '2022-11-28'
}

Write-Host 'Authenticating with GitHub...'
try {
  $me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -Method Get -TimeoutSec 30
} catch {
  $code = ''
  if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  Fail "authentication failed (HTTP $code). Check token, scopes, and expiry."
}
$login = $me.login
Ok "authenticated as: $login"
$scopes = ''
try { $scopes = $_.Headers['X-OAuth-Scopes'] } catch {}
if ($scopes) { Write-Host "token scopes: $scopes" }

$repoFull = "$login/$Repo"
$exists = $false
try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$repoFull" -Headers $headers -Method Get -TimeoutSec 30 | Out-Null
  $exists = $true
} catch {
  $code = 0
  if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  if ($code -ne 404) { Fail "could not check repository (HTTP $code)" }
}

if ($exists) {
  Write-Host "repository already exists: $repoFull"
} elseif ($DryRun) {
  Write-Host "[dry-run] would CREATE repository: $Repo (private=$(-not $Public))"
} else {
  $body = @{
    name        = $Repo
    private     = (-not $Public)
    description = 'CHRVVIM AI HUB - Ibn Zohr University digital ecosystem (unofficial)'
    auto_init   = $false
  } | ConvertTo-Json
  try {
    $created = Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Headers $headers -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 30
  } catch {
    $code = ''
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    Fail "repository creation failed (HTTP $code). Administration:write may be missing."
  }
  Ok "created repository: $($created.full_name)"
}

Set-Location $repoDir
$cleanUrl = "https://github.com/$repoFull.git"
$cur = (git remote get-url origin 2>$null)
if ($cur) { git remote set-url origin $cleanUrl } else { git remote add origin $cleanUrl }
Write-Host "remote origin -> $cleanUrl (no token stored)"

if ($DryRun) {
  Write-Host "[dry-run] would push branch '$Branch' to $repoFull"
  Ok 'dry-run complete - nothing was pushed'
  exit 0
}

$pushUrl = "https://x-access-token:$token@github.com/$repoFull.git"
Write-Host "Pushing branch '$Branch' ..."
$out = (git push $pushUrl "refs/heads/$Branch:refs/heads/$Branch" 2>&1 | Out-String)
$out = $out.Replace($token, '***')
if ($LASTEXITCODE -ne 0) {
  Write-Host $out
  Fail 'git push failed'
}
Ok "pushed branch '$Branch'"
Write-Host ($out.Trim())
Write-Host ''
Write-Host 'Repository: ' -NoNewline; Write-Host $cleanUrl -ForegroundColor Cyan
Write-Host ''
Write-Host 'IMPORTANT: revoke the token now -> https://github.com/settings/tokens' -ForegroundColor Yellow
