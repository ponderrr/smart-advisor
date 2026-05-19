import 'dart:async';
import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/ai_models.dart';
import '../../../core/models/answer.dart';
import '../../../core/models/enums.dart';
import '../../../core/models/question.dart';

/// Port of web src/features/recommendations/services/ai-service.ts.
/// Calls the anthropic-questions / anthropic-recommendations Edge Functions
/// (Authorization header is attached automatically by supabase_flutter).
class AiService {
  AiService(this._client);

  final SupabaseClient _client;

  Future<List<Question>> generateQuestions({
    required ContentType contentType,
    required int userAge,
    required String contentTone,
    int questionCount = 5,
    String? userName,
  }) async {
    final res = await _invoke('anthropic-questions', <String, dynamic>{
      'name': userName ?? '',
      'age': userAge,
      'questionCount': questionCount,
      'contentType': contentType.wire,
      'contentTone': contentTone,
    });

    final raw = (res['questions'] as List?) ?? const <dynamic>[];
    return raw
        .map((e) => Question.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<RecommendationData> generateRecommendations({
    required List<Answer> answers,
    required ContentType contentType,
    required int userAge,
    required String contentTone,
    String? userName,
    Map<String, dynamic>? recommendationFilters,
  }) async {
    final res = await _invoke('anthropic-recommendations', <String, dynamic>{
      'name': userName ?? '',
      'age': userAge,
      'answers': answers.map((a) => a.toJson()).toList(),
      'contentType': contentType.wire,
      'contentTone': contentTone,
      if (recommendationFilters != null && recommendationFilters.isNotEmpty)
        'recommendationFilters': recommendationFilters,
    });

    final raw = (res['recommendations'] as List?) ?? const <dynamic>[];
    final items = raw
        .map((e) =>
            AiRecommendationItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return RecommendationData.fromItems(items);
  }

  /// Retry wrapper mirroring the web delay policy: overloaded → 5s, 20s;
  /// generic → 1s, 3s. Auth errors are not retried.
  Future<T> _withRetry<T>(
    Future<T> Function() op, {
    int maxRetries = 2,
  }) async {
    var attempt = 0;
    while (true) {
      try {
        return await op();
      } on AiServiceException catch (e) {
        attempt++;
        if (e.kind == AiErrorKind.auth || attempt > maxRetries) rethrow;
        final delays = e.kind == AiErrorKind.overloaded
            ? const [Duration(seconds: 5), Duration(seconds: 20)]
            : const [Duration(seconds: 1), Duration(seconds: 3)];
        await Future<void>.delayed(delays[(attempt - 1).clamp(0, 1)]);
      }
    }
  }

  Future<List<Question>> generateQuestionsWithRetry({
    required ContentType contentType,
    required int userAge,
    required String contentTone,
    int questionCount = 5,
    String? userName,
    int maxRetries = 2,
  }) =>
      _withRetry(
        () => generateQuestions(
          contentType: contentType,
          userAge: userAge,
          contentTone: contentTone,
          questionCount: questionCount,
          userName: userName,
        ),
        maxRetries: maxRetries,
      );

  Future<RecommendationData> generateRecommendationsWithRetry({
    required List<Answer> answers,
    required ContentType contentType,
    required int userAge,
    required String contentTone,
    String? userName,
    Map<String, dynamic>? recommendationFilters,
    int maxRetries = 2,
  }) =>
      _withRetry(
        () => generateRecommendations(
          answers: answers,
          contentType: contentType,
          userAge: userAge,
          contentTone: contentTone,
          userName: userName,
          recommendationFilters: recommendationFilters,
        ),
        maxRetries: maxRetries,
      );

  Future<Map<String, dynamic>> _invoke(
    String fn,
    Map<String, dynamic> body,
  ) async {
    try {
      final res = await _client.functions.invoke(fn, body: body);
      final data = res.data;
      if (data is Map) return Map<String, dynamic>.from(data);
      throw AiServiceException(
          AiErrorKind.generic, 'Unexpected response from $fn');
    } on FunctionException catch (e) {
      throw AiServiceException(_classify(e), _message(e));
    } on SocketException catch (e) {
      throw AiServiceException(AiErrorKind.network, e.message);
    } on TimeoutException {
      throw AiServiceException(AiErrorKind.network, 'Request timed out');
    }
  }

  AiErrorKind _classify(FunctionException e) {
    final status = e.status;
    final detail = '${e.details ?? ''} ${e.reasonPhrase ?? ''}'.toLowerCase();
    if (status == 401 || status == 403) return AiErrorKind.auth;
    if (status == 429 ||
        status == 503 ||
        status == 529 ||
        detail.contains('overloaded')) {
      return AiErrorKind.overloaded;
    }
    return AiErrorKind.generic;
  }

  String _message(FunctionException e) {
    final d = e.details;
    if (d is Map && d['error'] is String) return d['error'] as String;
    return e.reasonPhrase ?? 'Edge function error (${e.status})';
  }
}
