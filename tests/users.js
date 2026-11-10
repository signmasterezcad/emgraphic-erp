// Kassirlər, PIN ilə giriş, icazələr və hər əməliyyatdan sonra ehtiyat nüsxə: node tests/users.js
// exe mühiti (erpLoad/erpSave/erpBackup/erpBackupKinds...) Node yaddaşında təqlid olunur.
const { chromium } = require('playwright');
const path = require('path');
const fs = { data: '', backups: [] };
let n = 0;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const errs = [];
  const open = async () => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.KASSA_SAMPLE = 1; }); // nümunə kassirlərlə (Leyla, Rəşad)
    await p.exposeFunction('erpLoad', () => fs.data);
    await p.exposeFunction('erpSave', j => { fs.data = j; });
    await p.exposeFunction('erpBackup', (j, kind) => { const k = ['avto', 'emel'].includes(kind) ? kind : 'el'; const name = `kassa-2026-11-09_10-00-${String(n++).padStart(2, '0')}-${k}.json`; fs.backups.unshift({ name, size: j.length, time: Date.now(), j }); return name; });
    await p.exposeFunction('erpBackupList', () => fs.backups.map(({ name, size, time }) => ({ name, size, time })));
    await p.exposeFunction('erpBackupKinds', () => ['avto', 'el', 'emel']);
    await p.exposeFunction('erpBackupRead', nm => fs.backups.find(x => x.name === nm).j);
    await p.exposeFunction('erpPaths', () => ({ data: 'C:\\data.json', backup: 'C:\\ehtiyat' }));
    await p.exposeFunction('erpOpenFolder', () => null);
    await p.goto('file://' + path.resolve('app/index.html'));
    await p.waitForTimeout(400);
    return p;
  };
  const kinds = k => fs.backups.filter(x => x.name.endsWith(`-${k}.json`)).length;
  const sellOne = async p => { await p.fill('#q', 'fincan termo'); await p.press('#q', 'Enter'); await p.click('#btnDone'); };

  // 1) Yeni quraşdırma: Admin PIN-siz → birbaşa açılır, işçilər kassirə çevrilib
  let p = await open();
  ok(await p.isHidden('#ovLogin'), 'admin PIN-i yoxdursa giriş ekranı çıxmır');
  ok((await p.textContent('#userName')).includes('Admin (admin)'), 'başlıqda: Admin (admin)');
  const d0 = JSON.parse(fs.data);
  ok(d0.users.length === 3 && d0.users.filter(u => u.role === 'admin').length === 1 && d0.users.find(u => u.name === 'Leyla').role === 'kassir', 'işçilər istifadəçiyə çevrildi: 1 admin + 2 kassir');
  ok(await p.isVisible('#btnSet') && await p.isVisible('#btnExp') && await p.isHidden('#btnEdit'), 'admin bütün düymələri görür (Düzəliş Ayarların içində)');

  // 2) Hər əməliyyatdan sonra nüsxə; dəyişiklik yoxdursa, yazılmır
  const e0 = kinds('emel');
  await sellOne(p); await p.waitForTimeout(2600);
  ok(kinds('emel') === e0 + 1, 'satışdan sonra "əməliyyat" nüsxəsi yarandı');
  ok(JSON.parse(fs.backups.find(x => x.name.endsWith('-emel.json')).j).data.sales.length === 1, 'nüsxədə yeni satış var');
  await sellOne(p); await sellOne(p); await p.waitForTimeout(2600);
  ok(kinds('emel') === e0 + 2, 'ard-arda 2 satış bir nüsxəyə yığıldı');
  await p.evaluate(() => save()); await p.waitForTimeout(2600);
  ok(kinds('emel') === e0 + 2, 'heç nə dəyişməyibsə, nüsxə yazılmır');

  // 3) Admin Kassirlər bölməsi: PIN qoyur, kassir əlavə edir, icazə verir
  await p.click('#btnSet'); await p.click('[data-rt=users]');
  ok((await p.textContent('#rbody')).includes('Admin üçün PIN qoyulmayıb'), 'admin PIN-siz: xəbərdarlıq görünür');
  const adminId = d0.users.find(u => u.role === 'admin').id, leyla = d0.users.find(u => u.name === 'Leyla').id;
  await p.fill(`#u_p_${adminId}`, '12'); await p.click(`[data-act=upin][data-id=${adminId}]`);
  ok((await p.textContent('#toast')).includes('4–6 rəqəm'), 'qısa PIN qəbul olunmur');
  await p.fill(`#u_p_${adminId}`, '1111'); await p.click(`[data-act=upin][data-id=${adminId}]`);
  ok(!(await p.textContent('#rbody')).includes('Admin üçün PIN qoyulmayıb'), 'admin PIN qoydu, xəbərdarlıq getdi');
  ok(!fs.data.includes('"1111"'), 'PIN faylda açıq yazılmır');
  await p.fill(`#u_p_${leyla}`, '2222'); await p.click(`[data-act=upin][data-id=${leyla}]`);
  await p.fill('#nu_name', 'leyla'); await p.click('[data-act=uadd]');
  ok((await p.textContent('#toast')).includes('artıq var'), 'eyni adlı ikinci işçi olmur');
  await p.fill('#nu_name', 'Nigar'); await p.fill('#nu_pin', '3333'); await p.click('[data-act=uadd]');
  const nigar = JSON.parse(fs.data).users.find(u => u.name === 'Nigar');
  ok(nigar && nigar.role === 'kassir' && nigar.perms.zay && nigar.perms.hist && !nigar.perms.cost, 'Nigar əlavə olundu: standart icazələr (zay, tarixçə)');
  await p.check(`[data-up="${nigar.id}"][data-k=reports]`);
  ok(JSON.parse(fs.data).users.find(u => u.id === nigar.id).perms.reports === 1, 'Nigar-a "günlük hesabat" icazəsi verildi');
  ok(await p.locator(`[data-ur="${adminId}"]`).isDisabled() && !(await p.locator(`[data-act=udel][data-id="${adminId}"]`).count()), 'admin özünü silə və vəzifəsini dəyişə bilməz');
  await p.click('#ovRep [data-close]');

  // 4) Çıxış → giriş ekranı; səhv və düz PIN
  await p.click('#btnUser');
  ok(await p.isVisible('#ovLogin') && await p.locator('.utile').count() === 4, 'çıxış: giriş ekranında 4 işçi');
  await p.click(`[data-login="${leyla}"]`);
  await p.keyboard.type('9999'); await p.keyboard.press('Enter');
  ok((await p.textContent('.pinerr')).includes('səhvdir') && await p.isVisible('#ovLogin'), 'səhv PIN: girmir');
  await p.click('[data-pin="2"]'); await p.click('[data-pin="2"]'); await p.keyboard.type('22'); await p.click('[data-pin=go]');
  ok(await p.isHidden('#ovLogin') && (await p.textContent('#userName')).trim() === 'Leyla', 'düz PIN (ekran + klaviatura): Leyla girdi');

  // 5) Kassir: yalnız icazəli düymələr
  ok(await p.isVisible('#btnZay') && await p.isVisible('#btnHist'), 'Leyla: Zay və Tarixçə görünür');
  ok(await p.isHidden('#btnRep') && await p.isHidden('#btnSet') && await p.isHidden('#btnExp') && await p.isHidden('#btnEdit') && await p.isHidden('#today'), 'Leyla: Hesabat, Ayarlar, Xərclər, Düzəliş, günün cəmi gizlidir');
  await sellOne(p);
  ok(JSON.parse(fs.data).sales.at(-1).worker === 'Leyla', 'satış Leyla-nın adına yazıldı');
  await p.click('#btnHist');
  ok(await p.locator('#hBody [data-h=ask]').count() === 0, 'Leyla satışı silə bilmir (Sil düyməsi yoxdur)');
  await p.click('#ovHist [data-close]');

  // 6) Nigar: günlük hesabat var, maya/mənfəət yoxdur
  await p.click('#btnUser'); await p.click(`[data-login="${nigar.id}"]`); await p.keyboard.type('3333'); await p.keyboard.press('Enter');
  ok(await p.isVisible('#btnRep') && await p.isHidden('#btnSet'), 'Nigar: Hesabat görünür, Ayarlar yox');
  await p.click('#btnRep');
  const tabs = await p.locator('#rtabs .tab').allTextContents();
  ok(tabs.join('|') === '📆 Gün / Dövr|Zay|💳 Borclar', 'Nigar: yalnız "Gün / Dövr", "Zay" və "Borclar" (baxış) tabları (Aylıq, Mənfəət yox)');
  const rb = await p.textContent('#rbody');
  ok(rb.includes('Kassa') && !rb.includes('Satışdan qazanc') && !rb.includes('mayası'), 'Nigar: kassa görünür, maya və qazanc gizlidir');
  await p.click('#ovRep [data-close]');

  // 7) Yenidən açılış: admin PIN-i var → giriş ekranı; admin girir
  await p.close(); p = await open();
  ok(await p.isVisible('#ovLogin'), 'yenidən açılış: giriş ekranı çıxır');
  await p.click('#ovLogin', { position: { x: 5, y: 5 } });
  ok(await p.isVisible('#ovLogin'), 'giriş ekranı kənara basmaqla bağlanmır');
  await p.keyboard.press('Space'); await p.keyboard.press('Space');
  ok(JSON.parse(fs.data).sales.length === 4, 'giriş ekranında Space ilə satış olmur');
  await p.click(`[data-login="${adminId}"]`); await p.keyboard.type('1111'); await p.keyboard.press('Enter');
  ok(await p.isHidden('#ovLogin') && await p.isVisible('#btnSet'), 'admin PIN ilə girdi, hər şey görünür');
  await p.click('#btnSet'); await p.click('[data-rt=users]');
  await p.click(`[data-act=udel][data-id="${nigar.id}"]`); await p.click(`[data-act=udel][data-id="${nigar.id}"]`);
  ok(!JSON.parse(fs.data).users.some(u => u.id === nigar.id), 'admin kassiri sildi (iki addımla)');
  await p.click('[data-rt=backup]'); await p.waitForSelector('#blist table');
  ok((await p.textContent('#rbody')).includes('hər əməliyyatdan sonra') && (await p.textContent('#blist')).includes('əməliyyatdan sonra'), 'ehtiyat bölməsi: yeni qayda izah olunur, növ göstərilir');
  await p.click('[data-act=bkind][data-k=avto]');
  ok(await p.locator('#blist tr').count() === kinds('avto') + 1, 'süzgəc: yalnız gündəlik nüsxələr');

  await p.click('#ovRep [data-close]');

  // 8) 🚚 Tədarükçü: kassir yazır, xərclərə düşür, admin aylıq hesabatı görür
  ok(JSON.parse(fs.data).suppliers.map(x => x.name).join('|') === 'Samir Foto|Vəfa Foto|Şamil Vinetka|Samir Banner', '4 tədarükçü hazırdır');
  await p.click('#btnUser'); await p.click(`[data-login="${leyla}"]`); await p.keyboard.type('2222'); await p.keyboard.press('Enter');
  ok(await p.isVisible('#btnSupp') && await p.isHidden('#btnExp'), 'Leyla: 🚚 Tədarükçü görünür, Xərclər yox');
  await p.click('#btnSupp');
  ok(await p.locator('#stabs .tab').count() === 0 && await p.locator('.stile').count() === 4, 'Leyla: yalnız alış yazmaq (hesabat tabı yoxdur), 4 tədarükçü');
  await p.click('.stile:has-text("Samir Foto")'); await p.click('[data-s=save]');
  ok((await p.textContent('#toast')).includes('məbləği yazın'), 'məbləğsiz yazılmır');
  await p.fill('#sl_s_0', '45.5'); await p.click('[data-s=save]');
  ok((await p.textContent('#toast')).includes('Malın adını'), 'malın adı olmadan yazılmır');
  await p.fill('#sl_n_0', 'Foto kağız 10x15'); await p.fill('#sl_q_0', '100'); await p.fill('#sl_s_0', '40');
  await p.click('[data-s=ladd]'); await p.fill('#sl_n_1', 'Çərçivə'); await p.fill('#sl_q_1', '1'); await p.fill('#sl_s_1', '5.5');
  ok((await p.textContent('#s_tot')).startsWith('45.50') && (await p.textContent('#sl_u_0')).includes('0.40'), 'cəmi özü hesablanır (45.50), 1 ədədin qiyməti görünür (0.40)');
  await p.press('#sl_s_1', 'Enter');
  await p.click('.stile:has-text("Şamil Vinetka")'); await p.fill('#sl_n_0', 'Vinetka'); await p.fill('#sl_s_0', '20'); await p.click('[data-s=pay][data-p=kart]'); await p.click('[data-s=save]');
  const ex = JSON.parse(fs.data).expenses.filter(x => x.supp);
  ok(ex.length === 2 && ex[0].cat === 'Samir Foto' && ex[0].amount === 45.5 && ex[0].pay === 'nağd' && ex[0].worker === 'Leyla' && ex[1].pay === 'kart' && ex[0].lines.length === 2 && ex[0].note.includes('Foto kağız 10x15 ×100'), 'alışlar xərclərə tədarükçünün adı ilə düşdü (kim yazıb, ödəniş)');
  ok((await p.textContent('#suppBody')).includes('Foto kağız 10x15 ×100') && await p.locator('#suppBody [data-s=ask]').count() === 2, 'bu günün siyahısı, Leyla öz yazdığını silə bilər');
  await p.click('#ovSupp [data-close]');
  await p.click('#btnUser'); await p.click(`[data-login="${adminId}"]`); await p.keyboard.type('1111'); await p.keyboard.press('Enter');
  await p.click('#btnSupp'); await p.click('[data-s=tab][data-t=rep]');
  const sr = await p.textContent('#suppBody');
  ok(sr.includes('65.50') && sr.includes('45.50') && sr.includes('Samir Foto') && sr.includes('20.00'), 'admin: aylıq hesabat — cəmi 65.50, Samir Foto 45.50, Şamil Vinetka 20.00');
  ok(sr.includes('nə alınıb') && sr.includes('Foto kağız 10x15') && sr.includes('Çərçivə'), 'aylıq hesabatda "nə alınıb" cədvəli (mal-mal)');
  await p.click('[data-s=tab][data-t=list]');
  await p.fill('[data-sn=sp1]', 'Samir Foto Studio'); await p.dispatchEvent('[data-sn=sp1]', 'change');
  ok(JSON.parse(fs.data).expenses.find(x => x.supp === 'sp1').cat === 'Samir Foto Studio', 'ad dəyişəndə keçmiş alış da yeni adla');
  await p.fill('#s_new', 'Kamran Kağız'); await p.click('[data-s=sadd]');
  ok(JSON.parse(fs.data).suppliers.length === 5, 'admin yeni tədarükçü əlavə etdi');
  await p.click('#ovSupp [data-close]');
  await p.click('#btnRep'); await p.click('[data-rt=gun]');
  ok((await p.textContent('#rbody')).includes('45.50'), 'nağd alış kassa hesabından çıxılır (− Nağd digər xərclər 45.50)');
  await p.click('[data-rt=ay]');
  ok((await p.textContent('#rbody')).includes('Samir Foto Studio'), 'aylıq mənfəət hesabatında xərc növü kimi görünür');
  await p.click('#ovRep [data-close]');

  // 9) Nisyə: borc tədarükçünün adına yazılır, hissə-hissə ödənir
  await p.click('#btnSupp'); await p.click('[data-s=tab][data-t=add]');
  await p.click('.stile:has-text("Vəfa Foto")'); await p.fill('#sl_n_0', 'Foto albom'); await p.fill('#sl_s_0', '100'); await p.click('[data-s=pay][data-p=nisyə]');
  ok((await p.textContent('#suppBody')).includes('borc Vəfa Foto adına'), 'nisyə seçiləndə izah çıxır');
  await p.click('[data-s=save]');
  await p.click('.stile:has-text("Vəfa Foto")'); await p.fill('#sl_n_0', 'Foto albom'); await p.fill('#sl_s_0', '50'); await p.click('[data-s=pay][data-p=nisyə]'); await p.click('[data-s=save]');
  ok((await p.textContent('#suppBadge')).includes('150.00') && await p.isVisible('#suppBadge'), 'başlıqda borc nişanı: 150.00 ₼');
  ok(!(await p.textContent('#stabs')).includes('Borclar'), 'Tədarükçü pəncərəsində Borclar tabı yoxdur (💳 Borclar-a köçüb)');
  await p.click('#ovSupp [data-close]'); await p.click('#btnCust'); await p.click('[data-c=tab][data-t=sdebt]');
  ok((await p.textContent('#cdBody')).includes('Borc: 150.00'), '💳 Borclar → Bizim borclarımız: Vəfa Foto 150.00');
  await p.fill('#dp_sp2', '200'); await p.click('[data-s=dpay][data-id=sp2][data-by=nağd]');
  ok((await p.textContent('#toast')).includes('Borcdan çox'), 'borcdan çox ödəmək olmur');
  await p.fill('#dp_sp2', '60'); await p.click('[data-s=dpay][data-id=sp2][data-by=nağd]');
  ok((await p.textContent('#toast')).includes('qalan borc 90.00') && (await p.textContent('#suppBadge')).includes('90.00'), 'hissəli ödəniş: 60 ödəndi, qalan 90');
  await p.click('[data-s=dpay][data-id=sp2][data-by=kart]');
  ok((await p.textContent('#toast')).includes('borc bağlandı') && await p.isHidden('#suppBadge'), 'qalanı kartla ödəndi: borc bağlandı, nişan getdi');
  await p.click('#ovCDebt [data-close]');
  await p.click('#btnRep'); await p.click('[data-rt=borc]');
  ok((await p.textContent('#rbody')).includes('Bizim borclarımız') && (await p.textContent('#rbody')).includes('Vəfa Foto'), 'Hesabat → 💳 Borclar: baxış (tədarükçü üzrə)');
  await p.click('#ovRep [data-close]');
  await p.click('#btnRep'); await p.click('[data-rt=gun]');
  ok((await p.textContent('#rbody')).includes('60.00'), 'nağd borc ödənişi (60) kassadan çıxılır');
  await p.click('#ovRep [data-close]');
  const months = JSON.parse(fs.data).expenses.filter(x => x.supp === 'sp2' && x.pay === 'nisyə').reduce((a, x) => a + x.amount, 0);
  ok(months === 150, 'nisyə alışlar xərc kimi alış günündə sayılır (150)');
  await p.click('#btnUser'); await p.click(`[data-login="${leyla}"]`); await p.keyboard.type('2222'); await p.keyboard.press('Enter');
  await p.click('#btnSupp');
  ok(!(await p.textContent('#stabs')).includes('Borclar') && await p.isHidden('#suppBadge'), 'Leyla: borc icazəsi yoxdur — Borclar tabı və nişan görünmür');
  await p.click('#ovSupp [data-close]');

  // 10) 🏢 Müəssisəyə borca satış (Leyla hələ girişdədir)
  await sellOne(p); // nağd satış kimi davam edir
  await p.fill('#q', 'fincan termo'); await p.press('#q', 'Enter');
  ok(await p.isVisible('#payDebt'), 'Leyla: "📝 Borca" düyməsi görünür');
  await p.click('#payDebt');
  ok(await p.isVisible('#ovCust'), 'Borca: müəssisə seçmə pəncərəsi açıldı');
  await p.fill('#c_new', '45 saylı məktəb'); await p.click('[data-c=new]');
  ok(await p.isHidden('#ovCust') && (await p.textContent('#custSel')).includes('45 saylı məktəb') && (await p.textContent('#btnDone')).includes('Nisyəyə yaz'), 'müəssisə seçildi, düymə "Borca yaz ✓"');
  await p.click('#btnDone');
  let sl = JSON.parse(fs.data).sales.at(-1);
  ok(sl.pay === 'borc' && sl.custName === '45 saylı məktəb' && sl.total === 10 && sl.worker === 'Leyla', 'satış məktəbin borcuna yazıldı (10 ₼)');
  ok((await p.textContent('#btnDone')).includes('Ödənildi') && await p.isHidden('#custSel'), 'satışdan sonra yenə nağd rejiminə qayıdır');
  await p.fill('#q', 'fincan sade'); await p.press('#q', 'Enter'); await p.click('#payDebt'); await p.click('.ctile:has-text("45 saylı məktəb")'); await p.click('#btnDone');
  ok(await p.isHidden('#btnCust'), 'Leyla: borclular bölməsi görünmür (icazə yoxdur)');
  await p.click('#btnUser'); await p.click(`[data-login="${adminId}"]`); await p.keyboard.type('1111'); await p.keyboard.press('Enter');
  ok((await p.textContent('#custBadge')).includes('18.00'), 'admin: başlıqda borclular nişanı 18.00 ₼');
  await p.click('#btnHist');
  ok((await p.textContent('#hBody')).includes('Nisyə: 45 saylı məktəb'), 'tarixçədə "📝 Borca: 45 saylı məktəb"');
  await p.click('#ovHist [data-hp=borc]');
  ok(await p.locator('#hBody tr').count() === 3, 'tarixçə süzgəci: yalnız borca satışlar (2)');
  await p.click('#ovHist [data-close]');
  await p.click('#btnCust');
  const cid = JSON.parse(fs.data).customers[0].id;
  ok((await p.textContent('#cdBody')).includes('Borc: 18.00'), 'Borclular: məktəbin borcu 18.00');
  await p.fill(`#cp_${cid}`, '10'); await p.click(`[data-c=cpay][data-id="${cid}"][data-by=nağd]`);
  ok((await p.textContent('#toast')).includes('qalan borc 8.00'), 'hissəli pul alındı: 10, qalan 8');
  await p.click('#ovCDebt [data-close]');
  await p.click('#btnRep'); await p.click('[data-rt=gun]');
  const g = await p.textContent('#rbody');
  ok(g.includes('Borclulardan alınan nağd') && g.includes('10.00'), 'kassa: borcludan alınan 10 ₼ nağd əlavə olunur');
  await p.click('#ovRep [data-close]');
  await p.click('#btnHist'); await p.click('#ovHist [data-hp=borc]'); await p.click('#hBody [data-h=ask] >> nth=0'); await p.click('#hBody [data-h=del]');
  await p.waitForTimeout(400);
  ok(JSON.parse(fs.data).sales.filter(s => s.pay === 'borc').length === 1, 'admin borca satışı silə bilir (ödənişdən artıq deyilsə)');
  await p.click('#ovHist [data-close]');

  // 11) Samir Foto qiymət siyahısı: düyməyə bas → say → məbləğ özü
  await p.click('#btnSupp'); await p.click('[data-s=tab][data-t=add]'); await p.click('.stile:has-text("Samir Foto")');
  ok(await p.locator('.plist button').count() === 7 && (await p.textContent('.plist')).includes('Foto 15x21') && (await p.textContent('.plist')).includes('0.45'), 'Samir Foto: 7 mallıq qiymət siyahısı (15x21 — 0.45)');
  await p.click('.plist button:has-text("Foto 10x15")'); await p.fill('#sl_q_0', '200'); await p.dispatchEvent('#sl_q_0', 'input');
  ok((await p.inputValue('#sl_s_0')) === '60.00', '10x15 × 200 = 60.00 (0.30-dan)');
  await p.click('.plist button:has-text("Foto 20x25")'); await p.click('.plist button:has-text("Foto 20x25")');
  ok((await p.inputValue('#sl_q_1')) === '2' && (await p.inputValue('#sl_s_1')) === '4.00' && (await p.textContent('#s_tot')).startsWith('64.00'), 'eyni mala iki dəfə basmaq sayı artırır: 20x25 × 2 = 4.00, cəmi 64.00');
  await p.click('[data-s=save]');
  ok(JSON.parse(fs.data).expenses.at(-1).note.startsWith('Foto 10x15 ×200, Foto 20x25 ×2'), 'alış mal-mal yazıldı');
  await p.click('[data-s=tab][data-t=list]'); await p.click('[data-s=pled][data-id=sp1]');
  await p.fill('[data-pp="sp1|pi1"]', '0.35'); await p.dispatchEvent('[data-pp="sp1|pi1"]', 'change');
  await p.fill('#pl_n', 'Foto 30x40'); await p.fill('#pl_p', '6'); await p.click('[data-s=pladd][data-id=sp1]');
  const sf = JSON.parse(fs.data).suppliers.find(x => x.id === 'sp1');
  ok(sf.items[0].price === 0.35 && sf.items.length === 8, 'admin qiyməti dəyişdi (0.35) və yeni mal əlavə etdi');
  await p.click('#ovSupp [data-close]');

  // 12) Foto: özümüz / Samir Foto — satış ayrı yazılır, aylıq hesabatda ayrılır
  await p.fill('#q', '15x21'); await p.press('#q', 'Enter');
  ok(await p.isVisible('#ovSrc'), 'axtarış + Enter: 15x21 üçün mənbə soruşulur');
  await p.keyboard.press('1');
  await p.fill('.line input', '10'); await p.dispatchEvent('.line input', 'change');
  await p.click('#qClear'); await p.fill('#q', '15x21'); await p.press('#q', 'Enter'); await p.keyboard.press('2');
  await p.fill('#lines .line:nth-child(2) input', '20'); await p.dispatchEvent('#lines .line:nth-child(2) input', 'change');
  await p.click('#btnDone');
  const ls = JSON.parse(fs.data).sales.at(-1).lines;
  ok(ls.length === 2 && !ls[0].from && ls[1].from === 'sp1' && ls[1].cost === 0 && Math.abs(ls[1].scost - 9) < 1e-9 && ls[1].sum === 20, 'satış: özümüz 10 əd + Samir 20 əd (alış 20×0.45=9, maya 0)');
  await p.click('#btnRep'); await p.click('[data-rt=ay]');
  const mr = await p.textContent('#rbody');
  ok(mr.includes('özümüz çap etdik') && mr.includes('Samir Foto Studio: satış') && mr.includes('11.00'), 'aylıq: Samir Foto-dan satış 20, alış qiyməti 9, qazanc 11');
  await p.click('[data-rt=mal]');
  ok((await p.textContent('#rbody')).includes('15x21 · 🚚 Samir Foto') && (await p.textContent('#rbody')).includes('15x21 · 🖨 özümüz'), 'Məhsul + mənfəət: 15x21 iki ayrı sətir');
  await p.click('#ovRep [data-close]');

  // 13) Banner / Vinil: m² ilə, qiymət hər sifarişdə; həmişə Samir Banner-dən
  const sb = JSON.parse(fs.data).suppliers.find(x => x.id === 'sp4');
  ok(sb.items.map(x => x.name + ':' + x.price).join('|') === 'Banner (1 m²):6|Vinil (1 m²):6', 'Samir Banner: Banner və Vinil 1 m² — 6 ₼');
  await p.fill('#q', 'banner'); await p.press('#q', 'Enter');
  ok(await p.isVisible('#ovM2') && await p.isHidden('#ovSrc'), 'Banner: ölçü/qiymət pəncərəsi açılır (Özümüz/Samir sualı yoxdur)');
  await p.click('[data-m2=add]');
  ok((await p.textContent('#toast')).includes('Ölçünü yazın'), 'ölçüsüz əlavə olunmur');
  await p.fill('#m2_w', '3'); await p.fill('#m2_h', '1,5');
  ok((await p.textContent('#m2_area')).includes('4,5 m²'), '3 × 1,5 = 4,5 m²');
  await p.fill('#m2_pm', '12');
  ok((await p.inputValue('#m2_tot')) === '54.00' && (await p.textContent('#m2_sum')).includes('27.00') && (await p.textContent('#m2_sum')).includes('27.00 ₼'), '1 m² 12 → cəmi 54; Samir: 4,5 × 6 = 27, qazanc 27');
  await p.fill('#m2_tot', '50');
  ok((await p.inputValue('#m2_pm')) === '11.11', 'cəmi 50 yazanda 1 m² qiyməti özü: 11.11');
  await p.keyboard.press('Enter');
  ok(await p.isHidden('#ovM2') && (await p.textContent('#lines')).includes('3 × 1,5 m (4,5 m²)') && (await p.textContent('#total')).startsWith('50.00'), 'sifarişdə: Banner 3 × 1,5 m (4,5 m²) — 50.00');
  await p.click('#qClear'); await p.fill('#q', 'vinil'); await p.press('#q', 'Enter');
  ok((await p.textContent('#m2t')).includes('Vinil'), 'axtarış "vinil" + Enter: Vinil açılır (Banner yox)');
  await p.click('[data-m2=mode][data-k=a]'); await p.fill('#m2_a', '2'); await p.fill('#m2_n', '3'); await p.fill('#m2_pm', '10'); await p.click('[data-m2=add]');
  ok((await p.textContent('#total')).startsWith('110.00'), 'Vinil 2 m² × 3 ədəd × 10 = 60; cəmi 110');
  await p.click('#btnDone');
  const bl = JSON.parse(fs.data).sales.at(-1).lines;
  ok(bl[0].from === 'sp4' && bl[0].cost === 0 && bl[0].scost === 27 && bl[0].sum === 50 && bl[1].m2 === 6 && bl[1].scost === 36, 'satış: Samir Banner işi, alış dəyəri (27 və 36), maya 0');
  await p.click('#btnRep'); await p.click('[data-rt=ay]');
  const br = await p.textContent('#rbody');
  ok(br.includes('Samir Banner: satış') && br.includes('110.00') && br.includes('47.00') && br.includes('Banner (m²)'), 'aylıq: Samir Banner satış 110, qazanc 47, Banner (m²) sətri');
  await p.click('#ovRep [data-close]');

  ok(errs.length === 0, 'JS xətası yoxdur ' + errs.join('; '));
  await b.close();
})();
