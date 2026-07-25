import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Format bonus points: show integer when whole number, one decimal otherwise.
/// e.g. 58.5 → "58.5", 60.0 → "60", 4.5 → "4.5"
String fmtPts(double pts) =>
    pts % 1 == 0 ? pts.toInt().toString() : pts.toStringAsFixed(1);

/// Return pts as num — int for whole numbers, double for decimals.
/// Pass to l10n methods typed as `num` so "4" prints not "4.0".
num ptsPrecise(double pts) => pts % 1 == 0 ? pts.toInt() : pts;

/// Format bonus with correct sign: "+3 pts", "0 pts", "-1.5 pts"
String fmtBonusText(double bonus, String ptsAbbr) {
  final abs = bonus.abs();
  final str = abs % 1 == 0 ? abs.toInt().toString() : abs.toStringAsFixed(1);
  if (bonus > 0) return '+$str $ptsAbbr';
  if (bonus < 0) return '-$str $ptsAbbr';
  return '0 $ptsAbbr';
}

/// Color for a bonus value: green for positive, amber for zero, red for negative.
Color bonusColor(double bonus) {
  if (bonus > 0) return AppColors.success;
  if (bonus < 0) return AppColors.error;
  return AppColors.warning;
}
