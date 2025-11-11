import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shopthoitrang_mobile/screens/new_return_screen.dart';

void main() {
  Widget _wrap(Widget child) => MaterialApp(home: child);

  final eligibleDate = DateTime.now().subtract(const Duration(days: 3));
  final ineligibleDate = DateTime.now().subtract(const Duration(days: 10));

  final items = <Map<String, dynamic>>[
    {'machitietsanpham': 101, 'tensp': 'Áo sơ mi', 'soluong': 2},
    {'machitietsanpham': 202, 'tensp': 'Quần jeans', 'soluong': 1},
  ];

  testWidgets(
      'Return submit disabled initially and enabled after valid inputs (eligible window)',
      (tester) async {
    await tester.pumpWidget(_wrap(NewReturnScreen(
      maDonHang: 1,
      maKhachHang: 10,
      ngayGiao: eligibleDate,
      items: items,
    )));

    // Initially: disabled
    ElevatedButton submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNull);

    // Select product dropdown
    await tester
        .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Áo sơ mi').last);
    await tester.pumpAndSettle();

    // Select reason (non-"Khác")
    await tester.tap(find.byType(DropdownButtonFormField<String>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sai kích thước').last);
    await tester.pumpAndSettle();

    // Now should be enabled
    submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNotNull);

    // If choose "Khác" without description -> disabled
    await tester.tap(find.byType(DropdownButtonFormField<String>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Khác').last);
    await tester.pumpAndSettle();
    submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNull);

    // Fill description -> enabled
    await tester.enterText(
        find.byType(TextFormField).first, 'Mô tả lý do khác');
    await tester.pumpAndSettle();
    submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNotNull);
  });

  testWidgets('Return submit stays disabled when out of 7-day window',
      (tester) async {
    await tester.pumpWidget(_wrap(NewReturnScreen(
      maDonHang: 1,
      maKhachHang: 10,
      ngayGiao: ineligibleDate,
      items: items,
    )));

    // Fill valid selections
    await tester
        .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Áo sơ mi').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButtonFormField<String>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sai kích thước').last);
    await tester.pumpAndSettle();

    final submitBtn = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
    expect(submitBtn.onPressed, isNull);
    expect(find.text('Đơn đã quá hạn 7 ngày kể từ ngày giao'), findsOneWidget);
  });
}
