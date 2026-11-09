# KASSA - yenileme skripti
# app/files.txt siyahisindaki butun fayllari (KASSA.exe daxil) GitHub-dan yukleyir.
# Kohne versiya app.evvelki qovluguna saxlanir. Satis melumatina ve ehtiyat qovluguna toxunmur.
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $root "app"
$oldDir = Join-Path $root "app.evvelki"
# Köhnə (Electron) quruluş
if (-not (Test-Path $appDir) -and (Test-Path (Join-Path $root "resources\app"))) { $appDir = Join-Path $root "resources\app"; $oldDir = Join-Path $root "resources\app.evvelki" }
$tmp    = Join-Path $env:TEMP "emgraphic-yeni"
$exe    = Join-Path $root "KASSA.exe"
# Kohne ad (kecid dovru): yalniz kohne skriptler ucun files.txt-de qalir; bu skript onu yuklemir ve silir
$legacy = @("EMGRAPHIC ERP.exe")
$base   = "https://raw.githubusercontent.com/signmasterezcad/emgraphic-erp/main"
$nc     = "?t=" + [DateTimeOffset]::Now.ToUnixTimeSeconds()

# files.txt-də "../X" yazılan fayl proqramın əsas qovluğuna gedir (məs. EMGRAPHIC ERP.exe)
function Tmp-Path($f) { if ($f.StartsWith("../")) { return (Join-Path $tmp ("_root\" + $f.Substring(3))) } return (Join-Path $tmp $f) }
function Dest-Path($f) { if ($f.StartsWith("../")) { return (Join-Path $root $f.Substring(3)) } return (Join-Path $appDir $f) }
function Get-File($rel, $dest) {
  $dir = Split-Path -Parent $dest
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Invoke-WebRequest -Uri ($base + "/" + $rel.Replace(" ", "%20") + $nc) -OutFile $dest -UseBasicParsing
}
function Get-Ver($file) {
  if (-not (Test-Path $file)) { return "" }
  return [regex]::Match((Get-Content $file -Raw -Encoding UTF8), 'APP_VERSION="([^"]+)"').Groups[1].Value
}

Write-Host "KASSA yenilənir..." -ForegroundColor Cyan
if (-not (Test-Path $appDir)) { Write-Host "Xəta: bu skript KASSA proqramının qovluğunda olmalıdır." -ForegroundColor Red; exit 1 }

try {
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  New-Item -ItemType Directory -Path $tmp | Out-Null
  Get-File "app/files.txt" (Join-Path $tmp "files.txt")
  $list = Get-Content (Join-Path $tmp "files.txt") | Where-Object { $_.Trim() -ne "" } |
    Where-Object { $legacy -notcontains ($_.Trim() -replace '^\.\./', '') }
  foreach ($f in $list) {
    $f = $f.Trim(); Write-Host "  yüklənir: $f"
    $rel = if ($f.StartsWith("../")) { $f.Substring(3) } else { "app/" + $f }
    Get-File $rel (Tmp-Path $f)
    if ($f.EndsWith(".exe")) {
      $b = [IO.File]::ReadAllBytes((Tmp-Path $f))
      if ($b.Length -lt 100000 -or $b[0] -ne 0x4D -or $b[1] -ne 0x5A) { throw "$f düzgün proqram faylı deyil" }
    }
  }
  Get-File "windows/yenile.ps1" (Join-Path $tmp "_yenile.ps1")
  Get-File "windows/YENILE.bat" (Join-Path $tmp "_YENILE.bat")
} catch {
  Write-Host "Yükləmək alınmadı. İnternet bağlantısını yoxlayın. Heç nə dəyişmədi." -ForegroundColor Red
  Write-Host $_.Exception.Message; exit 1
}

$newIndex = Join-Path $tmp "index.html"
if ((Get-Content $newIndex -Raw -Encoding UTF8) -notmatch "KASSA") { Write-Host "Yüklənən fayl düzgün deyil, heç nə dəyişmədi." -ForegroundColor Red; exit 1 }
$newVer = Get-Ver $newIndex
$oldVer = Get-Ver (Join-Path $appDir "index.html")

if ($newVer -and $newVer -eq $oldVer) {
  Write-Host "Sizdə artıq ən son versiya var: v$newVer" -ForegroundColor Green
} else {
  $p = Get-Process -Name "KASSA", "EMGRAPHIC ERP" -ErrorAction SilentlyContinue
  if ($p) { Write-Host "  proqram bağlanır..."; $p | Stop-Process -Force; $p | Wait-Process -Timeout 15 -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 1
  if (Test-Path $oldDir) { Remove-Item $oldDir -Recurse -Force }
  Copy-Item $appDir $oldDir -Recurse -Force
  foreach ($f in $list) {
    $f = $f.Trim(); $dest = Dest-Path $f; $dir = Split-Path -Parent $dest
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if ($f.EndsWith(".exe") -and (Test-Path $dest)) { Copy-Item $dest ($dest + ".evvelki") -Force }
    for ($i = 1; $i -le 5; $i++) {
      try { Copy-Item (Tmp-Path $f) $dest -Force; break }
      catch { if ($i -eq 5) { throw }; Start-Sleep -Seconds 2 }
    }
  }
  # Kohne adli fayllari sil, qisayollari KASSA.exe-ye yonelt
  if (Test-Path $exe) {
    foreach ($n in $legacy) { foreach ($x in @($n, "$n.evvelki")) { $q = Join-Path $root $x; if (Test-Path $q) { Remove-Item $q -Force -ErrorAction SilentlyContinue } } }
    try {
      $sh = New-Object -ComObject WScript.Shell
      foreach ($d in @($root, [Environment]::GetFolderPath('Desktop'))) {
        $lnk = Join-Path $d "KASSA.lnk"
        if ($d -eq $root -or (Test-Path $lnk)) { $l = $sh.CreateShortcut($lnk); $l.TargetPath = $exe; $l.WorkingDirectory = $root; $l.Save() }
      }
    } catch { }
  }
  Copy-Item (Join-Path $tmp "_YENILE.bat") (Join-Path $root "YENILE.bat") -Force
  Copy-Item (Join-Path $tmp "_yenile.ps1") (Join-Path $root "yenile.ps1") -Force
  Write-Host "Hazırdır: v$oldVer -> v$newVer" -ForegroundColor Green
  Write-Host "Satış və anbar məlumatınız toxunulmadı. Köhnə versiya: $oldDir"
}
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path $exe) { Start-Process $exe } elseif (Test-Path (Join-Path $root "EMGRAPHIC ERP.exe")) { Start-Process (Join-Path $root "EMGRAPHIC ERP.exe") }
