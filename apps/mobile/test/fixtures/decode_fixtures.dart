/// Canonical MatchCorner Decode payloads for tests.
///
/// These maps match `POST /api/v1/slips/decode` JSON, not Betway raw bodies.
const validDecodeJson = {
  'slip': {
    'operator': 'betway-ng',
    'bookingCode': 'BW69DC9F6B',
    'betType': 'multi',
    'isBuildABet': false,
    'selections': [
      {
        'eventId': '68096464',
        'eventName': 'Connecticut Sun vs. Los Angeles Sparks',
        'sport': 'Basketball',
        'region': 'USA',
        'league': 'WNBA',
        'startTime': '2026-08-18T23:00:00.000Z',
        'marketId': '68096464223hcp=1.5~',
        'marketName': 'Handicap',
        'operatorMarketId': '223',
        'selectionId': '68096464223hcp=1.5~1715',
        'selectionName': 'Los Angeles Sparks (-1.5)',
        'handicap': -1.5,
        'odds': 1.87,
        'active': true,
      },
      {
        'eventId': '68096586',
        'eventName': 'Toronto Tempo vs. Indiana Fever',
        'sport': 'Basketball',
        'region': 'USA',
        'league': 'WNBA',
        'startTime': '2026-08-18T23:00:00.000Z',
        'marketId': '68096586223hcp=10.5~',
        'marketName': 'Handicap',
        'operatorMarketId': '223',
        'selectionId': '68096586223hcp=10.5~1715',
        'selectionName': 'Indiana Fever (-10.5)',
        'handicap': -10.5,
        'odds': 2.05,
        'active': true,
      },
    ],
  },
  'fingerprint': '94c3c1d45329763971d28d59ca4dc2e3194c132ada692a639fb907fad395b56c',
};

/// Required identity/odds only — optional presentation fields are omitted.
const sparseSelectionJson = {
  'eventId': '42',
  'marketId': 'market-1',
  'selectionId': 'sel-1',
  'odds': 1.5,
  'active': false,
};
