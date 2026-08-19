/// Compile-time MatchCorner API configuration.
///
/// Pass a reachable origin with:
/// `--dart-define=API_BASE_URL=http://10.0.2.2:4000`
///
/// When the define is omitted, [apiBaseUrl] falls back to localhost so iOS
/// Simulator and `flutter run` on a host machine work out of the box. Android
/// emulators cannot reach the host via localhost — see apps/mobile/README.md.
class AppConfig {
  AppConfig._();

  static const String _fromEnvironment = String.fromEnvironment('API_BASE_URL');

  /// Development fallback used only when `API_BASE_URL` is not provided.
  static const String developmentFallback = 'http://localhost:4000';

  static String get apiBaseUrl {
    final configured = _fromEnvironment.trim();
    final raw = configured.isEmpty ? developmentFallback : configured;
    return raw.replaceAll(RegExp(r'/+$'), '');
  }

  static bool get hasExplicitApiBaseUrl => _fromEnvironment.trim().isNotEmpty;
}
