/// One canonical selection from a MatchCorner Decode response.
class Selection {
  const Selection({
    required this.eventId,
    required this.eventName,
    required this.sport,
    this.region,
    this.league,
    this.startTime,
    required this.marketId,
    this.operatorMarketId,
    required this.marketName,
    required this.selectionId,
    required this.selectionName,
    this.handicap,
    required this.odds,
    required this.active,
  });

  final String eventId;
  final String eventName;
  final String sport;
  final String? region;
  final String? league;
  final String? startTime;
  final String marketId;
  final String? operatorMarketId;
  final String marketName;
  final String selectionId;
  final String selectionName;
  final double? handicap;
  final double odds;
  final bool active;

  factory Selection.fromJson(Map<String, dynamic> json) {
    return Selection(
      eventId: _requiredString(json['eventId'], 'eventId'),
      eventName: _string(json['eventName']),
      sport: _string(json['sport']),
      region: _optionalString(json['region']),
      league: _optionalString(json['league']),
      startTime: _optionalString(json['startTime']),
      marketId: _requiredString(json['marketId'], 'marketId'),
      operatorMarketId: _optionalString(json['operatorMarketId']),
      marketName: _string(json['marketName']),
      selectionId: _requiredString(json['selectionId'], 'selectionId'),
      selectionName: _string(json['selectionName']),
      handicap: _optionalNumber(json['handicap']),
      odds: _number(json['odds']),
      active: json['active'] == true,
    );
  }
}

String _requiredString(Object? value, String field) {
  if (value == null) {
    throw FormatException('Missing $field');
  }
  final text = value.toString();
  if (text.isEmpty) {
    throw FormatException('Missing $field');
  }
  return text;
}

String _string(Object? value) {
  if (value == null) {
    return '';
  }
  return value.toString();
}

String? _optionalString(Object? value) {
  if (value == null) {
    return null;
  }
  final text = value.toString();
  return text.isEmpty ? null : text;
}

double _number(Object? value) {
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value) ?? 0;
  }
  return 0;
}

double? _optionalNumber(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value);
  }
  return null;
}
