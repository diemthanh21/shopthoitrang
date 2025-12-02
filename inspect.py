from pathlib import Path
text = Path('shopthoitrang-web/src/pages/DoiHangPage.jsx').read_text(encoding='utf-8')
start = text.find('markReceivedOld')
if start == -1:
    raise SystemExit('not found')
snippet = text[start-120:start+120]
Path('snippet.txt').write_text(snippet, encoding='utf-8')
