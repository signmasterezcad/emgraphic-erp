// Telefon (Wi-Fi) sinxronu: node tests/sync.js
// launcher-dəki sınaq serverini (devserver_other.go) işə salır, iki "cihaz" (brauzer səhifəsi) ona qoşulur.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kassa-sync-'));
  const bin = path.join(tmp, 'kassa-dev');
  execFileSync('go', ['build', '-o', bin, '.'], { cwd: path.resolve('launcher'), stdio: 'inherit' });
  const port = 18765 + Math.floor(Math.random() * 1000);
  const srv = spawn(bin, ['-app', path.resolve('app'), '-data', tmp, '-addr', '127.0.0.1:' + port, '-code', '123456']);
  await new Promise((res, rej) => { srv.stdout.on('data', d => { if (String(d).includes('hazır')) res(); }); srv.on('exit', rej); });
  const url = `http://127.0.0.1:${port}/`;
  const dataFile = path.join(tmp, 'data', 'kassa-data.json');
  const disk = () => JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const b = await chromium.launch();
  const errs = [];
  const open = async (name, vp) => {
    const ctx = await b.newContext({ viewport: vp || { width: 1366, height: 768 } });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto(url);
    return p;
  };
  try {
    // 1) Telefon kod soruşur; səhv kod → izah, düz kod → qoşulur
    const A = await open('A', { width: 390, height: 844 });
    await A.waitForSelector('#ovKey:not([hidden])');
    ok(true, 'telefon: kod soruşulur');
    await A.fill('#keyIn', '111111'); await A.click('#keyGo'); await sleep(300);
    ok((await A.textContent('#keyMsg')).includes('Kod səhvdir'), 'səhv kod: izah çıxır');
    await A.fill('#keyIn', '123456'); await A.click('#keyGo');
    await A.waitForFunction(() => document.querySelector('#today')?.textContent.includes('Bu gün'));
    await sleep(800);
    ok(fs.existsSync(dataFile) && disk().items.length > 0, 'telefon A: məlumat kompüterin faylına yazıldı');
    ok(await A.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'telefon ekranı (390px): yana sürüşmə yoxdur');

    const B = await open('B');
    await B.fill('#keyIn', '123456'); await B.click('#keyGo');
    await B.waitForFunction(() => document.querySelector('#today')?.textContent.includes('Bu gün'));
    ok(await B.evaluate(() => typeof S === 'object' && S.items.length) === disk().items.length, 'cihaz B: eyni məlumatı açdı');

    // 2) A satır → B 2-3 saniyəyə görür
    const sell = async (P, what) => { await P.fill('#q', what); await P.press('#q', 'Enter'); await P.click('#btnDone'); await P.fill('#q', ''); };
    await sell(A, 'fincan termo');
    await B.waitForFunction(() => S.sales.length === 1, null, { timeout: 8000 });
    ok((await B.textContent('#today')).includes('10.00'), 'A-dakı satış B-də göründü (10.00 ₼)');

    // 3) Eyni anda hər iki cihazda satış → heç biri itmir
    await Promise.all([sell(A, 'fincan sade'), sell(B, 'fincan rəngli')]);
    await sleep(5000);
    const d = disk();
    ok(d.sales.length === 3, 'eyni anda 2 satış: faylda 3 satış (heç biri itmədi)');
    ok(await A.evaluate(() => S.sales.length) === 3 && await B.evaluate(() => S.sales.length) === 3, 'hər iki cihazda 3 satış');

    // 4) Ayar dəyişikliyi: B-də tədarükçü əlavə et → A-da görünür; A-da kassir əlavə et → B-də görünür
    await B.click('#btnSupp'); await B.click('[data-s=tab][data-t=list]');
    await B.fill('#s_new', 'Kamran Kağız'); await B.click('[data-s=sadd]'); await B.click('#ovSupp [data-close]');
    await A.click('#btnSet'); await A.click('[data-rt=users]');
    await A.fill('#nu_name', 'Nigar'); await A.fill('#nu_pin', '4444'); await A.click('[data-act=uadd]'); await A.click('#ovRep [data-close]');
    await sleep(5000);
    ok(await A.evaluate(() => S.suppliers.some(x => x.name === 'Kamran Kağız')), 'B-də əlavə olunan tədarükçü A-da var');
    ok(await B.evaluate(() => S.users.some(u => u.name === 'Nigar')), 'A-da (telefonda) əlavə olunan kassir B-də var');
    ok(disk().suppliers.some(x => x.name === 'Kamran Kağız') && disk().users.some(u => u.name === 'Nigar'), 'hər ikisi kompüterin faylında');

    // 5) Anbar qalığı: hər iki tərəfin silinməsi toplanır (birləşdirmə qaydası)
    const m = await A.evaluate(() => merge3({ m: [{ id: 'a', stock: 100, cost: 1 }] }, { m: [{ id: 'a', stock: 90, cost: 1 }] }, { m: [{ id: 'a', stock: 95, cost: 1 }] }).m[0].stock);
    ok(m === 85, 'anbar: 100 → bu cihazda −10, o birində −5 = 85');
    const del = await A.evaluate(() => merge3({ x: [{ id: 1 }, { id: 2 }] }, { x: [{ id: 1 }, { id: 2 }, { id: 3 }] }, { x: [{ id: 2 }] }).x.map(o => o.id).join(','));
    ok(del === '2,3', 'siyahı: o birində silinən silinir, bunda əlavə olunan qalır');

    // 6) Kompüterin özü (exe): funksiyalar birbaşa serverə gedir; telefonun dəyişikliyini görür və ehtiyat nüsxəsini yazır
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const PC = await ctx.newPage(); PC.on('pageerror', e => errs.push('PC: ' + e.message));
    const H = { 'X-Kassa-Key': '123456', 'Content-Type': 'application/json' };
    const call = async (u, o = {}) => { const r = await fetch(url + u, { ...o, headers: H }); return r.json(); };
    let pcBackups = 0, phoneOn = true;
    await PC.exposeFunction('erpLoadV', () => call('api/state'));
    await PC.exposeFunction('erpSaveV', (base, data) => call('api/save', { method: 'POST', body: JSON.stringify({ base, data }) }));
    await PC.exposeFunction('erpVer', async () => (await call('api/ver')).ver);
    await PC.exposeFunction('erpLoad', async () => (await call('api/state')).data);
    await PC.exposeFunction('erpSave', () => null);
    await PC.exposeFunction('erpBackup', (j, k) => { if (k === 'emel') pcBackups++; return 'x'; });
    await PC.exposeFunction('erpBackupList', () => []);
    await PC.exposeFunction('erpBackupRead', () => '');
    await PC.exposeFunction('erpBackupKinds', () => ['avto', 'el', 'emel']);
    await PC.exposeFunction('erpPaths', () => ({ data: 'C:\\d', backup: 'C:\\e' }));
    await PC.exposeFunction('erpOpenFolder', () => null);
    await PC.exposeFunction('erpPhoneInfo', () => ({ on: phoneOn, port: 8765, ips: ['192.168.1.5'], code: '123456', seen: [{ ip: '192.168.1.20', ago: 5 }] }));
    await PC.exposeFunction('erpPhone', on => { phoneOn = on; return {}; });
    await PC.exposeFunction('erpPhoneNewCode', () => ({}));
    await PC.goto('file://' + path.resolve('app/index.html'));
    await PC.waitForFunction(() => typeof S === 'object' && S && S.sales.length === 3);
    ok(true, 'kompüter (exe) eyni məlumatı açdı: 3 satış');
    await sell(A, 'fincan sade');
    await PC.waitForFunction(() => S.sales.length === 4, null, { timeout: 8000 });
    await sleep(2600);
    ok(pcBackups >= 1, 'telefondakı satışın ehtiyat nüsxəsini kompüter yazdı');
    await PC.click('#btnSet'); await PC.click('[data-rt=phone]'); await PC.waitForSelector('#phoneBox .addr');
    const pt = await PC.textContent('#phoneBox');
    ok(pt.includes('http://192.168.1.5:8765') && pt.includes('123456') && pt.includes('192.168.1.20'), 'kompüter: 📱 Telefon bölməsində ünvan, kod və qoşulan telefon');
    await PC.click('[data-act=phoff]'); await sleep(200);
    ok(!phoneOn && (await PC.textContent('#phoneBox')).includes('Bağlıdır'), '"Bağla" telefon serverini bağlayır');
    await A.click('#btnSet'); await A.click('[data-rt=phone]'); await A.waitForSelector('#phoneBox p');
    ok((await A.textContent('#phoneBox')).includes('Bu telefon kompüterdəki KASSA-ya'), 'telefonda: "bu telefon kompüterə qoşulub" yazılır');
    await A.click('#ovRep [data-close]');

    // 7) Kompüter "sönür" → telefonda xəbərdarlıq; açılanda bərpa
    srv.kill(); await sleep(3500);
    ok(await A.isVisible('#syncBar') && (await A.textContent('#syncBar')).includes('Kompüterlə əlaqə yoxdur'), 'kompüter sönəndə telefonda qırmızı xəbərdarlıq');
  } finally {
    ok(errs.length === 0, 'JS xətası yoxdur ' + errs.join('; '));
    srv.kill(); await b.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})();
