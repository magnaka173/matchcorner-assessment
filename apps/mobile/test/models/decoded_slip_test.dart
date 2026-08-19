import 'package:flutter_test/flutter_test.dart';
import 'package:matchcorner_mobile/models/decoded_slip.dart';
import 'package:matchcorner_mobile/models/selection.dart';

import '../fixtures/decode_fixtures.dart';

void main() {
  test('parses a valid canonical Decode response', () {
    final decoded = DecodedSlip.fromJson(Map<String, dynamic>.from(validDecodeJson));

    expect(decoded.fingerprint, startsWith('94c3c1d4'));
    expect(decoded.slip.operator, 'betway-ng');
    expect(decoded.slip.bookingCode, 'BW69DC9F6B');
    expect(decoded.slip.betType, 'multi');
    expect(decoded.slip.isBuildABet, isFalse);
    expect(decoded.slip.selections, hasLength(2));

    final first = decoded.slip.selections.first;
    expect(first.eventId, '68096464');
    expect(first.eventName, 'Connecticut Sun vs. Los Angeles Sparks');
    expect(first.marketId, '68096464223hcp=1.5~');
    expect(first.operatorMarketId, '223');
    expect(first.selectionId, '68096464223hcp=1.5~1715');
    expect(first.odds, 1.87);
    expect(first.handicap, -1.5);
    expect(first.active, isTrue);
  });

  test('parses optional selection fields as null when omitted', () {
    final selection = Selection.fromJson(Map<String, dynamic>.from(sparseSelectionJson));

    expect(selection.eventName, isEmpty);
    expect(selection.sport, isEmpty);
    expect(selection.region, isNull);
    expect(selection.league, isNull);
    expect(selection.startTime, isNull);
    expect(selection.operatorMarketId, isNull);
    expect(selection.marketName, isEmpty);
    expect(selection.selectionName, isEmpty);
    expect(selection.handicap, isNull);
    expect(selection.active, isFalse);
    expect(selection.odds, 1.5);
  });

  test('treats explicit JSON nulls as absent optional fields', () {
    final selection = Selection.fromJson({
      'eventId': '1',
      'eventName': null,
      'sport': null,
      'region': null,
      'league': null,
      'startTime': null,
      'marketId': 'm',
      'operatorMarketId': null,
      'marketName': null,
      'selectionId': 's',
      'selectionName': null,
      'handicap': null,
      'odds': 2,
      'active': true,
    });

    expect(selection.region, isNull);
    expect(selection.league, isNull);
    expect(selection.startTime, isNull);
    expect(selection.operatorMarketId, isNull);
    expect(selection.handicap, isNull);
    expect(selection.eventName, isEmpty);
  });
}
