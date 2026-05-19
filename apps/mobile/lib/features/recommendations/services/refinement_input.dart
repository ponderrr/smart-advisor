/// Lightweight DTO for "conversational recommendation refinement": a
/// follow-up generation pass that reuses the original quiz context but
/// layers a free-text steer on top. Plain class (like MovieSearchResult),
/// not freezed — it never round-trips through JSON on its own; ai_service
/// flattens it into the Edge Function body.
class RefinementInput {
  const RefinementInput({
    required this.feedbackText,
    this.previousTitles = const <String>[],
  });

  /// The user's verbatim steer, e.g. "more like Dune, lighter, nothing
  /// over 2 hours". Treated as the strongest signal server-side.
  final String feedbackText;

  /// Titles already shown this session — so the AI avoids repeating them
  /// and understands "more like <title>" context.
  final List<String> previousTitles;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'feedbackText': feedbackText,
        'previousTitles': previousTitles,
      };
}
