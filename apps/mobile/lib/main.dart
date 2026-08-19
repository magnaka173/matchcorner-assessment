import 'package:flutter/material.dart';

import 'api/matchcorner_api.dart';
import 'screens/decode_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MatchCornerApp(api: MatchCornerApi()));
}

class MatchCornerApp extends StatelessWidget {
  const MatchCornerApp({super.key, required this.api});

  final MatchCornerApi api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MatchCorner',
      debugShowCheckedModeBanner: false,
      theme: MatchCornerTheme.light(),
      home: DecodeScreen(api: api),
    );
  }
}
