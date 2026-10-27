const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + __dirname + '/../Buksir.html'); await p.waitForTimeout(300);
  const names = process.argv.slice(2);
  const r = await p.evaluate((names) => { const B = window.__buksir; const out = [];
    for (const nm of names) { const [m, n] = nm.split('/'); B.setMode(m); const L = { struct: B.P_STRUCT, rings: B.P_RINGS, trail: B.P_TRAIL }[m]; B.applyPreset(L.find(x => x[0] === n)[1]);
      out.push([nm.replace('/', '-'), B.renderTo(1080, 1350, 0, true).toDataURL()]); } return out; }, names);
  for (const [n, d] of r) fs.writeFileSync(__dirname + '/out/full-' + n + '.png', Buffer.from(d.split(',')[1], 'base64'));
  await b.close(); })();
