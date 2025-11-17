const Duration _vietnamOffset = Duration(hours: 7);
final RegExp _tzRegex = RegExp(r'(Z|[+-]\d{2}:?\d{2})$');

DateTime _asLocal(DateTime dt) => DateTime(
      dt.year,
      dt.month,
      dt.day,
      dt.hour,
      dt.minute,
      dt.second,
      dt.millisecond,
      dt.microsecond,
    );

DateTime vietnamNow() => _asLocal(DateTime.now().toUtc().add(_vietnamOffset));

DateTime? parseVietnamDateTime(dynamic value) {
  if (value == null) return null;

  if (value is DateTime) {
    final adjusted = value.isUtc ? value.toUtc().add(_vietnamOffset) : value;
    return _asLocal(adjusted);
  }

  if (value is num) {
    final dt = DateTime.fromMillisecondsSinceEpoch(
      value.toInt(),
      isUtc: true,
    ).add(_vietnamOffset);
    return _asLocal(dt);
  }

  final text = value.toString().trim();
  if (text.isEmpty) return null;

  final parsed = DateTime.tryParse(text);
  if (parsed == null) return null;

  if (_tzRegex.hasMatch(text) || parsed.isUtc) {
    final adjusted = parsed.toUtc().add(_vietnamOffset);
    return _asLocal(adjusted);
  }

  return _asLocal(parsed);
}
