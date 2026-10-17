#requires -Version 5.1
<#
  RUN_ALL.ps1  (ASCII only)

  One command to run the whole finishing sequence:
    1. create-and-push-repo.ps1      (create GitHub repo + push)
    2. deploy-legacy-redirects.ps1   (publish 301 redirects to legacy sites)
    3. verify-redirects.ps1          (confirm 301 -> primary)

  Prerequisites (credentials are entered ONCE, outside this script):
    - GitHub : run  gh auth login     OR set GITHUB_TOKEN
    - Netlify: set NETLIFY_AUTH_TOKEN OR put a PAT in
               %TEMP%\opencode\netlify_token.txt

  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File RUN_ALL.ps1 -DryRun
    powershell -NoProfile -ExecutionPolicy Bypass -File RUN_ALL.ps1
#>
param([switch]$DryRun)

$ErrorActionPreference = 'Continue'
function Step($t){ Write-Host ''; Write-Host ("=== " + $t + " ===") -ForegroundColor Cyan }

$common = @{}
if ($DryRun) { $common['DryRun'] = $true }

Step 'STEP 1/3  GitHub repository'
& (Join-Path $PSScriptRoot 'create-and-push-repo.ps1') @common

Step 'STEP 2/3  Legacy 301 redirects'
& (Join-Path $PSScriptRoot 'deploy-legacy-redirects.ps1') @common

Step 'STEP 3/3  Verification'
& (Join-Path $PSScriptRoot 'verify-redirects.ps1')

Step 'DONE'
