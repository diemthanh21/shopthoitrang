from pathlib import Path
path = Path('shopthoitrang-web/src/pages/DoiHangPage.jsx')
text = path.read_text(encoding='utf-8')
replacements = [
("return [button('Da nh?n h?ng cu', () => run(() => exService.markReceivedOld(id)), 'neutral')];", "return [button('Da nh?n h?ng cu', () => run(() => exService.markReceivedOld(id), 'DA_NHAN_HANG_CU_CHO_KIEM_TRA'), 'neutral')];"),
("button('H?p l?', () => run(() => exService.markValid(id)), 'success')", "button('H?p l?', () => run(() => exService.markValid(id), 'CHO_TAO_DON_MOI'), 'success')"),
("button('Kh?ng h?p l?', () => run(() => exService.markInvalid(id, 'R?ch / da s? d?ng')), 'danger')", "button('Kh?ng h?p l?', () => run(() => exService.markInvalid(id, 'R?ch / da s? d?ng'), 'KHONG_HOP_LE'), 'danger')"),
("return [button('T?o don m?i', () => run(() => exService.createNewOrder(id)), 'primary')];", "return [button('T?o don m?i', () => run(() => exService.createNewOrder(id), 'DANG_GIAO_HANG_MOI'), 'primary')];"),
("button('Ho?n t?t', () => run(() => exService.complete(id)), 'success')", "button('Ho?n t?t', () => run(() => exService.complete(id), 'DA_DOI_XONG'), 'success')"),
("button('D?ng b? ho?n t?t', () => run(() => exService.syncComplete(id)), 'indigo')", "button('D?ng b? ho?n t?t', () => run(() => exService.syncComplete(id), 'DA_DOI_XONG'), 'indigo')"),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f'pattern not found: {old}')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
