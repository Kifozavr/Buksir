// Проверки: стык цикла по всем заготовкам, SVG, экспорт PNG/SVG/GIF/WebM через кнопки, вид на телефоне.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../Buksir.html'); await p.waitForTimeout(400);
  const seam = await p.evaluate(() => {
    const B = window.__buksir; const out = [];
    const diff = (a, b) => { const A = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, C = b.getContext('2d').getImageData(0, 0, a.width, a.height).data; let n = 0; for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - C[i]) + Math.abs(A[i + 1] - C[i + 1]) + Math.abs(A[i + 2] - C[i + 2]) > 24) n++; return n; };
    for (const [m, list] of [['struct', B.P_STRUCT], ['rings', B.P_RINGS], ['trail', B.P_TRAIL]]) {
      B.setMode(m);
      for (const [name, patch] of list) {
        B.applyPreset(patch);
        const a = B.renderTo(432, 540, 0, false), c = B.renderTo(432, 540, 1 - 1e-7, false);
        const svg = B.sceneSVG(B.buildScene(1080, 1350, 0.3, false));
        out.push(`${m}/${name}: стык ${diff(a, c)} пикс., svg ${(svg.length / 1024) | 0} КБ`);
      }
    }
    B.setMode('struct'); B.applyPreset(B.P_STRUCT[0][1]);
    return out;
  });
  console.log(seam.join('\n'));
  const dl = async (sel, label) => {
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 120000 }), p.click(sel)]);
    const path = __dirname + '/out/' + d.suggestedFilename(); await d.saveAs(path);
    console.log(label, d.suggestedFilename(), fs.statSync(path).size, 'байт');
  };
  await dl('button.btn:has-text("PNG")', 'PNG');
  await dl('button.btn:has-text("SVG")', 'SVG');
  // GIF маленький
  await p.evaluate(() => { const B = window.__buksir; B.S.anim.dur = 2; });
  await p.click('.seg button:has-text("GIF")');
  await p.click('.seg button:has-text("×⅓")');
  await dl('button.btn:has-text("Записать")', 'GIF');
  await p.click('.seg button:has-text("WebM")');
  await dl('button.btn:has-text("Записать")', 'WebM').catch(e => console.log('WebM:', e.message));
  console.log('status:', await p.textContent('#status'));
  await p.click('.seg button:has-text("MP4")');
  await p.click('button.btn:has-text("Записать")'); await p.waitForTimeout(1500);
  console.log('mp4 status:', await p.textContent('#status'));
  await p.screenshot({ path: __dirname + '/out/ui2.png' });
  await p.click('#m-trail'); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/out/ui-trail.png' });
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto('file://' + __dirname + '/../Buksir.html'); await m.waitForTimeout(400);
  await m.screenshot({ path: __dirname + '/out/mobile.png', fullPage: false });
  console.log('scrollW', await m.evaluate(() => document.documentElement.scrollWidth));
  console.log('errors:', errs);
  await b.close();
})();
