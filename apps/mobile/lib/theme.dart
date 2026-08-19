import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Navy/neutral palette aligned with the web workspace, using Material 3.
class MatchCornerTheme {
  MatchCornerTheme._();

  static const Color navy = Color(0xFF1F4E79);
  static const Color navyDark = Color(0xFF163A5C);
  static const Color background = Color(0xFFF3F5F8);
  static const Color text = Color(0xFF1B2433);
  static const Color muted = Color(0xFF5C6B80);
  static const Color border = Color(0xFFD5DDE8);
  static const Color success = Color(0xFF157347);
  static const Color successFill = Color(0xFFE8F6EE);
  static const Color danger = Color(0xFFB42318);
  static const Color dangerFill = Color(0xFFFDECEA);
  static const Color warning = Color(0xFF9A6700);
  static const Color warningFill = Color(0xFFFFF6DB);

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: navy,
      brightness: Brightness.light,
      primary: navy,
      onPrimary: Colors.white,
      surface: Colors.white,
      error: danger,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      appBarTheme: const AppBarTheme(
        backgroundColor: navy,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        hintStyle: const TextStyle(color: muted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: navy, width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: navy,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
