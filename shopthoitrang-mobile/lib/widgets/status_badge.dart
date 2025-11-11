import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String code;
  final Map<String, String> labels;
  final Color Function(String) colorOf;
  const StatusBadge(
      {super.key,
      required this.code,
      required this.labels,
      required this.colorOf});

  @override
  Widget build(BuildContext context) {
    final label = labels[code] ?? code;
    final c = colorOf(code).withOpacity(.12);
    final tc = colorOf(code);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style:
              TextStyle(color: tc, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}
