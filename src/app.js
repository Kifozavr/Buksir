/* Буксир — генератор фирменной графики.
   Три режима:
   struct — два набора концентрических контуров, наложенных с вычитанием (XOR);
   rings  — один набор контуров, в толщине каждого контура фото в своём масштабе;
   trail  — шлейф копий фото, растущих от точки роста по прямым.
   Все размеры хранятся в единицах u: короткая сторона макета = 1080 u. */
'use strict';

/* ---------- данные ---------- */
const LOGO = window.__LOGO__;           // {w,h,d} вектор логотипа
const LOGO_PATH = new Path2D(LOGO.d);

const FORMATS = [
  ['1:1', 'Квадрат', 1080, 1080],
  ['4:5', '4:5', 1080, 1350],
  ['9:16', 'Сторис', 1080, 1920],
  ['16:9', 'Экран', 1920, 1080],
  ['A', 'Плакат A', 1240, 1754],
  ['banner', 'Баннер', 1800, 800],
];

const THEMES = [
  ['Бумага', '#F2F1EC', '#121212'],
  ['Ночь', '#0F0F0F', '#F2F1EC'],
  ['Коралл', '#F6F3EF', '#E0524B'],
  ['Алый', '#121212', '#E0524B'],
  ['Бетон', '#B7B5AF', '#151515'],
  ['Графит', '#2A2A29', '#D9D6CF'],
];

const SET_DEFAULT = { cx: .5, cy: .5, n: 22, w0: 120, h0: 40, sx: 22, sy: 22, t: 12, tg: 0, r: 100, rmode: 'prop', rfix: 40, dx: 0, dy: 0, speed: 1 };

const S = {
  mode: 'struct', fmt: '4:5',
  bg: '#F2F1EC', ink: '#121212', inkB: '#121212', twoTone: false, blend: 'xor', grain: 0,
  setTab: 'A',
  A: { ...SET_DEFAULT },
  B: { ...SET_DEFAULT },
  R: { ...SET_DEFAULT, zoom0: 100, zstep: 6, gaps: 'bg', center: true, ox: 0, oy: 0, tone: 'color' },
  T: { anchor: 'tc', size: 30, px: 0, py: 0, pivot: 'auto', n: 14, end: 7, dist: 'geo', aspect: 'img', radius: 0, order: 'small', speed: 1, fz: 100, fx: 50, fy: 50, tone: 'color', margin: 0 },
  logo: { on: true, pos: 'tl', size: 22, color: 'ink', plate: false, vertical: false },
  anim: { dur: 6 },
  exp: { scale: 1, vfmt: 'mp4', fps: 30, loops: 1, gifScale: .5 },
};

/* ---------- заготовки ---------- */
const P_STRUCT = [
  ['Капсула', { bg: '#F2F1EC', ink: '#121212', blend: 'xor',
    A: { cx: .5, cy: .5, n: 26, w0: 300, h0: 36, sx: 22, sy: 22, t: 11, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .5, cy: .5, n: 26, w0: 36, h0: 36, sx: 24, sy: 28, t: 11, tg: 0, r: 70, rmode: 'prop', dx: 0, dy: 0, speed: -1 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Тоннель', { bg: '#F2F1EC', ink: '#121212', blend: 'xor',
    A: { cx: .5, cy: .5, n: 30, w0: 140, h0: 50, sx: 30, sy: 18, t: 13, tg: .25, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .5, cy: .5, n: 30, w0: 50, h0: 140, sx: 18, sy: 30, t: 13, tg: .25, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    logo: { on: true, pos: 'c', vertical: false, plate: true, size: 22 } }],
  ['Перекрестие', { bg: '#F7F6F3', ink: '#121212', blend: 'xor',
    A: { cx: .5, cy: .56, n: 18, w0: 60, h0: 150, sx: 9, sy: 16, t: 2.5, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .5, cy: .56, n: 18, w0: 150, h0: 60, sx: 16, sy: 9, t: 2.5, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Овал', { bg: '#F2F1EC', ink: '#121212', blend: 'xor',
    A: { cx: .5, cy: .5, n: 24, w0: 200, h0: 40, sx: 18, sy: 18, t: 9, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .5, cy: .5, n: 24, w0: 40, h0: 200, sx: 18, sy: 18, t: 9, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Сетка', { bg: '#F6F3EF', ink: '#E0524B', blend: 'xor',
    A: { cx: .5, cy: .5, n: 34, w0: 40, h0: 120, sx: 15, sy: 15, t: 7.5, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .5, cy: .5, n: 34, w0: 40, h0: 120, sx: 15.6, sy: 14.4, t: 7.5, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Купол', { bg: '#F2F1EC', ink: '#121212', blend: 'xor',
    A: { cx: .5, cy: .66, n: 22, w0: 6000, h0: 16, sx: 0, sy: 22, t: 11, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .5, cy: 1.02, n: 26, w0: 30, h0: 30, sx: 22, sy: 22, t: 11, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: -1 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Арка', { bg: '#F2F1EC', ink: '#121212', blend: 'xor',
    A: { cx: .5, cy: 1.2, n: 20, w0: 24, h0: 1500, sx: 23, sy: 23, t: 11, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .5, cy: .98, n: 22, w0: 24, h0: 24, sx: 23, sy: 23, t: 11, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: -1 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Пара', { bg: '#F6F3EF', ink: '#E0524B', blend: 'xor',
    A: { cx: .3, cy: .5, n: 20, w0: 30, h0: 240, sx: 16, sy: 16, t: 8, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    B: { cx: .7, cy: .5, n: 20, w0: 30, h0: 240, sx: 16, sy: 16, t: 8, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
];
const P_RINGS = [
  ['Тоннель', { bg: '#F7F6F3', R: { cx: .5, cy: .52, n: 16, w0: 150, h0: 230, sx: 26, sy: 30, t: 22, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: 7, gaps: 'bg', center: true, ox: 0, oy: 0 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Рамы', { bg: '#F7F6F3', R: { cx: .5, cy: .5, n: 14, w0: 220, h0: 280, sx: 26, sy: 32, t: 20, tg: 1, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: 9, gaps: 'bg', center: true, ox: 0, oy: 0 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Сквозь', { bg: '#121212', R: { cx: .5, cy: .5, n: 24, w0: 120, h0: 120, sx: 22, sy: 26, t: 18, tg: 0, r: 40, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: -3, gaps: 'img', center: true, ox: 0, oy: 0 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
  ['Подъём', { bg: '#F7F6F3', R: { cx: .5, cy: .78, n: 18, w0: 120, h0: 60, sx: 26, sy: 26, t: 20, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: -9, speed: 1, zoom0: 100, zstep: 8, gaps: 'bg', center: true, ox: 0, oy: 0 },
    logo: { on: true, pos: 'tl', vertical: false, plate: false, size: 22 } }],
];
const P_TRAIL = [
  ['Пирамида', { T: { anchor: 'tc', pivot: 'auto', size: 26, n: 16, end: 7, dist: 'geo', margin: 26, px: 0, py: 0, order: 'small' } }],
  ['Диагональ', { T: { anchor: 'tr', pivot: 'auto', size: 24, n: 14, end: 6, dist: 'geo', margin: 0, px: 0, py: 0, order: 'small' } }],
  ['Во все стороны', { T: { anchor: 'c', pivot: 'auto', size: 20, n: 14, end: 7, dist: 'geo', margin: 0, px: 0, py: 0, order: 'small' } }],
  ['Снизу вверх', { T: { anchor: 'bc', pivot: 'auto', size: 24, n: 12, end: 6, dist: 'lin', margin: 8, px: 0, py: 0, order: 'small' } }],
  ['Сбоку', { T: { anchor: 'cl', pivot: 'auto', size: 26, n: 12, end: 5, dist: 'geo', margin: 0, px: 0, py: 0, order: 'small' } }],
];

/* ---------- утилиты ---------- */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fr = (v) => ((v % 1) + 1) % 1;
const n2 = (v) => (Math.round(v * 100) / 100).toString();
const ANCH = { tl: [0, 0], tc: [.5, 0], tr: [1, 0], cl: [0, .5], c: [.5, .5], cr: [1, .5], bl: [0, 1], bc: [.5, 1], br: [1, 1] };
const getPath = (o, p) => p.split('.').reduce((a, k) => a[k], o);
const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
function merge(dst, src) { for (const k in src) { if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) merge(dst[k], src[k]); else dst[k] = src[k]; } }
function fmtSize() { const f = FORMATS.find(f => f[0] === S.fmt) || FORMATS[1]; return [f[2], f[3]]; }

/* ---------- геометрия ---------- */
// Скруглённый прямоугольник как SVG-путь (центр, полуоси, радиус). Используется и для холста (Path2D), и для SVG.
function rr(cx, cy, hw, hh, r) {
  r = clamp(r, 0, Math.min(hw, hh));
  const x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh;
  if (r < .01) return `M${n2(x0)} ${n2(y0)}H${n2(x1)}V${n2(y1)}H${n2(x0)}Z`;
  const a = `A${n2(r)} ${n2(r)} 0 0 1 `;
  return `M${n2(x0 + r)} ${n2(y0)}H${n2(x1 - r)}${a}${n2(x1)} ${n2(y0 + r)}V${n2(y1 - r)}${a}${n2(x1 - r)} ${n2(y1)}H${n2(x0 + r)}${a}${n2(x0)} ${n2(y1 - r)}V${n2(y0 + r)}${a}${n2(x0 + r)} ${n2(y0)}Z`;
}

// Список контуров набора в фазе tau (0..1). x — непрерывный номер контура.
// Крайние контуры плавно набирают и теряют толщину, поэтому цикл без шва.
function rings(P, tau, W, H, u, still) {
  const N = Math.max(1, Math.round(P.n));
  const f = still ? 0 : fr((P.speed || 0) * tau);
  const out = [];
  for (let k = -1; k < N; k++) {
    const x = k + f;
    const m = clamp(x + 1, 0, 1) * clamp(N - x, 0, 1);
    if (m <= 0.0005) continue;
    const cx = P.cx * W + P.dx * u * x, cy = P.cy * H + P.dy * u * x;
    const hw = (P.w0 / 2 + P.sx * x) * u, hh = (P.h0 / 2 + P.sy * x) * u;
    if (hw <= 0.2 || hh <= 0.2) continue;
    const t = Math.max(0, (P.t + P.tg * x) * u * m);
    if (t < 0.05) continue;
    const rad = P.rmode === 'fix' ? Math.min(P.rfix * u, hw, hh) : (P.r / 100) * Math.min(hw, hh);
    const outer = rr(cx, cy, hw, hh, rad);
    const ihw = hw - t, ihh = hh - t;
    const inner = (ihw > 0.2 && ihh > 0.2) ? rr(cx, cy, ihw, ihh, Math.max(0, rad - t)) : '';
    out.push({ x, cx, cy, hw, hh, rad, t, d: outer + inner, hole: inner });
  }
  return out;
}

/* ---------- фото ---------- */
let IMG = null, IMG_GRAY = null, IMG_NAME = 'Пример', IMG_URL_CACHE = { color: null, gray: null };
function makeDemo() {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 1500;
  const g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, 1500);
  gr.addColorStop(0, '#E4E0D9'); gr.addColorStop(.62, '#CFC9C0'); gr.addColorStop(.62, '#B3ABA0'); gr.addColorStop(1, '#9E968B');
  g.fillStyle = gr; g.fillRect(0, 0, 1200, 1500);
  // тень колонны на полу
  g.save(); g.globalAlpha = .25; g.fillStyle = '#4A443C';
  g.beginPath(); g.moveTo(750, 1500); g.lineTo(1200, 1180); g.lineTo(1200, 1300); g.lineTo(900, 1500); g.fill(); g.restore();
  // колонна
  gr = g.createLinearGradient(450, 0, 750, 0);
  gr.addColorStop(0, '#F3F0EA'); gr.addColorStop(.55, '#D9D3C9'); gr.addColorStop(1, '#A49C90');
  g.fillStyle = gr; g.fillRect(450, 790, 300, 710);
  g.fillStyle = '#EDE9E2'; g.fillRect(430, 770, 340, 32);
  // тень шара на капители
  g.save(); g.globalAlpha = .35; g.fillStyle = '#5B5248'; g.beginPath(); g.ellipse(625, 776, 150, 12, 0, 0, Math.PI * 2); g.fill(); g.restore();
  // шар
  gr = g.createRadialGradient(520, 470, 20, 600, 560, 230);
  gr.addColorStop(0, '#FF9A7A'); gr.addColorStop(.35, '#EE5236'); gr.addColorStop(.85, '#A9230F'); gr.addColorStop(1, '#7E1A0B');
  g.fillStyle = gr; g.beginPath(); g.arc(600, 560, 210, 0, Math.PI * 2); g.fill();
  return c;
}
function setImage(src, name) {
  IMG = src; IMG_NAME = name || 'Фото';
  const iw = src.naturalWidth || src.width, ih = src.naturalHeight || src.height;
  const c = document.createElement('canvas'); c.width = iw; c.height = ih;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  try {
    const d = g.getImageData(0, 0, iw, ih); const a = d.data;
    for (let i = 0; i < a.length; i += 4) { const l = a[i] * .2126 + a[i + 1] * .7152 + a[i + 2] * .0722; a[i] = a[i + 1] = a[i + 2] = l; }
    g.putImageData(d, 0, 0);
  } catch (e) { /* без ч/б */ }
  IMG_GRAY = c; IMG_URL_CACHE = { color: null, gray: null };
}
function img(tone) { return tone === 'gray' ? IMG_GRAY : IMG; }
function imgSize() { return [IMG.naturalWidth || IMG.width, IMG.naturalHeight || IMG.height]; }
// Матрица, вписывающая фото с заполнением (cover) в прямоугольник, с масштабом z вокруг точки (fx,fy) прямоугольника.
function coverMatrix(x, y, w, h, z, fx = .5, fy = .5) {
  const [iw, ih] = imgSize();
  const k = Math.max(w / iw, h / ih) * z;
  const dw = iw * k, dh = ih * k;
  const ox = x + (w - dw) * fx, oy = y + (h - dh) * fy;
  return [k, 0, 0, k, ox, oy];
}

/* ---------- построение сцены ---------- */
// Сцена — список слоёв, общий для холста и SVG.
function buildScene(W, H, tau, still) {
  const u = Math.min(W, H) / 1080;
  const sc = { W, H, u, layers: [] };
  if (S.mode === 'struct') {
    const A = rings(S.A, tau, W, H, u, still).map(r => r.d).join('');
    const B = rings(S.B, tau, W, H, u, still).map(r => r.d).join('');
    sc.layers.push({ kind: 'struct', A, B });
  } else if (S.mode === 'rings') {
    const R = S.R, list = rings(R, tau, W, H, u, still);
    const base = (R.zoom0 / 100);
    const q = 1 + R.zstep / 100;
    const cx = R.cx * W + R.ox * u, cy = R.cy * H + R.oy * u;
    // фото во всё поле, центр совпадает с центром набора
    const full = (z, ccx, ccy) => coverMatrix(ccx - W / 2, ccy - H / 2, W, H, z);
    if (R.gaps === 'img') sc.layers.push({ kind: 'img', m: full(base, cx, cy), clip: null, alpha: 1, tone: R.tone });
    if (R.center) {
      const r0 = rings({ ...R, speed: 0, n: Math.max(1, R.n) }, 0, W, H, u, true).find(r => Math.abs(r.x) < 1e-6);
      if (r0 && r0.hole) sc.layers.push({ kind: 'img', m: full(base, r0.cx + R.ox * u, r0.cy + R.oy * u), clip: r0.hole, alpha: 1, tone: R.tone });
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      const z = base * Math.pow(q, r.x + 1);
      sc.layers.push({ kind: 'img', m: full(z, r.cx + R.ox * u, r.cy + R.oy * u), clip: r.d, alpha: 1, tone: R.tone });
    }
  } else {
    const T = S.T; const [iw, ih] = imgSize();
    const asp = T.aspect === 'img' ? iw / ih : ({ '1:1': 1, '3:4': .75, '4:3': 4 / 3, '9:16': 9 / 16, '2:3': 2 / 3 })[T.aspect] || 1;
    const L = T.size / 100 * Math.min(W, H);
    const bw = asp >= 1 ? L : L * asp, bh = asp >= 1 ? L / asp : L;
    const [ax, ay] = ANCH[T.anchor] || [.5, .5];
    const mg = T.margin * u;
    const px = mg + ax * (W - 2 * mg) - ax * bw + T.px * u;
    const py = mg + ay * (H - 2 * mg) - ay * bh + T.py * u;
    const [vx, vy] = T.pivot === 'auto' ? [ax, ay] : (ANCH[T.pivot] || [.5, .5]);
    const Fx = px + vx * bw, Fy = py + vy * bh;
    const N = Math.max(2, Math.round(T.n));
    const f = still ? 0 : fr((T.speed || 0) * tau);
    const items = [];
    for (let k = -1; k < N; k++) {
      const x = k + f;
      const a = clamp(x + 1, 0, 1) * clamp(N - x, 0, 1);
      if (a <= 0.001) continue;
      const p = x / (N - 1);
      const s = T.dist === 'geo' ? Math.pow(T.end, p) : Math.max(0.02, 1 + (T.end - 1) * p);
      const rx = Fx + (px - Fx) * s, ry = Fy + (py - Fy) * s, rw = bw * s, rh = bh * s;
      const rad = (T.radius / 100) * Math.min(rw, rh) / 2;
      items.push({ x, a, clip: rr(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, rad), m: coverMatrix(rx, ry, rw, rh, T.fz / 100, T.fx / 100, T.fy / 100) });
    }
    items.sort((p, q) => T.order === 'small' ? q.x - p.x : p.x - q.x);
    for (const it of items) sc.layers.push({ kind: 'img', m: it.m, clip: it.clip, alpha: it.a, tone: T.tone });
    sc.base = { x: px, y: py, w: bw, h: bh, Fx, Fy };
  }
  // логотип
  if (S.logo.on) {
    const L = S.logo;
    const lw = L.size / 100 * (L.vertical ? H : W);
    const k = lw / LOGO.w, lh = LOGO.h * k;
    const mg = Math.min(W, H) * 0.05;
    const [ax, ay] = ANCH[L.pos] || [0, 0];
    const bw = L.vertical ? lh : lw, bh = L.vertical ? lw : lh;
    const x = mg + ax * (W - 2 * mg - bw), y = mg + ay * (H - 2 * mg - bh);
    let m;
    if (L.vertical) m = [0, -k, k, 0, x, y + bh];      // поворот на −90°, читается снизу вверх
    else m = [k, 0, 0, k, x, y];
    const pad = lh * 0.45;
    sc.logo = { m, color: L.color === 'bg' ? S.bg : (S.mode === 'struct' ? S.ink : (L.color === 'ink' ? S.ink : S.bg)), plate: L.plate ? { x: x - pad, y: y - pad, w: bw + 2 * pad, h: bh + 2 * pad } : null };
  }
  return sc;
}

/* ---------- отрисовка на холсте ---------- */
let LAYER = null;
function drawScene(ctx, sc) {
  const { W, H } = sc;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = S.bg; ctx.fillRect(0, 0, W, H);
  for (const L of sc.layers) {
    if (L.kind === 'struct') drawStruct(ctx, L, W, H);
    else {
      ctx.save();
      if (L.clip) ctx.clip(new Path2D(L.clip), 'evenodd');
      ctx.globalAlpha = L.alpha;
      ctx.setTransform(...L.m);
      ctx.drawImage(img(L.tone), 0, 0);
      ctx.restore();
    }
  }
  if (S.grain > 0) drawGrain(ctx, W, H);
  if (sc.logo) {
    const g = sc.logo;
    ctx.save();
    if (g.plate) { ctx.fillStyle = g.color === S.bg ? S.ink : S.bg; ctx.fillRect(g.plate.x, g.plate.y, g.plate.w, g.plate.h); }
    ctx.setTransform(...g.m); ctx.fillStyle = g.color; ctx.fill(LOGO_PATH, 'evenodd');
    ctx.restore();
  }
}
function drawStruct(ctx, L, W, H) {
  const pa = new Path2D(L.A), pb = new Path2D(L.B);
  const cA = S.ink, cB = S.twoTone ? S.inkB : S.ink;
  if (S.blend === 'a') { ctx.fillStyle = cA; ctx.fill(pa, 'evenodd'); return; }
  if (S.blend === 'b') { ctx.fillStyle = cB; ctx.fill(pb, 'evenodd'); return; }
  if (S.blend === 'over') { ctx.fillStyle = cA; ctx.fill(pa, 'evenodd'); ctx.fillStyle = cB; ctx.fill(pb, 'evenodd'); return; }
  if (!S.twoTone) { ctx.fillStyle = cA; ctx.fill(new Path2D(L.A + L.B), 'evenodd'); return; }
  if (!LAYER || LAYER.width !== W || LAYER.height !== H) { LAYER = document.createElement('canvas'); LAYER.width = W; LAYER.height = H; }
  const g = LAYER.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  g.fillStyle = cA; g.fill(pa, 'evenodd');
  g.globalCompositeOperation = 'xor'; g.fillStyle = cB; g.fill(pb, 'evenodd');
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(LAYER, 0, 0);
}
let GRAIN = null;
function drawGrain(ctx, W, H) {
  if (!GRAIN) {
    GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256;
    const g = GRAIN.getContext('2d'); const d = g.createImageData(256, 256);
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < d.data.length; i += 4) { const v = rnd() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = S.grain / 100 * 0.35; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}

/* ---------- SVG ---------- */
function imageDataURL(tone) {
  const key = tone === 'gray' ? 'gray' : 'color';
  if (IMG_URL_CACHE[key]) return IMG_URL_CACHE[key];
  const src = img(tone); const [iw, ih] = imgSize();
  const c = document.createElement('canvas'); c.width = iw; c.height = ih;
  c.getContext('2d').drawImage(src, 0, 0);
  return (IMG_URL_CACHE[key] = c.toDataURL('image/jpeg', 0.92));
}
function sceneSVG(sc) {
  const { W, H } = sc; const out = [];
  const defs = [];
  out.push(`<rect width="${W}" height="${H}" fill="${S.bg}"/>`);
  let clipN = 0; const usedTones = new Set();
  for (const L of sc.layers) {
    if (L.kind === 'struct') {
      const cA = S.ink, cB = S.twoTone ? S.inkB : S.ink;
      if (S.blend === 'a') out.push(`<path id="A" fill="${cA}" fill-rule="evenodd" d="${L.A}"/>`);
      else if (S.blend === 'b') out.push(`<path id="B" fill="${cB}" fill-rule="evenodd" d="${L.B}"/>`);
      else if (S.blend === 'over') out.push(`<path id="A" fill="${cA}" fill-rule="evenodd" d="${L.A}"/><path id="B" fill="${cB}" fill-rule="evenodd" d="${L.B}"/>`);
      else if (!S.twoTone) out.push(`<path id="A-xor-B" fill="${cA}" fill-rule="evenodd" d="${L.A}${L.B}"/>`);
      else {
        defs.push(`<mask id="notB" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><path fill="#000" fill-rule="evenodd" d="${L.B}"/></mask>`);
        defs.push(`<mask id="notA" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><path fill="#000" fill-rule="evenodd" d="${L.A}"/></mask>`);
        out.push(`<path id="A" fill="${cA}" fill-rule="evenodd" mask="url(#notB)" d="${L.A}"/><path id="B" fill="${cB}" fill-rule="evenodd" mask="url(#notA)" d="${L.B}"/>`);
      }
    } else {
      const tone = L.tone === 'gray' ? 'gray' : 'color'; usedTones.add(tone);
      let g = '<g';
      if (L.clip) { const id = 'c' + (clipN++); defs.push(`<clipPath id="${id}"><path clip-rule="evenodd" d="${L.clip}"/></clipPath>`); g += ` clip-path="url(#${id})"`; }
      if (L.alpha < 1) g += ` opacity="${n2(L.alpha)}"`;
      out.push(`${g}><use href="#img-${tone}" transform="matrix(${L.m.map(v => +v.toFixed(5)).join(' ')})"/></g>`);
    }
  }
  for (const t of usedTones) { const [iw, ih] = imgSize(); defs.push(`<image id="img-${t}" width="${iw}" height="${ih}" href="${imageDataURL(t)}"/>`); }
  if (sc.logo) {
    const g = sc.logo;
    if (g.plate) out.push(`<rect x="${n2(g.plate.x)}" y="${n2(g.plate.y)}" width="${n2(g.plate.w)}" height="${n2(g.plate.h)}" fill="${g.color === S.bg ? S.ink : S.bg}"/>`);
    out.push(`<path id="logo" fill="${g.color}" fill-rule="evenodd" transform="matrix(${g.m.map(v => +v.toFixed(5)).join(' ')})" d="${LOGO.d}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs.length ? '<defs>' + defs.join('') + '</defs>' : ''}${out.join('')}</svg>`;
}

/* ---------- основной холст и анимация ---------- */
const cv = $('cv'); const ctx = cv.getContext('2d');
let playing = false, tau = 0, t0 = 0, raf = 0;
function fit() {
  const w = $('wrap'); const [W, H] = fmtSize();
  const bw = w.clientWidth - 8, bh = w.clientHeight - 8;
  if (bw <= 0 || bh <= 0) return;
  const k = Math.min(bw / W, bh / H);
  cv.style.width = Math.floor(W * k) + 'px'; cv.style.height = Math.floor(H * k) + 'px';
}
new ResizeObserver(fit).observe($('wrap'));
function render() {
  const [W, H] = fmtSize();
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; fit(); }
  drawScene(ctx, buildScene(W, H, tau, false));
}
function loop(now) {
  if (!playing) return;
  tau = fr((now - t0) / 1000 / S.anim.dur);
  render();
  raf = requestAnimationFrame(loop);
}
function setPlaying(p) {
  playing = p;
  $('playBtn').setAttribute('aria-pressed', p);
  $('playBtn').textContent = p ? '❚❚ Пауза' : '▶ Движение';
  if (p) { t0 = performance.now() - tau * S.anim.dur * 1000; raf = requestAnimationFrame(loop); }
  else cancelAnimationFrame(raf);
}
let pending = false;
function update() { if (playing || pending) return; pending = true; requestAnimationFrame(() => { pending = false; render(); }); }

/* ---------- перетаскивание на макете ---------- */
let drag = null;
function toCanvas(e) { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * cv.width, (e.clientY - b.top) / b.height * cv.height]; }
cv.addEventListener('pointerdown', (e) => {
  const [x, y] = toCanvas(e); const [W, H] = fmtSize(); const u = Math.min(W, H) / 1080;
  if (S.mode === 'struct') {
    let key = S.setTab;
    if (S.blend === 'xor' || S.blend === 'over') {
      const dA = Math.hypot(S.A.cx * W - x, S.A.cy * H - y), dB = Math.hypot(S.B.cx * W - x, S.B.cy * H - y);
      if (Math.abs(dA - dB) > 4 * u) key = dA < dB ? 'A' : 'B';
    } else key = S.blend === 'b' ? 'B' : 'A';
    if (key !== S.setTab) { S.setTab = key; buildPanel(); }
    drag = { key, x, y, cx: S[key].cx, cy: S[key].cy, cx2: S[key === 'A' ? 'B' : 'A'].cx, cy2: S[key === 'A' ? 'B' : 'A'].cy, both: e.shiftKey };
  } else if (S.mode === 'rings') drag = { key: 'R', x, y, cx: S.R.cx, cy: S.R.cy };
  else drag = { key: 'T', x, y, px: S.T.px, py: S.T.py };
  cv.setPointerCapture(e.pointerId); cv.classList.add('drag');
});
cv.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const [x, y] = toCanvas(e); const [W, H] = fmtSize(); const u = Math.min(W, H) / 1080;
  const dx = x - drag.x, dy = y - drag.y;
  if (drag.key === 'T') { S.T.px = Math.round(drag.px + dx / u); S.T.py = Math.round(drag.py + dy / u); }
  else {
    S[drag.key].cx = +(drag.cx + dx / W).toFixed(4); S[drag.key].cy = +(drag.cy + dy / H).toFixed(4);
    if (drag.both) { const o = drag.key === 'A' ? 'B' : 'A'; S[o].cx = +(drag.cx2 + dx / W).toFixed(4); S[o].cy = +(drag.cy2 + dy / H).toFixed(4); }
  }
  syncPanel(); update();
});
const endDrag = () => { drag = null; cv.classList.remove('drag'); };
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

/* ---------- панель ---------- */
const panel = $('panel');
const bindings = [];   // [{path, el, out, fmt}]
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const k in attrs) { if (k === 'class') el.className = attrs[k]; else if (k.startsWith('on')) el.addEventListener(k.slice(2), attrs[k]); else el.setAttribute(k, attrs[k]); }
  for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
function sec(title, ...kids) { return h('section', { class: 'sec' }, h('h3', {}, ...[].concat(title)), ...kids); }
function range(path, label, min, max, step, fmt = (v) => v) {
  const id = 'r-' + path.replace(/\./g, '-');
  const el = h('input', { type: 'range', id, min, max, step });
  el.value = getPath(S, path);
  const out = h('output', { for: id }, String(fmt(+el.value)));
  el.addEventListener('input', () => { setPath(S, path, +el.value); out.textContent = fmt(+el.value); update(); });
  bindings.push({ path, el, out, fmt });
  return h('div', { class: 'row' }, h('label', { for: id }, label), el, out);
}
function seg(path, label, opts, after) {
  const box = h('div', { class: 'seg', role: 'group', 'aria-label': label });
  const cur = getPath(S, path);
  for (const [v, t] of opts) {
    const b = h('button', { type: 'button', 'aria-pressed': String(v === cur) }, t);
    b.addEventListener('click', () => { setPath(S, path, v); box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); if (after) after(v); update(); });
    box.append(b);
  }
  return h('div', { class: 'row' }, h('label', {}, label), box);
}
function check(path, label, after) {
  const id = 'c-' + path.replace(/\./g, '-');
  const el = h('input', { type: 'checkbox', id }); el.checked = !!getPath(S, path);
  el.addEventListener('change', () => { setPath(S, path, el.checked); if (after) after(el.checked); update(); });
  return h('label', { class: 'check', for: id }, el, label);
}
function grid9(path, label, withAuto) {
  const box = h('div', { class: 'grid9', role: 'group', 'aria-label': label });
  const keys = ['tl', 'tc', 'tr', 'cl', 'c', 'cr', 'bl', 'bc', 'br'];
  const names = { tl: 'слева вверху', tc: 'вверху', tr: 'справа вверху', cl: 'слева', c: 'в центре', cr: 'справа', bl: 'слева внизу', bc: 'внизу', br: 'справа внизу' };
  for (const k of keys) {
    const b = h('button', { type: 'button', 'aria-label': names[k], title: names[k], 'aria-pressed': String(getPath(S, path) === k) });
    b.addEventListener('click', () => { setPath(S, path, k); if (path === 'T.anchor') { S.T.px = 0; S.T.py = 0; } buildPanel(); update(); });
    box.append(b);
  }
  const row = h('div', { class: 'row' }, h('label', {}, label), box);
  if (withAuto) {
    const wrap = h('div', { style: 'display:grid;gap:8px' }, row,
      h('div', { class: 'row' }, h('span'), h('div', { style: 'grid-column:2/4' }, check(path + '__auto', 'Как у положения', (on) => { setPath(S, path, on ? 'auto' : 'c'); buildPanel(); }))));
    return wrap;
  }
  return row;
}
function syncPanel() { for (const b of bindings) { const v = getPath(S, b.path); if (+b.el.value !== v) { b.el.value = v; b.out.textContent = b.fmt(v); } } }
const px = (v) => n2(v), pc = (v) => Math.round(v) + '%';

function setControls(key) {
  const P = `${key}`;
  const items = [
    range(P + '.n', 'Контуров', 1, 80, 1),
    range(P + '.w0', 'Ширина', 0, key === 'R' ? 1200 : 3000, 1, px),
    range(P + '.h0', 'Высота', 0, key === 'R' ? 1200 : 3000, 1, px),
    range(P + '.sx', 'Шаг по X', 0, 80, .2, px),
    range(P + '.sy', 'Шаг по Y', 0, 80, .2, px),
    range(P + '.t', 'Толщина', .5, 80, .5, px),
    range(P + '.tg', 'Рост толщины', -2, 4, .05, px),
    seg(P + '.rmode', 'Скругление', [['prop', 'В долях'], ['fix', 'Одинаковое']], () => buildPanel()),
    S[key].rmode === 'fix' ? range(P + '.rfix', 'Радиус', 0, 400, 1, px) : range(P + '.r', 'Радиус', 0, 100, 1, pc),
    range(P + '.cx', 'Центр X', -0.5, 1.5, .005, (v) => Math.round(v * 100) + '%'),
    range(P + '.cy', 'Центр Y', -0.5, 1.5, .005, (v) => Math.round(v * 100) + '%'),
    range(P + '.dx', 'Смещение X', -40, 40, .5, px),
    range(P + '.dy', 'Смещение Y', -40, 40, .5, px),
    range(P + '.speed', 'Скорость', -4, 4, 1, (v) => (v > 0 ? '+' : '') + v),
  ];
  return items;
}

function themeRow() {
  const box = h('div', { class: 'themes' });
  for (const [name, bg, ink] of THEMES) {
    const b = h('button', { type: 'button', class: 'theme' }, h('i', { style: `background:${bg};box-shadow:inset -11px 0 0 ${ink}` }), h('span', {}, name));
    b.addEventListener('click', () => { S.bg = bg; S.ink = ink; if (!S.twoTone) S.inkB = ink; buildPanel(); update(); });
    box.append(b);
  }
  return box;
}
function colorInput(path, label) {
  const id = 'col-' + path;
  const el = h('input', { type: 'color', id }); el.value = getPath(S, path);
  el.addEventListener('input', () => { setPath(S, path, el.value); update(); });
  return h('label', { class: 'sw', for: id }, el, label);
}

function imageSection() {
  const thumb = h('img', { alt: '' });
  try { const c = document.createElement('canvas'); const [iw, ih] = imgSize(); const k = 112 / Math.min(iw, ih); c.width = Math.round(iw * k); c.height = Math.round(ih * k); c.getContext('2d').drawImage(IMG, 0, 0, c.width, c.height); thumb.src = c.toDataURL('image/jpeg', .8); } catch (e) {}
  return sec('Фото',
    h('div', { class: 'imgbox' }, thumb, h('div', { class: 'meta' },
      h('div', { class: 'name' }, IMG_NAME === 'Пример' ? 'Пример. Поставьте своё фото' : IMG_NAME),
      h('div', { class: 'btns' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => $('fileIn').click() }, 'Загрузить фото')))),
    h('p', { class: 'note' }, 'Можно перетащить файл на макет или вставить из буфера.'));
}

function presetsRow(list) {
  const box = h('div', { class: 'presets' });
  for (const [name, patch] of list) {
    box.append(h('button', { type: 'button', class: 'chipbtn', onclick: () => { applyPreset(patch); } }, name));
  }
  return box;
}
function applyPreset(patch) {
  const p = JSON.parse(JSON.stringify(patch));
  if (p.A) S.A = { ...SET_DEFAULT, ...p.A };
  if (p.B) S.B = { ...SET_DEFAULT, ...p.B };
  if (p.R) S.R = { ...S.R, ...p.R };
  if (p.T) S.T = { ...S.T, ...p.T };
  delete p.A; delete p.B; delete p.R; delete p.T;
  merge(S, p);
  if (!S.twoTone) S.inkB = S.ink;
  if (!playing) tau = 0;
  buildPanel(); update();
}

function buildPanel() {
  bindings.length = 0;
  const st = panel.scrollTop;
  panel.replaceChildren();
  const m = S.mode;
  if (m === 'struct') {
    panel.append(sec('Заготовки', presetsRow(P_STRUCT)));
    const tabs = h('div', { class: 'tabs', role: 'group', 'aria-label': 'Набор' });
    for (const k of ['A', 'B']) tabs.append(h('button', { type: 'button', 'aria-pressed': String(S.setTab === k), onclick: () => { S.setTab = k; buildPanel(); } }, k));
    panel.append(sec(['Набор', tabs, h('span', { class: 'grow' }, 'Shift + тянуть: оба')], ...setControls(S.setTab)));
    panel.append(sec('Наложение',
      seg('blend', 'Режим', [['xor', 'Вычитание'], ['over', 'Поверх'], ['a', 'Только A'], ['b', 'Только B']])));
  } else if (m === 'rings') {
    panel.append(sec('Заготовки', presetsRow(P_RINGS)));
    panel.append(imageSection());
    panel.append(sec('Фото в контурах',
      range('R.zoom0', 'Масштаб фото', 20, 400, 1, pc),
      range('R.zstep', 'Рост к краю', -20, 30, .5, (v) => (v > 0 ? '+' : '') + n2(v) + '%'),
      range('R.ox', 'Сдвиг фото X', -800, 800, 1, px),
      range('R.oy', 'Сдвиг фото Y', -800, 800, 1, px),
      seg('R.gaps', 'Между', [['bg', 'Фон'], ['img', 'Фото']]),
      seg('R.tone', 'Тон', [['color', 'Цвет'], ['gray', 'Ч/б']]),
      h('div', {}, check('R.center', 'Фото в центре'))));
    panel.append(sec('Контуры', ...setControls('R')));
  } else {
    panel.append(sec('Заготовки', presetsRow(P_TRAIL)));
    panel.append(imageSection());
    const T = S.T;
    panel.append(sec('Исходное фото',
      grid9('T.anchor', 'Положение'),
      range('T.size', 'Размер', 4, 80, .5, pc),
      range('T.margin', 'Отступ', 0, 200, 1, px),
      seg('T.aspect', 'Контейнер', [['img', 'Как фото'], ['1:1', '1:1'], ['3:4', '3:4'], ['4:3', '4:3'], ['9:16', '9:16']]),
      range('T.radius', 'Скругление', 0, 100, 1, pc),
      range('T.fz', 'Кадр: масштаб', 100, 300, 1, pc),
      range('T.fx', 'Кадр: X', 0, 100, 1, pc),
      range('T.fy', 'Кадр: Y', 0, 100, 1, pc),
      seg('T.tone', 'Тон', [['color', 'Цвет'], ['gray', 'Ч/б']])));
    const pivAuto = T.pivot === 'auto';
    const pivRow = h('div', { style: 'display:grid;gap:8px' });
    pivRow.append(h('div', {}, check('T.pivotAuto__', 'Точка роста там же, где фото', (on) => { S.T.pivot = on ? 'auto' : 'c'; buildPanel(); update(); })));
    pivRow.querySelector('input').checked = pivAuto;
    if (!pivAuto) pivRow.append(grid9('T.pivot', 'Точка роста'));
    panel.append(sec('Шлейф',
      range('T.n', 'Копий', 2, 60, 1),
      range('T.end', 'Масштаб последней', 1, 30, .1, (v) => '×' + n2(v)),
      seg('T.dist', 'Шаг', [['geo', 'Ускоряется'], ['lin', 'Ровный']]),
      seg('T.order', 'Сверху', [['small', 'Исходное'], ['big', 'Крупное']]),
      pivRow,
      range('T.speed', 'Скорость', -4, 4, 1, (v) => (v > 0 ? '+' : '') + v)));
  }

  // цвет
  const colorSec = sec('Цвет', themeRow(),
    h('div', { class: 'colors' }, colorInput('bg', 'Фон'), colorInput('ink', m === 'struct' ? (S.twoTone ? 'Набор A' : 'Контуры') : 'Логотип'),
      (m === 'struct' && S.twoTone) ? colorInput('inkB', 'Набор B') : null),
    m === 'struct' ? h('div', {}, check('twoTone', 'Наборы разного цвета', (on) => { if (!on) S.inkB = S.ink; buildPanel(); })) : null,
    range('grain', 'Зерно', 0, 100, 1, pc));
  panel.append(colorSec);

  // логотип
  const lg = [check('logo.on', 'Показывать логотип', () => buildPanel())];
  if (S.logo.on) {
    lg.push(grid9('logo.pos', 'Место'));
    lg.push(range('logo.size', 'Длина', 6, 90, .5, pc));
    if (m !== 'struct') lg.push(seg('logo.color', 'Цвет', [['ink', 'Как в цвете'], ['bg', 'Как фон']]));
    lg.push(h('div', { style: 'display:flex;gap:16px;flex-wrap:wrap' }, check('logo.vertical', 'Вертикально'), check('logo.plate', 'На плашке')));
  }
  panel.append(sec('Логотип', ...lg));

  // движение
  panel.append(sec('Движение',
    range('anim.dur', 'Цикл', 2, 20, .5, (v) => n2(v) + ' с'),
    h('p', { class: 'note' }, 'Скорость задаёт, на сколько контуров сдвинется набор за цикл. Ноль стоит на месте, минус движется внутрь. Цикл замкнут, видео можно ставить на повтор.')));

  // экспорт
  panel.append(exportSection());
  panel.scrollTop = st;
}

/* ---------- экспорт ---------- */
let DL = null;
(async () => { try { DL = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { DL = null; } })();
async function saveFile(filename, data) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  if (DL) {
    try { await DL.save({ filename, data: blob }); return true; }
    catch (e) {
      if (e && e.code === 'declined') return false;
      if (e && e.code === 'rate_limited') { status('Окно сохранения уже открыто. Закройте его и повторите.', true); return false; }
      if (e && e.code === 'too_large') { status('Файл слишком большой для этого окна. Попробуйте меньший размер.', true); return false; }
    }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}
function stamp() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; }
const MODE_NAME = { struct: 'interference', rings: 'rings', trail: 'trail' };
function fname(ext) { return `buksir-${MODE_NAME[S.mode]}-${S.fmt.replace(':', 'x')}-${stamp()}.${ext}`; }
function status(msg, err) { const s = $('status'); if (!s) return; s.textContent = msg; s.classList.toggle('err', !!err); }
function progress(v) { const b = $('bar'); if (b) b.style.width = Math.round(v * 100) + '%'; }
let busy = false;
function setBusy(b) { busy = b; document.querySelectorAll('[data-exp]').forEach(x => x.disabled = b); }

function exportSection() {
  const sc = S.exp;
  const s = sec('Экспорт',
    seg('exp.scale', 'Размер PNG', [[1, '×1'], [2, '×2'], [3, '×3']]),
    h('div', { class: 'btns' },
      h('button', { class: 'btn', type: 'button', 'data-exp': '', onclick: exportPNG }, 'PNG'),
      h('button', { class: 'btn ghost', type: 'button', 'data-exp': '', onclick: exportSVG }, 'SVG')),
    seg('exp.vfmt', 'Видео', [['mp4', 'MP4'], ['webm', 'WebM'], ['gif', 'GIF']], () => buildPanel()),
    sc.vfmt === 'gif'
      ? seg('exp.gifScale', 'Размер GIF', [[1, '×1'], [.5, '×½'], [.33, '×⅓']])
      : seg('exp.fps', 'Кадров/с', [[25, '25'], [30, '30'], [60, '60']]),
    seg('exp.loops', 'Циклов', [[1, '1'], [2, '2'], [4, '4']]),
    h('div', { class: 'btns' }, h('button', { class: 'btn', type: 'button', 'data-exp': '', onclick: exportVideo }, 'Записать ' + (sc.vfmt === 'gif' ? 'GIF' : 'видео'))),
    h('div', { class: 'bar' }, h('i', { id: 'bar' })),
    h('div', { class: 'status', id: 'status', role: 'status' }));
  return s;
}
function renderTo(W, H, t, still) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  drawScene(c.getContext('2d'), buildScene(W, H, t, still)); return c;
}
async function exportPNG() {
  if (busy) return; setBusy(true);
  try {
    const [W, H] = fmtSize(); const k = S.exp.scale;
    const c = renderTo(W * k, H * k, tau, false);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    status('Готовлю PNG…');
    const ok = await saveFile(fname('png'), blob);
    status(ok ? `PNG ${W * k} × ${H * k} готов.` : '');
  } catch (e) { status('Не получилось сохранить PNG: ' + e.message, true); }
  setBusy(false);
}
async function exportSVG() {
  if (busy) return; setBusy(true);
  try {
    const [W, H] = fmtSize();
    const svg = sceneSVG(buildScene(W, H, tau, false));
    const ok = await saveFile(fname('svg'), new Blob([svg], { type: 'image/svg+xml' }));
    status(ok ? 'SVG готов. Контуры в кривых, логотип отдельным слоем.' : '');
  } catch (e) { status('Не получилось собрать SVG: ' + e.message, true); }
  setBusy(false);
}
const nextTick = () => new Promise(r => setTimeout(r, 0));
async function exportVideo() {
  if (busy) return;
  const wasPlaying = playing; setPlaying(false); setBusy(true); progress(0);
  try {
    if (S.exp.vfmt === 'gif') await recordGIF(); else await recordVideo(S.exp.vfmt);
  } catch (e) { status('Запись не удалась: ' + (e && e.message || e), true); }
  progress(0); setBusy(false); if (wasPlaying) setPlaying(true); else render();
}
async function recordVideo(kind) {
  if (!('VideoEncoder' in window)) throw new Error('браузер не умеет кодировать видео. Откройте страницу в Chrome или Edge.');
  let [W, H] = fmtSize(); W -= W % 2; H -= H % 2;
  const fps = S.exp.fps, frames = Math.round(S.anim.dur * fps * S.exp.loops);
  const bitrate = Math.round(W * H * fps * 0.22);
  let codec, muxer, target;
  if (kind === 'mp4') {
    const tries = ['avc1.640034', 'avc1.640033', 'avc1.640028', 'avc1.4d0034', 'avc1.42003e'];
    for (const c of tries) { const r = await VideoEncoder.isConfigSupported({ codec: c, width: W, height: H, bitrate, framerate: fps }).catch(() => null); if (r && r.supported) { codec = c; break; } }
    if (!codec) throw new Error('кодировщик H.264 недоступен в этом браузере. Выберите WebM.');
    target = new Mp4Muxer.ArrayBufferTarget();
    muxer = new Mp4Muxer.Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: fps }, fastStart: 'in-memory' });
  } else {
    codec = 'vp09.00.41.08';
    const r = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate, framerate: fps }).catch(() => null);
    if (!r || !r.supported) throw new Error('кодировщик VP9 недоступен в этом браузере. Выберите MP4.');
    target = new WebMMuxer.ArrayBufferTarget();
    muxer = new WebMMuxer.Muxer({ target, video: { codec: 'V_VP9', width: W, height: H, frameRate: fps } });
  }
  let encErr = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { encErr = e; } });
  enc.configure({ codec, width: W, height: H, bitrate, framerate: fps, latencyMode: 'quality' });
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  for (let i = 0; i < frames; i++) {
    if (encErr) throw encErr;
    drawScene(g, buildScene(W, H, (i / (S.anim.dur * fps)) % 1, false));
    const vf = new VideoFrame(c, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
    enc.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close();
    if (enc.encodeQueueSize > 8) await new Promise(r => enc.addEventListener('dequeue', r, { once: true }));
    if (i % 4 === 0) { progress(i / frames); status(`Кодирую кадр ${i + 1} из ${frames}…`); await nextTick(); }
  }
  await enc.flush(); enc.close(); muxer.finalize();
  status('Сохраняю…');
  const ok = await saveFile(fname(kind), new Blob([target.buffer], { type: kind === 'mp4' ? 'video/mp4' : 'video/webm' }));
  status(ok ? `Видео ${W} × ${H}, ${fps} к/с, ${(frames / fps).toFixed(1)} с готово.` : '');
}
async function recordGIF() {
  const [W0, H0] = fmtSize(); const k = S.exp.gifScale;
  const W = Math.round(W0 * k), H = Math.round(H0 * k);
  const fps = 25, frames = Math.round(S.anim.dur * fps * S.exp.loops);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true });
  const { GIFEncoder, quantize, applyPalette } = window.gifenc;
  const gif = GIFEncoder();
  // общая палитра по нескольким кадрам цикла
  const samples = [];
  for (let i = 0; i < 6; i++) { drawScene(g, buildScene(W, H, i / 6, false)); samples.push(g.getImageData(0, 0, W, H).data); }
  const step = Math.max(1, Math.floor(samples.length * W * H / 400000));
  const pick = [];
  for (const d of samples) for (let p = 0; p < W * H; p += step) pick.push(d[p * 4], d[p * 4 + 1], d[p * 4 + 2], 255);
  const palette = quantize(new Uint8Array(pick), S.mode === 'struct' ? 32 : 256, { format: 'rgb565' });
  for (let i = 0; i < frames; i++) {
    drawScene(g, buildScene(W, H, (i / (S.anim.dur * fps)) % 1, false));
    const d = g.getImageData(0, 0, W, H).data;
    gif.writeFrame(applyPalette(d, palette, 'rgb565'), W, H, { palette: i === 0 ? palette : undefined, delay: 1000 / fps, repeat: 0 });
    if (i % 3 === 0) { progress(i / frames); status(`Кадр ${i + 1} из ${frames}…`); await nextTick(); }
  }
  gif.finish();
  const ok = await saveFile(fname('gif'), new Blob([gif.bytes()], { type: 'image/gif' }));
  status(ok ? `GIF ${W} × ${H}, ${(frames / fps).toFixed(1)} с готов.` : '');
}

/* ---------- верхняя и нижняя панели ---------- */
const VISITED = new Set();
function setMode(m) {
  S.mode = m;
  if (!VISITED.has(m)) { VISITED.add(m); const first = { struct: P_STRUCT, rings: P_RINGS, trail: P_TRAIL }[m][0][1]; const keep = S.logo; applyPreset(first); S.logo = keep; }
  document.querySelectorAll('#modes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('hint').textContent = m === 'trail' ? 'Тяните фото на макете' : 'Тяните контуры на макете';
  if (!playing) tau = 0;
  buildPanel(); update();
}
document.querySelectorAll('#modes button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
function buildFormats() {
  const box = $('fmts'); box.replaceChildren();
  for (const [k, name, w, hgt] of FORMATS) {
    const b = h('button', { type: 'button', class: 'pill', 'aria-pressed': String(S.fmt === k), title: `${w} × ${hgt}` }, name);
    b.addEventListener('click', () => { S.fmt = k; buildFormats(); update(); });
    box.append(b);
  }
}
$('playBtn').addEventListener('click', () => setPlaying(!playing));
document.addEventListener('keydown', (e) => { if (e.code === 'Space' && !/INPUT|BUTTON|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); setPlaying(!playing); } });
$('brand').prepend(new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO.w} ${LOGO.h}" role="img" aria-label="Буксир"><path fill-rule="evenodd" d="${LOGO.d}"/></svg>`, 'image/svg+xml').documentElement);

/* ---------- загрузка фото ---------- */
function loadFile(file) {
  if (!file || !/^image\//.test(file.type)) { status('Нужен файл изображения: JPG, PNG или WebP.', true); return; }
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => { setImage(im, file.name); if (S.mode === 'struct') setMode('rings'); else { buildPanel(); update(); } };
  im.onerror = () => status('Не удалось открыть это изображение.', true);
  im.src = url;
}
$('fileIn').addEventListener('change', (e) => { loadFile(e.target.files[0]); e.target.value = ''; });
const wrap = $('wrap');
['dragenter', 'dragover'].forEach(t => wrap.addEventListener(t, (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); $('drop').hidden = false; } }));
['dragleave', 'drop'].forEach(t => wrap.addEventListener(t, (e) => { e.preventDefault(); $('drop').hidden = true; if (t === 'drop' && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); }));
document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find(f => /^image\//.test(f.type)); if (f) loadFile(f); });

/* ---------- старт ---------- */
setImage(makeDemo(), 'Пример');
applyPreset(P_STRUCT[0][1]);
buildFormats();
setMode('struct');
window.__buksir = { S, render, buildScene, sceneSVG, setMode, applyPreset, P_STRUCT, P_RINGS, P_TRAIL, setTau: (t) => { tau = t; render(); }, renderTo };
