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
  ok(await p.isVisible('#btnSet') && await p.isVisible('#btnExp') && await p.isVisible('#btnEdit'), 'admin bütün düymələri görür');

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
  ok(tabs.join('|') === 'Bu gün|Zay', 'Nigar: yalnız "Bu gün" və "Zay" tabları (Aylıq, Mənfəət, Anbar yox)');
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
  ok((await p.textContent('#toast')).includes('Məbləği yazın'), 'məbləğsiz yazılmır');
  await p.fill('#s_amt', '45.5'); await p.fill('#s_note', '100 foto 10x15'); await p.press('#s_amt', 'Enter');
  await p.click('.stile:has-text("Şamil Vinetka")'); await p.fill('#s_amt', '20'); await p.click('[data-s=pay][data-p=kart]'); await p.click('[data-s=save]');
  const ex = JSON.parse(fs.data).expenses.filter(x => x.supp);
  ok(ex.length === 2 && ex[0].cat === 'Samir Foto' && ex[0].amount === 45.5 && ex[0].pay === 'nağd' && ex[0].worker === 'Leyla' && ex[1].pay === 'kart', 'alışlar xərclərə tədarükçünün adı ilə düşdü (kim yazıb, ödəniş)');
  ok((await p.textContent('#suppBody')).includes('100 foto 10x15') && await p.locator('#suppBody [data-s=ask]').count() === 2, 'bu günün siyahısı, Leyla öz yazdığını silə bilər');
  await p.click('#ovSupp [data-close]');
  await p.click('#btnUser'); await p.click(`[data-login="${adminId}"]`); await p.keyboard.type('1111'); await p.keyboard.press('Enter');
  await p.click('#btnSupp'); await p.click('[data-s=tab][data-t=rep]');
  const sr = await p.textContent('#suppBody');
  ok(sr.includes('65.50') && sr.includes('45.50') && sr.includes('Samir Foto') && sr.includes('20.00'), 'admin: aylıq hesabat — cəmi 65.50, Samir Foto 45.50, Şamil Vinetka 20.00');
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
  await p.click('.stile:has-text("Vəfa Foto")'); await p.fill('#s_amt', '100'); await p.click('[data-s=pay][data-p=nisyə]');
  ok((await p.textContent('#suppBody')).includes('borc Vəfa Foto adına'), 'nisyə seçiləndə izah çıxır');
  await p.click('[data-s=save]');
  await p.click('.stile:has-text("Vəfa Foto")'); await p.fill('#s_amt', '50'); await p.click('[data-s=pay][data-p=nisyə]'); await p.click('[data-s=save]');
  ok((await p.textContent('#suppBadge')).includes('150.00') && await p.isVisible('#suppBadge'), 'başlıqda borc nişanı: 150.00 ₼');
  await p.click('[data-s=tab][data-t=debt]');
  ok((await p.textContent('#suppBody')).includes('Borc: 150.00'), 'Borclar: Vəfa Foto 150.00');
  await p.fill('#dp_sp2', '200'); await p.click('[data-s=dpay][data-id=sp2][data-by=nağd]');
  ok((await p.textContent('#toast')).includes('Borcdan çox'), 'borcdan çox ödəmək olmur');
  await p.fill('#dp_sp2', '60'); await p.click('[data-s=dpay][data-id=sp2][data-by=nağd]');
  ok((await p.textContent('#toast')).includes('qalan borc 90.00') && (await p.textContent('#suppBadge')).includes('90.00'), 'hissəli ödəniş: 60 ödəndi, qalan 90');
  await p.click('[data-s=dpay][data-id=sp2][data-by=kart]');
  ok((await p.textContent('#toast')).includes('borc bağlandı') && await p.isHidden('#suppBadge'), 'qalanı kartla ödəndi: borc bağlandı, nişan getdi');
  await p.click('#ovSupp [data-close]');
  await p.click('#btnRep'); await p.click('[data-rt=gun]');
  ok((await p.textContent('#rbody')).includes('60.00'), 'nağd borc ödənişi (60) kassadan çıxılır');
  await p.click('#ovRep [data-close]');
  const months = JSON.parse(fs.data).expenses.filter(x => x.supp === 'sp2' && x.pay === 'nisyə').reduce((a, x) => a + x.amount, 0);
  ok(months === 150, 'nisyə alışlar xərc kimi alış günündə sayılır (150)');
  await p.click('#btnUser'); await p.click(`[data-login="${leyla}"]`); await p.keyboard.type('2222'); await p.keyboard.press('Enter');
  await p.click('#btnSupp');
  ok(!(await p.textContent('#stabs')).includes('Borclar') && await p.isHidden('#suppBadge'), 'Leyla: borc icazəsi yoxdur — Borclar tabı və nişan görünmür');
  await p.click('#ovSupp [data-close]');

  ok(errs.length === 0, 'JS xətası yoxdur ' + errs.join('; '));
  await b.close();
})();
