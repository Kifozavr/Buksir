#!/usr/bin/env python3
"""Сборка Буксира: src/page.html + src/app.js + vendor + логотип.
Выход: Buksir.html (автономная страница) и dist/artifact.html (для публикации артефактом)."""
import json, pathlib

ROOT = pathlib.Path(__file__).parent
page = (ROOT / 'src/page.html').read_text(encoding='utf-8')
app = (ROOT / 'src/app.js').read_text(encoding='utf-8')
logo = json.loads((ROOT / 'assets/logo.json').read_text(encoding='utf-8'))
vendor = ''.join((ROOT / 'vendor' / f).read_text(encoding='utf-8') + '\n'
                 for f in ['mp4-muxer.min.js', 'webm-muxer.min.js', 'gifenc.js'])

for bad in ('</script', '<!--'):
    assert bad not in app, f'в app.js нельзя писать {bad!r}'

scripts = ('<script>' + vendor + '</script>\n'
           '<script>window.__LOGO__=' + json.dumps(logo, ensure_ascii=False) + ';</script>\n'
           '<script>' + app + '</script>\n')
body = page + '\n' + scripts

(ROOT / 'dist').mkdir(exist_ok=True)
(ROOT / 'dist/artifact.html').write_text(body, encoding='utf-8')
full = ('<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>'
        '</head><body>\n' + body + '</body></html>\n')
(ROOT / 'Buksir.html').write_text(full, encoding='utf-8')
print('Buksir.html', len(full) // 1024, 'КБ; dist/artifact.html', len(body) // 1024, 'КБ')
