// ☁️ Bulud sinxronu: node tests/cloud.js
// Firebase (Auth + Firestore REST) əvəzinə yaddaşda işləyən sınaq serveri; kompüter (exe simulyasiyası) və telefon (brauzer).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const APP = path.resolve('app');

// ---------- sınaq Firebase ----------
const USER = { email: 'sahib@test.az', password: 'parol123', uid: 'U1' };
const docs = new Map(); // name -> {fields, updateTime}
let commits = 0, lastMicros = 0;
const now = () => { let us = Date.now() * 1000; if (us <= lastMicros) us = lastMicros + 1; lastMicros = us; const ms = Math.floor(us / 1000); return new Date(ms).toISOString().replace('Z', '').replace(/\.\d+$/, '') + '.' + String(us % 1000000).padStart(6, '0') + 'Z'; };
const tsNum = s => { const m = s.match(/^(.*?)\.(\d+)Z$/); return Date.parse(m[1] + 'Z') * 1000 + +m[2].padEnd(6, '0').slice(0, 6); };
const srv = http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const u = new URL(req.url, 'http://x'); const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); };
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }); return res.end(); }
    if (u.pathname === '/auth/accounts:signInWithPassword') {
      const j = JSON.parse(body); if (u.searchParams.get('key') !== 'KEY1') return send(400, { error: { message: 'API key not valid. Please pass a valid API key.' } });
      if (j.email !== USER.email || j.password !== USER.password) return send(400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } });
      return send(200, { idToken: 'TOK', refreshToken: 'REF', localId: USER.uid, expiresIn: '3600' });
    }
    if (u.pathname === '/token/token') { if (!body.includes('refresh_token=REF')) return send(400, { error: { message: 'INVALID_REFRESH_TOKEN' } }); return send(200, { id_token: 'TOK', refresh_token: 'REF', expires_in: '3600' }); }
    if (u.pathname.startsWith('/fs/')) {
      if (req.headers.authorization !== 'Bearer TOK') return send(403, { error: { status: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } });
      if (u.pathname.endsWith(':commit')) {
        const t = now(); commits++;
        for (const w of JSON.parse(body).writes) {
          const name = w.update.name, cur = docs.get(name) || { fields: {} }, f = { ...cur.fields };
          (w.updateMask?.fieldPaths || Object.keys(w.update.fields)).forEach(k => { if (k in w.update.fields) f[k] = w.update.fields[k]; else delete f[k]; });
          (w.updateTransforms || []).forEach(tr => {
            if (tr.setToServerValue) f[tr.fieldPath] = { timestampValue: t };
            if (tr.increment) { const old = f[tr.fieldPath] ? Number(f[tr.fieldPath].doubleValue ?? f[tr.fieldPath].integerValue) : 0; f[tr.fieldPath] = { doubleValue: old + Number(tr.increment.doubleValue) }; }
          });
          docs.set(name, { fields: f, updateTime: t });
        }
        return send(200, { commitTime: t });
      }
      if (u.pathname.endsWith(':runQuery')) {
        const q = JSON.parse(body).structuredQuery, from = tsNum(q.where.fieldFilter.value.timestampValue);
        const list = [...docs.entries()].filter(([, d]) => tsNum(d.fields.t.timestampValue) >= from).sort((a, b) => tsNum(a[1].fields.t.timestampValue) - tsNum(b[1].fields.t.timestampValue)).slice(0, q.limit);
        return send(200, list.length ? list.map(([name, d]) => ({ document: { name, fields: d.fields, updateTime: d.updateTime }, readTime: now() })) : [{ readTime: now() }]);
      }
    }
    // telefon üçün proqram faylları (GitHub Pages əvəzinə)
    const fp = path.join(APP, decodeURIComponent(u.pathname.replace(/^\/app\/?/, '/')).replace(/\/$/, '/index.html'));
    if (fp.startsWith(APP) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      const ct = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }[path.extname(fp)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct }); return res.end(fs.readFileSync(fp));
    }
    send(404, { error: { message: 'NOT_FOUND' } });
  });
});

(async () => {
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const URLS = { auth: base + '/auth', token: base + '/token', fs: base + '/fs' };
  const b = await chromium.launch(); const errs = [];
  try {
    // ---------- kompüter (exe simulyasiyası) ----------
    const pcFiles = { data: '', kv: {} }; let pcOnline = true;
    const ctxPC = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const PC = await ctxPC.newPage(); PC.on('pageerror', e => errs.push('PC: ' + e.message));
    await PC.addInitScript(u => { window.KASSA_CLOUD_URLS = u; }, URLS);
    await PC.exposeFunction('erpLoad', () => pcFiles.data);
    await PC.exposeFunction('erpSave', j => { pcFiles.data = j; });
    await PC.exposeFunction('erpBackup', () => 'x');
    await PC.exposeFunction('erpBackupList', () => []);
    await PC.exposeFunction('erpBackupRead', () => '');
    await PC.exposeFunction('erpBackupKinds', () => ['avto', 'el', 'emel']);
    await PC.exposeFunction('erpPaths', () => ({ data: 'C:\\d', backup: 'C:\\e' }));
    await PC.exposeFunction('erpOpenFolder', () => null);
    await PC.exposeFunction('erpKVGet', n => pcFiles.kv[n] || '');
    await PC.exposeFunction('erpKVSet', (n, v) => { if (v) pcFiles.kv[n] = v; else delete pcFiles.kv[n]; });
    await PC.exposeFunction('erpFetch', async (m, url, h, body) => {
      if (!pcOnline) throw new Error('internet yoxdur');
      const r = await fetch(url, { method: m, headers: JSON.parse(h || '{}'), body: body || undefined }); return { status: r.status, body: await r.text() };
    });
    await PC.goto('file://' + path.join(APP, 'index.html'));
    await PC.waitForFunction(() => document.querySelector('#today')?.textContent.includes('Bu gün'));
    ok(await PC.isHidden('#btnCloud'), 'kompüter: buluda qoşulmayıb — ☁️ düyməsi görünmür');
    await PC.click('#btnSet'); await PC.click('[data-rt=cloud]');
    ok((await PC.textContent('#rbody')).includes('console.firebase.google.com'), 'kompüter: ☁️ Bulud bölməsində quraşdırma addımları');
    await PC.fill('#cf_k', 'KEY1'); await PC.fill('#cf_p', 'kassa-test'); await PC.fill('#cf_e', USER.email); await PC.fill('#cf_w', 'sehv');
    await PC.click('[data-act=clcon]'); await sleep(400);
    ok((await PC.textContent('#toast')).includes('E-poçt və ya parol səhvdir'), 'səhv parol: Azərbaycanca izah');
    await PC.fill('#cf_k', 'KEY1'); await PC.fill('#cf_p', 'kassa-test'); await PC.fill('#cf_e', USER.email); await PC.fill('#cf_w', USER.password);
    await PC.click('[data-act=clcon]');
    await PC.waitForFunction(() => CL.last > 0, null, { timeout: 15000 });
    ok(docs.size > 50 && !pcFiles.kv.cfg.includes(USER.password), `ilk sinxron: kompüterin məlumatı buluda getdi (${docs.size} sənəd), parol saxlanmır`);
    ok(await PC.isVisible('#btnCloud') && (await PC.textContent('#cloudTxt')) === '✓', 'başlıqda ☁️ ✓');
    const link = await PC.evaluate(() => cloudPhoneLink());
    ok(link.startsWith('https://signmasterezcad.github.io/kassa/app/#bulud='), 'telefon üçün link hazırdır');
    await PC.click('#ovRep [data-close]');
    // anbar üçün material
    await PC.evaluate(() => { S.materials.push({ id: 'mx', name: 'Sınaq kağızı', cost: 0.1, stock: 100, min: 0 }); save(); });

    // ---------- telefon (internetdən açılır) ----------
    const ctxPh = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const Ph = await ctxPh.newPage(); Ph.on('pageerror', e => errs.push('Telefon: ' + e.message));
    await Ph.goto(base + '/app/' + link.slice(link.indexOf('#')));
    await Ph.waitForSelector('#ovCloud:not([hidden]) #clw');
    ok((await Ph.inputValue('#cle')) === USER.email, 'telefon: linklə açıldı, e-poçt hazırdır, yalnız parol soruşulur');
    await Ph.evaluate(u => { const m = location.hash; }, null);
    // linkdəki ünvanlar sınaq serverinə yönəlsin
    await Ph.evaluate(u => { window.KASSA_TEST_URLS = u; }, URLS);
    await Ph.goto('about:blank');
    const enc = Buffer.from(JSON.stringify({ a: 'KEY1', p: 'kassa-test', e: USER.email, u: URLS })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await Ph.goto(base + '/app/#bulud=' + enc);
    await Ph.fill('#clw', USER.password); await Ph.click('#clgo');
    await Ph.waitForFunction(() => document.querySelector('#today')?.textContent.includes('Bu gün'), null, { timeout: 20000 });
    await Ph.waitForFunction(() => S.materials.some(m => m.id === 'mx'), null, { timeout: 20000 });
    const pcItems = await PC.evaluate(() => S.items.length);
    ok(await Ph.evaluate(() => S.items.length) === pcItems, `telefon: bütün düymələr buluddan gəldi (${pcItems})`);
    ok(!(await Ph.evaluate(() => location.hash)).includes('bulud'), 'link ünvandan silindi (parol/açar ekranda qalmır)');

    ok(await Ph.locator('#lines .epay').count() === 1 && await PC.locator('#lines .epay').count() === 0, 'Nağd / Kart düymələri yalnız telefonda');
    ok(await Ph.isHidden('main .note') && await PC.isVisible('main .note') && await Ph.locator('.srchint').count() === 1 && await Ph.isHidden('.srchint'), 'telefonda izah yazısı gizlidir, kompüterdə görünür');
    await Ph.click('#btnUser');
    ok((await Ph.locator('.utile').allTextContents()).every(t => t.includes('Admin')) && await Ph.locator('.utile').count() >= 1 && await PC.evaluate(() => S.users.length) > 1, 'telefonda giriş ekranında yalnız admin');
    await Ph.click('.utile');
    const sell = async (P, what) => { await P.fill('#q', what); await P.press('#q', 'Enter'); await P.click('#btnDone'); await P.fill('#q', ''); };
    // ---------- 1) telefon satır → kompüter görür ----------
    await sell(Ph, 'fincan termo');
    await PC.evaluate(() => cloudTick()); await sleep(2500); await PC.evaluate(() => cloudTick());
    await PC.waitForFunction(() => S.sales.length === 1, null, { timeout: 15000 });
    ok(true, 'telefondakı satış kompüterə gəldi');

    // ---------- 2) kompüter internetsiz: kassir satır, anbardan silir ----------
    pcOnline = false;
    await sell(PC, 'fincan sade'); await sell(PC, 'fincan sade');
    await PC.evaluate(() => { S.materials.find(m => m.id === 'mx').stock -= 10; save(); });
    await PC.evaluate(() => cloudTick()); await sleep(300);
    ok((await PC.textContent('#cloudTxt')).includes('internet yoxdur') && JSON.parse(pcFiles.data).sales.length === 3, 'internet yoxdur: kompüter işləyir, satışlar faylda (3), ☁️ "internet yoxdur"');
    // bu arada telefonda (internet var) satış və anbar dəyişikliyi
    await sell(Ph, 'fincan rəngli');
    await Ph.evaluate(() => { S.materials.find(m => m.id === 'mx').stock -= 5; save(); });
    await Ph.evaluate(() => cloudTick()); await sleep(1500);
    // ---------- 3) internet gəlir → hamısı birləşir ----------
    pcOnline = true;
    await PC.evaluate(() => cloudTick()); await sleep(2000); await PC.evaluate(() => cloudTick());
    await Ph.evaluate(() => cloudTick()); await sleep(1500);
    const pcS = await PC.evaluate(() => [S.sales.length, S.materials.find(m => m.id === 'mx').stock]);
    const phS = await Ph.evaluate(() => [S.sales.length, S.materials.find(m => m.id === 'mx').stock]);
    ok(pcS[0] === 4 && phS[0] === 4, `internet gələndə: hər iki tərəfdə 4 satış (kompüter ${pcS[0]}, telefon ${phS[0]})`);
    ok(pcS[1] === 85 && phS[1] === 85, `anbar: 100 − 10 (kompüter) − 5 (telefon) = 85 (kompüter ${pcS[1]}, telefon ${phS[1]})`);

    // ---------- 4) telefon internetsiz → dəyişiklik saxlanır, internet gələndə gedir ----------
    await ctxPh.setOffline(true);
    await Ph.evaluate(() => { const it = S.items.find(i => i.id === 'fc_termo') || S.items.find(i => !i.group && i.tiers?.length); it.tiers[0][1] = 11; save(); });
    await sell(Ph, 'fincan sade');
    await Ph.evaluate(() => cloudTick()); await sleep(500);
    ok(await Ph.evaluate(() => !CL.online && CL.pend >= 0), 'telefon internetsiz: işləyir, göndərilmək üçün gözləyir');
    await Ph.reload(); await Ph.waitForFunction(() => document.querySelector('#today')?.textContent.includes('Bu gün'), null, { timeout: 15000 });
    ok(await Ph.evaluate(() => S.sales.length) === 5, 'telefon internetsiz yenidən açıldı: məlumat telefonun yaddaşındadır (5 satış)');
    await ctxPh.setOffline(false);
    await Ph.evaluate(() => cloudTick()); await sleep(1500);
    await PC.evaluate(() => cloudTick()); await sleep(1500);
    ok(await PC.evaluate(() => S.sales.length) === 5, 'telefonun internetsiz etdiyi satış kompüterə çatdı');
    ok(await PC.evaluate(() => (S.items.find(i => i.id === 'fc_termo') || {}).tiers?.[0][1]) === 11, 'telefonda (admin) dəyişən qiymət kompüterdə də dəyişdi');

    // ---------- 5) kompüterdə ayar → telefonda ----------
    await PC.evaluate(() => { S.suppliers.push({ id: 'spx', name: 'Yeni Tədarükçü', items: [] }); save(); });
    await PC.evaluate(() => cloudTick()); await sleep(1500); await Ph.evaluate(() => cloudTick()); await sleep(1500);
    ok(await Ph.evaluate(() => S.suppliers.some(x => x.name === 'Yeni Tədarükçü')), 'kompüterdə əlavə olunan tədarükçü telefonda göründü');
    // silmə
    await PC.evaluate(() => { S.suppliers = S.suppliers.filter(x => x.id !== 'spx'); save(); });
    await PC.evaluate(() => cloudTick()); await sleep(1500); await Ph.evaluate(() => cloudTick()); await sleep(1500);
    ok(!(await Ph.evaluate(() => S.suppliers.some(x => x.id === 'spx'))), 'kompüterdə silinən telefonda da silindi');
    ok(JSON.parse(pcFiles.data).sales.length === 5, 'kompüterin faylında da 5 satış');

    // ---------- 6) Android proqramı (APK): ilk açılışda linki yapışdırmaq ----------
    const ctxA = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile KassaAndroid/1' });
    const An = await ctxA.newPage(); An.on('pageerror', e => errs.push('APK: ' + e.message));
    await An.goto(base + '/app/');
    await An.waitForSelector('#ovCloud:not([hidden]) #cllink');
    ok(true, 'APK ilk açılış: link yapışdırmaq üçün xana');
    await An.fill('#cllink', 'Link: https://signmasterezcad.github.io/kassa/app/#bulud=' + enc);
    ok((await An.inputValue('#clk')) === 'KEY1' && (await An.inputValue('#cle')) === USER.email, 'yapışdırılan linkdən API Key və e-poçt özü dolur');
    await An.fill('#clw', USER.password); await An.click('#clgo');
    await An.waitForFunction(() => typeof S === 'object' && S && S.sales && S.sales.length === 5, null, { timeout: 20000 });
    ok(true, 'APK: buluddan bütün məlumat gəldi (5 satış)');
  } finally {
    ok(errs.length === 0, 'JS xətası yoxdur ' + errs.join('; '));
    await b.close(); srv.close();
  }
})();
