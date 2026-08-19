import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../theme.dart';

class ErrorPanel extends StatelessWidget {
  const ErrorPanel({super.key, required this.error});

  final ApiException error;

  @override
  Widget build(BuildContext context) {
    return Card(
      key: const Key('errorPanel'),
      color: MatchCornerTheme.dangerFill,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFF0B8B4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              error.title,
              style: const TextStyle(
                color: MatchCornerTheme.danger,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              error.message,
              style: const TextStyle(color: MatchCornerTheme.text, height: 1.4),
            ),
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                childrenPadding: const EdgeInsets.only(bottom: 12),
                title: const Text(
                  'Technical details',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                children: [
                  _TechRow(label: 'Application error code', value: error.code),
                  if (error.status > 0)
                    _TechRow(label: 'HTTP status', value: '${error.status}'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TechRow extends StatelessWidget {
  const _TechRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 160,
            child: Text(
              label,
              style: const TextStyle(color: MatchCornerTheme.muted, fontSize: 13),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
