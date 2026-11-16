#!/bin/sh
# Rebuilds ../../js/data.js: every answer and syntax colour on the site, computed by the real Linewise engine.
set -e
cd "$(dirname "$0")"
swift build -c release -q
python3 - <<'PY' | .build/release/eval | { printf 'window.LW = '; cat; printf ';\n'; } > ../../js/data.js
import json, re
s = json.load(open("sheets.json"))
src = open("../../../Linewise/Sources/Linewise/GuideView.swift").read()
s["guide"] = re.search(r'let guideText = """\n(.*?)\n"""', src, re.S).group(1)
print(json.dumps(s))
PY

echo "wrote js/data.js"
