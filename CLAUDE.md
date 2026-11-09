# KASSA — layihə qeydləri

**Ad: KASSA** (v0.17.0-dan daxili adlar da): `KASSA.exe`, məlumat `%APPDATA%\KASSA\data\kassa-data.json`,
ehtiyat faylları `kassa-...json`, ehtiyatda `app:"KASSA"`. Sahibi proqramı gələcəkdə başqalarına satmaq istəyir —
"emgraphic" sözü alıcıya görünməməlidir.

**Köhnə ad (EMGRAPHIC ERP) — v0.21.1-də təmizləndi:**
- Depoda `EMGRAPHIC ERP.exe` yoxdur, `files.txt`-də də yoxdur; `index.html`-də "EMGRAPHIC" sözü qalmayıb (yenile.ps1 "KASSA" yoxlayır).
- `yenile.ps1` **hər işə düşəndə** (versiya eyni olsa da): köhnə `EMGRAPHIC ERP.exe(.evvelki)`-ni silir, `ehtiyat\emgraphic-*.json` → `kassa-*.json`
  adlandırır, `KASSA.lnk` qısayollarını (qovluqda və iş masasında varsa) `KASSA.exe`-yə + `app\kassa.ico`-ya yönəldir.
- Başladıcıda hələ qalır (zərərsiz, satış paketində silinəcək): köhnə `%APPDATA%\EMGRAPHIC ERP` məlumatını köçürmə, `emgraphic-` ehtiyatlarını tanıma,
  köhnə adla açılanda KASSA.exe-ni açma. go.mod modul adı `emgraphic-erp/launcher`.
- **GitHub adı `signmasterezcad/kassa`** (istifadəçi adı dəyişdi; köhnə `emgraphic-erp` ünvanı GitHub tərəfindən yönləndirilir).
  `yenile.ps1` (v0.21.1-dən) `kassa` ünvanından yükləyir. İş qovluğu: `/home/user/kassa`.
  GitHub səhifəsindəki "About" təsviri və köhnə commit mesajlarında hələ "EMGRAPHIC" var (tarixçə dəyişdirilmir; satışdan əvvəl depo Private olmalıdır).
- Qısayol: `KASSA.exe` bir dəfə proqram qovluğunda və iş masasında `KASSA.lnk` yaradır/yönəldir (işarə: `%APPDATA%\KASSA\qisayol-kassa-ikon`).

Foto, çap və xırda promo işləri üçün kassa/anbar proqramı (Windows). Sahibi proqramçı deyil:
**həmişə Azərbaycan dilində, sadə və addım-addım yaz**, texniki termini izah et.

## Biznes məntiqi (əsas fikir)
- **Material** (anbarda: A4 80 qr, foto kağız 10x15, vizit kağızı…) ilə **satılan düymə/xidmət** ayrıdır.
- Hər düymənin **resepti** var: 1 ədəd satışda anbardan hansı materialdan neçə silinir
  (məs. 3x4 paket = 1 foto kağız 10x15; vizit 100 əd = 10 vərəq vizit kağızı).
- Eyni kağız fərqli düymələrdə fərqli qiymətə satılır (boş A4 0.05, A4 rəngli çap 1.00).
- **Qiymət pillələri**: say artdıqca 1 ədədin qiyməti dəyişir (1+, 11+, 51+…).
- **Zay** ayrıca qeyd olunur (səbəb, işçi). **Sayım fərqi** = qeydə alınmayan itki.
- **Qrup düyməsi** (`group:1`): basanda içində düymələr açılır, öz qiyməti/resepti yoxdur.
  İçindəki düymələrdə `parent: <qrup id>` olur. Yalnız bir səviyyə (qrupun içində qrup yoxdur).
- **ÇAP bölməsi** (id `cap`): 5 qrup — A4 Sadə (`g_a4`), A3 Sadə (`g_a3`), Sertifikat Kağızı (`g_sert`), Foto Kağızlar (`g_foto`),
  Sənəd Surəti (Kserokopiya) (`g_kser`; `S.mig.kserQrup`).
  - A4 Sadə (`S.mig.a4Sade`, hər biri 1 vərəq A4 80 qr): Sadə yazı ağ-qara 0.10 / 101+ 0.05 (`a4s_bw`),
    30% rəngli çap 0.20 (`a4s_30`), 40% rəngli çap 0.30 (`a4s_40`),
    60% rəngli çap 0.40 (`a4s_60`), 100% rəngli çap 0.50 (`a4s_100`; `S.mig.a4Sade2`). "Qismən" sözü çıxarılıb (`S.mig.qismenYox`).
    İki tərəfli çap 0.15 (`a4s_2t`), Elan hazırlanması 0.50 (`a4s_elan`; `S.mig.a4Sade3`).
    İki tərəfli rəngli çap 0.25 (`a4s_2tr`; `S.mig.a4Sade4`).
  - Sənəd Surəti (`S.mig.kserIci`): A4 ağ-qara surət 0.20 / 51+ 0.15 (`ks_a4bw`, 1 vərəq A4), A3 ağ-qara surət 0.50 (`ks_a3bw`),
    A3 ağ-qara surət (2 üzlü) 1.00 (`ks_a3bw2`) — A3 materialı hələ yoxdur, resept boşdur;
    Telefondan sənəd surəti 0.30 (`ks_tel`, 1 vərəq A4; `S.mig.telQiymet`).
  - A3 Sadə (0.50) və Sertifikat Kağızı (1.00) qrup deyil, birbaşa satış düyməsidir (`S.mig.a3Sert`; material yoxdur).
  - Foto Kağızlar (`S.mig.fotoIci`, id `fk_1015`…): 10x15 0.40 (1 foto kağız 10x15), 13x18 0.80, 15x21 1, 20x25 3, 21x30 3,
    25x38 8, 30x40 12, 30x42 12, 30x45 15 (10x15-dən başqalarının materialı yoxdur).
- **Poliqrafiya Xidmətləri** (id `poli`, ÇAP-ın yanında; `S.mig.poliBolme`): 4 qrup — Skan Etmə (`g_skan`), Spiral Cildləmə (`g_spiral`),
  Laminasiya A4 (`g_lamA4`), Laminasiya A3 (`g_lamA3`). İçi (`S.mig.poliIci`):
  - Skan Etmə: A4 skan 0.50 (`sk_a4`), A3 skan 0.50 (`sk_a3`). Spiral: 50/100/200/300 vərəqə qədər — 3/5/7/10 (`sp_50`…`sp_300`).
  - Laminasiya A4 (1.00, 1 Laminasiya A4 plyonka) və A3 (2.00, material yoxdur) qrup deyil, birbaşa satış düyməsidir (id-ləri `g_` ilə qalıb).
- **Sublim** bölməsini istifadəçi özü yaradıb (id təsadüfi, adla tapılır; `S.mig.sublimFincan`): Fincan Sadə (`fc_sade`), Fincan Termo (`fc_termo`),
  Fincan rəngli (`fc_reng`), Fincan toplu (`fc_toplu`). Qiymətlər (`S.mig.fincanQiymet`): Sadə 8 / 11+ 6, Termo 10, rəngli 10, toplu 13 (11+ pilləsi ləğv edilib; `S.mig.topluPille`).
  Açarlıq 8 (`sb_acar`), Köynək 15 / 6+ 12 (`sb_koynek`; `S.mig.acarKoynek`).
  Yaxa kartı — qrup (`g_yaxa`; `S.mig.yaxaQrup`), içindəki növləri istifadəçi yazacaq.
  Qruplar (`S.mig.sublimQruplar`, hamısı boş, istifadəçi zamanla yazacaq): Plaket (`g_plaket`), Suvenir (`g_suvenir`),
  Bayraq təkli/ikili/üçlü (`g_bayraq1/2/3`), Medal (`g_medal`), Alışqan (`g_alisqan`), Body (`g_body`).
- Qiyməti 0 olan düymə "⚠ qiymət yoxdur" göstərir və satılmır.
- **Kəsim Plotter** (id `plotter`) və **Fiber Lazer** (id `lazer`) bölmələri (`S.mig.plotterLazer`) — hələ boşdur.
- **🔍 Axtarış** (v0.13.0) Sevimlilər-in yerinə gəlib (daxili açar `"search"`, həmişə birinci tab, açılışda seçilir).
  Bütün bölmə və qruplarda düymə adı + qrup + bölmə adına görə axtarır; ə/ş/ç/ğ/ı/ö/ü hərfsiz yazmaq olar; Enter birinci nəticəni əlavə edir.
  Düymələrdəki köhnə `fav` sahəsi artıq işlənmir.
- İndi bölmələr: Axtarış, ÇAP, Poliqrafiya Xidmətləri, Sublim, Kəsim Plotter, Fiber Lazer.
- **Klaviatura ilə nağd ödəniş** (v0.14.0): sifarişdə məhsul varsa, Space və ya Enter 1.5 saniyə ərzində iki dəfə → nağd satış.
  Birinci basış "Ödənildi" düyməsini sarı edir. Pəncərə açıq, düzəliş rejimi və ya yazı xanasında işləmir.
  Axtarışda: hərf yaz → Enter (birinci nəticə əlavə olunur) → Enter Enter (ödə). Yazı dəyişməyibsə (`qAdded===q`),
  xanadakı Enter də ödəniş sayılır — fokus xanada qalsa belə məhsul ikinci dəfə əlavə olunmur.
- **🧾 Satış Tarixçəsi** (v0.15.0, "Cari sifariş" başlığının sağında): gün seçimi (Bu gün / Dünən / Bütün günlər), Nağd/Kart filtri,
  tarix gg.aa.iiii, saat ss:dd, cəmlər. Admin istənilən satışı silə bilər (təsdiqlə); silmədən əvvəl ehtiyat nüsxə,
  satışın `used` sahəsindəki material anbara qaytarılır (v0.15.0-dan əvvəlki satışlarda `used` yoxdur).
- **💸 Xərclər** (v0.18.0, başlıqda): 1-ci mərhələ hazırdır — **📦 Mal alışı** (`S.purchases`): təchizatçı, ödəniş nağd/kart/nisyə,
  bir qəbzdə bir neçə mal; "Say × 1 paçkada" = anbara düşən say; yeni mal yerindəcə yaradılır (vahid: ədəd/vərəq/…);
  "Olduğu kimi satıram" seçilən düymənin reseptinə [mal, 1] əlavə edir. Anbar artır, maya **orta qiymətlə** yenilənir:
  (köhnə qalıq × köhnə maya + alış məbləği) / (köhnə qalıq + alınan say). Alış silinəndə anbar və maya geri hesablanır.
  **📋 Alış tarixçəsi** (bu ay cəmləri), **💳 Borclar** (nisyə, təchizatçı üzrə, "Ödədim: nağd/kart"), başlıqda borc nişanı.
  Mal alışı mənfəətdən çıxılmır (anbardır); maya satışda reseptlə çıxılır.
  2-ci mərhələ (v0.19.0): **🧾 Digər xərclər** (`S.expenses`, növlər `S.expCats` — əlavə etmək olur), ay seçimi və növ üzrə cəmlər;
  **🔁 aylıq təkrarlanan** (`S.recurring`; xərcdə `rec` = şablon id; "bu ay ödənilib" monKey ilə yoxlanır).
  **💰 Kassa** (Hesabat → Bu gün, `cashDay()`): səhər kassada (`S.cash[gün].open`) + nağd satış − nağd alış − nağd ödənmiş borc − nağd xərc
  = kassada olmalıdır; "saydım" (`counted`) ilə fərq. "Xalis qazanc" adı "Satışdan qazanc" oldu (xərclər aylıq hesabatda çıxılacaq).
  3-cü mərhələ (v0.20.0): **📅 Aylıq** tab (Hesabat / Anbar; `monthStats()`, `renderMonthly()`): xalis = satış − satış sətirlərinin `cost`-u
  − zay `cost` − digər xərclər (mal alışı çıxılmır). Ay seçimi, əvvəlki ayla ▲/▼ % (xərclərdə azalma yaşıl), son 12 ayın SVG sütun
  qrafiki (Satış `--series-1`, Xalis `--series-2`, validator hər iki mövzuda keçib), 24 aylıq cədvəl, ayın xərc növləri və ən çox satılanlar.
- **Pəncərəni böyüt / kiçilt** (v0.21.0): hər `.ov` pəncərənin başlığında "⛶ Böyüt / 🗗 Kiçilt" (və başlığa iki dəfə basmaq);
  seçim `localStorage["kassa.maxed"]`-də (pəncərə id-sinə görə).
- **Loqo** (v0.21.0): `launcher/icon/kassa.svg` (mavi kvadrat, qəbz, K) → PNG-lər → `app/kassa.ico` (öz Python skriptimizlə, PNG daxilli ICO)
  və `app/kassa.svg` (başlıq + favicon). Başladıcı pəncərə/tapşırıq zolağı ikonunu `LoadImageW`+`WM_SETICON` ilə qoyur;
  qısayollar `IconLocation = app\kassa.ico` (işarə `qisayol-kassa-ikon`). **exe faylının öz ikonu hələ yoxdur** — resurs
  (`.syso`) üçün go-winres işlətmək bu mühitdə icazəsiz oldu; istifadəçi icazə versə, `go-winres simply --icon` ilə edilər.
- **👥 Kassirlər və icazələr** (v0.22.0): `S.users=[{id,name,pin,role:"admin"|"kassir",perms:{}}]`; köhnə `S.workers` adlardan
  bir dəfə yaradılır (adı "Admin" olan və ya birinci → admin), `S.workers` adların siyahısı kimi saxlanır (`syncWorkers()`).
  PIN 4–6 rəqəm, faylda yalnız izi (`pinHash`, FNV — ciddi qoruma deyil, təsadüfi baxışa qarşıdır). Admin-in PIN-i yoxdursa
  proqram birbaşa admin kimi açılır (`startSession`), varsa giriş ekranı (`#ovLogin`, `.ov.lock` — kənara basanda bağlanmır).
  Başlıqda `#btnUser` = Çıxış. İcazələr `PERMS`: zay, hist, delSale, reports, cost, stock, exp, edit, backup;
  `can(p)` (admin hər şey), tablar `TAB_PERM` ilə süzülür (`repTabs()/setTabs()`), "👥 Kassirlər" tabı yalnız admin.
  Yeni kassir: `KASSIR_DEFAULT` = zay + hist. Satış/zay/sayım `worker: curName()`. "Endirim" funksiyası hələ yoxdur.
- **Hər əməliyyatdan sonra ehtiyat nüsxə** (v0.22.0): `save()` → `opBackupSoon()` (2 san. yığır) → `erpBackup(...,"emel")`,
  yalnız məlumat dəyişibsə (`dataSig()`, lastAuto/lastBackup nəzərə alınmır). exe-də `erpBackupKinds` yoxdursa (köhnə exe) işləmir.
  exe hər növü ayrıca saxlayır (`keepByKind`): emel 100, avto 60, el 30. Ehtiyat siyahısında növ süzgəci.
- **🚚 Tədarükçü** (v0.23.0, başlıqda `#btnSupp`, pəncərə `#ovSupp`): hazır mal alınan yerlər `S.suppliers=[{id,name}]`
  (ilkin: Samir Foto `sp1`, Vəfa Foto `sp2`, Şamil Vinetka `sp3`, Samir Banner `sp4`; admin adını dəyişir/əlavə edir/silir).
  Alış **`S.expenses`-ə** düşür: `{cat: tədarükçünün adı, supp: id, amount, pay: nağd|kart, note: nə alınıb, worker}` — ayın xalis
  mənfəətindən çıxılır, nağd olan kassa hesabından da. Ad dəyişəndə keçmiş qeydlərin `cat`-ı da dəyişir.
  **Nisyə** (v0.24.0): `pay:"nisyə"` — xərc alış günü sayılır, kassaya toxunmur. Ödənişlər `S.suppPays=[{id,supp,name,ts,amount,by:nağd|kart,worker}]`,
  hissə-hissə olar (borcdan çox yox). Borc = `suppOwed(id)` = nisyə cəmi − ödənişlər. Nağd ödəniş `cashDay()`-də "borc ödənişi" kimi çıxılır.
  "💳 Borclar" tabı + başlıqda `#suppBadge` — icazə `suppDebt` (kassirə standart bağlı). Ödənişi yalnız admin silir;
  üstünə ödəniş olunmuş nisyə alışı silmək olmur.
  İcazələr: `supp` (alışı yazmaq, nisyə daxil; kassirlərə standart, `S.mig.suppPerm` mövcud kassirlərə verdi), `suppRep` (aylıq hesabat).
  Kassir yalnız bu gün öz yazdığını silə bilər, admin hamısını; tarixi yalnız admin seçə bilir.
  **Mal-mal qeyd** (v0.25.0): alış formasında sətirlər (`sl_n_i` ad, `sl_q_i` say, `sl_s_i` məbləğ), cəmi özü; qeyddə `lines:[{name,qty,sum}]`,
  `note` = "Ad ×say, …". Əvvəlki adlar datalist ilə təklif olunur. Aylıq hesabatda "nə alınıb" cədvəli (tədarükçü + mal üzrə cəm).
  **Qiymət siyahısı** (v0.26.0): `S.suppliers[].items=[{id,name,price}]` (1 ədədin alış qiyməti). Formada düymə kimi (`data-s="pli"`):
  basanda sətir əlavə olunur / say +1, məbləğ = say × qiymət (sətirdə `price`). Admin "⚙️ Tədarükçülər → 💲 Qiymətlər"-də dəyişir.
  Samir Foto (`S.mig.samirQiymet`): Foto 10x15 0.30, 13x18 0.40, 15x21 0.45, 20x25 2, 21x30 2, 25x30 4, 25x38 4.
  Bu alış qiymətləri satış düymələrinin mayasına (resept) **qoşulmayıb** — alış artıq xərc kimi çıxılır, qoşsaq iki dəfə çıxılar.
  **Özümüz / Tədarükçü** (v0.27.0): düymədə `src:{supp,item}` (redaktorda "Tədarükçüdən hazır da alınır?" `#e_src`).
  `S.mig.fotoSrc`: Foto Kağızlar (`g_foto`) düymələri ölçüyə görə Samir Foto-ya qoşuldu (10x15, 13x18, 15x21, 20x25, 21x30, 25x38; 30x40+ yox).
  Basanda `#ovSrc` (1 = Özümüz, 2 = tədarükçü, Esc). Sifariş sətri `{id,q,from}`, açar `okey()` = "id@from"; satış qiyməti eynidir.
  Tədarükçü sətri: anbardan material silinmir, `cost:0` (alış xərclərdədir — iki dəfə çıxılmasın), `from`, `fromName`, `scost` = say × alış qiyməti.
  Hesabat: "Məhsul + mənfəət"də ayrı sətir (maya = scost); 📅 Aylıq-da `srcSection()`: özümüz satış, tədarükçü satışı / alış qiyməti ilə / qazanc, ölçü cədvəli.
- **🏢 Borclular — müəssisələrə nisyə satış** (v0.25.0; v0.27.1-də ekranda "Borca" → **"Nisyə"**, düymə "Nisyəyə yaz ✓"): "Cari sifariş"də `#payDebt` "📝 Nisyə" → `#ovCust` müəssisə seçimi
  (yenisini orada əlavə etmək olar) → `pay="borc"` (daxili ad dəyişmir), `ordCust`. Satış: `pay:"borc", cust, custName`.
  `S.customers=[{id,name}]`, pul alınanda `S.custPays=[{id,cust,name,ts,amount,by,worker}]` (hissə-hissə). Borc = `custOwed(id)`.
  Satış həmin gün satış/mənfəət sayılır; kassaya yalnız nağd alınan pul düşür (`cashDay().custIn`, "+ Borclulardan alınan nağd").
  Başlıqda `#btnCust` "🏢 Borclular" + `#custBadge`, pəncərə `#ovCDebt` (Borclar / Müəssisələr — admin). Tarixçədə "📝 Nisyə" süzgəci.
  İcazələr: `custSale` (kassirə standart, `S.mig.custPerm`), `custDebt` (borcları görmək və pulu almaq, standart bağlı).
  Üstünə pul alınmış borca satışı silmək olmur.

- **Anbar sıfırlanıb (v0.12.1, `S.mig.anbarSifir`):** bütün materiallar silinib, bütün reseptlər boşdur
  (yuxarıda yazılan "1 vərəq A4" kimi reseptlər artıq yoxdur). Silmədən əvvəl ehtiyat nüsxə yazılıb.
  İstifadəçi "deyəndə" anbarı yenidən dolduracağıq və materialları düymələrə qoşacağıq.
  Bu köçürmə `upgrade()`-in **sonunda** qalmalıdır. Yeni quraşdırmada (`firstRun`) tətbiq olunmur.

## İstifadəçinin məlumatını dəyişmək
Düymələr istifadəçinin kompüterindəki faylda saxlanır, `SEED`-i dəyişmək ona təsir etmir.
Mövcud məlumatı dəyişmək lazımdırsa, `upgrade()`-də birdəfəlik köçürmə yaz və `S.mig.<ad>` bayrağı qoy
(nümunə: `S.mig.capQrup`). Satışlara, anbara toxunma.

## Quruluş
- `app/index.html` — bütün proqram (ekranlar + məntiq, bir fayl, kitabxanasız)
- `app/fonts/` — Noto Sans (oflayn). `app/files.txt` — yeniləmənin yüklədiyi fayllar
- `launcher/` — Go + WebView2 başladıcı. `main.go` (yalnız Windows), `storage.go` (məlumat faylı, ehtiyat nüsxə)
- `KASSA.exe` (depo kökündə) — hazır başladıcı; yeniləmə onu buradan yükləyir
- `windows/YENILE.bat` + `yenile.ps1` — istifadəçi iki klik edir, files.txt-dəki hər şeyi (exe daxil, `../` ilə) və özünü yeniləyir
- Məlumat: `%APPDATA%\KASSA\data\kassa-data.json`. Ehtiyat: proqram qovluğunda `ehtiyat\` (hər əməliyyatdan sonra + gündəlik + əl ilə, növ üzrə ayrıca saxlanır)
- exe içində `window.erpLoad/erpSave/erpBackup/...` var (`NATIVE`); brauzerdə localStorage işlədilir

## Hər dəyişiklikdə qaydalar
1. `app/index.html`-də `APP_VERSION`-u artır (yeniləmə skripti versiyanı müqayisə edir).
2. Yeni fayl əlavə edirsənsə, `app/files.txt`-ə yaz.
3. Launcher dəyişibsə: `cd launcher && go test ./... && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o ../KASSA.exe .`
4. Testlər: `node tests/smoke.js` (brauzer), `node tests/native.js` (exe simulyasiyası) və `node tests/users.js` (kassirlər + əməliyyat nüsxəsi) — hamısı OK olmalıdır.
5. Push-dan sonra yoxla: `https://raw.githubusercontent.com/signmasterezcad/kassa/main/app/index.html` yeni versiyanı verir (GitHub 5 dəqiqəyə qədər köhnəni göstərə bilər; yeni versiya görünənə qədər gözlə, sonra istifadəçiyə "hazırdır" de).
6. İstifadəçiyə **tam ZIP göndərmə** — `YENILE.bat` ilə yeniləsin. (Keçmişdə iki dəfə söz verib ZIP göndərmişik, bu, etimadı sarsıdıb.)

## Açıq məsələlər
- `YENILE.bat` Windows-da işləyir (istifadəçi v0.8.4-ə yenilənib, ekran şəklində görünür).
- WebView2 başladıcısının açılış sürəti Windows-da ölçülməyib.
- Təklif olunub, hələ edilməyib: setup (quraşdırma) faylı, telefon versiyası + sinxronlaşma, ehtiyat nüsxənin Google Drive qovluğuna da yazılması.

## Brauzer versiyası (nümayiş üçün)
https://claude.ai/artifact/5TkmNrGWJuyNTRNZoXi5vA — `app/index.html`-dən `<head>` və `<body>` teqləri çıxarılıb dərc olunur.
