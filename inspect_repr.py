from pathlib import Path
text = Path('shopthoitrang-server/src/services/donhang.service.js').read_text(encoding='utf-8')
start = text.find('// Create the order first')
print(repr(text[start-10:start+80]))
