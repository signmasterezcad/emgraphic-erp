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

  await p.click('[data-cat=skan]');
  await p.click('[data-add=kser]'); for (let i = 0; i < 20; i++) await p.click('[data-inc=kser]');
  ok((await p.textContent('#total')).startsWith('2.10'), '21 × Kserokopiya = 2.10 (pillə 21+)');
  await p.click('#btnDone');
  ok((await p.textContent('#chips')).includes('1179'), 'A4 80 qr qalığı 1200 → 1179');

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
  ok((await p.textContent('#chips')).includes('1139'), 'yeni məhsulun resepti: 20 × 2 vərəq silindi');

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
  await p.click('#ovRep [data-close]');
  await p.locator('#tabs .tab', { hasText: 'Möhür və ştamp' }).click();
  const mb = p.locator('.svc', { hasText: 'Avtomat möhür' });
  ok(await mb.count() === 1 && (await mb.getAttribute('style')).includes('#dc2626'), 'yeni bölmədə yeni düymə, seçilmiş rənglə');
  // İçində düymə olan bölməni silmək: köçür və ya birlikdə sil
  await p.click('#btnSet'); await p.click('[data-rt=bolme]');
  await p.locator('[data-act=cdel]').nth(n - 2).click();
  ok((await p.textContent('tr.confirm')).includes('1 düymə var'), 'Sil: təsdiq sətri düymə sayını göstərir');
  await p.click('[data-act=cdelx]');
  ok(await p.locator('tr.confirm').count() === 0, 'Ləğv et: heç nə silinmədi');
  await p.locator('[data-act=cdel]').nth(n - 2).click();
  const cid = await p.locator('[data-act=cmove]').getAttribute('data-c');
  await p.selectOption('#mv_' + cid, 'cap'); await p.click('[data-act=cmove]');
  ok(!(await p.textContent('#tabs')).includes('Möhür və ştamp') && (await p.textContent('#toast')).includes('köçdü'), 'bölmə silindi, düymə başqa bölməyə köçdü');
  await p.click('#ovRep [data-close]'); await p.click('[data-cat=cap]');
  ok(await p.locator('.svc', { hasText: 'Avtomat möhür' }).count() === 1, 'köçürülən düymə Çap bölməsində');
  await p.click('#btnSet'); await p.click('[data-rt=bolme]');
  const lamRow = p.locator('tr', { has: p.locator('input[value="Laminasiya / Cild"]') });
  await lamRow.locator('[data-act=cdel]').click(); await p.click('[data-act=cdelall]');
  ok(!(await p.textContent('#tabs')).includes('Laminasiya') && !(await p.content()).includes('data-id="lamA4"'), 'bölmə düymələri ilə birlikdə silindi');
  await p.click('#ovRep [data-close]');
  // Düymə sırası
  await p.click('#btnSet'); await p.click('[data-rt=admin]'); await p.click('[data-act=scat][data-c=cap]');
  await p.click('[data-act=down][data-id=g_a4]');
  await p.click('#ovRep [data-close]'); await p.click('[data-cat=cap]');
  const names = await p.locator('#grid .nm').allTextContents();
  ok(names[0] === 'A3 Sadə' && names[1] === 'A4 Sadə', 'düymə ↓ ilə yer dəyişdi');

  // ÇAP bölməsi: 4 qrup düyməsi, içində düymələr
  ok((await p.textContent('#tabs')).includes('ÇAP'), 'bölmənin adı ÇAP');
  await p.click('[data-grp=g_a4]');
  ok((await p.locator('#grid [data-add]').allTextContents()).join('|').includes('Sadə yazı ağ-qara') && await p.locator('#grid [data-add]').count() === 8, 'A4 Sadə: içində 8 düymə');
  await p.click('[data-add=a4s_bw]'); await p.fill('.line input', '100'); await p.dispatchEvent('.line input', 'change'); await p.waitForTimeout(50);
  ok((await p.textContent('#total')).startsWith('10.00'), 'Sadə yazı ağ-qara: 100 × 0.10 = 10.00');
  await p.fill('.line input', '101'); await p.dispatchEvent('.line input', 'change'); await p.waitForTimeout(50);
  ok((await p.textContent('#total')).startsWith('5.05'), '100-dən çox: 101 × 0.05 = 5.05');
  await p.click('#btnClear'); await p.click('[data-add=a4s_40]');
  ok((await p.textContent('#total')).startsWith('0.30'), 'Qismən 40% rəngli: 0.30');
  await p.click('#btnClear'); await p.click('[data-add=a4s_60]'); await p.click('[data-add=a4s_100]');
  ok((await p.textContent('#total')).startsWith('0.90'), '60% (0.40) + 100% (0.50) = 0.90');
  await p.click('#btnClear'); await p.click('[data-add=a4s_2t]'); await p.click('[data-add=a4s_elan]');
  ok((await p.textContent('#total')).startsWith('0.65'), 'İki tərəfli (0.15) + Elan (0.50) = 0.65');
  await p.click('#btnClear'); await p.click('[data-add=a4s_2tr]');
  ok((await p.textContent('#total')).startsWith('0.25'), 'İki tərəfli rəngli çap: 0.25');
  const order5 = await p.locator('#grid [data-add] .nm').allTextContents();
  ok(order5.join('|') === 'Sadə yazı ağ-qara|30% rəngli çap|40% rəngli çap|60% rəngli çap|100% rəngli çap|İki tərəfli çap|Elan hazırlanması|İki tərəfli rəngli çap', 'A4 Sadə: adlarda "Qismən" yoxdur, sıra düzgündür');
  await p.click('#btnClear'); await p.click('[data-back]');
  ok(await p.locator('#grid .svc.grpt').count() === 5 && (await p.locator('#grid .svc.grpt .nm').allTextContents()).pop() === 'Sənəd Surəti (Kserokopiya)' && await p.locator('[data-add=a4bw],[data-add=a4c],[data-add=a4qc]').count() === 0, 'ÇAP: 5 qrup (sonuncu Sənəd Surəti), köhnə 3 düymə silinib');
  await p.click('[data-grp=g_foto]');
  ok(await p.isVisible('#crumb') && (await p.textContent('#grid')).includes('hələ düymə yoxdur'), 'boş qrup açılır, izah görünür');
  await p.click('#btnEdit'); await p.click('[data-act=qnew]');
  ok((await p.textContent('#editor h4')).includes('Foto Kağızlar'), 'qrupun içində + Yeni düymə: qrup seçilib');
  await p.fill('#e_name', '10x15 parlaq'); await p.fill('#t_p_0', '0.40'); await p.click('[data-act=radd]'); await p.selectOption('#r_m_0', 'f1015');
  await p.click('[data-act=isave]'); await p.click('#ovRep [data-close]'); await p.click('[data-act=editdone]');
  ok(await p.locator('#grid [data-add]', { hasText: '10x15 parlaq' }).count() === 1, 'yeni düymə qrupun içində');
  await p.click('#grid [data-add]'); await p.click('#btnDone');
  ok((await p.textContent('#chips')).includes('10x15 foto kağızı: 499'), 'qrupdakı düymə ilə satış: foto kağız 500 → 499');
  await p.click('[data-back]');
  ok(!(await p.isVisible('#crumb')) && await p.locator('#grid [data-add]', { hasText: '10x15 parlaq' }).count() === 0, '← geri: bölməyə qayıtdı, içdəki düymə burada görünmür');
  ok((await p.textContent('[data-grp=g_foto]')).includes('1 düymə'), 'qrup düyməsində içindəki say görünür');
  // Ayarlarda yeni qrup yaratmaq
  await p.click('#btnSet'); await p.click('[data-rt=admin]'); await p.click('[data-act=scat][data-c=cap]'); await p.click('[data-act=new]');
  await p.selectOption('#e_type', 'group'); await p.fill('#e_name', 'Laminasiya qrupu'); await p.click('[data-act=isave]');
  await p.click('#ovRep [data-close]');
  ok(await p.locator('#grid .svc.grpt', { hasText: 'Laminasiya qrupu' }).count() === 1, 'Ayarlardan yeni qrup yaradıldı');
  // qrupu içindəkilərlə birlikdə silmək
  await p.click('#btnEdit');
  const fg = p.locator('[data-grp=g_foto]');
  await fg.locator('[data-act=qdel]').click();
  ok((await fg.locator('[data-act=qdel]').textContent()) === '1 düymə ilə sil?', 'qrup 🗑: içindəki say ilə soruşur');
  await fg.locator('[data-act=qdel]').click();
  ok(await p.locator('[data-grp=g_foto]').count() === 0 && !(await p.evaluate(() => S.items.some(i => i.name === '10x15 parlaq'))), 'qrup içindəki düymə ilə birlikdə silindi');
  await p.click('[data-act=editdone]');

  // Düzəliş rejimi: satış ekranından birbaşa əlavə et / sil
  await p.click('#btnEdit');
  ok(await p.isVisible('#editbar'), 'düzəliş rejimi açıldı');
  await p.click('[data-cat=foto]', { position: { x: 12, y: 12 } });
  const before = await p.locator('#grid .svc:not(.addtile)').count();
  await p.click('#grid .svc:not(.addtile) >> nth=0');
  ok((await p.textContent('#lines')).includes('Xidmət düyməsinə'), 'düzəliş rejimində düyməyə basmaq satışa əlavə etmir');
  await p.click('[data-act=qnew]');
  ok(await p.isVisible('#editor') && (await p.inputValue('#e_cat')) === 'foto', '+ Yeni düymə: redaktor açıldı, bölmə Foto');
  await p.fill('#e_name', 'Sənəd şəkli 3x4'); await p.fill('#t_p_0', '4'); await p.click('[data-act=isave]');
  await p.click('#ovRep [data-close]');
  ok(await p.locator('#grid .svc:not(.addtile)').count() === before + 1, 'yeni düymə Foto bölməsində');
  const tile = p.locator('#grid .svc', { hasText: 'Sənəd şəkli 3x4' });
  await tile.locator('[data-act=qdel]').click();
  ok((await tile.locator('[data-act=qdel]').textContent()) === 'Sil?', '🗑 birinci basışda təsdiq soruşur');
  await tile.locator('[data-act=qdel]').click();
  ok(await p.locator('#grid .svc', { hasText: 'Sənəd şəkli 3x4' }).count() === 0, '🗑 ikinci basışda düymə silindi');
  await p.locator('#grid .svc', { hasText: '10x15 foto' }).locator('[data-act=qedit]').click();
  ok((await p.inputValue('#e_name')) === '10x15 foto', '✏️ düyməni redaktə üçün açır');
  await p.click('#ovRep [data-close]');
  await p.click('[data-act=qcadd]'); await p.fill('#nc_name', 'Banner'); await p.click('[data-act=cadd]'); await p.click('#ovRep [data-close]');
  const bt = p.locator('#tabs .tab', { hasText: 'Banner' });
  ok(await bt.count() === 1, '+ Bölmə ilə yeni bölmə');
  await bt.locator('[data-act=qcdel]').click(); await bt.locator('[data-act=qcdel]').click();
  ok(await p.locator('#tabs .tab', { hasText: 'Banner' }).count() === 0, 'boş bölmə 🗑 ilə silindi');
  const vt = p.locator('#tabs .tab', { hasText: 'Vizit' });
  await vt.locator('[data-act=qcdel]').click();
  ok((await vt.locator('[data-act=qcdel]').textContent()).includes('1 düymə ilə sil?'), 'dolu bölmə 🗑: neçə düymə ilə silinəcəyini soruşur');
  await vt.locator('[data-act=qcdel]').click();
  ok(await p.locator('#tabs .tab', { hasText: 'Vizit' }).count() === 0, 'dolu bölmə 🗑 ilə düymələri ilə birlikdə silindi');
  await p.click('[data-act=editdone]');
  ok(!(await p.isVisible('#editbar')) && await p.locator('[data-act=qnew]').count() === 0, 'Hazır: düzəliş rejimi bağlandı');

  // Düymələr siyahısında Sil
  await p.click('#btnSet'); await p.click('[data-rt=admin]'); await p.click('[data-act=scat][data-c=skan]');
  await p.click('[data-act=ldel][data-id=kser]'); await p.click('[data-act=ldel][data-id=kser]');
  ok(await p.locator('[data-act=ldel][data-id=kser]').count() === 0 && !(await p.textContent('#tabs')).includes('📑'), 'siyahıdan Sil ilə düymə silindi');

  // Materiallar
  await p.click('[data-rt=mat]');
  await p.fill('#nm_name', 'A3 80 qr'); await p.fill('#nm_cost', '0.04'); await p.fill('#nm_stock', '500');
  await p.click('[data-act=madd]');
  ok((await p.textContent('#chips')).includes('A3 80 qr'), 'material əlavə olundu');
  await p.click('[data-act=mdel][data-id=a4]');
  ok(await p.isVisible('#toast') && (await p.textContent('#toast')).includes('reseptlərdən'), 'istifadədə olan material silinmir');

  // Ehtiyat nüsxə: fayla yaz və geri yüklə
  await p.click('[data-rt=backup]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=bexp]')]);
  const file = await dl.path(); const j = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  ok(j.app === 'EMGRAPHIC ERP' && j.data.sales.length === 3, 'ehtiyat faylı: 3 satış');
  await p.click('[data-act=reset]'); await p.click('[data-act=reset]');
  ok((await p.textContent('#today')).includes('0'), 'sıfırlama (iki addımla)');
  await p.setInputFiles('#bfile', file); await p.waitForSelector('[data-act=bimp]');
  await p.click('[data-act=bimp]');
  ok((await p.textContent('#chips')).includes('1139'), 'ehtiyat nüsxədən bərpa');

  ok(external.length === 0, 'internetə heç bir sorğu getmir ' + external.join(' '));
  ok(errs.length === 0, 'JS xətası yoxdur ' + (errs.join('; ') || ''));
  await b.close();
})();
