#requires -Version 5.1
<#
  create-and-push-repo.ps1  (ASCII only)

  Creates the GitHub repository (default: chrvvim-ai-hub) and pushes the local
  CHRVVIM AI HUB repository to it.

  Authentication (first available wins):
    A) gh CLI already logged in  (check: gh auth status)
    B) GITHUB_TOKEN / GH_TOKEN environment variable
    C) token file, default: %TEMP%\opencode\gh_token.txt
       create at https://github.com/settings/tokens  (scope: repo)

  The token is never printed and never written to .git/config.

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File create-and-push-repo.ps1 -DryRun
    powershell -NoProfile -ExecutionPolicy Bypass -File create-and-push-repo.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File create-and-push-repo.ps1 -Public
#>
param(
  [string]$Repo      = 'chrvvim-ai-hub',
  [string]$RepoDir   = (Join-Path $PSScriptRoot '..'),
  [string]$TokenPath = (Join-Path $env:TEMP 'opencode\gh_token.txt'),
  [string]$Branch    = 'main',
  [switch]$Public,
  [switch]$DryRun
)

# Native commands (gh, git) write to stderr; 'Continue' avoids PS 5.1 treating
# that as a terminating error. Exit codes are checked explicitly below.
$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
function Fail($m){ Write-Host "ERROR: $m" -ForegroundColor Red; exit 1 }
function Ok($m){ Write-Host $m -ForegroundColor Green }
function Info($m){ Write-Host $m }

$RepoDir = (Resolve-Path $RepoDir).Path
if (-not (Test-Path (Join-Path $RepoDir '.git'))) { Fail "no git repository at: $RepoDir" }
Set-Location $RepoDir
$curBranch = (git rev-parse --abbrev-ref HEAD).Trim()
$vis = if ($Public) { 'public' } else { 'private' }
Info "repo    : $RepoDir"
Info "branch  : $curBranch"
Info "target  : github.com/<you>/$Repo  ($vis)"

# --- resolve a token (if any) ---------------------------------------------
$token = ''
if (-not $token -and $env:GITHUB_TOKEN) { $token = $env:GITHUB_TOKEN.Trim() }
if (-not $token -and $env:GH_TOKEN)     { $token = $env:GH_TOKEN.Trim() }
if (-not $token -and (Test-Path $TokenPath)) { $token = (Get-Content -Raw $TokenPath).Trim() }

# --- path A: gh CLI --------------------------------------------------------
$ghOk = $false
$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
  & gh auth status *> $null
  if ($LASTEXITCODE -eq 0) { $ghOk = $true }
}

if ($ghOk) {
  Info 'using GitHub CLI (gh) - already authenticated'
  $login = ((& gh api user --jq .login 2>$null | Out-String).Trim())
  Ok "authenticated as: $login"
  $full = "$login/$Repo"

  $exists = $false
  & gh repo view $full *> $null
  if ($LASTEXITCODE -eq 0) { $exists = $true }

  if (-not $exists) {
    if ($DryRun) { Info "[dry-run] would CREATE $full ($vis) and push '$Branch'"; Ok 'dry-run complete'; exit 0 }
    Info "creating repository $full ..."
    & gh repo create $Repo "--$vis" --source . --remote origin --push
    if ($LASTEXITCODE -ne 0) { Fail 'gh repo create failed' }
  } else {
    Info "repository already exists: $full"
    if ($DryRun) { Info "[dry-run] would push '$Branch' to $full"; Ok 'dry-run complete'; exit 0 }
    $cur = (git remote get-url origin 2>$null)
    $clean = "https://github.com/$full.git"
    if ($cur) { git remote set-url origin $clean } else { git remote add origin $clean }
    git push -u origin $Branch
    if ($LASTEXITCODE -ne 0) { Fail 'git push failed' }
  }
  Ok "done -> https://github.com/$full"
  exit 0
}

# --- path B/C: REST API with a token --------------------------------------
if (-not $token) {
  Fail "not authenticated. Run 'gh auth login', or set GITHUB_TOKEN, or put a PAT in $TokenPath"
}
if ($token.Length -lt 20) { Fail 'token looks too short' }

$headers = @{
  Authorization          = "Bearer $token"
  Accept                 = 'application/vnd.github+json'
  'User-Agent'           = 'chrvvim-ai-hub-deploy'
  'X-GitHub-Api-Version' = '2022-11-28'
}
Info 'authenticating with GitHub ...'
try { $me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -Method Get -TimeoutSec 30 }
catch { Fail 'authentication failed (check token, scopes and expiry)' }
$login = $me.login
Ok "authenticated as: $login"
$full = "$login/$Repo"

$exists = $false
try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$full" -Headers $headers -Method Get -TimeoutSec 30 | Out-Null
  $exists = $true
} catch {
  $code = 0
  if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  if ($code -ne 404) { Fail "could not check repository (HTTP $code)" }
}

if (-not $exists) {
  if ($DryRun) { Info "[dry-run] would CREATE $full ($vis)"; Ok 'dry-run complete'; exit 0 }
  $body = @{
    name        = $Repo
    private     = (-not $Public)
    description = 'CHRVVIM AI HUB - Ibn Zohr University digital ecosystem (unofficial)'
    auto_init   = $false
  } | ConvertTo-Json
  try { $created = Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Headers $headers -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 30 }
  catch { Fail 'repository creation failed (token needs the "repo" scope)' }
  Ok "created repository: $($created.full_name)"
} else {
  Info "repository already exists: $full"
}

$clean = "https://github.com/$full.git"
$cur = (git remote get-url origin 2>$null)
if ($cur) { git remote set-url origin $clean } else { git remote add origin $clean }
Info "remote origin -> $clean (no token stored)"

if ($DryRun) { Info "[dry-run] would push branch '$Branch'"; Ok 'dry-run complete'; exit 0 }

$pushUrl = "https://x-access-token:$token@github.com/$full.git"
Info "pushing branch '$Branch' ..."
$out = (git push $pushUrl "refs/heads/${Branch}:refs/heads/${Branch}" 2>&1 | Out-String)
$out = $out.Replace($token, '***')
if ($LASTEXITCODE -ne 0) { Write-Host $out; Fail 'git push failed' }
Ok "pushed branch '$Branch'"
Write-Host ($out.Trim())
Ok "done -> $clean"
Info 'SECURITY: if you used a PAT, you can revoke it now at https://github.com/settings/tokens'
