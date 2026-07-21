/// Format bonus points: show integer when whole number, one decimal otherwise.
/// e.g. 58.5 → "58.5", 60.0 → "60", 4.5 → "4.5"
String fmtPts(double pts) =>
    pts % 1 == 0 ? pts.toInt().toString() : pts.toStringAsFixed(1);

/// Return pts as num — int for whole numbers, double for decimals.
/// Pass to l10n methods typed as `num` so "4" prints not "4.0".
num ptsPrecise(double pts) => pts % 1 == 0 ? pts.toInt() : pts;
