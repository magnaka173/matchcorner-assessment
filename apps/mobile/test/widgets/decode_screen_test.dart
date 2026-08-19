import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:matchcorner_mobile/api/matchcorner_api.dart';
import 'package:matchcorner_mobile/main.dart';

import '../fixtures/decode_fixtures.dart';

void main() {
  testWidgets('renders the booking-code field and decode action', (tester) async {
    await tester.pumpWidget(
      MatchCornerApp(
        api: MatchCornerApi(
          baseUrl: 'http://api.test',
          httpClient: MockClient((_) async => http.Response('{}', 500)),
        ),
      ),
    );

    expect(find.text('MatchCorner'), findsWidgets);
    expect(find.text('Betway Nigeria'), findsOneWidget);
    expect(find.text('Technical Assessment'), findsOneWidget);
    expect(find.byKey(const Key('bookingCodeField')), findsOneWidget);
    expect(find.text('Decode slip'), findsOneWidget);
  });

  testWidgets('shows a loading state while Decode is in flight', (tester) async {
    final completer = Completer<http.Response>();

    await tester.pumpWidget(
      MatchCornerApp(
        api: MatchCornerApi(
          baseUrl: 'http://api.test',
          httpClient: MockClient((_) => completer.future),
        ),
      ),
    );

    await tester.enterText(find.byKey(const Key('bookingCodeField')), 'BW69DC9F6B');
    await tester.pump();
    await tester.tap(find.byKey(const Key('decodeButton')));
    await tester.pump();

    expect(find.byKey(const Key('loadingIndicator')), findsOneWidget);
    expect(find.byKey(const Key('decodeProgress')), findsOneWidget);

    completer.complete(
      http.Response(jsonEncode(validDecodeJson), 200, headers: {
        'content-type': 'application/json',
      }),
    );
    await tester.pumpAndSettle();
  });

  testWidgets('renders selection count, event name and odds on success', (tester) async {
    await tester.pumpWidget(
      MatchCornerApp(
        api: MatchCornerApi(
          baseUrl: 'http://api.test',
          httpClient: MockClient((_) async {
            return http.Response(jsonEncode(validDecodeJson), 200, headers: {
              'content-type': 'application/json',
            });
          }),
        ),
      ),
    );

    await tester.enterText(find.byKey(const Key('bookingCodeField')), 'BW69DC9F6B');
    await tester.pump();
    await tester.tap(find.byKey(const Key('decodeButton')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('slipSummary')), findsOneWidget);
    expect(find.text('2'), findsWidgets);
    expect(find.textContaining('Connecticut Sun vs. Los Angeles Sparks'), findsOneWidget);
    expect(find.text('1.87'), findsOneWidget);
    expect(find.text('2.05'), findsOneWidget);
    expect(
      find.text('94c3c1d45329763971d28d59ca4dc2e3194c132ada692a639fb907fad395b56c'),
      findsOneWidget,
    );
  });

  testWidgets('renders stable identifier values when expanded', (tester) async {
    tester.view.physicalSize = const Size(800, 1600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.binding.setSurfaceSize(const Size(800, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MatchCornerApp(
        api: MatchCornerApi(
          baseUrl: 'http://api.test',
          httpClient: MockClient((_) async {
            return http.Response(jsonEncode(validDecodeJson), 200, headers: {
              'content-type': 'application/json',
            });
          }),
        ),
      ),
    );

    await tester.enterText(find.byKey(const Key('bookingCodeField')), 'BW69DC9F6B');
    await tester.pump();
    await tester.tap(find.byKey(const Key('decodeButton')));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Stable identifiers').first,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Stable identifiers').first);
    await tester.pumpAndSettle();

    expect(find.text('68096464'), findsWidgets);
    expect(find.text('68096464223hcp=1.5~'), findsOneWidget);
    expect(find.text('68096464223hcp=1.5~1715'), findsOneWidget);
  });

  testWidgets('renders an error panel for a structured API error', (tester) async {
    await tester.pumpWidget(
      MatchCornerApp(
        api: MatchCornerApi(
          baseUrl: 'http://api.test',
          httpClient: MockClient((_) async {
            return http.Response(
              jsonEncode({
                'error': {
                  'code': 'UPSTREAM_UNAVAILABLE',
                  'message': 'The betting operator is currently unavailable.',
                },
              }),
              502,
            );
          }),
        ),
      ),
    );

    await tester.enterText(find.byKey(const Key('bookingCodeField')), 'BW69DC9F6B');
    await tester.pump();
    await tester.tap(find.byKey(const Key('decodeButton')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('errorPanel')), findsOneWidget);
    expect(find.text('The betting operator is unavailable'), findsOneWidget);
    expect(find.text('The betting operator is currently unavailable.'), findsOneWidget);
    expect(find.text('BW69DC9F6B'), findsOneWidget);
  });
}
