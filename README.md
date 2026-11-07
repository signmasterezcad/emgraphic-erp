# EMGRAPHIC ERP

Foto, çap və xırda promo işləri üçün satış və anbar proqramı (Windows).

## Nə edir
- **Satış ekranı:** böyük düymələr, say pilləli qiymət (məs. A4 1–10 / 11–50 / 51+)
- **Resept:** satışda kağız anbardan avtomatik silinir (eyni kağız fərqli xidmətlərdə)
- **Zay qeydi:** material, say, səbəb, işçi
- **Hesabat / Anbar:** günlük kassa, mənfəət, zay faizi, sayım fərqi

## Qovluqlar
- `app/index.html` — proqramın özü (bütün ekran və məntiq)
- `app/main.js`, `app/package.json` — Windows pəncərəsi (Electron)
- `tests/smoke.js` — sadə avtomatik test (Playwright)

## Windows .exe yığmaq
```bash
npx @electron/packager ./app "EMGRAPHIC ERP" --platform=win32 --arch=x64 --electron-version=33.2.1 --out=dist --overwrite
```

Satış və anbar məlumatı yalnız istifadəçinin kompüterində saxlanır (`%APPDATA%\EMGRAPHIC ERP`), bu depoya düşmür.
