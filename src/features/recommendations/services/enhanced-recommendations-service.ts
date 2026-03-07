import { generateRecommendations } from "@/features/recommendations/services/ai-service";
import { tmdbService } from "@/features/recommendations/services/tmdb-service";
import { openLibraryService } from "@/features/recommendations/services/open-library-service";
import { databaseService } from "@/features/recommendations/services/database-service";
import { Recommendation } from "@/features/recommendations/types/recommendation";
import { Answer } from "@/features/quiz/types/answer";

interface QuestionnaireData {
  answers: Answer[];
  contentType: "movie" | "book" | "both";
  userAge: number;
  userName: string;
}

class EnhancedRecommendationsService {
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000;

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toRecommendation(
    rec: Partial<Recommendation>,
    userId: string,
    contentType: "movie" | "book" | "both",
  ): Recommendation {
    const idSeed = `${rec.type || "item"}-${rec.title || "pick"}-${rec.year || "na"}`;
    const safeId = (rec.id && rec.id.trim()) || `fallback-${idSeed.toLowerCase().replace(/\s+/g, "-")}`;
    return {
      id: safeId,
      user_id: rec.user_id || userId,
      type: (rec.type as "movie" | "book") || "movie",
      title: rec.title || "Recommended Pick",
      director: rec.director,
      author: rec.author,
      year: rec.year,
      rating: rec.rating,
      genres: Array.isArray(rec.genres) ? rec.genres : [],
      poster_url: rec.poster_url,
      explanation: rec.explanation,
      is_favorited: Boolean(rec.is_favorited),
      content_type: rec.content_type || contentType,
      created_at: rec.created_at || new Date().toISOString(),
      description: rec.description,
    };
  }

  async retryRecommendation(
    questionnaireData: QuestionnaireData,
    userId: string,
    retryCount = 0
  ): Promise<Recommendation[]> {
    try {
      return await this.generateEnhancedRecommendations(
        questionnaireData,
        userId
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : "";
      const isNonRetryable =
        errorMsg.includes("not authenticated") ||
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("401") ||
        errorMsg.includes("403");

      if (!isNonRetryable && retryCount < this.MAX_RETRIES) {
        await this.delay(this.RETRY_DELAY * (retryCount + 1));
        return this.retryRecommendation(
          questionnaireData,
          userId,
          retryCount + 1
        );
      }

      throw error instanceof Error
        ? error
        : new Error(
            `Failed to generate recommendations after ${this.MAX_RETRIES + 1} attempts`,
          );
    }
  }

  async generateEnhancedRecommendations(
    questionnaireData: QuestionnaireData,
    userId: string
  ): Promise<Recommendation[]> {
    const { answers, contentType, userAge, userName } = questionnaireData;

    const aiRecommendations = await generateRecommendations(
      answers,
      contentType,
      userAge,
      userName
    );

    const recommendationsArray: Partial<Recommendation>[] = [];

    if (contentType === "movie" || contentType === "both") {
      if (aiRecommendations.movieRecommendation) {
        recommendationsArray.push({
          ...aiRecommendations.movieRecommendation,
          type: "movie",
        });
      }
    }

    if (contentType === "book" || contentType === "both") {
      if (aiRecommendations.bookRecommendation) {
        recommendationsArray.push({
          ...aiRecommendations.bookRecommendation,
          type: "book",
        });
      }
    }

    if (recommendationsArray.length === 0) {
      throw new Error("No recommendations were generated");
    }

    const enhancedRecommendations = await Promise.all(
      recommendationsArray.map(async (rec) => {
        try {
          let enhancedRec = { ...rec };

          if (rec.type === "movie") {
            try {
              const tmdbData = rec.title ? await tmdbService.searchMovie(rec.title) : null;
              if (tmdbData) {
                enhancedRec = {
                  ...enhancedRec,
                  poster_url: tmdbData.poster || rec.poster_url,
                  rating: tmdbData.rating || rec.rating,
                  year: tmdbData.year || rec.year,
                  description: enhancedRec.explanation || tmdbData.description,
                };
              }
            } catch {
              // TMDB enhancement is non-critical
            }
          }

          if (rec.type === "book") {
            try {
              const bookData = rec.title ? await openLibraryService.searchBook(
                rec.title,
                rec.author
              ) : null;
              if (bookData) {
                enhancedRec = {
                  ...enhancedRec,
                  poster_url: bookData.cover || rec.poster_url,
                  rating: bookData.rating || rec.rating,
                  year: bookData.year || rec.year,
                  description: enhancedRec.explanation || bookData.description,
                };
              }
            } catch {
              // Open Library enhancement is non-critical
            }
          }

          const { data: savedRec, error } =
            await databaseService.saveRecommendation({
              ...enhancedRec,
              user_id: userId,
            } as any);

          if (error) {
            return this.toRecommendation(enhancedRec as Recommendation, userId, contentType);
          }

          if (savedRec) {
            return this.toRecommendation(savedRec as Recommendation, userId, contentType);
          }

          return this.toRecommendation(enhancedRec as Recommendation, userId, contentType);
        } catch {
          return this.toRecommendation(rec as Recommendation, userId, contentType);
        }
      })
    );

    return enhancedRecommendations as Recommendation[];
  }
}

export const enhancedRecommendationsService =
  new EnhancedRecommendationsService();
