// Sadə avtomatik yoxlama: node tests/smoke.js [app/index.html]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const external = []; p.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
  await p.goto('file://' + path.resolve(process.argv[2] || 'app/index.html'));
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const vis = id => p.isVisible('#' + id);

  ok(!(await vis('ovZay')) && !(await vis('ovRep')), 'açılışda pəncərələr gizlidir');
  await p.click('#btnZay'); ok(await p.locator('#zMat option').count() === 5, 'zay: material siyahısı');
  await p.click('#ovZay [data-close]'); ok(!(await vis('ovZay')), 'zay: Bağla işləyir');

  await p.click('[data-add=a4bw]'); for (let i = 0; i < 11; i++) await p.click('[data-inc=a4bw]');
  ok((await p.textContent('#total')).startsWith('3.60'), '12 × A4 ağ-qara = 3.60 (pillə 11+)');
  await p.click('#btnDone');
  ok((await p.textContent('#chips')).includes('1188'), 'A4 80 qr qalığı 1200 → 1188');

  await p.evaluate(() => document.fonts.ready);
  ok(await p.evaluate(() => document.fonts.check('700 16px "Noto Sans"', 'əğ₼')), 'şrift proqramın içindən yükləndi (ə, ğ, ₼)');

  // Ayarlar: yeni məhsul
  await p.click('#btnSet'); ok((await p.textContent('#rt')).includes('Ayarlar'), 'Ayarlar pəncərəsi açıldı');
  await p.click('[data-rt=admin]');
  await p.click('[data-act=new]');
  await p.fill('#e_name', 'A3 rəngli çap');
  await p.click('[data-act=radd]'); await p.selectOption('#r_m_0', 'a4'); await p.fill('#r_q_0', '2');
  await p.fill('#t_p_0', '2'); await p.click('[data-act=tadd]'); await p.fill('#t_min_1', '20'); await p.fill('#t_p_1', '1.5');
  await p.check('#e_fav');
  await p.click('[data-act=isave]');
  ok((await p.textContent('#rbody')).includes('A3 rəngli çap'), 'admin: yeni məhsul siyahıda');
  await p.click('#ovRep [data-close]');
  const btn = p.locator('.svc', { hasText: 'A3 rəngli çap' });
  ok(await btn.count() === 1, 'admin: yeni məhsul satış ekranında');
  await btn.click(); await p.fill('.line input', '20'); await p.dispatchEvent('.line input', 'change');
  ok((await p.textContent('#total')).startsWith('30.00'), 'yeni məhsul: 20 × 1.50 = 30.00');
  await p.click('#btnDone');
  ok((await p.textContent('#chips')).includes('1148'), 'yeni məhsulun resepti: 20 × 2 vərəq silindi');

  // Bölmələr
  await p.click('#btnSet');
  ok(!(await p.textContent('#rtabs')).includes('Bu gün'), 'Ayarlarda hesabat tabları yoxdur');
  await p.fill('#nc_name', 'Möhür'); await p.click('[data-act=cadd]');
  ok((await p.textContent('#tabs')).includes('Möhür'), 'yeni bölmə satış ekranında');
  const n = await p.locator('[data-act=cup]').count();
  await p.locator('[data-act=cup]').nth(n - 1).click();
  const tabs = await p.locator('#tabs .tab').allTextContents();
  ok(tabs.indexOf('Möhür') === tabs.length - 2, 'bölmə ↑ ilə yuxarı keçdi');
  const inp = p.locator('input[data-cid]').nth(n - 2); await inp.fill('Möhür və ştamp'); await inp.press('Enter');
  ok((await p.textContent('#tabs')).includes('Möhür və ştamp'), 'bölmənin adı dəyişdi');
  await p.locator('[data-act=cbtn]').nth(n - 2).click(); await p.click('[data-act=new]');
  await p.fill('#e_name', 'Avtomat möhür'); await p.fill('#t_p_0', '15');
  await p.locator('[data-act=sw]').nth(7).click();
  ok((await p.inputValue('#e_name')) === 'Avtomat möhür', 'rəng seçəndə yazılan ad qalır');
  await p.click('[data-act=isave]');
  await p.click('[data-rt=bolme]'); await p.locator('[data-act=cdel]').nth(n - 2).click();
  ok((await p.textContent('#toast')).includes('1 düymə var'), 'içində düymə olan bölmə silinmir');
  await p.click('#ovRep [data-close]');
  await p.locator('#tabs .tab', { hasText: 'Möhür və ştamp' }).click();
  const mb = p.locator('.svc', { hasText: 'Avtomat möhür' });
  ok(await mb.count() === 1 && (await mb.getAttribute('style')).includes('#dc2626'), 'yeni bölmədə yeni düymə, seçilmiş rənglə');
  // Düymə sırası
  await p.click('#btnSet'); await p.click('[data-rt=admin]'); await p.click('[data-act=scat][data-c=cap]');
  await p.click('[data-act=down][data-id=a4bw]');
  await p.click('#ovRep [data-close]'); await p.locator('#tabs .tab', { hasText: 'Çap' }).click();
  const names = await p.locator('#grid .nm').allTextContents();
  ok(names[0] === 'A4 rəngli' && names[1] === 'A4 ağ-qara', 'düymə ↓ ilə yer dəyişdi');

  // Materiallar
  await p.click('#btnSet'); await p.click('[data-rt=mat]');
  await p.fill('#nm_name', 'A3 80 qr'); await p.fill('#nm_cost', '0.04'); await p.fill('#nm_stock', '500');
  await p.click('[data-act=madd]');
  ok((await p.textContent('#chips')).includes('A3 80 qr'), 'material əlavə olundu');
  await p.click('[data-act=mdel][data-id=a4]');
  ok(await p.isVisible('#toast') && (await p.textContent('#toast')).includes('reseptlərdən'), 'istifadədə olan material silinmir');

  // Ehtiyat nüsxə: fayla yaz və geri yüklə
  await p.click('[data-rt=backup]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=bexp]')]);
  const file = await dl.path(); const j = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  ok(j.app === 'EMGRAPHIC ERP' && j.data.sales.length === 2, 'ehtiyat faylı: 2 satış');
  await p.click('[data-act=reset]'); await p.click('[data-act=reset]');
  ok((await p.textContent('#today')).includes('0'), 'sıfırlama (iki addımla)');
  await p.setInputFiles('#bfile', file); await p.waitForSelector('[data-act=bimp]');
  await p.click('[data-act=bimp]');
  ok((await p.textContent('#chips')).includes('1148'), 'ehtiyat nüsxədən bərpa');

  ok(external.length === 0, 'internetə heç bir sorğu getmir ' + external.join(' '));
  ok(errs.length === 0, 'JS xətası yoxdur ' + (errs.join('; ') || ''));
  await b.close();
})();
