import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.label,
    this.tone = StatusBadgeTone.neutral,
  });

  final String label;
  final StatusBadgeTone tone;

  @override
  Widget build(BuildContext context) {
    final colors = switch (tone) {
      StatusBadgeTone.success => (MatchCornerTheme.successFill, MatchCornerTheme.success),
      StatusBadgeTone.danger => (MatchCornerTheme.dangerFill, MatchCornerTheme.danger),
      StatusBadgeTone.warning => (MatchCornerTheme.warningFill, MatchCornerTheme.warning),
      StatusBadgeTone.neutral => (const Color(0xFFEEF2F7), MatchCornerTheme.navy),
    };
    final background = colors.$1;
    final foreground = colors.$2;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: foreground,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

enum StatusBadgeTone { neutral, success, danger, warning }

class CopyableValue extends StatelessWidget {
  const CopyableValue({super.key, required this.value});

  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SelectableText(
            value,
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 13,
              height: 1.4,
              color: MatchCornerTheme.text,
            ),
          ),
        ),
        IconButton(
          tooltip: 'Copy',
          visualDensity: VisualDensity.compact,
          onPressed: () async {
            await Clipboard.setData(ClipboardData(text: value));
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Copied to clipboard')),
              );
            }
          },
          icon: const Icon(Icons.copy, size: 18),
        ),
      ],
    );
  }
}

String formatOdds(double odds) {
  if (odds.isNaN || odds.isInfinite) {
    return odds.toString();
  }
  return odds.toStringAsFixed(2);
}

String formatStartTime(String? value) {
  if (value == null || value.isEmpty) {
    return '—';
  }

  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    return value;
  }

  final local = parsed.toLocal();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final month = months[local.month - 1];
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '${local.day} $month ${local.year}, $hour:$minute';
}

String displayOrDash(String? value) {
  if (value == null || value.trim().isEmpty) {
    return '—';
  }
  return value;
}
