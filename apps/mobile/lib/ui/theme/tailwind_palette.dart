import 'package:flutter/painting.dart';

/// The exact subset of Tailwind v3 color shades referenced by the web
/// accent system (content-accent / type-accent / match-score). Kept literal
/// so the mobile palette matches the web pixel-for-pixel.
class Tw {
  const Tw._();

  // amber
  static const amber50 = Color(0xFFFFFBEB);
  static const amber100 = Color(0xFFFEF3C7);
  static const amber300 = Color(0xFFFCD34D);
  static const amber400 = Color(0xFFFBBF24);
  static const amber500 = Color(0xFFF59E0B);
  static const amber600 = Color(0xFFD97706);
  static const amber700 = Color(0xFFB45309);
  static const amber900 = Color(0xFF78350F);

  // orange
  static const orange50 = Color(0xFFFFF7ED);
  static const orange500 = Color(0xFFF97316);

  // rose
  static const rose50 = Color(0xFFFFF1F2);
  static const rose100 = Color(0xFFFFE4E6);
  static const rose300 = Color(0xFFFDA4AF);
  static const rose400 = Color(0xFFFB7185);
  static const rose500 = Color(0xFFF43F5E);
  static const rose600 = Color(0xFFE11D48);
  static const rose700 = Color(0xFFBE123C);
  static const rose900 = Color(0xFF881337);

  // pink
  static const pink50 = Color(0xFFFDF2F8);
  static const pink500 = Color(0xFFEC4899);

  // fuchsia
  static const fuchsia50 = Color(0xFFFDF4FF);
  static const fuchsia500 = Color(0xFFD946EF);

  // emerald
  static const emerald50 = Color(0xFFECFDF5);
  static const emerald100 = Color(0xFFD1FAE5);
  static const emerald300 = Color(0xFF6EE7B7);
  static const emerald400 = Color(0xFF34D399);
  static const emerald500 = Color(0xFF10B981);
  static const emerald600 = Color(0xFF059669);
  static const emerald700 = Color(0xFF047857);
  static const emerald900 = Color(0xFF064E3B);

  // teal
  static const teal50 = Color(0xFFF0FDFA);
  static const teal500 = Color(0xFF14B8A6);

  // cyan
  static const cyan50 = Color(0xFFECFEFF);
  static const cyan500 = Color(0xFF06B6D4);

  // violet
  static const violet50 = Color(0xFFF5F3FF);
  static const violet100 = Color(0xFFEDE9FE);
  static const violet300 = Color(0xFFC4B5FD);
  static const violet400 = Color(0xFFA78BFA);
  static const violet500 = Color(0xFF8B5CF6);
  static const violet600 = Color(0xFF7C3AED);

  // indigo
  static const indigo500 = Color(0xFF6366F1);
  static const indigo900 = Color(0xFF1E1B4B);
}
