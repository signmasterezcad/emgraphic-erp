# KASSA

Foto, çap və xırda promo işləri üçün satış və anbar proqramı (Windows).

## Nə edir
- **Satış ekranı:** böyük düymələr, say pilləli qiymət (məs. A4 1–10 / 11–50 / 51+)
- **Resept:** satışda kağız anbardan avtomatik silinir (eyni kağız fərqli xidmətlərdə)
- **Zay qeydi:** material, say, səbəb, işçi
- **Hesabat / Anbar:** günlük kassa, mənfəət, zay faizi, sayım fərqi
- **Ayarlar:** bölmələr (əlavə et, adını dəyiş, sırala, sil), rəngli düymələr (rəng, ikon, qiymət pillələri, resept, sıra), materiallar və işçilər
- **Düzəliş rejimi:** satış ekranında ✏️ Düzəliş basıb bölmə və düymələri birbaşa əlavə etmək, dəyişmək, silmək
- **Məlumat faylı:** `%APPDATA%\KASSA\data\kassa-data.json` (həcm həddi yoxdur, yazı yarıda kəsilsə köhnə fayl qorunur)
- **Avtomatik ehtiyat nüsxə:** hər gün proqram qovluğundakı `ehtiyat` papkasına, son 30 nüsxə saxlanır
- **Oflayn:** şrift proqramın içindədir, internet tələb olunmur
- **Ehtiyat nüsxə:** bütün məlumatı fayla yazmaq və geri yükləmək

## Qovluqlar
- `app/index.html` — proqramın özü (bütün ekran və məntiq)
- `launcher/` — `KASSA.exe` başladıcısı (Go + Windows-un daxili WebView2 mühərriki, ~3 MB)
- `app/fonts/` — Noto Sans şrifti (oflayn)
- `app/files.txt` — yeniləmə skriptinin yüklədiyi faylların siyahısı (yeni fayl əlavə edəndə bura yazın)
- `windows/YENILE.bat`, `windows/yenile.ps1` — bir kliklə yeniləmə (yeni `index.html`-i bu depodan yükləyir)
- `KASSA.exe` — hazır başladıcı (yeniləmə skripti onu buradan yükləyir)
- `tests/smoke.js` — brauzer testi, `tests/native.js` — exe mühitinin simulyasiyası (Playwright), `launcher/storage_test.go` — fayl əməliyyatları (`go test`)

## Windows .exe yığmaq
```bash
cd launcher && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o ../KASSA.exe .
```
Qovluq quruluşu: `KASSA.exe`, `app/` (bu depodakı `app` qovluğu), `YENILE.bat`, `yenile.ps1`.

WebView2 Windows 11-də və yenilənmiş Windows 10-da artıq var. Yoxdursa, proqram quraşdırma linkini göstərir.

## Yeniləmə
Proqram qovluğundakı `YENILE.bat` faylına iki dəfə klikləyin. Skript `app/files.txt`-dəki bütün faylları yükləyir, proqramı bağlayır, köhnə versiyanı `resources\app.evvelki` qovluğunda saxlayır, yeni faylları qoyur, özünü də yeniləyir və proqramı yenidən açır.

Satış və anbar məlumatı yalnız istifadəçinin kompüterində saxlanır (`%APPDATA%\KASSA\data`), bu depoya düşmür.
