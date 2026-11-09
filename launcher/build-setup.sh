#!/usr/bin/env bash
# KASSA-Setup.exe yığır (depo kökünə). İstifadə: launcher/build-setup.sh
set -euo pipefail
cd "$(dirname "$0")"
ROOT=..
P=setup/payload
rm -rf "$P" && mkdir -p "$P/app" && touch "$P/.keep"
cp "$ROOT/KASSA.exe" "$P/"
cp "$ROOT/windows/YENILE.bat" "$ROOT/windows/yenile.ps1" "$P/"
cp "$ROOT/app/files.txt" "$P/app/"
while IFS= read -r f; do f="${f%$'\r'}"; [ -z "$f" ] && continue; case "$f" in ../*) continue;; esac
  mkdir -p "$P/app/$(dirname "$f")"; cp "$ROOT/app/$f" "$P/app/$f"; done < "$ROOT/app/files.txt"
VER=$(grep -o 'APP_VERSION="[0-9.]*"' "$ROOT/app/index.html" | cut -d'"' -f2)
go test ./setup
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w -X main.version=$VER" -o "$ROOT/KASSA-Setup.exe" ./setup
rm -rf "$P" && mkdir -p "$P" && touch "$P/.keep"
ls -l "$ROOT/KASSA-Setup.exe"; echo "versiya $VER"
