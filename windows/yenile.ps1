# EMGRAPHIC ERP - yenileme skripti
# Yeni index.html-i GitHub-dan yukleyir, kohnesini ehtiyat kimi saxlayir.
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $root "resources\app"
$target = Join-Path $appDir "index.html"
$backup = Join-Path $appDir "index.evvelki.html"
$temp   = Join-Path $env:TEMP "emgraphic-index.html"
$exe    = Join-Path $root "EMGRAPHIC ERP.exe"
$url    = "https://raw.githubusercontent.com/signmasterezcad/emgraphic-erp/main/app/index.html"

Write-Host "EMGRAPHIC ERP yenilənir..." -ForegroundColor Cyan
if (-not (Test-Path $appDir)) { Write-Host "Xəta: bu skript EMGRAPHIC ERP qovluğunda olmalıdır." -ForegroundColor Red; exit 1 }

try {
  Invoke-WebRequest -Uri ($url + "?t=" + [DateTimeOffset]::Now.ToUnixTimeSeconds()) -OutFile $temp -UseBasicParsing
} catch {
  Write-Host "Yükləmək alınmadı. İnternet bağlantısını yoxlayın." -ForegroundColor Red
  Write-Host $_.Exception.Message; exit 1
}

$new = Get-Content $temp -Raw -Encoding UTF8
if ($new -notmatch "EMGRAPHIC ERP") { Write-Host "Yüklənən fayl düzgün deyil, heç nə dəyişmədi." -ForegroundColor Red; exit 1 }
$newVer = [regex]::Match($new, 'APP_VERSION="([^"]+)"').Groups[1].Value
$oldVer = ""
if (Test-Path $target) { $oldVer = [regex]::Match((Get-Content $target -Raw -Encoding UTF8), 'APP_VERSION="([^"]+)"').Groups[1].Value }

if ($newVer -and $newVer -eq $oldVer) {
  Write-Host "Sizdə artıq ən son versiya var: v$newVer" -ForegroundColor Green
} else {
  Get-Process -Name "EMGRAPHIC ERP" -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 1
  if (Test-Path $target) { Copy-Item $target $backup -Force }
  Copy-Item $temp $target -Force
  Write-Host "Hazırdır: v$oldVer -> v$newVer" -ForegroundColor Green
  Write-Host "Satış və anbar məlumatınız toxunulmadı."
}
Remove-Item $temp -ErrorAction SilentlyContinue
if (Test-Path $exe) { Start-Process $exe }
