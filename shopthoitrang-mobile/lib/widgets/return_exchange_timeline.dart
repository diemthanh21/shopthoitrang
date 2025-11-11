import 'package:flutter/material.dart';

class ReturnExchangeTimeline extends StatelessWidget {
  final List<dynamic> logs;
  const ReturnExchangeTimeline({super.key, required this.logs});

  IconData _icon(String action) {
    switch (action) {
      case 'CREATE':
        return Icons.add_circle_outline;
      case 'ACCEPT':
        return Icons.verified_outlined;
      case 'REJECT':
        return Icons.block_outlined;
      case 'MARK_RECEIVED':
      case 'MARK_RECEIVED_OLD':
        return Icons.inventory_2_outlined;
      case 'MARK_INVALID':
        return Icons.highlight_off_outlined;
      case 'MARK_VALID':
        return Icons.assignment_turned_in_outlined;
      case 'CALC_REFUND':
        return Icons.calculate_outlined;
      case 'REFUND':
        return Icons.payments_outlined;
      case 'CALC_DIFF':
        return Icons.price_change_outlined;
      case 'REQUEST_EXTRA_PAYMENT':
        return Icons.request_quote_outlined;
      case 'CONFIRM_EXTRA_PAID':
        return Icons.check_circle_outline;
      case 'REFUND_DIFFERENCE':
        return Icons.money_off_csred_outlined;
      case 'CREATE_NEW_ORDER':
        return Icons.library_add_outlined;
      case 'COMPLETE':
        return Icons.flag_outlined;
      default:
        return Icons.timeline;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (logs.isEmpty) return const Text('Chưa có lịch sử.');
    return Column(
      children: logs.map((e) {
        final m = e as Map<String, dynamic>;
        final action = (m['action'] ?? m['hanh_dong'] ?? '').toString();
        final note = (m['note'] ?? m['ghichu'] ?? '').toString();
        final time = (m['created_at'] ?? m['thoigian'] ?? '').toString();
        return ListTile(
          leading: Icon(_icon(action)),
          title: Text(action),
          subtitle: Text(note),
          trailing: Text(time,
              style: const TextStyle(fontSize: 12, color: Colors.grey)),
        );
      }).toList(),
    );
  }
}
