/* Буксир — текст.
   Шрифты разбираются opentype.js, текст выводится кривыми: холст и SVG рисуют одни и те же пути.
   Здесь же примитивы вёрстки: столбец строк с подбором кегля и плашками, строка «дата — время»,
   строка из нескольких частей, список афиши, логотип, логотип партнёра. */
'use strict';

const FACES = { d: 'Unbounded-SemiBold', dr: 'Unbounded-Regular', t: 'Onest-Regular', tm: 'Onest-Medium' };
const FONT = {}, CAP = {};
(function initFonts() {
  for (const k in FACES) {
    const bin = atob(window.__FONTS__[FACES[k]]);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    FONT[k] = opentype.parse(buf.buffer);
    CAP[k] = (FONT[k].tables.os2.sCapHeight || 700) / FONT[k].unitsPerEm;
    // те же шрифты для интерфейса страницы
    if (k === 't' || k === 'tm') {
      try { document.fonts.add(new FontFace('Onest', buf.buffer.slice(0), { weight: k === 't' ? '400' : '500' })); } catch (e) { /* системный шрифт */ }
    }
  }
})();

const ADV = new Map();
function adv(face, s, size) {
  const key = face + '\u0001' + s;
  let w = ADV.get(key);
  if (w === undefined) { w = FONT[face].getAdvanceWidth(s, 1000, { kerning: true }); if (ADV.size > 20000) ADV.clear(); ADV.set(key, w); }
  return w * size / 1000;
}
const PATHS = new Map();
function glyphPath(face, s, x, y, size) {
  const key = `${face}|${s}|${x.toFixed(1)}|${y.toFixed(1)}|${size.toFixed(2)}`;
  let d = PATHS.get(key);
  if (d === undefined) { d = FONT[face].getPath(s, x, y, size, { kerning: true }).toPathData(2); if (PATHS.size > 6000) PATHS.clear(); PATHS.set(key, d); }
  return d;
}

// Короткие предлоги и союзы не остаются в конце строки: склеиваем со следующим словом неразрывным пробелом.
const NB = ' ';
function typo(s) {
  return String(s)
    .replace(/(^|[\s(«])(в|во|с|со|к|ко|у|о|об|и|а|но|на|за|до|из|от|по|не|ни|для|без|при|про|над|под)\s+/gi, (m, a, w) => a + w + NB)
    .replace(/\s+(—|–)\s+/g, NB + '$1 ')
    .replace(/(\d)\s+(?=\d{3}\b)/g, '$1' + NB);
}
function wrapText(face, text, size, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(/[ \t]+/).filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const t = line + ' ' + words[i];
      if (adv(face, t, size) <= maxW) line = t; else { out.push(line); line = words[i]; }
    }
    out.push(line);
  }
  return out;
}

// Один абзац: подбираем кегль, чтобы влез по ширине и числу строк.
function layItem(it, maxW, scale) {
  const face = it.face || 'd';
  let src = it.text == null ? '' : String(it.text);
  if (it.upper) src = src.toUpperCase();
  src = typo(src);
  const min = (it.min || it.size * 0.45) * (it.grow === false ? 1 : scale);
  let size = it.size * (it.grow === false ? 1 : scale);
  let lines;
  for (let guard = 0; guard < 60; guard++) {
    lines = wrapText(face, src, size, maxW);
    const wide = lines.some(l => adv(face, l, size) > maxW + 0.5);
    if ((!wide && lines.length <= (it.maxLines || 99)) || size <= min) break;
    size = Math.max(min, size * 0.95);
  }
  if (it.maxLines && lines.length > it.maxLines) {           // не влезло даже в минимальном кегле: обрезаем с многоточием
    lines = lines.slice(0, it.maxLines);
    let l = lines[lines.length - 1];
    while (l.length > 1 && adv(face, l + '…', size) > maxW) l = l.slice(0, -1);
    lines[lines.length - 1] = l.replace(/[\s,.;:]+$/, '') + '…';
  }
  const lh = size * (it.lh || 1.12);
  return { face, size, lines, lh, h: lines.length * lh };
}

/* ----- группы примитивов -----
   Группа: {tf:[a,b,c,d,e,f], prims:[...]}. Примитивы:
   {p:'path', d, fill, alpha}  {p:'rect', x,y,w,h, fill, alpha}  {p:'logo', m, fill}  {p:'img', x,y,w,h} (партнёр) */
const ID = [1, 0, 0, 1, 0, 0];

function textLine(prims, face, s, x, top, size, lh, fill, plate, upper) {
  const cap = CAP[face] * size;
  const base = top + (lh - cap) / 2 + cap;
  const w = adv(face, s, size);
  if (plate) {
    const px = size * 0.26, pt = size * 0.24;
    const desc = !upper && /[a-zа-яё,;()qypgдруфщц]/.test(s) ? size * 0.2 : 0;
    prims.push({ p: 'rect', x: x - px, y: base - cap - pt, w: w + 2 * px, h: cap + 2 * pt + desc, fill: plate });
  }
  if (s) prims.push({ p: 'path', d: glyphPath(face, s, x, base, size), fill });
  return w;
}

// Столбец абзацев. spec: {x,y,w,h, ax, ay:'t'|'m'|'b', rot:0|-90, items:[{text, face, size, min, lh, upper, color, plate, maxLines, gap, ax, grow}]}
function stackGroup(spec, col) {
  const rot = spec.rot === -90;
  const W = rot ? spec.h : spec.w, H = rot ? spec.w : spec.h;
  const items = spec.items.filter(it => it && it.text != null && String(it.text).trim() !== '');
  let lays, total, scale = 1;
  for (let guard = 0; guard < 40; guard++) {
    lays = items.map(it => layItem(it, W, scale));
    total = lays.reduce((a, l, i) => a + l.h + (i < lays.length - 1 ? (items[i].gap || 0) * (items[i].grow === false ? 1 : scale) : 0), 0);
    if (total <= H || scale < 0.4) break;
    scale *= 0.95;
  }
  let y = spec.ay === 'b' ? H - total : spec.ay === 'm' ? (H - total) / 2 : 0;
  const prims = [];
  const rects = [];
  lays.forEach((L, i) => {
    const it = items[i];
    const ax = it.ax || spec.ax || 'l';
    for (const line of L.lines) {
      const w = adv(L.face, line, L.size);
      const x = ax === 'r' ? W - w : ax === 'c' ? (W - w) / 2 : 0;
      const before = prims.length;
      textLine(prims, L.face, line, x, y, L.size, L.lh, col(it.color || 'text'), it.plate ? col(it.plate) : null, it.upper);
      // плашки собираем отдельно, чтобы они лежали под всеми строками
      for (let k = before; k < prims.length; k++) if (prims[k].p === 'rect') rects.push(prims.splice(k--, 1)[0]);
      y += L.lh;
    }
    y += (it.gap || 0) * (it.grow === false ? 1 : scale);
  });
  const tf = rot ? [0, -1, 1, 0, spec.x, spec.y + spec.h] : [1, 0, 0, 1, spec.x, spec.y];
  return { tf, prims: rects.concat(prims), box: { y0: spec.ay === 'b' ? H - total : 0, h: total } };
}

// «дата ——— время» и, если задано, примечание справа. y — середина прописных.
function datelineGroup(spec, col, u) {
  const face = spec.face || 'dr', size = spec.size, fill = col(spec.color || 'text');
  const cap = CAP[face] * size;
  const top = spec.y - cap / 2 - (size * 1.12 - cap) / 2, lh = size * 1.12;
  const prims = [];
  const L = typo(spec.left || ''), R = typo(spec.right || ''), N = typo(spec.note || '');
  const wl = adv(face, L, size), wr = adv(face, R, size);
  const gap = size * 0.55, lw = Math.max(1.5, 2.2 * u);
  let x = spec.x;
  if (spec.ax === 'c') {
    const len = spec.lineLen || 130 * u;
    x = spec.x + (spec.w - (wl + wr + 2 * gap + len)) / 2;
  }
  if (spec.plate) {
    const pad = size * 0.4;
    prims.push({ p: 'rect', x: spec.x - pad, y: spec.y - cap / 2 - pad, w: spec.w + 2 * pad, h: cap + 2 * pad, fill: col(spec.plate) });
  }
  if (L) textLine(prims, face, L, x, top, size, lh, fill, null, true);
  let lineEnd;
  if (N || spec.ax === 'c' || spec.lineLen) lineEnd = x + wl + gap + (spec.lineLen || 130 * u);
  else lineEnd = spec.x + spec.w - wr - gap;
  if (R) {
    if (L) prims.push({ p: 'rect', x: x + wl + gap, y: spec.y - lw / 2, w: Math.max(0, lineEnd - (x + wl + gap)), h: lw, fill });
    textLine(prims, face, R, lineEnd + gap, top, size, lh, fill, null, true);
  }
  if (N) {
    const nf = spec.noteFace || face;
    const ns = typo(N.toUpperCase()), w = adv(nf, ns, size * 0.82);
    const s2 = size * 0.82, cap2 = CAP[nf] * s2;
    textLine(prims, nf, ns, spec.x + spec.w - w, spec.y - cap2 / 2 - (s2 * 1.12 - cap2) / 2, s2, s2 * 1.12, fill, null, true);
  }
  return { tf: ID, prims };
}

// Строка из частей: первая слева, последняя справа, остальные распределены между ними.
function rowGroup(spec, col) {
  const face = spec.face || 't', size = spec.size, fill = col(spec.color || 'text');
  const cap = CAP[face] * size, lh = size * 1.12, top = spec.y - cap / 2 - (lh - cap) / 2;
  const parts = spec.parts.map(p => typo(spec.upper ? String(p).toUpperCase() : String(p))).filter(Boolean);
  const prims = [];
  const ws = parts.map(p => adv(face, p, size));
  if (parts.length === 1) { textLine(prims, face, parts[0], spec.x, top, size, lh, fill, null, spec.upper); return { tf: ID, prims }; }
  const free = spec.w - ws.reduce((a, b) => a + b, 0);
  let x = spec.x;
  parts.forEach((p, i) => { textLine(prims, face, p, x, top, size, lh, fill, null, spec.upper); x += ws[i] + free / (parts.length - 1); });
  return { tf: ID, prims };
}

// Список афиши: «число | название | время» по строкам.
function listGroup(spec, col, u) {
  const rows = String(spec.rows || '').split('\n').map(r => r.split('|').map(s => s.trim())).filter(r => r.length && r[0] !== '');
  const prims = [];
  if (!rows.length) return { tf: ID, prims };
  const fillT = col(spec.color || 'text'), fillD = col(spec.dayColor || spec.color || 'text');
  const lay = (s) => {
    const dS = 76 * u * s, tS = 23 * u * s, hS = 26 * u * s;
    const dayW = adv('d', '00', dS) + 26 * u * s;
    const timeW = Math.max(...rows.map(r => adv('dr', r[2] || '', hS))) + 22 * u * s;
    const titleW = spec.w - dayW - timeW;
    const items = rows.map(r => {
      const it = layItem({ text: r[1] || '', face: 'tm', size: tS, lh: 1.08, upper: true, maxLines: 3, min: tS * 0.8 }, titleW, 1);
      const h = Math.max(CAP.d * dS, it.h) + 26 * u * s;
      return { r, it, h };
    });
    return { dS, tS, hS, dayW, timeW, titleW, items, total: items.reduce((a, b) => a + b.h, 0) };
  };
  let s = 1, L = lay(s);
  for (let g = 0; g < 30 && L.total > spec.h; g++) { s *= 0.94; L = lay(s); }
  let y = spec.y;
  const lw = Math.max(1, 1.6 * u);
  L.items.forEach(({ r, it, h }, i) => {
    const mid = y + h / 2 - 13 * u * s;
    const day = r[0];
    const dw = adv('d', day, L.dS);
    textLine(prims, 'd', day, spec.x + L.dayW - 26 * u * s - dw, mid - (L.dS * 1.12) / 2, L.dS, L.dS * 1.12, fillD, null, true);
    let ty = mid - it.h / 2;
    for (const line of it.lines) { textLine(prims, 'tm', line, spec.x + L.dayW, ty, it.size, it.lh, fillT, null, true); ty += it.lh; }
    const tw = adv('dr', r[2] || '', L.hS);
    if (r[2]) textLine(prims, 'dr', r[2], spec.x + spec.w - tw, mid - (L.hS * 1.12) / 2, L.hS, L.hS * 1.12, fillT, null, true);
    y += h;
    if (i < L.items.length - 1) prims.push({ p: 'rect', x: spec.x + L.dayW, y: y - lw / 2, w: spec.w - L.dayW, h: lw, fill: fillT, alpha: 0.18 });
  });
  return { tf: ID, prims };
}

function logoGroup(spec, col) {
  const k = spec.w / LOGO.w, h = LOGO.h * k;
  const x = spec.ax === 'r' ? spec.x - spec.w : spec.ax === 'c' ? spec.x - spec.w / 2 : spec.x;
  const prims = [];
  if (spec.plate) { const p = h * 0.55; prims.push({ p: 'rect', x: x - p, y: spec.y - p, w: spec.w + 2 * p, h: h + 2 * p, fill: col(spec.plate) }); }
  prims.push({ p: 'logo', m: [k, 0, 0, k, x, spec.y], fill: col(spec.color || 'text') });
  return { tf: ID, prims, h };
}
function partnerGroup(spec) {
  if (!PARTNER) return null;
  const iw = PARTNER.naturalWidth || PARTNER.width, ih = PARTNER.naturalHeight || PARTNER.height;
  const h = spec.h, w = iw / ih * h;
  const x = spec.ax === 'r' ? spec.x - w : spec.x;
  return { tf: ID, prims: [{ p: 'img', x, y: spec.y, w, h }] };
}
function rectGroup(spec, col) { return { tf: ID, prims: [{ p: 'rect', x: spec.x, y: spec.y, w: spec.w, h: spec.h, fill: col(spec.color), alpha: spec.alpha }] }; }
