class SupabaseConfig {
  // Project ref Supabase (đồng bộ với web hiện có)
  static const String projectRef = 'ergnrfsqzghjseovmzkg';
  static const String url = 'https://$projectRef.supabase.co';

  // Fallback anon key (DEV ONLY). Đừng commit key thật vào repo production.
  // Ở môi trường phát triển, bạn có thể dùng trực tiếp anon public key:
  static const String _fallbackAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ25yZnNxemdoanNlb3ZtemtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTkzMDgsImV4cCI6MjA3NTEzNTMwOH0.vziMc7JLJEzGMqTxpDjrDfMLfNPGScB_sDx6hq6mbew';

  // Lấy anon key từ --dart-define nếu có, nếu không dùng fallback (có thể để rỗng).
  static String get anonKey => const String.fromEnvironment(
        'SUPABASE_ANON_KEY',
        defaultValue: _fallbackAnonKey,
      ).trim();

  static bool get isConfigured => anonKey.isNotEmpty && !anonKey.startsWith('<PUT_');

  /// Quick validation for anon key format (JWT-like): three dot-separated parts
  static bool isValidAnonKey() {
    final k = anonKey;
    if (k.isEmpty) return false;
    // Basic JWT structure check
    final parts = k.split('.');
    if (parts.length != 3) return false;
    // Common JWTs from Supabase start with 'eyJ'
    if (!k.startsWith('eyJ')) return false;
    // reasonable length
    if (k.length < 40) return false;
    return true;
  }

  /// Masked key for logging (do not leak full key in logs)
  static String maskedKey() {
    final k = anonKey;
    if (k.length <= 10) return k;
    return '${k.substring(0, 6)}...${k.substring(k.length - 4)}';
  }
}
