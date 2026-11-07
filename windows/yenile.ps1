# EMGRAPHIC ERP - yenileme skripti
# app/files.txt siyahisindaki butun fayllari GitHub-dan yukleyir.
# Kohne versiya resources\app.evvelki qovluguna saxlanir. Satis melumatina toxunmur.
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $root "app"
$oldDir = Join-Path $root "app.evvelki"
# Köhnə (Electron) quruluş
if (-not (Test-Path $appDir) -and (Test-Path (Join-Path $root "resources\app"))) { $appDir = Join-Path $root "resources\app"; $oldDir = Join-Path $root "resources\app.evvelki" }
$tmp    = Join-Path $env:TEMP "emgraphic-yeni"
$exe    = Join-Path $root "EMGRAPHIC ERP.exe"
$base   = "https://raw.githubusercontent.com/signmasterezcad/emgraphic-erp/main"
$nc     = "?t=" + [DateTimeOffset]::Now.ToUnixTimeSeconds()

function Get-File($rel, $dest) {
  $dir = Split-Path -Parent $dest
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Invoke-WebRequest -Uri ($base + "/" + $rel + $nc) -OutFile $dest -UseBasicParsing
}
function Get-Ver($file) {
  if (-not (Test-Path $file)) { return "" }
  return [regex]::Match((Get-Content $file -Raw -Encoding UTF8), 'APP_VERSION="([^"]+)"').Groups[1].Value
}

Write-Host "EMGRAPHIC ERP yenilənir..." -ForegroundColor Cyan
if (-not (Test-Path $appDir)) { Write-Host "Xəta: bu skript EMGRAPHIC ERP qovluğunda olmalıdır." -ForegroundColor Red; exit 1 }

try {
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  New-Item -ItemType Directory -Path $tmp | Out-Null
  Get-File "app/files.txt" (Join-Path $tmp "files.txt")
  $list = Get-Content (Join-Path $tmp "files.txt") | Where-Object { $_.Trim() -ne "" }
  foreach ($f in $list) { Write-Host "  yüklənir: $f"; Get-File ("app/" + $f.Trim()) (Join-Path $tmp $f.Trim()) }
  Get-File "windows/yenile.ps1" (Join-Path $tmp "_yenile.ps1")
  Get-File "windows/YENILE.bat" (Join-Path $tmp "_YENILE.bat")
} catch {
  Write-Host "Yükləmək alınmadı. İnternet bağlantısını yoxlayın. Heç nə dəyişmədi." -ForegroundColor Red
  Write-Host $_.Exception.Message; exit 1
}

$newIndex = Join-Path $tmp "index.html"
if ((Get-Content $newIndex -Raw -Encoding UTF8) -notmatch "EMGRAPHIC ERP") { Write-Host "Yüklənən fayl düzgün deyil, heç nə dəyişmədi." -ForegroundColor Red; exit 1 }
$newVer = Get-Ver $newIndex
$oldVer = Get-Ver (Join-Path $appDir "index.html")

if ($newVer -and $newVer -eq $oldVer) {
  Write-Host "Sizdə artıq ən son versiya var: v$newVer" -ForegroundColor Green
} else {
  Get-Process -Name "EMGRAPHIC ERP" -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 1
  if (Test-Path $oldDir) { Remove-Item $oldDir -Recurse -Force }
  Copy-Item $appDir $oldDir -Recurse -Force
  foreach ($f in $list) {
    $dest = Join-Path $appDir $f.Trim(); $dir = Split-Path -Parent $dest
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item (Join-Path $tmp $f.Trim()) $dest -Force
  }
  Copy-Item (Join-Path $tmp "_YENILE.bat") (Join-Path $root "YENILE.bat") -Force
  Copy-Item (Join-Path $tmp "_yenile.ps1") (Join-Path $root "yenile.ps1") -Force
  Write-Host "Hazırdır: v$oldVer -> v$newVer" -ForegroundColor Green
  Write-Host "Satış və anbar məlumatınız toxunulmadı. Köhnə versiya: $oldDir"
}
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path $exe) { Start-Process $exe }
