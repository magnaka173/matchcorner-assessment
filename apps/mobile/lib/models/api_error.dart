/// Normalized MatchCorner API error shown in the UI.
///
/// This is the client-facing `{ error: { code, message } }` envelope plus the
/// HTTP status. It never includes stack traces, cookies, or raw operator bodies.
class ApiError {
  const ApiError({
    required this.code,
    required this.message,
    required this.status,
  });

  final String code;
  final String message;
  final int status;

  factory ApiError.fromResponse({
    required int status,
    required Object? payload,
  }) {
    final envelope = payload is Map<String, dynamic> ? payload : null;
    final error = envelope?['error'];
    final record = error is Map<String, dynamic> ? error : null;
    final code = record?['code'];
    final message = record?['message'];

    return ApiError(
      code: code is String && code.isNotEmpty ? code : 'INTERNAL_ERROR',
      message: message is String && message.isNotEmpty
          ? message
          : 'The MatchCorner API returned an error.',
      status: status,
    );
  }
}
