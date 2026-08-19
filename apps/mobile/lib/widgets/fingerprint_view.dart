import 'package:flutter/material.dart';

import '../theme.dart';
import 'status_badge.dart';

class FingerprintView extends StatelessWidget {
  const FingerprintView({super.key, required this.fingerprint});

  final String fingerprint;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Fingerprint',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: MatchCornerTheme.muted,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 6),
            CopyableValue(value: fingerprint),
          ],
        ),
      ),
    );
  }
}
