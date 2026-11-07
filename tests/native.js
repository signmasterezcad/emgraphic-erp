// EMGRAPHIC ERP.exe mühitinin simulyasiyası: node tests/native.js
// exe-nin erpLoad/erpSave/erpBackup... funksiyaları burada Node yaddaşında təqlid olunur.
const { chromium } = require('playwright');
const path = require('path');
const fs = { data: '', backups: [] };
let clock = 0;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const errs = [];
  const open = async (seedLocal) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.exposeFunction('erpLoad', () => fs.data);
    await p.exposeFunction('erpSave', j => { if (j[0] !== '{') throw new Error('bad'); fs.data = j; });
    await p.exposeFunction('erpBackup', (j, kind) => { const name = `emgraphic-2026-11-${String(10 + clock++).padStart(2, '0')}_10-00-00-${kind === 'avto' ? 'avto' : 'el'}.json`; fs.backups.unshift({ name, size: j.length, time: Date.now(), j }); return 'C:\\EMGRAPHIC-ERP\\ehtiyat\\' + name; });
    await p.exposeFunction('erpBackupList', () => fs.backups.map(({ name, size, time }) => ({ name, size, time })));
    await p.exposeFunction('erpBackupRead', n => fs.backups.find(x => x.name === n).j);
    await p.exposeFunction('erpPaths', () => ({ data: 'C:\\Users\\x\\AppData\\Roaming\\EMGRAPHIC ERP\\data\\emgraphic-data.json', backup: 'C:\\EMGRAPHIC-ERP\\ehtiyat' }));
    await p.exposeFunction('erpOpenFolder', () => null);
    if (seedLocal !== undefined) await p.addInitScript(v => { if (v) localStorage.setItem('fotoerp.v1', v); else localStorage.clear(); }, seedLocal);
    await p.goto('file://' + path.resolve('app/index.html'));
    await p.waitForFunction(() => document.querySelector('#chips .chip'));
    await p.waitForTimeout(200);
    return p;
  };

  // 1) v0.5.0 brauzer yaddaşında 1 satış var → exe ilk dəfə açılır
  const old = JSON.stringify({ items: [{ id: 'x1', name: 'Köhnə xidmət', cat: 'cap', fav: 1, icon: 'A', color: '#2563eb', recipe: [], tiers: [[1, 2]] }],
    materials: [{ id: 'a4', name: 'A4 80 qr', cost: 0.02, stock: 999, min: 1 }], workers: ['Leyla'], sales: [{ ts: Date.now(), worker: 'Leyla', pay: 'nağd', lines: [], total: 7 }], waste: [] });
  let p = await open(old);
  ok((await p.textContent('#toast')).includes('köçürüldü') || fs.data.includes('Köhnə xidmət'), 'köhnə yaddaşdan fayla avtomatik köçürüldü');
  ok(JSON.parse(fs.data).sales.length === 1 && (await p.textContent('#chips')).includes('999'), 'köçürülən məlumat: 1 satış, anbar 999');
  ok(fs.backups.length === 1 && fs.backups[0].name.includes('-avto'), 'açılışda avtomatik ehtiyat nüsxə yaradıldı');

  // 2) satış → fayla yazılır; eyni gün ikinci avtomatik nüsxə yaranmır
  await p.click('[data-add=x1]'); await p.click('#btnDone'); await p.waitForTimeout(200);
  ok(JSON.parse(fs.data).sales.length === 2, 'satış fayla yazıldı');
  ok(fs.backups.length === 1, 'eyni gündə ikinci avtomatik nüsxə yaranmır');
  await p.close();

  // 3) yenidən açılış: brauzer yaddaşı boş olsa da, məlumat fayldan gəlir
  p = await open('');
  ok((await p.textContent('#today')).includes('2'), 'yenidən açılanda məlumat fayldan oxundu (2 satış)');
  ok(!(await p.isVisible('#banner')), 'məlumat varsa "köhnə versiya" xəbərdarlığı çıxmır');

  // 4) Ehtiyat ekranı: qovluq yolu, siyahı, əl ilə nüsxə, bərpa
  await p.click('#btnSet'); await p.click('[data-rt=backup]'); await p.waitForSelector('#blist table');
  ok((await p.textContent('#rbody')).includes('C:\\EMGRAPHIC-ERP\\ehtiyat'), 'ehtiyat qovluğunun yolu göstərilir');
  await p.click('[data-act=bnow]'); await p.waitForTimeout(200);
  ok(fs.backups.length === 2 && fs.backups[0].name.includes('-el'), '"İndi ehtiyat nüsxə yarat" işləyir');
  ok(await p.locator('#blist tr').count() === 3, 'siyahıda 2 nüsxə görünür');
  const firstBackup = fs.backups[fs.backups.length - 1].name; // 1 satışlı köhnə nüsxə
  await p.click(`[data-act=brest][data-n="${firstBackup}"]`); await p.waitForSelector('[data-act=bimp]');
  ok((await p.textContent('[data-act=bimp]')).includes('1 satışlı'), 'nüsxə seçildi: 1 satış');
  await p.click('[data-act=bimp]'); await p.waitForTimeout(300);
  ok(JSON.parse(fs.data).sales.length === 1, 'bərpa: məlumat 1 satışlı nüsxəyə qaytarıldı');
  ok(fs.backups.length === 3 && JSON.parse(fs.backups[0].j).data.sales.length === 2, 'bərpadan əvvəl indiki vəziyyətin nüsxəsi saxlandı');
  await p.close();

  // 5) məlumat faylı xarab olub → ən son nüsxə açılır
  fs.data = '{xarab';
  p = await open(''); await p.waitForTimeout(400);
  const t5 = await p.textContent('#toast'); if (!t5.includes('Ən son')) console.log('   toast:', t5);
  ok(t5.includes('Ən son ehtiyat nüsxə'), 'xarab fayl: ən son ehtiyat nüsxə açıldı');
  ok((await p.textContent('#chips')).includes('999'), 'xarab fayldan sonra məlumat yerindədir');

  // 6) xarab fayl və ehtiyat nüsxə yoxdur → fayla toxunulmur
  await p.close(); fs.data = '{xarab'; fs.backups = [];
  p = await open(''); await p.waitForTimeout(400);
  await p.click('#btnZay'); await p.click('#zSave'); await p.waitForTimeout(200);
  ok(fs.data === '{xarab', 'xarab fayl, nüsxə yoxdur: fayl üzərinə yazılmır');

  ok(errs.length === 0, 'JS xətası yoxdur ' + errs.join('; '));
  await b.close();
})();
