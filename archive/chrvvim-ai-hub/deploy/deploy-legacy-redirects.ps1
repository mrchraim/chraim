#requires -Version 5.1
<#
  deploy-legacy-redirects.ps1  (ASCII only)

  Publishes a permanent (HTTP 301) redirect from each legacy Netlify site to the
  primary site, by deploying that site's ready `_redirects` file.

  The deploy is a normal Netlify production deploy, so:
    * it is fully reversible (Netlify keeps the deploy history), and
    * it does NOT touch the primary site.

  IMPORTANT: while the account is over quota the legacy sites answer
  {"error":"usage_exceeded"} (503) and Netlify rejects new deploys. Run this
  again after the quota is restored (wait for the billing cycle, upgrade the
  plan, or ask support for a one-time reset).

  Authentication (first available wins):
    - NETLIFY_AUTH_TOKEN environment variable, or
    - token file, default: %TEMP%\opencode\netlify_token.txt
      create at Netlify -> User settings -> Applications -> Personal access tokens

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File deploy-legacy-redirects.ps1 -ListSites
    powershell -NoProfile -ExecutionPolicy Bypass -File deploy-legacy-redirects.ps1 -DryRun
    powershell -NoProfile -ExecutionPolicy Bypass -File deploy-legacy-redirects.ps1
#>
param(
  [string]$Token        = '',
  [string]$TokenPath    = (Join-Path $env:TEMP 'opencode\netlify_token.txt'),
  [string[]]$Sites      = @('chrvvim0k0l0a0k0', 'mrchraimfsjpachrvvim'),
  [string]$RedirectsDir = (Join-Path $PSScriptRoot '..\legacy-redirects'),
  [string]$Primary      = 'https://mr1mohamed1chraim.netlify.app/',
  [switch]$ListSites,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
function Fail($m){ Write-Host "ERROR: $m" -ForegroundColor Red; exit 1 }
function Ok($m){ Write-Host $m -ForegroundColor Green }
function Info($m){ Write-Host $m }
function Warn($m){ Write-Host $m -ForegroundColor Yellow }

if (-not $Token -and $env:NETLIFY_AUTH_TOKEN) { $Token = $env:NETLIFY_AUTH_TOKEN.Trim() }
if (-not $Token -and (Test-Path $TokenPath)) { $Token = (Get-Content -Raw $TokenPath).Trim() }
if (-not $Token) { Fail "no Netlify token. Set NETLIFY_AUTH_TOKEN or put one in $TokenPath" }

$api     = 'https://api.netlify.com/api/v1'
$headers = @{ Authorization = "Bearer $Token" }

function Read-Err($ex) {
  try {
    $r = $ex.Exception.Response
    if ($r) {
      $sr = New-Object System.IO.StreamReader($r.GetResponseStream())
      $body = $sr.ReadToEnd()
      if ($body) { return $body }
    }
  } catch {}
  return $ex.Exception.Message
}

Info 'fetching site list ...'
try { $allSites = Invoke-RestMethod -Uri "$api/sites" -Headers $headers -Method Get -TimeoutSec 60 }
catch { Fail "could not list sites: $(Read-Err $_)" }

Info 'sites available to this token:'
foreach ($s in $allSites) { Info ("  {0,-28} id={1}  {2}" -f $s.name, $s.id, $s.url) }
if ($ListSites) { Ok 'done (list only)'; exit 0 }

$RedirectsDir = (Resolve-Path $RedirectsDir).Path
$results = @()

foreach ($name in $Sites) {
  $site = $allSites | Where-Object { $_.name -eq $name -or $_.url -like "*$name.netlify.app*" } | Select-Object -First 1
  if (-not $site) { Warn "WARN: site '$name' not found on this account - skipping"; continue }

  $src = Join-Path $RedirectsDir (Join-Path $name '_redirects')
  if (-not (Test-Path $src)) { Warn "WARN: no _redirects at $src - skipping"; continue }

  Info ''
  Info ("site  : {0}   {1}" -f $site.name, $site.url)
  Info ("rules : {0}" -f $src)

  if ($DryRun) {
    Info "[dry-run] would deploy only _redirects to $($site.name)"
    $results += [pscustomobject]@{ Site = $site.name; Status = 'dry-run' }
    continue
  }

  $tmp = Join-Path $env:TEMP ("redir_" + $site.name + "_" + (Get-Random))
  $zip = "$tmp.zip"
  New-Item -ItemType Directory -Path $tmp -Force | Out-Null
  Copy-Item $src (Join-Path $tmp '_redirects') -Force
  $html = '<!doctype html><meta http-equiv="refresh" content="0;url=' + $Primary + '"><title>CHRVVIM</title>'
  Set-Content -Path (Join-Path $tmp 'index.html') -Value $html -Encoding ASCII
  Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $zip -Force

  Info 'deploying ...'
  $status = 'unknown'
  try {
    $dep = Invoke-RestMethod -Uri "$api/sites/$($site.id)/deploys" -Headers $headers -Method Post -InFile $zip -ContentType 'application/zip' -TimeoutSec 180
    Info ("  deploy id = {0}" -f $dep.id)
    $final = $null
    for ($i = 0; $i -lt 40; $i++) {
      Start-Sleep -Seconds 3
      try {
        $final = Invoke-RestMethod -Uri "$api/deploys/$($dep.id)" -Headers $headers -Method Get -TimeoutSec 30
        Info ("  [{0,2}] state = {1}" -f ($i + 1), $final.state)
        if ($final.state -eq 'ready' -or $final.state -eq 'error') { break }
      } catch { Info ("  [{0,2}] retry: {1}" -f ($i + 1), $_.Exception.Message) }
    }
    if ($final -and $final.state -eq 'ready') { $status = 'ok (live)' } elseif ($final) { $status = "state=$($final.state)" } else { $status = 'no state' }
  } catch {
    $body = Read-Err $_
    if ($body -match 'usage_exceeded') { $status = 'BLOCKED by usage_exceeded (quota)'; Warn "  $status" }
    else { $status = "error: $body"; Warn "  $status" }
  }

  $results += [pscustomobject]@{ Site = $site.name; Status = $status }
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item $zip -Force -ErrorAction SilentlyContinue
}

Info ''
Info '=== summary ==='
$results | Format-Table -AutoSize | Out-String | Write-Host
Info 'Verify with:  verify-redirects.ps1'
