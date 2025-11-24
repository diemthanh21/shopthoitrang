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
    // Make badge responsive: limit width to a fraction of screen width
    final screenWidth = MediaQuery.of(context).size.width;
    final maxWidth = screenWidth * 0.5; // up to 50% of available width
    final effectiveMax = maxWidth < 220 ? maxWidth : 220.0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      constraints: BoxConstraints(minWidth: 0, maxWidth: effectiveMax),
      decoration: BoxDecoration(
        color: c,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        softWrap: false,
        style: TextStyle(color: tc, fontWeight: FontWeight.w600, fontSize: 11),
      ),
    );
  }
}
