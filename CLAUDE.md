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
  - A4 Sadə (`S.mig.a4Sade`, hər biri 1 vərəq A4 80 qr): Sadə yazı ağ-qara 0.10 (`a4s_bw`; v0.62.0 `S.mig.a4bwPille`: 101+ 0.05 pilləsi ləğv — sahibi Endirimlə edir),
    30% rəngli çap 0.20 (`a4s_30`), 40% rəngli çap 0.30 (`a4s_40`),
    60% rəngli çap 0.40 (`a4s_60`), 100% rəngli çap 0.50 (`a4s_100`; `S.mig.a4Sade2`). "Qismən" sözü çıxarılıb (`S.mig.qismenYox`).
    İki tərəfli çap 0.15 (`a4s_2t`), Elan hazırlanması 0.50 (`a4s_elan`; `S.mig.a4Sade3`).
    İki tərəfli rəngli çap 0.25 (`a4s_2tr`; `S.mig.a4Sade4`).
  - Sənəd Surəti (`S.mig.kserIci`): A4 ağ-qara surət 0.20 / 51+ 0.15 (`ks_a4bw`, 1 vərəq A4), A3 ağ-qara surət 0.50 (`ks_a3bw`),
    A3 ağ-qara surət (2 üzlü) 1.00 (`ks_a3bw2`) — A3 materialı hələ yoxdur, resept boşdur;
    Telefondan sənəd surəti 0.30 (`ks_tel`, 1 vərəq A4; `S.mig.telQiymet`).
  - Sertifikat Kağızı (1.00) birbaşa satış düyməsidir (`S.mig.a3Sert`). **A3 Sadə** v0.61.0-dan qrupdur (`S.mig.a3Qrup`, `g_a3`):
    A3 sadə 0.50 (`a3s_bw`), A3 50% rəngli 0.70 (`a3s_50`), A3 100% rəngli 1.00 (`a3s_100`); köhnə resept birinciyə keçir.
  - Foto Kağızlar (`S.mig.fotoIci`, id `fk_1015`…): 10x15 0.40 (1 foto kağız 10x15), 13x18 0.80, 15x21 1, 20x25 3, 21x30 3,
    25x38 8, 30x40 12, 30x42 12, 30x45 15 (10x15-dən başqalarının materialı yoxdur).
    v0.66.0 (`S.mig.fotoA4`): + A4 120 qram 2 (`fk_a4_120`), A4 Sticker 3 (`fk_a4_stk`).
- **Poliqrafiya Xidmətləri** (id `poli`, ÇAP-ın yanında; `S.mig.poliBolme`): 4 qrup — Skan Etmə (`g_skan`), Spiral Cildləmə (`g_spiral`),
  Laminasiya A4 (`g_lamA4`), Laminasiya A3 (`g_lamA3`). İçi (`S.mig.poliIci`):
  - Skan Etmə: A4 skan 0.50 (`sk_a4`), A3 skan 0.50 (`sk_a3`). Spiral: 50/100/200/300 vərəqə qədər — 3/5/7/10 (`sp_50`…`sp_300`).
  - Laminasiya A4 (1.00, 1 Laminasiya A4 plyonka) və A3 (2.00, material yoxdur) qrup deyil, birbaşa satış düyməsidir (id-ləri `g_` ilə qalıb).
  - v0.64.0 (`S.mig.vizitKonfet`): Vizit Kart 0.10 (`pq_vizit`) + 🍬 Konfet Kartı qrupu `g_konfet`: 0.50 / 0.40 / 0.80 (`kk_050`, `kk_040`, `kk_080`;
    adlar "Konfet Kartı 0.50"… — sahibi növlərini deməyib, dəqiqləşdirə bilər).
- **Sublim** bölməsini istifadəçi özü yaradıb (id təsadüfi, adla tapılır; `S.mig.sublimFincan`): Fincan Sadə (`fc_sade`), Fincan Termo (`fc_termo`),
  Fincan rəngli (`fc_reng`), Fincan toplu (`fc_toplu`). Qiymətlər (`S.mig.fincanQiymet`): Sadə 8 / 11+ 6, Termo 10, rəngli 10, toplu 13 (11+ pilləsi ləğv edilib; `S.mig.topluPille`).
  Açarlıq 8 (`sb_acar`), Köynək 15 / 6+ 12 (`sb_koynek`; `S.mig.acarKoynek`).
  Yaxa kartı — qrup (`g_yaxa`; `S.mig.yaxaQrup`), içindəki növləri istifadəçi yazacaq.
  Qruplar (`S.mig.sublimQruplar`, hamısı boş, istifadəçi zamanla yazacaq): Plaket (`g_plaket`), Suvenir (`g_suvenir`),
  Bayraq təkli/ikili/üçlü (`g_bayraq1/2/3`), Medal (`g_medal`), Alışqan (`g_alisqan`), Body (`g_body`).
  Plaket içi (v0.51.0, `S.mig.plaketIci`): Plaket 10x15 16 (`pk_1015`), 13x18 16 (`pk_1318`), 15x21 25 (`pk_1521`).
- Qiyməti 0 olan düymə "⚠ qiymət yoxdur" göstərir və satılmır.
- **Başlıq quruluşu** (v0.38.0, sahibinin seçimi): **📦 Anbar** (`#btnStock`, `mode="stock"`, `RT_STOCK`: Qalıq / Sayım `anbar`, Materiallar `mat`,
  ⚠ Az qalanlar `low`; icazə `stock`) — Hesabatdan "Anbar / Sayım", Ayarlardan "Materiallar" bura köçdü. **💳 Borclar** (`#btnCust`, pəncərə `#ovCDebt`):
  🏢 Bizə borclular (`debt`, custDebt) / 🚚 Bizim borclarımız (`sdebt`, suppDebt — `suppDebtHtml()`, Tədarükçü pəncərəsindəki Borclar tabı silindi) /
  Müəssisələr (admin); həmişə birinci tabla açılır; başlıqda iki nişan: `#custBadge` "bizə …", `#suppBadge` (qırmızı) "biz …". `data-s` düymələri
  `#ovCDebt` içində də işləyir. **📊 Hesabat** (adı "Hesabat / Anbar" idi) → yeni **💳 Borclar** tabı (`borc`, yalnız baxış, dövrlə: indiki borclar,
  dövrdə nisyə satış/alınan, nisyə alış/ödənən; mal alışı nisyəsi `purchDebt()` də sayılır).
- **Sol menyu** (v0.55.0, sahibinin istəyi): başlıqdakı düymələr `<nav class="side" id="sideNav">`-də — kompüterdə (>860px) solda sabit 200px zolaq
  (`body{padding-left:200px}`), hər düymə öz rəngi ilə (`--c`: Zay qırmızı, Anbar narıncı, Hesabat göy, Xərclər bənövşəyi, Borclar firuzəyi, Tədarükçü yaşıl,
  Ayarlar boz — aşağıda, `.sgap`); telefonda (≤860px) başlığın altında 2 sütunlu rəngli düymələr. Düymə içi: `.ic` + `.lb` (id-lər eyni qalıb).
  `.side .hbtn[hidden]{display:none}` vacibdir (display:flex hidden-i üstələyir).
  v0.60.0: menyunun boş yerində (`.sgap`) sahibinin göndərdiyi akvarel fotoaparat şəkli `app/kamera.png` (`.cam`; fonu Python ilə şəffaf edilib —
  damalı ağ/boz fon kənardan doldurulub, kənarlar yumşaq; files.txt və sw.js-də var; yalnız kompüterdə, ekran hündürlüyü ≤640px olanda gizli). v0.59.0-dakı SVG silindi.
- **✏️ Düzəliş** (v0.37.0): başlıqda yoxdur (`#btnEdit` gizli), **⚙️ Ayarlar**-ın yuxarısında "✏️ Düzəliş rejimini aç" (`data-act="goedit"`, `can("edit")`) —
  Ayarlar bağlanır, `setEdit(true)`; çıxış əvvəlki kimi "Hazır" (`editdone`).
- **Kəsim Plotter** və **Fiber Lazer** — v0.53.0-dan (`S.mig.plotLazPoli`, sahibinin istəyi) ayrıca bölmə deyil, **Poliqrafiya Xidmətləri**-nin içində qrup:
  `g_plotter` ✂️, `g_lazer` ⚡ (köhnə bölmələrdəki düymələr bu qruplara köçür, bölmələr silinir; köhnə id-lər `plotter`/`lazer` (`S.mig.plotterLazer`)). Lazerdə (v0.50.0, `S.mig.lazerM2`) `lz_m2` "Lazer işi" ⚡ — eyni qayda. Plotterdə (v0.49.0, `S.mig.plotterM2`)
  `pl_m2` "Plotter kəsimi" ✂️ — `area:1`, tədarükçüsüz (banner/vinil kimi m² + sərbəst qiymət, alış dəyəri yoxdur).
- **🔍 Axtarış** (v0.13.0; v0.56.0-dan **tab yoxdur**, sahibinin istəyi): axtarış çubuğu `#searchbar` həmişə bölmə düymələrinin altında görünür.
  `cat` açılışda birinci bölmə (`refreshCats`: "search" → `S.cats[0]`); yazı varsa (`q.trim()`) qrupsuz rejimdə bütün bölmələrdən nəticə (`S_`),
  nəticədəki qrupa basanda qrup açılır (geri = "🔍 Axtarış", yazı qalır); yazmağa başlayanda `grp=null`; bölmə tabına basanda axtarış təmizlənir;
  hər yerdə hərf yazanda xana özü seçilir (düzəliş rejimi və pəncərə açıq olmasa).
  Bütün bölmə və qruplarda düymə adı + qrup + bölmə adına görə axtarır; ə/ş/ç/ğ/ı/ö/ü hərfsiz yazmaq olar; Enter birinci nəticəni əlavə edir.
  Düymələrdəki köhnə `fav` sahəsi artıq işlənmir.
- İndi bölmələr: ÇAP, Poliqrafiya Xidmətləri (içində Kəsim Plotter, Fiber Lazer qrupları), Sublim, Banner / Vinil, **Studiya** (v0.41.0, id `studiya`, `S.mig.studiya`;
  içində `st_sened` "Sənəd Şəkli" — qiyməti hələ 0, sahibi yazacaq; v0.42.0 `S.mig.studiya2`: sahibinin özü yaratdığı "Sənəd şəkili Kostyum montaj" → 🤵, "Digər" → 🖼️ + `free:1`).
  **💬 Qiyməti razılaşma ilə** (`free:1`, redaktorda `#e_free`): basanda `#ovM2` "free" rejimi — "Nə çəkildi" qeydi (`m2_note`, istəyə görə), Ədəd,
  1 ədədin qiyməti ⇄ cəmi. Sifariş sətri `{uid,id,q,cp,note}`; satış sətri ad "Digər — qeyd", `plain` (hesabatda düymənin adı ilə qruplaşır), `note`. Sahibi sıranı özü dəyişib (ekranda: ÇAP, Banner / Vinil, Sublim, Fiber Lazer, Kəsim Plotter, Poliqrafiya…).
  **Studiya paketləri** (v0.46.0, `S.mig.studiya3`): 3 qrup — 📸 Fotosessiya `g_sessiya` (`ss_1..4`: 1–4 dekor 20/30/35/45, kadr sayı adda),
  📔 Albomlu `g_albomlu` (`sa_1..4` 45/55/60/70, `sa_tek` Tək Albom free), 🎥 Videolu `g_videolu` (`sv_1..4` 40/50/65/70, `sv_tek` Tək Video free; "30 ₼-dən" adda).
  🖼️ Ədədlə şəkillər `g_ededle` (v0.47.0, `S.mig.studiya4`): 15x21 6, 21x30 8, 25x38 10, 30x40 12 (`se_1521`, `se_2130`, `se_2538`, `se_3040`).
  **🖼️ Çərçivə** (v0.45.0, id `cerceve`, ikon 🖼️, `S.mig.cerceve`): boş bölmə, düymələri sahibi özü əlavə edir (sonda, Studiyadan sonra).
  v0.48.0 `S.mig.cerceve2`: 📂 Standart çərçivələr `g_cer_std` (`cs_6_9`…: 6x9 2, 10x15 3, 13x18 4, 15x21 5, 21x30 6, 20x25 6, 25x30 10, 25x38 12,
  30x40 13, 30x42 13, 30x45 15; ad "Çərçivə 6x9") + ✨ Digər çərçivə `cer_diger` (free). Sahibinin planı: başqa növlər (taxta, dekorativ…) ayrıca qrup kimi.
  Bölmə düymələri (`.tabs`, v0.28.1) sığmayanda ikinci sıraya düşür — sürüşdürmə çubuğu olmamalıdır (sahibinin istəyi).
  v0.58.0: axtarış çubuğu bölmələrin **üstündə**; bölmələr sol menyu kimi rəngli (`TAB_COLORS`, sıraya görə), bərabər enli grid;
  `tabCols()` sütun sayını sıralar bərabər dolsun deyə seçir (simmetriya: 6 → 3+3) — sahibinin istəyi "simmetriyanı pozma".
- **🎨 İkon seçimi** (v0.43.0): `pickIcon(cur,title,cb)` → `#ovIcon` (`ICONS`: Foto/Studiya, Çap/Ofis, Reklam, Hədiyyə/Sublim, Texnika, Rəng/Digər;
  "özünüz yazın" `#ic_own` (Win + .), "İkonsuz"). Düymə redaktorunda `data-act="eicon"` (+ köhnə `#e_icon` xanası, maxlength 8);
  Ayarlar → Bölmələr: "İkon" sütunu (`cicon`, yeni bölmə üçün `ncicon`/`ncIcon`). Bölmədə `S.cats[].icon` (istəyə görə) — tabda adın qabağında (`catIcon()`).
- **Klaviatura ilə nağd ödəniş** (v0.14.0): sifarişdə məhsul varsa, Space və ya Enter 1.5 saniyə ərzində iki dəfə → nağd satış.
  Birinci basış "Ödənildi" düyməsini sarı edir. Pəncərə açıq, düzəliş rejimi və ya yazı xanasında işləmir.
  Axtarışda: hərf yaz → Enter (birinci nəticə əlavə olunur) → Enter Enter (ödə). Yazı dəyişməyibsə (`qAdded===q`),
  xanadakı Enter də ödəniş sayılır — fokus xanada qalsa belə məhsul ikinci dəfə əlavə olunmur.
- **🧾 Satış Tarixçəsi** (v0.15.0, "Cari sifariş" başlığının sağında): **tarix aralığı** (v0.35.0: `hFrom`/`hTo` "Tarixdən – Tarixədək", boş = həddsiz;
  Bu gün / Dünən / Bu həftə (bazar ertəsindən) / Bu ay / Keçən ay / Bütün günlər; tərs yazılsa özü dəyişir; bir neçə gündə "📅 Günlər üzrə" cədvəli,
  günə basanda o gün açılır), Nağd/Kart/Nisyə filtri,
  tarix gg.aa.iiii, saat ss:dd, cəmlər. Admin istənilən satışı silə bilər (təsdiqlə); silmədən əvvəl ehtiyat nüsxə,
  satışın `used` sahəsindəki material anbara qaytarılır (v0.15.0-dan əvvəlki satışlarda `used` yoxdur).
  **✏️ Ödənişi dəyiş** (v0.65.0): tarixçədə "✏️ Karta/Nağda dəyiş" (`data-h=payask` → `payok`, `changeSalePay`; icazə `delSale`), nağd ⇄ kart,
  satışda `payEdits=[{from,to,ts,by}]` qeydi tarixçədə görünür. Nisyə satışda düymə yoxdur (müştəri borcuna toxunur).
  **↩️ Qaytar / Əvəzlə** (v0.67.0, icazə `refund` — kassirə standart **bağlı**): tarixçədə `data-h=ret` → `#ovRet` (sətir üzrə qaytarılan say, `retAvail`,
  1-in qiyməti endirim nisbətində `retUnit`) → sifarişə mənfi sətir `{uid,id,q,cp:-u,ret:{sale,li,name,plain,cost1,scost1,m21,from,base}}` (`data-rx` ilə silinir).
  Yeni mal əlavə olunsa fərq ödənir; yalnız qaytarmada düymə "↩️ Pulu qaytar: X ₼" (cəmi mənfi; nağd/kart, nisyə olmaz).
  Satış sətri `q<0, sum<0, cost<0, ret:{sale,li}`; reseptdəki material anbara qayıdır (`used` mənfi); əsl satışda `returned={li:say}`.
  Qaytarması olan satış silinmir (əvvəl qaytarma satışı); qaytarma satışı silinəndə `returned` geri azalır. Nisyə satışda düymə yoxdur.
- **💸 Xərclər** (v0.18.0, başlıqda): 1-ci mərhələ hazırdır — **📦 Mal alışı** (`S.purchases`): təchizatçı, ödəniş nağd/kart/nisyə,
  bir qəbzdə bir neçə mal; "Say × 1 paçkada" = anbara düşən say; yeni mal yerindəcə yaradılır (vahid: ədəd/vərəq/…);
  "Olduğu kimi satıram" seçilən düymənin reseptinə [mal, 1] əlavə edir. Anbar artır, maya **orta qiymətlə** yenilənir:
  (köhnə qalıq × köhnə maya + alış məbləği) / (köhnə qalıq + alınan say). Alış silinəndə anbar və maya geri hesablanır.
  **📋 Alış tarixçəsi** (bu ay cəmləri), **💳 Borclar** (nisyə, təchizatçı üzrə, "Ödədim: nağd/kart"), başlıqda borc nişanı.
  Mal alışı mənfəətdən çıxılmır (anbardır); maya satışda reseptlə çıxılır.
  2-ci mərhələ (v0.19.0): **🧾 Digər xərclər** (`S.expenses`, növlər `S.expCats` — əlavə etmək olur), ay seçimi və növ üzrə cəmlər;
  **🔁 aylıq təkrarlanan** (`S.recurring`; xərcdə `rec` = şablon id; "bu ay ödənilib" monKey ilə yoxlanır).
  **Hesabat dövrü** (v0.36.0): "📆 Gün / Dövr" (əvvəl "Bu gün"), "Məhsul + mənfəət" və "Zay" tablarında `rFrom`/`rTo` "Tarixdən – Tarixədək"
  (`rrPreset`: Bu gün / Dünən / Bu həftə / Bu ay / Keçən ay / Bütün dövr; Hesabat açılanda bu gün). Bir neçə gündə "📅 Günlər üzrə" cədvəli (`data-rd`),
  kassa bloku yalnız bir gün seçiləndə (o günün `cashDay`; k_open/k_cnt o günə yazılır).
  **💰 Kassa** (Hesabat → Gün / Dövr, `cashDay()`): səhər kassada (`S.cash[gün].open`) + nağd satış − nağd alış − nağd ödənmiş borc − nağd xərc
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
  Yeni kassir: `KASSIR_DEFAULT` = zay + hist (+ supp, custSale, disc, exp). Satış/zay/sayım `worker: curName()`.
  v0.61.0 (`S.mig.expPerm`, sahibinin istəyi): bütün kassirlərə `exp` (💸 Xərclər) verildi; admin Kassirlər bölməsində bağlaya bilər.
- **🏷️ Endirim** (v0.52.0): "Cari sifariş" başlığının yerində `#btnDisc` (icazə `disc`; kassirlərə standart, `S.mig.discPerm`). `#ovDisc`: ₼ məbləğ / % faiz,
  səbəb məcburi (`#d_r`, hazır səbəblər `DISC_REASONS`). Sifariş vəziyyəti `ordDisc={mode,v,reason}`, `discAmt(sub)` (cəmdən çox olmur), `#discRow` (✕ silir).
  Satış: `total` = sub − disc, `sub`, `disc`, `discReason`, `discPct`. Satış tarixçəsində sətir, Gün/Dövr hesabatında "🏷️ Endirimlər" KPI.
  Məhsul hesabatı sətir cəmləri ilə (endirimsiz) qalır; satış/mənfəət/kassa `s.total` ilə (endirim çıxılıb).
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
- **📐 Banner / Vinil — m² ilə, sərbəst qiymət** (v0.28.0, `S.mig.bannerVinil`): yeni bölmə `banner` "Banner / Vinil" (plotterlə əlaqəsi yoxdur),
  düymələr `bv_banner`, `bv_vinil` — `area:1`, `src:{supp:"sp4",item:"pb1"|"pb2",only:1}` (həmişə Samir Banner-dən, "Özümüz" sualı yoxdur).
  Samir Banner qiymət siyahısı: Banner (1 m²) `pb1` 6 ₼, Vinil (1 m²) `pb2` 6 ₼. Satış qiyməti sabit deyil (sahibi m²-ə görə dəyişir):
  basanda `#ovM2` — En × Hündürlük (və ya m² birbaşa), Ədəd, "1 m² qiyməti" ⇄ "cəmi məbləğ" (biri yazılır, o biri hesablanır);
  `can("cost")` olana alış dəyəri və qazanc göstərilir. Sifariş sətri `{uid,id,q,area,w,h,cp,from}` (`okey` = uid, `lineUnit()` = cp).
  Satış sətri: ad "Banner 3 × 1,5 m (4,5 m²)", `base`, `m2` (= area × q), `scost` = m2 × alış qiyməti. Hesabatlarda "Banner (m²)" bir sətir, say = m².
  Redaktorda `#e_area` "📐 Kvadrat metrlə satılır". Axtarış: adında söz olan düymə birinci (`searchList` sıralayır).
- **🏢 Borclular — müəssisələrə nisyə satış** (v0.25.0; v0.27.1-də ekranda "Borca" → **"Nisyə"**, düymə "Nisyəyə yaz ✓"): "Cari sifariş"də `#payDebt` "📝 Nisyə" → `#ovCust` müəssisə seçimi
  (yenisini orada əlavə etmək olar) → `pay="borc"` (daxili ad dəyişmir), `ordCust`. Satış: `pay:"borc", cust, custName`.
  `S.customers=[{id,name}]`, pul alınanda `S.custPays=[{id,cust,name,ts,amount,by,worker}]` (hissə-hissə). Borc = `custOwed(id)`.
  Satış həmin gün satış/mənfəət sayılır; kassaya yalnız nağd alınan pul düşür (`cashDay().custIn`, "+ Borclulardan alınan nağd").
  Başlıqda `#btnCust` "🏢 Borclular" + `#custBadge`, pəncərə `#ovCDebt` (Borclar / Müəssisələr — admin). Tarixçədə "📝 Nisyə" süzgəci.
  İcazələr: `custSale` (kassirə standart, `S.mig.custPerm`), `custDebt` (borcları görmək və pulu almaq, standart bağlı).
  Üstünə pul alınmış borca satışı silmək olmur.

- **📱 Telefon — Wi-Fi ilə, kompüterlə tam sinxron** (v0.29.0; istifadəçi seçim etmədi, tövsiyə olunan "əvvəl Wi-Fi, sonra internet" yolu).
  `launcher/server.go`: `syncStore` (məlumat + versiya; `put(base,data)` yalnız versiya uyğundursa yazır, deyilsə ən son məlumatı qaytarır),
  `phoneServer` (port **8765**, bütün ünvanlarda; `/api/state|ver|save|backup|backups|kinds|paths`, başlıq `X-Kassa-Key` = 6 rəqəmli kod
  `%APPDATA%\KASSA\telefon-kodu`; `/` index.html-ə `<meta name="kassa-remote">` qoyur). Açıq/bağlı: `%APPDATA%\KASSA\telefon-acik`.
  exe bağlamaları: `erpLoadV`, `erpSaveV(base,data)`, `erpVer`, `erpPhoneInfo`, `erpPhone(on)`, `erpPhoneNewCode`. Köhnə `erpLoad/erpSave` qalır.
  `devserver_other.go` (yalnız Linux, sınaq): `go run . -app ../app -data DIR -addr 127.0.0.1:PORT -code 123456`.
  index.html: `REMOTE` (telefon) — exe funksiyaları `fetch` ilə; kod `localStorage["kassa.key"]`, `#ovKey`. `SYNC` (exe və telefon):
  `save()` → `schedulePush()` → `push()` (`erpSaveV`; toqquşmada `applyRemote()` → `merge3(base, S, remote)` və yenidən), `pollSync()` hər 2 san.
  `merge3`: obyektlər açar üzrə, id/ts olan siyahılar element üzrə (silinən/əlavə olunan nəzərə alınır), `stock` — hər iki tərəfin fərqi toplanır,
  `lastAuto/lastBackup` — max, qalan toqquşmada bu cihaz qalib. Telefon ehtiyat nüsxə yazmır — telefonun dəyişikliyinin nüsxəsini kompüter yazır.
  Ayarlar → "📱 Telefon" (yalnız admin): aç/bağla, ünvanlar (http://IP:8765), kod, qoşulan cihazlar, "Kodu dəyiş"; telefonda "bu telefonu ayır".
  Telefon ekranı: ≤640px kiçik düymələr, ≤860px aşağıda `#mobBar` ("Sifariş: n ədəd · cəmi · Ödənişə keç ↓"); əlaqə yoxdursa `#syncBar` (qırmızı).
  **Boş sifarişdə** (v0.33.0; v0.32.0-dakı göy `#dayCard` sahibinin istəyi ilə silindi): "Xidmət düyməsinə toxunun" yerinə iki düymə
  `.epay` — 💵 Nağd / 💳 Kart, bu günün cəmi (`can("reports")`); basanda Satış Tarixçəsi o ödəniş növü ilə (`openHist(p)`). **Yalnız telefonda** (`PHONE_CLOUD||REMOTE`, v0.36.1) — kompüterdə yoxdur.
  Windows Firewall ilk dəfə icazə soruşur ("Allow access"). Sonrakı mərhələ (istəsə): internet üzərindən (Firebase).

- **☁️ Bulud — Google Firebase (Firestore + Auth, REST, SDK yoxdur)** (v0.30.0; istifadəçinin seçimi: hər yerdən internetlə).
  Hər cihaz öz məlumatını saxlayır (kompüter: fayl; telefon: IndexedDB `kassa/kv` → "data"), internet olanda buludla mübadilə edir.
  Firestore: `shops/main/u/{vahid}` sənədləri: `d` (JSON), `del` (silinib), `t` (server vaxtı), `dev`, materiallarda `stock` (rəqəm, **increment** ilə).
  Vahidlər (`unitsOf/compose`): `KEYED` siyahıların hər elementi `K~rkey` (items, cats, users, materials, suppliers, customers, recurring,
  sales, expenses, purchases, waste, custPays, suppPays), sıralı olanlarda `@ord~K`; `cash.gün`; qalanı `@K`. `lastAuto/lastBackup` yalnız yerli.
  `cloudPushNow` (base-dən fərqlənənlər, 400-lük commit, updateMask), `cloudPullNow` (`t >= kursor−2 san`, 500-lük səhifə, `seen` ilə təkrar süzülür),
  `applyCloud` (yerli dəyişiklik yoxdursa buludunku, varsa `merge3`; `stock` fərqləri toplanır). `cloudTick`: al → göndər → al; kompüter 10 san, telefon 5 san (görünəndə).
  Vəziyyət: `KV` "cfg" (apiKey, projectId, email, refresh token — parol saxlanmır), "sync" (base, kursor, seen), "dev". Kompüterdə exe faylları
  `%APPDATA%\KASSA\data\bulud-*.json` (`erpKVGet/erpKVSet`), Google sorğuları exe-dən (`erpFetch`, yalnız *.googleapis.com; `launcher/cloud.go`).
  İlk yükləmədə (`CL.loading`) `upgrade()` işləmir — yarımçıq məlumatda köçürmələr (anbarSifir!) işə düşməsin.
  Telefon: `PAGES_URL` = https://signmasterezcad.github.io/kassa/app/ (GitHub Pages: main, kök; `.nojekyll`), link `#bulud=` (apiKey, projectId, email),
  yalnız parol soruşulur; `PHONE_CLOUD` (body `.phone`; v0.54.0-dan izah yazısı `.note` silinib və boş axtarışın ipucu `.srchint` hər yerdə gizlidir; giriş ekranında yalnız admin — `loginUsers()`, v0.34.0);
  `sw.js` + `manifest.webmanifest` (internetsiz açılır). Ayarlar → "☁️ Bulud" (admin): quraşdırma addımları,
  qoşul / indi sinxronlaşdır / ayır, telefon linki, Rules mətni (`request.auth.token.email == ...`). Başlıqda `#btnCloud` (✓ / n gözləyir / internet yoxdur).
  Sınaq: `node tests/cloud.js` (yaddaşda sınaq Firebase-i). GitHub Pages-i API ilə açmaq bu mühitdə qadağandır — istifadəçi Settings → Pages-dən açmalıdır.

- **📱 Android proqramı (APK)** (v0.31.0, `android/`): `MainActivity` — WebView, `https://signmasterezcad.github.io/kassa/app/` açır
  (məntiq səhifədədir → yeniliklər APK-sız gəlir), brauzer identifikatoruna ` KassaAndroid/1` əlavə edir; başqa saytlar brauzerdə; "geri" düyməsi.
  İlk açılışda link yoxdur → `askCloudLogin(null)`: kompüterdəki linki **yapışdırmaq** xanası (`#cllink`, `cloudLinkCfg(txt)`), sonra parol.
  Yığma: `android/build.sh <kod> <ad> <keystore.p12> <parol>` — Google SDK-sız: aapt2 + framework apktool-lib jar-dan, dx (jakewharton
  dalvik-dx), stub `com.google.android:android:4.1.1.4`, imza apksig 2.3.0 (yalnız **v2**, Java 21-də v1 işləmir; minSdk 24, targetSdk 34).
  Hazır fayl: `android/KASSA.apk` (Pages-dən: https://signmasterezcad.github.io/kassa/android/KASSA.apk). **İmza açarı depoda deyil**
  (sessiyanın müvəqqəti qovluğunda idi) — yeni APK başqa açarla imzalansa, telefonda köhnəni silib yenisini qurmaq lazımdır (məlumat buluddan gəlir).

- **💿 Quraşdırma faylı `KASSA-Setup.exe`** (v0.39.0, depo kökündə; Pages: https://signmasterezcad.github.io/kassa/KASSA-Setup.exe):
  öz Go quraşdırıcımız `launcher/setup/` (NSIS yoxdur). İçində (`//go:embed payload`) KASSA.exe, YENILE.bat, yenile.ps1, files.txt-dəki `app/` faylları.
  Yığma: `cd launcher && ./build-setup.sh` (versiya APP_VERSION-dan, payload sonra təmizlənir; `setup/payload/` gitignore-dadır).
  Quraşdırır: `%LOCALAPPDATA%\Programs\KASSA` (admin icazəsi lazım deyil), qısayollar iş masası + Start menyusu, Windows "Proqramlar"
  siyahısında (HKCU Uninstall, `uninstall.exe /uninstall`). Silinəndə `ehtiyat\` və `%APPDATA%\KASSA` məlumatı qalır. KASSA açıqdırsa bağlamağı xahiş edir.
  Hər dəyişiklikdə Setup-ı yenidən yığmaq **vacib deyil** (quraşdırılandan sonra YENILE.bat yeniləyir), amma böyük versiyalarda yığmaq yaxşıdır.
  **Yeni kompüterdə buluda qoşulma** (`cloudAdopt()`): yerli məlumatda satış/xərc/alış/zay/ödəniş yoxdursa (`pristineLocal()`), nümunə (SEED) buluda
  qatılmır — buluddakı məlumat götürülür (bulud boşdursa yerli göndərilir). Sınaq: `tests/cloud.js` 7-ci hissə.

- **🧹 Təzə quraşdırma təmiz açılır** (v0.44.0; sahibi iş kompüterində nümunə bölmələri, Leyla/Rəşad, itmiş PIN/kassir görüb qarışdı):
  exe-də `firstRun` → `cleanStart()` (yalnız Admin, materiallar boş, reseptlər boş) + `upgrade()`-dən sonra `cleanStartLate()`: köhnə nümunə bölmələri
  (foto, viz, skan, lam, kag) silinir, sıra ÇAP, Banner / Vinil, Sublim, Fiber Lazer, Kəsim Plotter, Poliqrafiya, Studiya; Studiyaya `st_kostyum` 🤵, `st_diger` 🖼️ free.
  Sınaqlarda nümunə məlumat lazımdırsa: `window.KASSA_SAMPLE=1` (users.js, cloud.js). Brauzerdə (smoke) SEED dəyişmir.
  Bulud qoşulmayıb və məlumat təmizdirsə banner: "👋 … ☁️ Buluda qoşulun" (`bancl`). Bulud bölməsində **⬇️ Buluddakı məlumatı götür** (`cltake`, təsdiqlə):
  ehtiyat nüsxə → `cloudAdopt()` (bu kompüterdəkini buludla əvəz edir). Adopt-dan sonra admin tapılmasa `startSession()`.
  Kassirlər/PIN cihazlar arası yalnız bulud ilə gəlir (Setup-a şəxsi məlumat qoyulmur — depo açıqdır).

- **🔄 Yenilə düyməsi** (v0.40.0, sahibinin istəyi): başlıqda versiyanın yanında `#btnUpd` (yalnız exe-də, `CAN_UPD` = `erpUpdate`+`erpLatest` var; telefonda yox).
  exe `erpLatest()` (`launcher/update.go`) GitHub raw index.html-dən APP_VERSION-u oxuyur — açılışdan 4 san. sonra və hər 3 saatdan bir; yeni versiya varsa
  düymə sarı "🔄 Yenilə v0.x". Basanda: yoxlayır → "ən son versiya var" / təsdiq ("✓ Bəli, … yenilə", 6 san.) → cari sifariş varsa yeniləmir →
  məlumatı yazır (push / erpSave), əməliyyat nüsxəsi, bulud vəziyyəti → `erpUpdate()`: `powershell -Command updateCommand(yenile.ps1)` yeni konsolda
  (CREATE_NEW_CONSOLE); yenile.ps1 KASSA-nı bağlayır, yeniləyir, yenidən açır; səhvdə pəncərə açıq qalır. Köhnə exe-lərdə düymə görünmür — bir dəfə YENILE.bat lazımdır.
  Sınaq: `node tests/update.js`.

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
4. Testlər: `node tests/smoke.js` (brauzer), `node tests/native.js` (exe simulyasiyası), `node tests/users.js` (kassirlər + əməliyyat nüsxəsi)
   , `node tests/sync.js` (Wi-Fi telefon serveri; Go lazımdır) `node tests/cloud.js` (bulud + APK ilk açılışı) və `node tests/update.js` (Yenilə düyməsi) — hamısı OK olmalıdır.
5. Push-dan sonra yoxla: `https://raw.githubusercontent.com/signmasterezcad/kassa/main/app/index.html` yeni versiyanı verir (GitHub 5 dəqiqəyə qədər köhnəni göstərə bilər; yeni versiya görünənə qədər gözlə, sonra istifadəçiyə "hazırdır" de).
6. İstifadəçiyə **tam ZIP göndərmə** — `YENILE.bat` ilə yeniləsin. (Keçmişdə iki dəfə söz verib ZIP göndərmişik, bu, etimadı sarsıdıb.)

## Açıq məsələlər
- `YENILE.bat` Windows-da işləyir (istifadəçi v0.8.4-ə yenilənib, ekran şəklində görünür).
- WebView2 başladıcısının açılış sürəti Windows-da ölçülməyib.
- Google Disk-ə nüsxə — istifadəçi istəmədi. Setup iş kompüterində quraşdırıldı və işləyir; iş kompüteri v0.44.1-də linklə buluda qoşuldu (☁️ ✓, sahibi təsdiqlədi).
- Bulud real Firebase ilə işləyir (layihə `kassa-7bad5`, istifadəçi təsdiqlədi: kompüter + telefon sinxron). GitHub Pages açıqdır. Depo Private olsa, Pages pulsuz işləmir.
- APK real telefonda hələ yoxlanmayıb (emulyator yoxdur).
- Telefon Windows-da real Wi-Fi ilə hələ yoxlanmayıb (Firewall icazəsi, IP ünvanı).

## Brauzer versiyası (nümayiş üçün)
https://claude.ai/artifact/5TkmNrGWJuyNTRNZoXi5vA — `app/index.html`-dən `<head>` və `<body>` teqləri çıxarılıb dərc olunur.
