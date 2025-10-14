class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    // Nếu chạy bằng Android Studio emulator
    defaultValue: 'http://10.0.2.2:3000/api',
  );
}
