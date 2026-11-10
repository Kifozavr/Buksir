// Интерфейс: шаблон по умолчанию, правка поля, SVG с текстом.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../Buksir.html'); await p.waitForTimeout(500);
  await p.screenshot({ path: __dirname + '/out/ui-tpl.png' });
  await p.click('button.chipbtn:has-text("Афиша месяца")'); await p.waitForTimeout(200);
  await p.fill('#f-month-month', 'Декабрь'); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/out/ui-month.png' });
  const svg = await p.evaluate(() => { const B = window.__buksir; return B.sceneSVG(B.buildScene(1080, 1350, 0, true)); });
  fs.writeFileSync(__dirname + '/out/month.svg', svg);
  await p.click('button.chipbtn:has-text("Без текста")'); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/out/ui-free.png' });
  console.log('svg', svg.length, 'errors', errs); await b.close();
})();
