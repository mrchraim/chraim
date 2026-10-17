param(
  [string]$Token = '',
  [string]$Site  = 'chrvvim0k0l0a0k0.netlify.app',
  [string]$Zip   = '',
  [switch]$ListSites
)
$ErrorActionPreference = 'Stop'

# --- resolve default zip (same folder as this script) ----------------------
if (-not $Zip) { $Zip = Join-Path $PSScriptRoot 'chrvvim-campus-DROPREDY.zip' }

# --- token from env if not passed -----------------------------------------
if (-not $Token) { $Token = $env:NETLIFY_AUTH_TOKEN }
if (-not $Token) {
  Write-Host 'ERROR: provide a Netlify personal access token via -Token or NETLIFY_AUTH_TOKEN.'
  Write-Host 'Create one: Netlify -> Applications -> Personal access tokens -> New access token.'
  exit 1
}

$api     = 'https://api.netlify.com/api/v1'
$headers = @{ Authorization = "Bearer $Token" }

# --- list sites (find the right one) --------------------------------------
if ($ListSites) {
  $sites = Invoke-RestMethod -Uri "$api/sites" -Headers $headers -Method Get
  $sites | Select-Object name, url, id, account_slug | Format-Table -AutoSize
  exit 0
}

# --- deploy a zip to the SAME site (keeps the same URL) --------------------
if (-not (Test-Path $Zip)) { throw "ZIP not found: $Zip" }
Write-Host "Deploying: $Zip"
Write-Host "To site  : $Site"
Write-Host "This publishes to the SAME Netlify URL (no link change)."
Write-Host ''

$dep = Invoke-RestMethod -Uri "$api/sites/$Site/deploys" -Headers $headers -Method Post -InFile $Zip -ContentType 'application/zip'
Write-Host "deploy id = $($dep.id)"
Write-Host "state     = $($dep.state)"
$id = $dep.id

$final = $null
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 3
  try {
    $final = Invoke-RestMethod -Uri "$api/deploys/$id" -Headers $headers -Method Get
    Write-Host ("  [{0,2}] state = {1}" -f ($i + 1), $final.state)
    if ($final.state -eq 'ready' -or $final.state -eq 'error') { break }
  } catch {
    Write-Host ("  [{0,2}] retry: {1}" -f ($i + 1), $_.Exception.Message)
  }
}

Write-Host ''
if ($final -and $final.state -eq 'ready') {
  Write-Host "DONE - live at:"
  Write-Host ("  {0}" -f $final.ssl_url)
  Write-Host ("  {0}" -f $final.url)
} elseif ($final) {
  Write-Host "Finished with state: $($final.state)"
} else {
  Write-Host 'Could not read deploy state (check the token / site).'
}
