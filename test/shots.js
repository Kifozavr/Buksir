// Скриншоты: интерфейс и все заготовки (кадр холста).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/../Buksir.html');
  await p.waitForTimeout(600);
  await p.screenshot({ path: __dirname + '/out/ui.png' });
  const which = process.argv[2] || 'all';
  const shots = await p.evaluate(async (which) => {
    const B = window.__buksir; const res = [];
    const groups = { struct: B.P_STRUCT, rings: B.P_RINGS, trail: B.P_TRAIL };
    for (const m of Object.keys(groups)) {
      if (which !== 'all' && which !== m) continue;
      B.setMode(m);
      for (const [name, patch] of groups[m]) {
        B.applyPreset(patch); B.setTau(0);
        const c = B.renderTo(...(B.S.fmt === '4:5' ? [540, 675] : [540, 675]), 0, true);
        res.push([m + '-' + name, c.toDataURL('image/png')]);
      }
    }
    return res;
  }, which);
  for (const [n, d] of shots) fs.writeFileSync(__dirname + '/out/' + n + '.png', Buffer.from(d.split(',')[1], 'base64'));
  console.log('errors:', errs);
  await b.close();
})();
