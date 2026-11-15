#!/usr/bin/env python3
"""فحص ثابت: كل ملف يشير له التطبيق موجود فعلاً في الحزمة.
التشغيل: python3 qa/check_paths.py  (من مجلد التطبيق)"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
missing, checked = [], 0

def need(path, where):
    global checked
    checked += 1
    p = os.path.normpath(path.split('?')[0].split('#')[0])
    if not os.path.isfile(p):
        missing.append('%s  <- %s' % (path, where))

for html in ['index.html', 'privacy.html']:
    src = open(html, encoding='utf-8').read()
    for ref in re.findall(r'(?:src|href)="([^"]+)"', src):
        if ref.startswith(('http', '#', 'mailto:')): continue
        need(ref, html)
css = open('css/app.css', encoding='utf-8').read()
for ref in re.findall(r"url\('?([^')]+)'?\)", css):
    if ref.startswith(('data:', 'http')): continue
    need(os.path.join('css', ref), 'css/app.css')
sw = open('sw.js', encoding='utf-8').read()
shell = re.search(r'const SHELL = \[(.*?)\];', sw, re.S).group(1)
for ref in re.findall(r"'([^']+)'", shell):
    if ref == './': ref = 'index.html'
    need(ref, 'sw.js SHELL')
man = json.load(open('audio/manifest.json', encoding='utf-8'))
for k, v in man['items'].items():
    need(v['file'], 'audio/manifest.json ' + k)
    if any(ord(c) > 127 for c in v['file']):
        missing.append('non-ASCII file name: ' + v['file'])
la = open('js/lesson-audio.js', encoding='utf-8').read()
for ref in re.findall(r'"(audio/[^"]+)"', la):
    need(ref, 'js/lesson-audio.js')
chk = open('audio/ar/letters/CHECK.html', encoding='utf-8').read()
for ref in re.findall(r"p\('([^']+)'\)", chk):
    need(os.path.join('audio/ar/letters', ref), 'CHECK.html')
wm = json.load(open('manifest.webmanifest', encoding='utf-8'))
for ic in wm.get('icons', []): need(ic['src'], 'manifest.webmanifest')
for root, _, files in os.walk('.'):
    for f in files:
        if any(ord(c) > 127 for c in f): missing.append('non-ASCII file in package: ' + os.path.join(root, f))
print('checked %d references' % checked)
if missing:
    print('MISSING (%d):' % len(missing)); print('\n'.join(missing)); sys.exit(1)
print('OK — every referenced file exists')
