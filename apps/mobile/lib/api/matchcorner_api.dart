import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/api_error.dart';
import '../models/decoded_slip.dart';
import 'api_exception.dart';

/// HTTP client for the MatchCorner backend. Never talks to Betway directly.
class MatchCornerApi {
  MatchCornerApi({
    http.Client? httpClient,
    String? baseUrl,
    Duration timeout = const Duration(seconds: 20),
  })  : _client = httpClient ?? http.Client(),
        _ownsClient = httpClient == null,
        _baseUrl = _normalizeBaseUrl(baseUrl ?? AppConfig.apiBaseUrl),
        _timeout = timeout;

  final http.Client _client;
  final bool _ownsClient;
  final String _baseUrl;
  final Duration _timeout;

  static const decodePath = '/api/v1/slips/decode';

  Uri get decodeUri => Uri.parse('$_baseUrl$decodePath');

  String get baseUrl => _baseUrl;

  static String _normalizeBaseUrl(String value) {
    return value.trim().replaceAll(RegExp(r'/+$'), '');
  }

  /// POST /api/v1/slips/decode with `{ "bookingCode": "BW..." }`.
  Future<DecodedSlip> decodeSlip(String bookingCode) async {
    final http.Response response;
    try {
      response = await _client
          .post(
            decodeUri,
            headers: const {
              'accept': 'application/json',
              'content-type': 'application/json',
            },
            body: jsonEncode({'bookingCode': bookingCode.trim()}),
          )
          .timeout(_timeout);
    } on TimeoutException {
      throw ApiException.network(
        'The MatchCorner API did not respond in time. Confirm API_BASE_URL is reachable from this device.',
      );
    } on http.ClientException {
      throw ApiException.network(
        'Could not reach the MatchCorner API. Confirm the API is running and API_BASE_URL is reachable from this device.',
      );
    } on Object {
      throw ApiException.network(
        'Could not reach the MatchCorner API. Confirm the API is running and API_BASE_URL is reachable from this device.',
      );
    }

    return _parseDecodeResponse(response);
  }

  DecodedSlip _parseDecodeResponse(http.Response response) {
    final Object? payload = _decodeJson(response.body, response.statusCode);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        ApiError.fromResponse(status: response.statusCode, payload: payload),
      );
    }

    if (payload is! Map) {
      throw ApiException.invalidResponse(response.statusCode);
    }

    try {
      return DecodedSlip.fromJson(Map<String, dynamic>.from(payload));
    } on FormatException {
      throw ApiException.invalidResponse(response.statusCode);
    }
  }

  Object? _decodeJson(String body, int status) {
    if (body.trim().isEmpty) {
      if (status >= 200 && status < 300) {
        throw ApiException.invalidResponse(status);
      }
      return null;
    }

    try {
      return jsonDecode(body);
    } on FormatException {
      throw ApiException.invalidResponse(status);
    }
  }

  void close() {
    if (_ownsClient) {
      _client.close();
    }
  }
}
