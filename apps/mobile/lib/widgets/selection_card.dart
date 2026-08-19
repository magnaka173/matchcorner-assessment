import 'package:flutter/material.dart';

import '../models/selection.dart';
import '../theme.dart';
import 'status_badge.dart';

class SelectionCard extends StatelessWidget {
  const SelectionCard({
    super.key,
    required this.selection,
    required this.index,
  });

  final Selection selection;
  final int index;

  @override
  Widget build(BuildContext context) {
    final regionLeague = [
      if (selection.region != null && selection.region!.isNotEmpty) selection.region,
      if (selection.league != null && selection.league!.isNotEmpty) selection.league,
    ].join(' · ');

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: '#${index + 1}  ',
                          style: const TextStyle(
                            color: MatchCornerTheme.muted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        TextSpan(
                          text: displayOrDash(selection.eventName),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                StatusBadge(
                  label: selection.active ? 'Active' : 'Unavailable',
                  tone: selection.active
                      ? StatusBadgeTone.success
                      : StatusBadgeTone.warning,
                ),
              ],
            ),
            const SizedBox(height: 12),
            _MetaGrid(
              items: [
                _MetaItem(label: 'Market', value: displayOrDash(selection.marketName)),
                _MetaItem(label: 'Selection', value: displayOrDash(selection.selectionName)),
                _MetaItem(label: 'Odds', value: formatOdds(selection.odds)),
                _MetaItem(label: 'Sport', value: displayOrDash(selection.sport)),
                if (regionLeague.isNotEmpty)
                  _MetaItem(label: 'Competition', value: regionLeague),
                if (selection.startTime != null && selection.startTime!.isNotEmpty)
                  _MetaItem(label: 'Start', value: formatStartTime(selection.startTime)),
              ],
            ),
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                childrenPadding: const EdgeInsets.only(bottom: 8),
                title: const Text(
                  'Stable identifiers',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                children: [
                  _IdRow(label: 'eventId', value: selection.eventId),
                  _IdRow(label: 'marketId', value: selection.marketId),
                  _IdRow(
                    label: 'operatorMarketId',
                    value: displayOrDash(selection.operatorMarketId),
                  ),
                  _IdRow(label: 'selectionId', value: selection.selectionId),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaItem {
  const _MetaItem({required this.label, required this.value});

  final String label;
  final String value;
}

class _MetaGrid extends StatelessWidget {
  const _MetaGrid({required this.items});

  final List<_MetaItem> items;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 16,
      runSpacing: 10,
      children: [
        for (final item in items)
          SizedBox(
            width: 140,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.label,
                  style: const TextStyle(
                    color: MatchCornerTheme.muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _IdRow extends StatelessWidget {
  const _IdRow({required this.label, required this.value});

  final String label;
  final String value;

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
          CopyableValue(value: value),
        ],
      ),
    );
  }
}
