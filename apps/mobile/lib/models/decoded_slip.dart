import 'betslip.dart';

/// Successful Decode payload: canonical slip plus identity fingerprint.
class DecodedSlip {
  const DecodedSlip({
    required this.slip,
    required this.fingerprint,
  });

  final Betslip slip;
  final String fingerprint;

  factory DecodedSlip.fromJson(Map<String, dynamic> json) {
    final rawSlip = json['slip'];
    if (rawSlip is! Map) {
      throw const FormatException('Missing slip');
    }

    final fingerprint = json['fingerprint']?.toString() ?? '';
    if (fingerprint.isEmpty) {
      throw const FormatException('Missing fingerprint');
    }

    return DecodedSlip(
      slip: Betslip.fromJson(Map<String, dynamic>.from(rawSlip)),
      fingerprint: fingerprint,
    );
  }
}
