// 🔄 Yenilə düyməsi: node tests/update.js (exe simulyasiyası)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const b = await chromium.launch(); const errs = [];
  const st = { data: '', latest: '0.0.1', updates: 0, saved: 0, net: true };
  const open = async (withUpd = true) => {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.exposeFunction('erpLoad', () => st.data);
    await p.exposeFunction('erpSave', j => { st.data = j; st.saved++; });
    for (const n of ['erpBackup', 'erpOpenFolder']) await p.exposeFunction(n, () => 'x');
    await p.exposeFunction('erpBackupList', () => []);
    await p.exposeFunction('erpBackupRead', () => '');
    await p.exposeFunction('erpPaths', () => ({ data: 'C:\\d', backup: 'C:\\e' }));
    if (withUpd) {
      await p.exposeFunction('erpLatest', () => { if (!st.net) throw new Error('internet yoxdur'); return st.latest; });
      await p.exposeFunction('erpUpdate', () => { st.updates++; return null; });
    }
    await p.goto('file://' + path.resolve('app/index.html'));
    await p.waitForFunction(() => document.querySelector('#today')?.textContent.includes('Bu gün'));
    return p;
  };
  try {
    // təzə quraşdırma (exe): nümunə kassir/anbar/köhnə bölmələr yoxdur, Studiya sahibinin istədiyi kimi, "Buluda qoşul" izahı
    const fresh = await open(false);
    const f = await fresh.evaluate(() => ({ cats: S.cats.map(c => c.name).join('|'), users: S.users.map(u => u.name).join('|'), mats: S.materials.length,
      st: S.items.filter(i => i.cat === 'studiya' && !i.group && !i.parent).map(i => i.icon + i.name + (i.free ? '*' : '')).join('|'), orphan: S.items.filter(i => !S.cats.some(c => c.id === i.cat)).length, clean: 'cleanStart' in S }));
    ok(f.cats === 'ÇAP|Banner / Vinil|Sublim|Poliqrafiya Xidmətləri|Studiya|Çərçivə', 'təzə quraşdırma: bölmələr sahibinin sırası ilə, artıq bölmə yoxdur (' + f.cats + ')');
    ok(f.users === 'Admin' && f.mats === 0 && f.orphan === 0 && !f.clean, 'təzə quraşdırma: yalnız Admin, nümunə anbar yoxdur');
    ok(f.st === '🪪Sənəd Şəkli|🤵Sənəd şəkili Kostyum montaj|🖼️Digər*', 'Studiya: Sənəd Şəkli, Kostyum montaj, Digər (razılaşma ilə)');
    ok(await fresh.isVisible('#banner') && (await fresh.textContent('#banner')).includes('Buluda qoşul'), 'təzə quraşdırma: "☁️ Buluda qoşul" izahı görünür');
    await fresh.context().close();
    const old = await open(false);
    ok(await old.isHidden('#btnUpd'), 'köhnə exe (yeniləmə funksiyası yoxdur): düymə görünmür');
    await old.context().close();

    const p = await open();
    ok(await p.isVisible('#btnUpd') && (await p.textContent('#btnUpd')).includes('Yenilə'), 'başlıqda "🔄 Yenilə" düyməsi');
    const cur = await p.evaluate(() => APP_VERSION);
    await p.click('#btnUpd'); await p.waitForTimeout(300);
    ok((await p.textContent('#toast')).includes('ən son versiya var'), 'yeni versiya yoxdur: "Sizdə ən son versiya var"');
    ok(st.updates === 0, 'yeni versiya yoxdursa yeniləmə işə düşmür');

    st.net = false; await p.click('#btnUpd'); await p.waitForTimeout(300);
    ok((await p.textContent('#toast')).includes('internet'), 'internet yoxdur: izah');
    st.net = true;

    st.latest = cur.replace(/\d+$/, n => +n + 1);
    await p.evaluate(() => checkUpd());
    ok(await p.evaluate(() => document.querySelector('#btnUpd').classList.contains('new')) && (await p.textContent('#btnUpd')).includes('v' + st.latest), 'yeni versiya var: düymə sarı, versiya yazılır');
    ok(await p.evaluate(() => verGt('0.10.0', '0.9.9') && !verGt('0.9.9', '0.10.0') && !verGt('1.0', '1.0.0')), 'versiya müqayisəsi (0.10 > 0.9)');

    // sifariş açıqdırsa yeniləmir
    await p.fill('#q', 'fincan termo'); await p.press('#q', 'Enter');
    await p.click('#btnUpd'); await p.waitForTimeout(300);
    ok((await p.textContent('#toast')).includes('bir də basın'), 'birinci basış: təsdiq soruşulur');
    await p.click('#btnUpd'); await p.waitForTimeout(300);
    ok((await p.textContent('#toast')).includes('cari sifarişi bitirin') && st.updates === 0, 'cari sifariş varsa: əvvəlcə bitirin');
    await p.click('#btnDone'); await p.fill('#q', '');

    const before = st.saved;
    await p.click('#btnUpd'); await p.waitForTimeout(300); await p.click('#btnUpd'); await p.waitForTimeout(500);
    ok(st.updates === 1, 'iki basış: yeniləmə işə düşdü');
    ok(st.saved > before && JSON.parse(st.data).sales.length === 1, 'yeniləmədən əvvəl məlumat fayla yazıldı (1 satış)');
    ok((await p.textContent('#toast')).includes('Yenilənir'), 'izah: proqram bağlanıb yenidən açılacaq');
  } finally {
    ok(errs.length === 0, 'JS xətası yoxdur ' + errs.join('; '));
    await b.close();
  }
})();
