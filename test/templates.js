// Лист шаблонов рубрик: каждый шаблон в выбранных форматах (по умолчанию 4:5, 9:16, 1:1).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const fmts = (process.argv[2] || '4:5,9:16,1:1').split(',');
  const only = process.argv[3] ? process.argv[3].split(',') : null;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/../Buksir.html'); await p.waitForTimeout(500);
  const shots = await p.evaluate(({ fmts, only }) => {
    const B = window.__buksir; const out = []; const sizes = { '4:5': [1080, 1350], '9:16': [1080, 1920], '1:1': [1080, 1080] };
    for (const t of B.TEMPLATES) {
      if (only && !only.includes(t.id)) continue;
      B.applyTemplate(t.id);
      for (const f of fmts) { B.S.fmt = f; const [w, h] = sizes[f]; const c = B.renderTo(w, h, 0, true); out.push([t.id + '_' + f.replace(':', 'x'), c.toDataURL('image/png')]); }
    }
    return out;
  }, { fmts, only });
  fs.mkdirSync(__dirname + '/out/tpl', { recursive: true });
  for (const [n, d] of shots) fs.writeFileSync(__dirname + '/out/tpl/' + n + '.png', Buffer.from(d.split(',')[1], 'base64'));
  console.log('кадров:', shots.length, 'ошибки:', errs);
  await b.close();
})();
