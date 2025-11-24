from pathlib import Path
text = Path('shopthoitrang-server/src/services/donhang.service.js').read_text(encoding='utf-8')
marker = "// Create the order first"
idx = text.find(marker)
if idx == -1:
    raise SystemExit('marker not found')
insert_block = "    const pointsToSpend = Math.max(0, Number(body.diem_su_dung ?? body.pointsUsed ?? 0));\r\n    if (pointsToSpend > 0) {\r\n      await membershipService.ensurePointBalance(body.makhachhang, pointsToSpend);\r\n    }\r\n\r\n"
text = text[:idx] + insert_block + text[idx:]
Path('shopthoitrang-server/src/services/donhang.service.js').write_text(text, encoding='utf-8')
