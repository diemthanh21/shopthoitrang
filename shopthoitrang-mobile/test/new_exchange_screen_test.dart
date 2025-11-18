import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shopthoitrang_mobile/screens/new_exchange_screen.dart';

void main() {
  Widget _wrap(Widget child) => MaterialApp(home: child);

  final eligibleDate = DateTime.now().subtract(const Duration(days: 2));
  final items = <Map<String, dynamic>>[
    {'machitietsanphamcu': 501, 'tensp': 'Áo khoác', 'soluong': 3},
  ];

  testWidgets('Exchange submit enabled after required fields entered',
      (tester) async {
    await tester.pumpWidget(_wrap(NewExchangeScreen(
      maDonHang: 77,
      maKhachHang: 999,
      ngayGiao: eligibleDate,
      items: items,
    )));

    // Initially disabled
    ElevatedButton submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNull);

    // Select old product
    await tester
        .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Áo khoác').last);
    await tester.pumpAndSettle();

    // Enter new variant id
    await tester.enterText(find.byType(TextFormField).first, '777');
    await tester.pumpAndSettle();

    // Select reason
    await tester.tap(find.byType(DropdownButtonFormField<String>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Muốn đổi mẫu/size').last);
    await tester.pumpAndSettle();

    // Should be enabled now
    submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNotNull);

    // Change reason to "Khác" without description -> disabled
    await tester.tap(find.byType(DropdownButtonFormField<String>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Khác').last);
    await tester.pumpAndSettle();
    submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNull);

    // Fill description -> enabled
    // The first TextFormField is variant id; second is reasonOther (after choosing Khác)
    await tester.enterText(
        find.byType(TextFormField).at(1), 'Muốn đổi vì chất liệu khác');
    await tester.pumpAndSettle();
    submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNotNull);
  });
}
