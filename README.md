# EMGRAPHIC ERP

Foto, çap və xırda promo işləri üçün satış və anbar proqramı (Windows).

## Nə edir
- **Satış ekranı:** böyük düymələr, say pilləli qiymət (məs. A4 1–10 / 11–50 / 51+)
- **Resept:** satışda kağız anbardan avtomatik silinir (eyni kağız fərqli xidmətlərdə)
- **Zay qeydi:** material, say, səbəb, işçi
- **Hesabat / Anbar:** günlük kassa, mənfəət, zay faizi, sayım fərqi
- **Ayarlar:** bölmələr (əlavə et, adını dəyiş, sırala, sil), rəngli düymələr (rəng, ikon, qiymət pillələri, resept, sıra), materiallar və işçilər
- **Düzəliş rejimi:** satış ekranında ✏️ Düzəliş basıb bölmə və düymələri birbaşa əlavə etmək, dəyişmək, silmək
- **Oflayn:** şrift proqramın içindədir, internet tələb olunmur
- **Ehtiyat nüsxə:** bütün məlumatı fayla yazmaq və geri yükləmək

## Qovluqlar
- `app/index.html` — proqramın özü (bütün ekran və məntiq)
- `launcher/` — `EMGRAPHIC ERP.exe` başladıcısı (Go + Windows-un daxili WebView2 mühərriki, ~3 MB)
- `app/fonts/` — Noto Sans şrifti (oflayn)
- `app/files.txt` — yeniləmə skriptinin yüklədiyi faylların siyahısı (yeni fayl əlavə edəndə bura yazın)
- `windows/YENILE.bat`, `windows/yenile.ps1` — bir kliklə yeniləmə (yeni `index.html`-i bu depodan yükləyir)
- `tests/smoke.js` — avtomatik test (Playwright): `node tests/smoke.js`

## Windows .exe yığmaq
```bash
cd launcher && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o "EMGRAPHIC ERP.exe" .
```
Qovluq quruluşu: `EMGRAPHIC ERP.exe`, `app/` (bu depodakı `app` qovluğu), `YENILE.bat`, `yenile.ps1`.

WebView2 Windows 11-də və yenilənmiş Windows 10-da artıq var. Yoxdursa, proqram quraşdırma linkini göstərir.

## Yeniləmə
Proqram qovluğundakı `YENILE.bat` faylına iki dəfə klikləyin. Skript `app/files.txt`-dəki bütün faylları yükləyir, proqramı bağlayır, köhnə versiyanı `resources\app.evvelki` qovluğunda saxlayır, yeni faylları qoyur, özünü də yeniləyir və proqramı yenidən açır.

Satış və anbar məlumatı yalnız istifadəçinin kompüterində saxlanır (`%APPDATA%\EMGRAPHIC ERP\WebView2`), bu depoya düşmür.
