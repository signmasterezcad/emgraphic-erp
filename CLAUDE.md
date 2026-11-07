# EMGRAPHIC ERP — layihə qeydləri

Foto, çap və xırda promo işləri üçün kassa/anbar proqramı (Windows). Sahibi proqramçı deyil:
**həmişə Azərbaycan dilində, sadə və addım-addım yaz**, texniki termini izah et.

## Biznes məntiqi (əsas fikir)
- **Material** (anbarda: A4 80 qr, foto kağız 10x15, vizit kağızı…) ilə **satılan düymə/xidmət** ayrıdır.
- Hər düymənin **resepti** var: 1 ədəd satışda anbardan hansı materialdan neçə silinir
  (məs. 3x4 paket = 1 foto kağız 10x15; vizit 100 əd = 10 vərəq vizit kağızı).
- Eyni kağız fərqli düymələrdə fərqli qiymətə satılır (boş A4 0.05, A4 rəngli çap 1.00).
- **Qiymət pillələri**: say artdıqca 1 ədədin qiyməti dəyişir (1+, 11+, 51+…).
- **Zay** ayrıca qeyd olunur (səbəb, işçi). **Sayım fərqi** = qeydə alınmayan itki.

## Quruluş
- `app/index.html` — bütün proqram (ekranlar + məntiq, bir fayl, kitabxanasız)
- `app/fonts/` — Noto Sans (oflayn). `app/files.txt` — yeniləmənin yüklədiyi fayllar
- `launcher/` — Go + WebView2 başladıcı. `main.go` (yalnız Windows), `storage.go` (məlumat faylı, ehtiyat nüsxə)
- `EMGRAPHIC ERP.exe` (depo kökündə) — hazır başladıcı; yeniləmə onu buradan yükləyir
- `windows/YENILE.bat` + `yenile.ps1` — istifadəçi iki klik edir, files.txt-dəki hər şeyi (exe daxil, `../` ilə) və özünü yeniləyir
- Məlumat: `%APPDATA%\EMGRAPHIC ERP\data\emgraphic-data.json`. Ehtiyat: proqram qovluğunda `ehtiyat\` (son 30, gündəlik avtomatik)
- exe içində `window.erpLoad/erpSave/erpBackup/...` var (`NATIVE`); brauzerdə localStorage işlədilir

## Hər dəyişiklikdə qaydalar
1. `app/index.html`-də `APP_VERSION`-u artır (yeniləmə skripti versiyanı müqayisə edir).
2. Yeni fayl əlavə edirsənsə, `app/files.txt`-ə yaz.
3. Launcher dəyişibsə: `cd launcher && go test ./... && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o "../EMGRAPHIC ERP.exe" .`
4. Testlər: `node tests/smoke.js` (brauzer) və `node tests/native.js` (exe simulyasiyası) — hamısı OK olmalıdır.
5. Push-dan sonra yoxla: `https://raw.githubusercontent.com/signmasterezcad/emgraphic-erp/main/app/index.html` yeni versiyanı verir.
6. İstifadəçiyə **tam ZIP göndərmə** — `YENILE.bat` ilə yeniləsin. (Keçmişdə iki dəfə söz verib ZIP göndərmişik, bu, etimadı sarsıdıb.)

## Açıq məsələlər
- `yenile.ps1` Windows-da hələ işlədilməyib (bu mühitdə PowerShell yoxdur). İstifadəçidən qara pəncərənin nəticəsini soruş.
- WebView2 başladıcısının açılış sürəti Windows-da ölçülməyib.
- Təklif olunub, hələ edilməyib: işçi girişi (şifrə; işçi maya/mənfəət görməsin), ehtiyat nüsxənin Google Drive qovluğuna da yazılması.

## Brauzer versiyası (nümayiş üçün)
https://claude.ai/artifact/5TkmNrGWJuyNTRNZoXi5vA — `app/index.html`-dən `<head>` və `<body>` teqləri çıxarılıb dərc olunur.
