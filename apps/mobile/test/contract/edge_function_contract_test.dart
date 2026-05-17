import 'package:flutter_test/flutter_test.dart';
import 'package:smart_advisor/core/models/ai_models.dart';
import 'package:smart_advisor/core/models/answer.dart';
import 'package:smart_advisor/core/models/enums.dart';
import 'package:smart_advisor/core/models/question.dart';

/// Parity tests: these JSON fixtures are the EXACT shapes the Supabase Edge
/// Functions (anthropic-questions / anthropic-recommendations) return, per
/// the web contract. If the backend contract changes, these break — which is
/// how mobile/web stay in lockstep without shared code.
void main() {
  group('anthropic-questions response', () {
    test('parses single_select / select_all / fill_in_blank', () {
      const fixture = {
        'questions': [
          {
            'id': 'q1',
            'text': 'Pick a vibe',
            'type': 'single_select',
            'options': ['Cozy', 'Tense', 'Epic', 'Weird'],
          },
          {
            'id': 'q2',
            'text': 'Select all that apply',
            'type': 'select_all',
            'options': ['A', 'B', 'C', 'D'],
          },
          {
            'id': 'q3',
            'text': 'Describe your pick',
            'type': 'fill_in_blank',
            'placeholder': 'e.g. a slow-burn mystery',
          },
        ],
      };

      final qs = (fixture['questions'] as List)
          .map((e) => Question.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();

      expect(qs, hasLength(3));
      expect(qs[0].type, QuestionType.singleSelect);
      expect(qs[0].options, ['Cozy', 'Tense', 'Epic', 'Weird']);
      expect(qs[1].type, QuestionType.selectAll);
      expect(qs[2].type, QuestionType.fillInBlank);
      expect(qs[2].placeholder, 'e.g. a slow-burn mystery');
      expect(qs[2].options, isNull);
    });
  });

  group('anthropic-recommendations response', () {
    test('parses items and groups by type', () {
      const fixture = {
        'recommendations': [
          {
            'type': 'movie',
            'title': 'Past Lives',
            'description': 'Two friends reconnect across decades.',
            'explanation': 'You said you like "quiet, aching" stories.',
            'genres': ['Drama', 'Romance'],
            'year': 2023,
            'director': 'Celine Song',
            'rating': 8.0,
            'match_score': 93,
          },
          {
            'type': 'book',
            'title': 'Piranesi',
            'description': 'A man in an endless labyrinth of halls.',
            'explanation': 'Matches your taste for "dreamlike" worlds.',
            'genres': ['Fantasy'],
            'year': 2020,
            'author': 'Susanna Clarke',
            'rating': 9.0,
            'match_score': 88,
          },
        ],
      };

      final items = (fixture['recommendations'] as List)
          .map((e) =>
              AiRecommendationItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      final grouped = RecommendationData.fromItems(items);

      expect(grouped.movieRecommendation?.title, 'Past Lives');
      expect(grouped.movieRecommendation?.director, 'Celine Song');
      expect(grouped.movieRecommendation?.matchScore, 93);
      expect(grouped.bookRecommendation?.author, 'Susanna Clarke');
      expect(grouped.musicRecommendation, isNull);
    });
  });

  group('Answer wire shape (request body)', () {
    test('round-trips snake_case keys', () {
      const json = {
        'id': 'a1',
        'question_id': 'q1',
        'answer_text': 'Cozy',
        'question_text': 'Pick a vibe',
        'selected_options': ['Cozy'],
        'created_at': '2026-05-16T00:00:00Z',
      };
      final a = Answer.fromJson(json);
      expect(a.questionId, 'q1');
      expect(a.answerText, 'Cozy');
      expect(a.toJson()['question_id'], 'q1');
      expect(a.toJson()['answer_text'], 'Cozy');
    });
  });
}
