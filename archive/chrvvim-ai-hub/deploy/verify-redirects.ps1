#requires -Version 5.1
<#
  verify-redirects.ps1  (ASCII only)

  Read-only check that each legacy URL now permanently (301) redirects to the
  primary site and that deep paths + query strings are preserved.

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File verify-redirects.ps1
#>
param(
  [string]$Primary   = 'https://mr1mohamed1chraim.netlify.app',
  [string[]]$Legacy  = @('https://chrvvim0k0l0a0k0.netlify.app', 'https://mrchraimfsjpachrvvim.netlify.app'),
  [string]$DeepPath  = '/documents/s1-public-timetable.pdf?from=legacy&x=1'
)

$ErrorActionPreference = 'Continue'
function Line($m){ Write-Host $m }

function First-Status($u) { return (& curl.exe -s -o NUL -w "%{http_code}" $u).Trim() }
function First-Loc($u) {
  $h = (& curl.exe -s -D - -o NUL $u 2>&1 | Out-String)
  $m = [regex]::Match($h, '(?im)^location:\s*(.+?)\s*$')
  if ($m.Success) { return $m.Groups[1].Value.Trim() } else { return '-' }
}
function Followed($u) { return (& curl.exe -s -L --max-redirs 6 -o NUL -w "%{http_code} %{url_effective}" $u).Trim() }

Line "=== CHRVVIM legacy redirect verification ==="
Line ("primary : {0}" -f $Primary)
Line ''

$primaryCode = First-Status ($Primary + '/')
Line ("primary /                              -> {0}" -f $primaryCode)
Line ''

foreach ($base in $Legacy) {
  $root  = "$base/"
  $deep  = "$base$DeepPath"

  $code1 = First-Status $root
  $loc1  = First-Loc    $root
  $fin1  = Followed     $root

  $code2 = First-Status $deep
  $loc2  = First-Loc    $deep
  $fin2  = Followed     $deep

  Line ("--- {0}" -f $base)
  Line ("  /            first={0}  location={1}" -f $code1, $loc1)
  Line ("  /  followed  -> {0}" -f $fin1)
  Line ("  deep         first={0}  location={1}" -f $code2, $loc2)
  Line ("  deep followed-> {0}" -f $fin2)
  $okRedirect = ($code1 -eq '301' -or $code1 -eq '308')
  $okFinal    = ($fin1 -like '200*' -and $fin1 -like "*$Primary*")
  if ($okRedirect -and $okFinal) { Write-Host '  RESULT: OK (301 -> primary, path/query preserved)' -ForegroundColor Green }
  elseif ($code1 -eq '503') { Write-Host '  RESULT: NOT ACTIVE - legacy site is 503 usage_exceeded' -ForegroundColor Yellow }
  else { Write-Host ("  RESULT: CHECK (first={0}, followed={1})" -f $code1, $fin1) -ForegroundColor Yellow }
  Line ''
}
