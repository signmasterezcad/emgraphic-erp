const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1366,height:768}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto("file://" + require("path").resolve(process.argv[2] || "app/index.html"));
  const vis = async id => p.isVisible('#'+id);
  console.log('start zay/rep visible:', await vis('ovZay'), await vis('ovRep'));
  await p.click('#btnZay'); console.log('zay open:', await vis('ovZay'), 'options:', await p.locator('#zMat option').count());
  await p.click('#ovZay [data-close]'); console.log('zay after close:', await vis('ovZay'));
  await p.click('[data-add=a4bw]'); for(let i=0;i<11;i++) await p.click('[data-inc=a4bw]');
  console.log('total 12x a4bw:', await p.textContent('#total'));
  await p.click('#btnDone');
  await p.click('#btnRep'); console.log('rep open:', await vis('ovRep'), (await p.textContent('#rbody')).slice(0,60));
  await p.click('#ovRep [data-close]'); console.log('rep after close:', await vis('ovRep'));
  console.log('errors:', errs); await b.close();
})();
