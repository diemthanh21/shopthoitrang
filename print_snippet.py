from pathlib import Path
text = Path('shopthoitrang-server/src/services/donhang.service.js').read_text(encoding='utf-8', errors='ignore')
start = text.find('async create')
Path('snippet.txt').write_text(text[start:start+800], encoding='utf-8')
