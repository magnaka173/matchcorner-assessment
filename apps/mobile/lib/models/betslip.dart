import 'selection.dart';

/// Canonical betslip returned by MatchCorner Decode.
class Betslip {
  const Betslip({
    required this.operator,
    required this.bookingCode,
    required this.betType,
    required this.isBuildABet,
    required this.selections,
  });

  final String operator;
  final String bookingCode;
  final String betType;
  final bool isBuildABet;
  final List<Selection> selections;

  factory Betslip.fromJson(Map<String, dynamic> json) {
    final rawSelections = json['selections'];
    if (rawSelections is! List) {
      throw const FormatException('Missing selections');
    }

    return Betslip(
      operator: json['operator']?.toString() ?? '',
      bookingCode: json['bookingCode']?.toString() ?? '',
      betType: json['betType']?.toString() ?? '',
      isBuildABet: json['isBuildABet'] == true,
      selections: [
        for (final item in rawSelections)
          if (item is Map<String, dynamic>) Selection.fromJson(item)
          else if (item is Map)
            Selection.fromJson(Map<String, dynamic>.from(item))
          else
            throw const FormatException('Invalid selection'),
      ],
    );
  }
}
