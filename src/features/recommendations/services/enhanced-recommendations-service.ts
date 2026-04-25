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
    const safeId =
      (rec.id && rec.id.trim()) ||
      `fallback-${idSeed.toLowerCase().replace(/\s+/g, "-")}`;
    return {
      id: safeId,
      user_id: rec.user_id || userId,
      type: (rec.type as "movie" | "book") || "movie",
      title: rec.title || "Recommended Pick",
      director: rec.director,
      author: rec.author,
      year: rec.year,
      rating: rec.rating,
      genres: Array.isArray(rec.genres)
        ? rec.genres
        : typeof (rec as Record<string, unknown>).genre === "string" &&
            (rec as Record<string, unknown>).genre
          ? ((rec as Record<string, unknown>).genre as string)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
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
    retryCount = 0,
  ): Promise<Recommendation[]> {
    try {
      return await this.generateEnhancedRecommendations(
        questionnaireData,
        userId,
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message.toLowerCase() : "";
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
          retryCount + 1,
        );
      }

      throw error instanceof Error
        ? error
        : new Error(
            `Failed to generate recommendations after ${this.MAX_RETRIES + 1} attempts`,
          );
    }
  }

  /**
   * Target counts: always 3 total picks regardless of contentType.
   * For "both" we split 2 movies + 1 book. Fires parallel calls with dedup
   * buffer and falls back to sequential retries if any calls fail silently.
   */
  async generateEnhancedRecommendations(
    questionnaireData: QuestionnaireData,
    userId: string,
  ): Promise<Recommendation[]> {
    const { answers, contentType, userAge, userName } = questionnaireData;

    let movieTarget: number;
    let bookTarget: number;
    if (contentType === "movie") {
      movieTarget = 3;
      bookTarget = 0;
    } else if (contentType === "book") {
      movieTarget = 0;
      bookTarget = 3;
    } else {
      movieTarget = 2;
      bookTarget = 1;
    }

    const movieRecs: Partial<Recommendation>[] = [];
    const bookRecs: Partial<Recommendation>[] = [];
    const seenMovieTitles = new Set<string>();
    const seenBookTitles = new Set<string>();

    const ingest = (data: Awaited<ReturnType<typeof generateRecommendations>>) => {
      if (data.movieRecommendation && movieRecs.length < movieTarget) {
        const title = data.movieRecommendation.title.toLowerCase().trim();
        if (!seenMovieTitles.has(title)) {
          seenMovieTitles.add(title);
          movieRecs.push({ ...data.movieRecommendation, type: "movie" });
        }
      }
      if (data.bookRecommendation && bookRecs.length < bookTarget) {
        const title = data.bookRecommendation.title.toLowerCase().trim();
        if (!seenBookTitles.has(title)) {
          seenBookTitles.add(title);
          bookRecs.push({ ...data.bookRecommendation, type: "book" });
        }
      }
    };

    const atTarget = () =>
      movieRecs.length >= movieTarget && bookRecs.length >= bookTarget;

    // First pass: parallel calls sized to the target plus a small dedup buffer.
    const parallelCalls = movieTarget + bookTarget + 2;
    const callResults = await Promise.allSettled(
      Array.from({ length: parallelCalls }, () =>
        generateRecommendations(answers, contentType, userAge, userName),
      ),
    );

    let failures = 0;
    for (const result of callResults) {
      if (result.status !== "fulfilled") {
        failures++;
        continue;
      }
      ingest(result.value);
    }
    if (failures > 0) {
      console.warn(
        `[recommendations] ${failures}/${parallelCalls} AI calls failed in parallel pass`,
      );
    }

    // Fallback: sequential retries if silent failures or over-aggressive dedup
    // left us short. Bounded so a persistent outage can still fail fast.
    const maxExtraCalls = 3;
    for (let i = 0; i < maxExtraCalls && !atTarget(); i++) {
      try {
        const data = await generateRecommendations(
          answers,
          contentType,
          userAge,
          userName,
        );
        ingest(data);
      } catch (err) {
        console.warn("[recommendations] fallback AI call failed:", err);
      }
    }

    const allRecs = [...movieRecs, ...bookRecs];

    if (allRecs.length === 0) {
      throw new Error("No recommendations were generated");
    }

    // Enrich and save each recommendation
    const enhancedRecommendations = await Promise.all(
      allRecs.map(async (rec) => {
        try {
          let enhancedRec = { ...rec };

          if (rec.type === "movie") {
            try {
              const tmdbData = rec.title
                ? await tmdbService.searchMovie(rec.title)
                : null;
              if (tmdbData) {
                enhancedRec = {
                  ...enhancedRec,
                  poster_url: tmdbData.poster || rec.poster_url,
                  rating: tmdbData.rating || rec.rating,
                  year: tmdbData.year || rec.year,
                  description: tmdbData.description || enhancedRec.description,
                  genres:
                    enhancedRec.genres && enhancedRec.genres.length > 0
                      ? enhancedRec.genres
                      : tmdbData.genres || [],
                };
              }
            } catch {
              // TMDB enhancement is non-critical
            }
          }

          if (rec.type === "book") {
            try {
              const bookData = rec.title
                ? await openLibraryService.searchBook(rec.title, rec.author)
                : null;
              if (bookData) {
                // Prefer the AI's description — OpenLibrary often returns a
                // generic "engaging and thought-provoking read" placeholder
                // that would override a much better synopsis from Anthropic.
                enhancedRec = {
                  ...enhancedRec,
                  poster_url: bookData.cover || rec.poster_url,
                  rating: bookData.rating || rec.rating,
                  year: bookData.year || rec.year,
                  description: enhancedRec.description || bookData.description,
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
            } as Omit<Recommendation, "id" | "created_at">);

          if (error) {
            return this.toRecommendation(
              enhancedRec as Recommendation,
              userId,
              contentType,
            );
          }

          if (savedRec) {
            return this.toRecommendation(
              savedRec as Recommendation,
              userId,
              contentType,
            );
          }

          return this.toRecommendation(
            enhancedRec as Recommendation,
            userId,
            contentType,
          );
        } catch {
          return this.toRecommendation(
            rec as Recommendation,
            userId,
            contentType,
          );
        }
      }),
    );

    return enhancedRecommendations as Recommendation[];
  }
}

export const enhancedRecommendationsService =
  new EnhancedRecommendationsService();
