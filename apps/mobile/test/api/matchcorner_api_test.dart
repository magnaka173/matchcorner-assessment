import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:matchcorner_mobile/api/api_exception.dart';
import 'package:matchcorner_mobile/api/matchcorner_api.dart';

import '../fixtures/decode_fixtures.dart';

void main() {
  test('POSTs the booking code to the MatchCorner decode path', () async {
    late http.Request captured;

    final api = MatchCornerApi(
      baseUrl: 'http://api.test:4000/',
      httpClient: MockClient((request) async {
        captured = request;
        return http.Response(
          jsonEncode(validDecodeJson),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    final decoded = await api.decodeSlip('  BW69DC9F6B  ');

    expect(captured.method, 'POST');
    expect(captured.url.toString(), 'http://api.test:4000/api/v1/slips/decode');
    expect(captured.headers['content-type'], contains('application/json'));
    expect(jsonDecode(captured.body), {'bookingCode': 'BW69DC9F6B'});
    expect(decoded.slip.bookingCode, 'BW69DC9F6B');
    expect(decoded.slip.selections, hasLength(2));
  });

  test('maps a structured API error onto ApiException', () async {
    final api = MatchCornerApi(
      baseUrl: 'http://api.test',
      httpClient: MockClient((request) async {
        return http.Response(
          jsonEncode({
            'error': {
              'code': 'BOOKING_CODE_NOT_FOUND',
              'message': 'Booking code was not found or is no longer valid.',
            },
          }),
          404,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    try {
      await api.decodeSlip('BWDEADCODE');
      fail('expected ApiException');
    } on ApiException catch (error) {
      expect(error.code, 'BOOKING_CODE_NOT_FOUND');
      expect(error.status, 404);
      expect(error.message, contains('not found'));
    }
  });

  test('maps UPSTREAM_TIMEOUT from a structured 504 body', () async {
    final api = MatchCornerApi(
      baseUrl: 'http://api.test',
      httpClient: MockClient((request) async {
        return http.Response(
          jsonEncode({
            'error': {
              'code': 'UPSTREAM_TIMEOUT',
              'message': 'The betting operator did not respond in time.',
            },
          }),
          504,
        );
      }),
    );

    expect(
      () => api.decodeSlip('BW69DC9F6B'),
      throwsA(
        isA<ApiException>()
            .having((e) => e.code, 'code', 'UPSTREAM_TIMEOUT')
            .having((e) => e.status, 'status', 504),
      ),
    );
  });

  test('fails safely on a malformed success payload', () async {
    final api = MatchCornerApi(
      baseUrl: 'http://api.test',
      httpClient: MockClient((request) async {
        return http.Response(
          '{"not":"a-slip"}',
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    expect(
      () => api.decodeSlip('BW69DC9F6B'),
      throwsA(
        isA<ApiException>().having((e) => e.code, 'code', 'INVALID_RESPONSE'),
      ),
    );
  });

  test('fails safely on non-JSON error bodies', () async {
    final api = MatchCornerApi(
      baseUrl: 'http://api.test',
      httpClient: MockClient((request) async {
        return http.Response('<html>upstream</html>', 502);
      }),
    );

    expect(
      () => api.decodeSlip('BW69DC9F6B'),
      throwsA(
        isA<ApiException>().having((e) => e.code, 'code', 'INVALID_RESPONSE'),
      ),
    );
  });
}
