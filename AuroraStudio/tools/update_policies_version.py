#!/usr/bin/env python3
"""
Update policies-version meta tag across HTML files based on the SHA1 of politicas.html content.
Usage: python tools/update_policies_version.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
POLICIES = ROOT / 'politicas.html'

if not POLICIES.exists():
    print('politicas.html not found at', POLICIES)
    raise SystemExit(1)

content = POLICIES.read_bytes()
sha1 = hashlib.sha1(content).hexdigest()
version = sha1[:10]
print('Computed policies version:', version)

# Regex to replace or insert meta name="policies-version"
meta_re = re.compile(r'(<meta\s+name=["\']policies-version["\']\s+content=)(["\'])(.*?)(["\'])', re.IGNORECASE)

html_files = list(ROOT.glob('*.html'))
for html in html_files:
    text = html.read_text(encoding='utf-8')
    if meta_re.search(text):
        new_text = meta_re.sub(rf"\1\2{version}\4", text)
        html.write_text(new_text, encoding='utf-8')
        print(f'Updated {html.name}')
    else:
        # try to insert after viewport meta
        vp_re = re.compile(r'(<meta\s+name=["\']viewport["\'].*?>)', re.IGNORECASE)
        m = vp_re.search(text)
        insert_tag = f"\n    <meta name=\"policies-version\" content=\"{version}\">"
        if m:
            idx = m.end()
            new_text = text[:idx] + insert_tag + text[idx:]
            html.write_text(new_text, encoding='utf-8')
            print(f'Inserted policies-version into {html.name}')
        else:
            print(f'No viewport meta in {html.name}; skipping')

print('Done.')
