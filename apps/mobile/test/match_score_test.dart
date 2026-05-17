import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/features/recommendations/utils/match_score.dart';

void main() {
  group('deriveMatchScore', () {
    test('uses match_score, clamped and rounded, with tone thresholds', () {
      expect(deriveMatchScore(id: 'x', matchScore: 93).score, 93);
      expect(deriveMatchScore(id: 'x', matchScore: 93).tone, MatchTone.green);
      expect(deriveMatchScore(id: 'x', matchScore: 80).tone, MatchTone.yellow);
      expect(deriveMatchScore(id: 'x', matchScore: 50).tone, MatchTone.red);
      expect(deriveMatchScore(id: 'x', matchScore: 150).score, 100);
      expect(deriveMatchScore(id: 'x', matchScore: 88.6).score, 89);
    });

    test('falls back to a stable hash in 78..97 when score absent', () {
      final a = deriveMatchScore(id: 'rec-abc');
      final b = deriveMatchScore(id: 'rec-abc');
      expect(a.score, b.score, reason: 'deterministic per id');
      expect(a.score, inInclusiveRange(78, 97));
      // Many ids should spread across the 78..97 band (collisions on the
      // 20-value range are expected, so assert spread, not per-id distinctness).
      final spread = {
        for (var i = 0; i < 200; i++) deriveMatchScore(id: 'id-$i').score,
      };
      expect(spread.length, greaterThan(10));
      expect(spread.every((s) => s >= 78 && s <= 97), isTrue);
    });
  });
}
