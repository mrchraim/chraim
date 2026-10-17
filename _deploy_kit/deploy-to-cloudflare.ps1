param(
  [string]$Token = '',
  [string]$AccountId = '',
  [string]$Project = 'chrvvim-campus',
  [string]$Dir = '',
  [switch]$ListAccounts
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not $Dir) {
  $projRoot = Split-Path $PSScriptRoot -Parent
  $Dir = Join-Path $projRoot 'chrvvim-campus\web'
}
if (-not $Token) { $Token = $env:CLOUDFLARE_API_TOKEN }
if (-not $Token) {
  Write-Host 'ERROR: provide a Cloudflare API token via -Token or CLOUDFLARE_API_TOKEN.'
  Write-Host 'Create one (free account): dash.cloudflare.com -> My Profile -> API Tokens -> Create Token'
  Write-Host 'Permission needed: Account > Cloudflare Pages > Edit'
  exit 1
}
if (-not (Test-Path $Dir)) { throw "Site directory not found: $Dir" }

$base = 'https://api.cloudflare.com/client/v4'
$hdr  = @{ Authorization = "Bearer $Token" }

# --- accounts ---------------------------------------------------------------
if (-not $AccountId) {
  $acc = Invoke-RestMethod -Uri "$base/accounts" -Headers $hdr -Method Get
  if (-not $acc.result -or $acc.result.Count -eq 0) { throw 'No Cloudflare account found for this token.' }
  $acc.result | Select-Object id, name | Format-Table -AutoSize
  if ($ListAccounts) { return }
  if ($acc.result.Count -eq 1) {
    $AccountId = $acc.result[0].id
  } else {
    Write-Host 'Multiple accounts found. Re-run with -AccountId <id> -ListAccounts false.'
    return
  }
}
Write-Host "account_id = $AccountId"
Write-Host "project    = $Project"
Write-Host "dir        = $Dir"

# --- create project (ignore if it already exists) --------------------------
$pbody = @{ name = $Project; production_branch = 'main' } | ConvertTo-Json
try {
  Invoke-RestMethod -Uri "$base/accounts/$AccountId/pages/projects" -Headers $hdr -Method Post -Body $pbody -ContentType 'application/json' | Out-Null
  Write-Host 'project created'
} catch {
  Write-Host 'project already exists (ok)'
}

# --- build manifest + multipart (Direct Upload) ----------------------------
Add-Type -AssemblyName System.Net.Http
$files = Get-ChildItem -Path $Dir -Recurse -File
Write-Host "files      = $($files.Count)"

$sha = [System.Security.Cryptography.SHA256]::Create()
$manifest = @{}
$http = New-Object System.Net.Http.HttpClient
$http.Timeout = [TimeSpan]::FromMinutes(10)
$http.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $Token)
$mp = New-Object System.Net.Http.MultipartFormDataContent

foreach ($f in $files) {
  $rel = $f.FullName.Substring($Dir.Length).TrimStart('\', '/') -replace '\\', '/'
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $hash = ([System.BitConverter]::ToString($sha.ComputeHash($bytes)) -replace '-', '').ToLower()
  $manifest[$rel] = $hash
  $content = New-Object System.Net.Http.ByteArrayContent($bytes)
  $content.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue('application/octet-stream')
  $mp.Add($content, $rel, $rel)
}
$manifestJson = $manifest | ConvertTo-Json -Compress
$mf = New-Object System.Net.Http.StringContent($manifestJson, [System.Text.Encoding]::UTF8, 'application/json')
$mp.Add($mf, 'manifest')

Write-Host 'uploading...'
$resp = $http.PostAsync("$base/accounts/$AccountId/pages/projects/$Project/deployments", $mp).Result
$text = $resp.Content.ReadAsStringAsync().Result

if ($resp.IsSuccessStatusCode) {
  $json = $text | ConvertFrom-Json
  Write-Host ''
  Write-Host 'DONE - live at:'
  Write-Host ("  {0}" -f $json.result.url)
} else {
  Write-Host "FAILED: HTTP $([int]$resp.StatusCode)"
  Write-Host $text
}
