import 'package:flutter/material.dart';

import '../models/betslip.dart';
import '../theme.dart';
import 'fingerprint_view.dart';
import 'selection_card.dart';
import 'status_badge.dart';

class BetslipView extends StatelessWidget {
  const BetslipView({
    super.key,
    required this.slip,
    required this.fingerprint,
  });

  final Betslip slip;
  final String fingerprint;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          key: const Key('slipSummary'),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    StatusBadge(label: slip.betType),
                    if (slip.isBuildABet) const StatusBadge(label: 'Build-a-bet'),
                  ],
                ),
                const SizedBox(height: 16),
                _SummaryRow(label: 'Booking code', value: slip.bookingCode, mono: true),
                _SummaryRow(label: 'Operator', value: slip.operator),
                _SummaryRow(label: 'Bet type', value: slip.betType),
                _SummaryRow(
                  key: const Key('selectionCount'),
                  label: 'Selections',
                  value: '${slip.selections.length}',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        FingerprintView(fingerprint: fingerprint),
        const SizedBox(height: 16),
        for (var i = 0; i < slip.selections.length; i++) ...[
          SelectionCard(selection: slip.selections[i], index: i),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    super.key,
    required this.label,
    required this.value,
    this.mono = false,
  });

  final String label;
  final String value;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: MatchCornerTheme.muted,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontFamily: mono ? 'monospace' : null,
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}
