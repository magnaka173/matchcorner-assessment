import '../models/api_error.dart';

/// Application exception raised by [MatchCornerApi].
class ApiException implements Exception {
  const ApiException(this.error);

  final ApiError error;

  String get code => error.code;
  String get message => error.message;
  int get status => error.status;

  factory ApiException.network(String message) {
    return ApiException(
      ApiError(code: 'NETWORK_ERROR', message: message, status: 0),
    );
  }

  factory ApiException.invalidResponse([int status = 0]) {
    return ApiException(
      ApiError(
        code: 'INVALID_RESPONSE',
        message: 'The API returned an unexpected response.',
        status: status,
      ),
    );
  }

  /// Short reviewer-facing title for known MatchCorner error codes.
  String get title {
    switch (code) {
      case 'INVALID_REQUEST':
        return 'Invalid request';
      case 'BOOKING_CODE_NOT_FOUND':
        return 'Booking code not found';
      case 'UPSTREAM_TIMEOUT':
        return 'The betting operator timed out';
      case 'UPSTREAM_UNAVAILABLE':
        return 'The betting operator is unavailable';
      case 'UPSTREAM_CONTRACT_MISMATCH':
        return 'Unexpected operator response';
      case 'NETWORK_ERROR':
        return 'API unreachable';
      case 'INVALID_RESPONSE':
        return 'Unexpected API response';
      case 'INTERNAL_ERROR':
        return 'Request failed';
      default:
        return 'Request failed';
    }
  }

  @override
  String toString() => 'ApiException($code, status: $status)';
}
