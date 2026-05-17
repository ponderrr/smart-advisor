/// Port of web src/features/recommendations/utils/match-score.ts.
enum MatchTone { green, yellow, red }

class MatchScore {
  const MatchScore(this.score, this.tone);
  final int score;
  final MatchTone tone;
}

MatchTone _toneFor(int score) {
  if (score >= 90) return MatchTone.green;
  if (score >= 75) return MatchTone.yellow;
  return MatchTone.red;
}

/// Uses [matchScore] when present (clamped 0..100, rounded). Otherwise
/// derives a stable score in 78..97 by hashing [id], so the same item always
/// shows the same number.
MatchScore deriveMatchScore({required String id, num? matchScore}) {
  if (matchScore != null) {
    final s = matchScore.round().clamp(0, 100);
    return MatchScore(s, _toneFor(s));
  }
  var hash = 0;
  for (final c in id.codeUnits) {
    hash = (hash * 31 + c) & 0x7fffffff;
  }
  final s = 78 + (hash % 20); // 78..97
  return MatchScore(s, _toneFor(s));
}
