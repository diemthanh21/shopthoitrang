from pathlib import Path
path = Path('shopthoitrang-server/src/services/donhang.service.js')
text = path.read_text(encoding='utf-8')
marker = "    if (giftConsumptions.length) {"
idx = text.find(marker)
if idx == -1:
    raise SystemExit('gift marker not found')
insert = "    if (pointsToSpend > 0 && order?.madonhang) {\r\n      await membershipService.spendPoints(order.makhachhang, pointsToSpend, order.madonhang);\r\n      order.pointsRedeemed = pointsToSpend;\r\n    }\r\n\r\n"
text = text[:idx] + insert + text[idx:]
path.write_text(text, encoding='utf-8')
