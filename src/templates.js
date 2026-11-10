/* Буксир — шаблоны рубрик.
   Каждый шаблон: поля текста, графика (режим и её настройки), зона графики и вёрстка.
   Вёрстка считается от размеров макета, поэтому один шаблон работает в 4:5, 9:16 и 1:1.
   Основа: папка «Контент» (анонсы лекций, мастер-классов, кинопоказов, концертов, афиши выставок,
   дайджест недели, афиша месяца, карусели-статьи, фотоотчёты). */
'use strict';

const RED = '#EC0F13';

const SAMPLE_MONTH = [
  '2 | Мастер-класс «Наброски» | 18:00',
  '6 | Кинопоказ «Магия лунного света» | 18:00',
  '9 | Мастер-класс «Цианотипия для взрослых» | 18:00',
  '10 | Коллажная встреча | 18:00',
  '13 | Кинопоказ «Джейн Остин» | 18:00',
  '14 | Кинолекция Кристины Мамаджановой | 19:00',
  '15 | Фотопрогулка | 18:00',
  '17 | Лекция «Мобильная съёмка и творчество» | 18:00',
  '21 | Книжный клуб «Золотой храм» | 19:00',
  '23 | Английский клуб | 14:00',
  '24 | Клуб «Слово на карте» | 18:00',
  '31 | Мастер-класс «Фигурный дискошар» | 18:00',
].join('\n');

const ADDRESS = 'Зегеля, 1', HOURS = 'пн–вс / 10–20', SITE = 'buksirgallery.ru';

/* Общие куски вёрстки */
function headerBlocks(L, o = {}) {
  const { W, u, m } = L;
  const out = [];
  const lg = L.logo({ x: m, y: m, w: 250 * u, color: o.logoColor || 'text', plate: o.plate });
  out.push(lg);
  const mid = m + lg.h / 2;
  if (PARTNER) out.push(L.partner({ x: W - m, y: mid - 46 * u, h: 92 * u, ax: 'r' }));
  else if (o.rubric) {
    const size = 30 * u, lh = size * 1.12;
    out.push(L.stack({ x: W * 0.42, y: mid - lh / 2, w: W * 0.58 - m, h: lh * 2.2, ay: 't', ax: 'r',
      items: [{ text: o.rubric, face: 'dr', size, upper: true, color: o.rubricColor || 'accent', maxLines: 2, plate: o.plate, grow: false }] }));
  }
  return out;
}
// Если в шапке логотип партнёра, рубрика переезжает в начало заголовка.
const rubricInline = (L, F, color, plate) => PARTNER && F.rubric ? { text: F.rubric, face: 'dr', size: 28 * L.u, upper: true, color: color || 'accent', gap: 22 * L.u, plate, grow: false } : null;

const TEMPLATES = [
  /* ---------- анонсы ---------- */
  {
    id: 'lecture', group: 'Анонсы', name: 'Лекция · open talk',
    fields: [['rubric', 'Рубрика', 'Лекция'], ['title', 'Заголовок', 'Художники металла', 'area'], ['sub', 'Спикер, подзаголовок', 'Павел Зуданов', 'area'],
      ['date', 'Дата', '29.04'], ['time', 'Время', '18:00'], ['note', 'Справа внизу', 'Вход свободный']],
    scene: { mode: 'rings', theme: 'white', R: { cx: .5, cy: .55, n: 16, w0: 160, h0: 220, sx: 26, sy: 30, t: 20, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: 7, gaps: 'bg', center: true, ox: 0, oy: 0, tone: 'gray' } },
    area: (W, H, u) => { const top = 150 * u, tz = Math.max(500 * u, H * 0.37); return { x: 0, y: top, w: W, h: H - tz - top }; },
    layout(L, F) {
      const { W, H, u, m } = L, tz = Math.max(500 * u, H * 0.37);
      return [
        ...headerBlocks(L, { rubric: F.rubric }),
        L.stack({ x: m, y: H - tz + 44 * u, w: W - 2 * m, h: tz - 44 * u - m - 90 * u, ay: 't', items: [
          rubricInline(L, F),
          { text: F.title, face: 'd', size: 84 * u, min: 40 * u, lh: 1.04, upper: true, maxLines: 3, gap: 26 * u },
          { text: F.sub, face: 't', size: 36 * u, min: 26 * u, lh: 1.2, maxLines: 2 }] }),
        L.dateline({ x: m, y: H - m - 16 * u, w: W - 2 * m, left: F.date, right: F.time, note: F.note, size: 36 * u }),
      ];
    },
  },
  {
    id: 'workshop', group: 'Анонсы', name: 'Мастер-класс · клуб',
    fields: [['rubric', 'Рубрика', 'Мастер-класс'], ['title', 'Заголовок', '«Мой архив»', 'area'], ['sub', 'Ведущий', 'с Ириной Гладких', 'area'],
      ['date', 'Дата', '03.10'], ['time', 'Время', '17:00'], ['note', 'Справа внизу', '']],
    scene: { mode: 'trail', theme: 'white', T: { anchor: 'tr', pivot: 'auto', size: 34, n: 11, end: 4.2, dist: 'geo', margin: 64, px: 0, py: 0, order: 'small', aspect: '3:4', radius: 0, speed: 1, fz: 100, fx: 50, fy: 50, tone: 'gray' } },
    area: (W, H, u) => ({ x: 0, y: 0, w: W, h: H - 150 * u }),
    layout(L, F) {
      const { W, H, u, m } = L;
      return [
        L.logo({ x: m, y: m, w: 250 * u, color: 'text' }),
        ...(PARTNER ? [L.partner({ x: m, y: m + 70 * u, h: 80 * u })] : []),
        L.stack({ x: m, y: H * 0.36, w: W * 0.78 - m, h: H - 150 * u - H * 0.36 - 40 * u, ay: 'b', items: [
          { text: F.rubric, face: 'dr', size: 30 * u, upper: true, color: 'accent', plate: 'bg', gap: 30 * u, grow: false },
          { text: F.title, face: 'd', size: 88 * u, min: 44 * u, lh: 1.16, upper: true, maxLines: 3, plate: 'bg', gap: 26 * u },
          { text: F.sub, face: 't', size: 38 * u, min: 26 * u, lh: 1.3, maxLines: 2, plate: 'bg' }] }),
        L.dateline({ x: m, y: H - 75 * u, w: W - 2 * m, left: F.date, right: F.time, note: F.note, size: 36 * u }),
      ];
    },
  },
  {
    id: 'cinema', group: 'Анонсы', name: 'Кинопоказ',
    fields: [['rubric', 'Рубрика', 'Кинопоказ'], ['title', 'Фильм', 'Девушка с жемчужной серёжкой', 'area'], ['sub', 'Режиссёр, год', 'Питер Уэббер, 2003', 'area'],
      ['date', 'Дата', '30.09'], ['time', 'Время', '18:30'], ['note', 'Справа внизу', 'Вход свободный']],
    scene: { mode: 'rings', theme: 'black', R: { cx: .5, cy: .45, n: 22, w0: 110, h0: 150, sx: 24, sy: 28, t: 18, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: -3.5, gaps: 'img', center: true, ox: 0, oy: 0, tone: 'color' } },
    area: () => null,
    layout(L, F) {
      const { W, H, u, m } = L;
      return [
        ...headerBlocks(L, { rubric: F.rubric, plate: 'bg', rubricColor: 'text' }),
        L.stack({ x: m, y: H * 0.45, w: W - 2 * m, h: H * 0.55 - m - 110 * u, ay: 'b', ax: 'c', items: [
          rubricInline(L, F, 'text', 'bg'),
          { text: F.title, face: 'd', size: 74 * u, min: 38 * u, lh: 1.18, upper: true, maxLines: 3, plate: 'bg', gap: 22 * u },
          { text: F.sub, face: 't', size: 32 * u, min: 24 * u, lh: 1.3, maxLines: 2, plate: 'bg' }] }),
        L.dateline({ x: m, y: H - m - 18 * u, w: W - 2 * m, left: F.date, right: F.time, note: F.note, size: 36 * u, plate: 'bg' }),
      ];
    },
  },
  {
    id: 'concert', group: 'Анонсы', name: 'Концерт',
    fields: [['rubric', 'Рубрика', 'Концерт'], ['title', 'Заголовок', 'Вечер джаза', 'area'], ['sub', 'Исполнители', 'Кавер-дуэт «Dreamers»: Сухраб Георгиев и Татьяна Золотых', 'area'],
      ['date', 'Дата', '01.10'], ['time', 'Время', '18:30'], ['note', 'Справа внизу', 'Вход свободный']],
    scene: { mode: 'struct', theme: 'blackRed', blend: 'xor',
      A: { cx: .5, cy: 1.25, n: 20, w0: 24, h0: 1500, sx: 23, sy: 23, t: 11, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
      B: { cx: .5, cy: 1.0, n: 22, w0: 24, h0: 24, sx: 23, sy: 23, t: 11, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: -1 } },
    area: (W, H, u) => { const y = Math.max(H * 0.5, 600 * u); return { x: 0, y, w: W, h: H - y - 150 * u }; },
    layout(L, F) {
      const { W, H, u, m } = L, y = Math.max(H * 0.5, 600 * u);
      return [
        ...headerBlocks(L, { rubric: F.rubric }),
        L.stack({ x: m, y: 170 * u, w: W - 2 * m, h: y - 170 * u - 40 * u, ay: 'b', items: [
          rubricInline(L, F),
          { text: F.title, face: 'd', size: 110 * u, min: 50 * u, lh: 1.02, upper: true, maxLines: 3, gap: 30 * u },
          { text: F.sub, face: 't', size: 34 * u, min: 24 * u, lh: 1.25, maxLines: 3 }] }),
        L.dateline({ x: m, y: H - 75 * u, w: W - 2 * m, left: F.date, right: F.time, note: F.note, size: 36 * u }),
      ];
    },
  },
  /* ---------- выставки ---------- */
  {
    id: 'exhibition', group: 'Выставки', name: 'Афиша выставки',
    fields: [['rubric', 'Рубрика', 'Выставка'], ['title', 'Название', 'Логика переплетений', 'area'], ['sub', 'Художник', 'Кристина Пашкова', 'area'],
      ['dates', 'Даты', '3 мая — 20 июня'], ['address', 'Адрес', ADDRESS], ['hours', 'Часы работы', HOURS]],
    scene: { mode: 'struct', theme: 'whiteRed', blend: 'xor',
      A: { cx: .5, cy: .5, n: 26, w0: 300, h0: 36, sx: 22, sy: 22, t: 11, tg: 0, r: 100, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
      B: { cx: .5, cy: .5, n: 26, w0: 36, h0: 36, sx: 24, sy: 28, t: 11, tg: 0, r: 70, rmode: 'prop', dx: 0, dy: 0, speed: -1 } },
    area: () => null,
    layout(L, F) {
      const { W, H, u, m } = L;
      return [
        ...headerBlocks(L, { rubric: F.rubric, plate: 'bg' }),
        L.stack({ x: m, y: 170 * u, w: W - 2 * m, h: H - 340 * u, ay: 'm', ax: 'c', items: [
          rubricInline(L, F, null, 'bg'),
          { text: F.title, face: 'd', size: 112 * u, min: 52 * u, lh: 1.16, upper: true, maxLines: 4, plate: 'bg', gap: 34 * u },
          { text: F.sub, face: 'dr', size: 34 * u, min: 24 * u, lh: 1.3, upper: true, maxLines: 2, plate: 'bg', gap: 14 * u },
          { text: F.dates, face: 'dr', size: 34 * u, min: 24 * u, lh: 1.3, upper: true, maxLines: 1, plate: 'bg', color: 'accent' }] }),
        L.dateline({ x: m, y: H - m - 18 * u, w: W - 2 * m, left: F.address, right: F.hours, size: 32 * u, plate: 'bg' }),
      ];
    },
  },
  {
    id: 'article', group: 'Выставки', name: 'Карусель: текст и фото',
    fields: [['title', 'Заголовок', 'Язык формы', 'area'], ['body', 'Текст', 'Визуальный стиль Серафимы сложился под влиянием послевоенной манги 1950–60-х, в том числе творчества «Бога манги» Осаму Тэдзуки. Эмоциональная гиперболизация, яркая палитра, почти детская пластика — через эту простоту художница говорит о глубоких вещах.', 'area'],
      ['page', 'Номер слайда', '02 / 05']],
    scene: { mode: 'rings', theme: 'white', R: { cx: .5, cy: .5, n: 9, w0: 420, h0: 260, sx: 30, sy: 30, t: 8, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: 5, gaps: 'img', center: true, ox: 0, oy: 0, tone: 'color' } },
    area: (W, H, u) => { const y = Math.max(H * 0.4, 520 * u); return { x: 64 * u, y, w: W - 128 * u, h: H - y - 150 * u }; },
    layout(L, F) {
      const { W, H, u, m } = L, y = Math.max(H * 0.4, 520 * u);
      return [
        L.stack({ x: m, y: m, w: W - 2 * m, h: y - m - 44 * u, ay: 't', items: [
          { text: F.title, face: 'd', size: 56 * u, min: 34 * u, lh: 1.08, upper: true, maxLines: 2, gap: 30 * u },
          { text: F.body, face: 't', size: 31 * u, min: 22 * u, lh: 1.34, maxLines: 9 }] }),
        L.stack({ x: m, y: H - 75 * u - 30 * u, w: W / 2, h: 60 * u, ay: 'm', items: [{ text: F.page, face: 'dr', size: 26 * u, upper: true, color: 'accent', grow: false }] }),
        L.logo({ x: W - m, y: H - 75 * u - 20 * u, w: 230 * u, ax: 'r' }),
      ];
    },
  },
  /* ---------- регулярные ---------- */
  {
    id: 'digest', group: 'Регулярные', name: 'Дайджест недели',
    fields: [['top', 'Сверху', 'Дайджест'], ['bottom', 'Снизу', 'событий недели'], ['from', 'С', '26.10'], ['to', 'По', '01.11']],
    scene: { mode: 'rings', theme: 'white', R: { cx: .5, cy: .5, n: 14, w0: 220, h0: 280, sx: 26, sy: 32, t: 16, tg: 1, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: 6, gaps: 'img', center: true, ox: 0, oy: 0, tone: 'red' } },
    area: (W, H, u) => ({ x: 64 * u, y: 150 * u, w: W - 128 * u, h: H - 150 * u - 200 * u }),
    layout(L, F) {
      const { W, H, u, m } = L, ay = 150 * u, ab = H - 200 * u;
      const s = 70 * u, lh = s * 1.16, cap = CAP.d * s;
      return [
        L.logo({ x: m, y: m, w: 250 * u }),
        L.stack({ x: W * 0.3, y: ay - lh / 2, w: W * 0.7 - m + 18 * u, h: lh * 2, ay: 't', ax: 'r', items: [{ text: F.top, face: 'd', size: s, upper: true, plate: 'bg', maxLines: 1, min: 40 * u }] }),
        L.stack({ x: m - 18 * u, y: ab - lh * 2 + lh / 2, w: W - 2 * m, h: lh * 2, ay: 'b', items: [{ text: F.bottom, face: 'd', size: s, upper: true, plate: 'bg', maxLines: 2, min: 40 * u, lh: 1.16 }] }),
        L.dateline({ x: m, y: H - 90 * u, w: W - 2 * m, left: F.from, right: F.to, size: 34 * u, ax: 'c', lineLen: 150 * u }),
      ];
    },
  },
  {
    id: 'month', group: 'Регулярные', name: 'Афиша месяца',
    fields: [['title', 'Заголовок', 'Афиша'], ['month', 'Месяц', 'Ноябрь'], ['rows', 'События: число | название | время', SAMPLE_MONTH, 'list'],
      ['site', 'Сайт', SITE], ['address', 'Адрес', ADDRESS], ['hours', 'Часы', HOURS]],
    scene: { mode: 'struct', theme: 'white', twoTone: true, blend: 'xor',
      A: { cx: .5, cy: .5, n: 40, w0: 30, h0: 90, sx: 9, sy: 22, t: 4.5, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1 },
      B: { cx: .5, cy: .5, n: 40, w0: 90, h0: 30, sx: 22, sy: 9, t: 4.5, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1 } },
    area: (W, H, u) => ({ x: 0, y: 0, w: Math.round(W * 0.2), h: H }),
    layout(L, F) {
      const { W, H, u, m } = L, x0 = W * 0.2 + 52 * u, w = W - x0 - m;
      const s = 64 * u;
      return [
        L.stack({ x: x0, y: m - 6 * u, w, h: s * 2.4, ay: 't', items: [
          { text: F.title, face: 'd', size: s, upper: true, maxLines: 1, min: 36 * u, lh: 1.08 },
          { text: F.month, face: 'd', size: s, upper: true, maxLines: 1, min: 36 * u, lh: 1.08, color: 'accent' }] }),
        L.logo({ x: W - m, y: m, w: 200 * u, ax: 'r' }),
        L.list({ x: x0, y: m + s * 2.4 + 34 * u, w, h: H - (m + s * 2.4 + 34 * u) - 130 * u, rows: F.rows }),
        L.row({ x: x0, y: H - 70 * u, w, parts: [F.site, F.address, F.hours], size: 26 * u, face: 'tm' }),
      ];
    },
  },
  /* ---------- фотоотчёты ---------- */
  {
    id: 'reportCover', group: 'Фотоотчёты', name: 'Фотоотчёт: обложка',
    fields: [['title', 'Заголовок', 'Чем «Буксир» занимался летом?', 'area'], ['sub', 'Подзаголовок', 'четыре главных события, выездные проекты и новый филиал', 'area']],
    scene: { mode: 'trail', theme: 'black', T: { anchor: 'c', pivot: 'auto', size: 30, n: 12, end: 6, dist: 'geo', margin: 0, px: 0, py: 0, order: 'small', aspect: 'img', radius: 0, speed: 1, fz: 100, fx: 50, fy: 50, tone: 'color' } },
    area: () => null,
    layout(L, F) {
      const { W, H, u, m } = L;
      return [
        L.logo({ x: m, y: m, w: 250 * u, plate: 'bg' }),
        ...(PARTNER ? [L.partner({ x: W - m, y: m - 20 * u, h: 92 * u, ax: 'r' })] : []),
        L.stack({ x: m, y: 160 * u, w: W - 2 * m, h: H - 320 * u, ay: 'm', ax: 'c', items: [
          { text: F.title, face: 'd', size: 84 * u, min: 42 * u, lh: 1.18, upper: true, maxLines: 4, plate: 'bg', gap: 30 * u },
          { text: F.sub, face: 't', size: 34 * u, min: 24 * u, lh: 1.32, maxLines: 3, plate: 'bg' }] }),
      ];
    },
  },
  {
    id: 'reportSlide', group: 'Фотоотчёты', name: 'Фотоотчёт: слайд',
    fields: [['num', 'Номер', '1'], ['title', 'Заголовок', 'Провели выставку Артёма Ляпина «Узор пустот»', 'area'],
      ['body', 'Подпись', 'Проект, созданный вместе с «Елецкими кружевами»: художник с мастерицами переосмыслил традиционный орнамент, кружевные узоры зазвучали в металле.', 'area'], ['credit', 'Мелко внизу', 'куратор: Дарья Эпин']],
    scene: { mode: 'rings', theme: 'black', R: { cx: .5, cy: .5, n: 12, w0: 300, h0: 380, sx: 30, sy: 34, t: 10, tg: 0, r: 0, rmode: 'prop', dx: 0, dy: 0, speed: 1, zoom0: 100, zstep: 4, gaps: 'img', center: true, ox: 0, oy: 0, tone: 'color' } },
    area: () => null,
    layout(L, F) {
      const { W, H, u, m } = L;
      return [
        L.stack({ x: m, y: m, w: W - 2 * m, h: H * 0.45, ay: 't', items: [
          { text: F.num ? F.num + ')' : '', face: 'd', size: 120 * u, color: 'accent', maxLines: 1, gap: 18 * u, grow: false, plate: 'bg' },
          { text: F.title, face: 'd', size: 52 * u, min: 32 * u, lh: 1.2, upper: true, maxLines: 4, plate: 'bg' }] }),
        L.stack({ x: m, y: H * 0.55, w: W - 2 * m, h: H * 0.45 - 150 * u, ay: 'b', items: [
          { text: F.body, face: 't', size: 32 * u, min: 22 * u, lh: 1.36, maxLines: 6, plate: 'bg', gap: 16 * u },
          { text: F.credit, face: 't', size: 26 * u, lh: 1.3, maxLines: 1, plate: 'bg', color: 'accent' }] }),
        L.logo({ x: W - m, y: H - 75 * u - 20 * u, w: 230 * u, ax: 'r', plate: 'bg' }),
      ];
    },
  },
];
