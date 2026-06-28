import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand
  static const Color primary = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFFEEF2FF);
  static const Color secondary = Color(0xFF7C3AED);
  static const Color accentGold = Color(0xFFF59E0B);

  // Tiers
  static const Color tierBest = Color(0xFF10B981);
  static const Color tierSecond = Color(0xFF6366F1);
  static const Color tierThird = Color(0xFFF59E0B);
  static const Color tierBelow = Color(0xFFEF4444);

  static const Color tierBestLight = Color(0xFFD1FAE5);
  static const Color tierSecondLight = Color(0xFFE0E7FF);
  static const Color tierThirdLight = Color(0xFFFEF3C7);
  static const Color tierBelowLight = Color(0xFFFEE2E2);

  // Semantic
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Neutrals — light
  static const Color neutral900 = Color(0xFF111827);
  static const Color neutral700 = Color(0xFF374151);
  static const Color neutral600 = Color(0xFF4B5563);
  static const Color neutral400 = Color(0xFF9CA3AF);
  static const Color neutral200 = Color(0xFFE5E7EB);
  static const Color neutral100 = Color(0xFFF3F4F6);
  static const Color neutral50 = Color(0xFFF9FAFB);
  static const Color white = Color(0xFFFFFFFF);

  // Dark mode surfaces
  static const Color darkBg = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkSurface2 = Color(0xFF334155);
  static const Color darkText = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, secondary],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Tier color helpers
  static Color tierColor(String tier) {
    switch (tier) {
      case 'best':
        return tierBest;
      case 'second':
        return tierSecond;
      case 'third':
        return tierThird;
      default:
        return tierBelow;
    }
  }

  static Color tierColorLight(String tier) {
    switch (tier) {
      case 'best':
        return tierBestLight;
      case 'second':
        return tierSecondLight;
      case 'third':
        return tierThirdLight;
      default:
        return tierBelowLight;
    }
  }
}
