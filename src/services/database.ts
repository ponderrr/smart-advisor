import { supabase } from "@/integrations/supabase/client";
import { Recommendation } from "@/types/Recommendation";
import { User } from "@/types/User";

export interface FilterOptions {
  contentType?: "movie" | "book" | "both";
  isFavorited?: boolean;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "newest" | "oldest" | "favorites_first";
  limit?: number;
  offset?: number;
}

export interface ProfileUpdates {
  name?: string;
  age?: number;
  email?: string;
}

export interface UserStats {
  totalRecommendations: number;
  favoriteCount: number;
  movieCount: number;
  bookCount: number;
  thisMonthCount: number;
}

class DatabaseService {
  /**
   * Save a recommendation to the database
   */
  async saveRecommendation(
    recommendation: Omit<Recommendation, "id" | "created_at">
  ): Promise<{ data: Recommendation | null; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: "User not authenticated" };
      }

      // Prepare recommendation data for database
      const dbRecommendation = {
        user_id: user.id,
        type: recommendation.type,
        title: recommendation.title,
        description: recommendation.description || "",
        explanation: recommendation.explanation || "",
        poster_url: recommendation.poster_url || "",
        genre: Array.isArray(recommendation.genres)
          ? recommendation.genres.join(", ")
          : "",
        rating: recommendation.rating || null,
        is_favorited: recommendation.is_favorited || false,
        content_type: recommendation.content_type,
        director: recommendation.director || null,
        author: recommendation.author || null,
        year: recommendation.year || null,
      };

      const { data, error } = await supabase
        .from("recommendations")
        .insert(dbRecommendation)
        .select()
        .single();

      if (error) {
        console.error("Error saving recommendation:", error);
        return { data: null, error: error.message };
      }

      // Convert database response back to Recommendation type
      const savedRecommendation: Recommendation = {
        id: data.id,
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        director: data.director,
        author: data.author,
        year: data.year,
        rating: data.rating || 0,
        genres: data.genre ? data.genre.split(", ").filter(Boolean) : [],
        poster_url: data.poster_url,
        explanation: data.explanation,
        is_favorited: data.is_favorited || false,
        content_type: data.content_type,
        created_at: data.created_at,
        description: data.description,
      };

      return { data: savedRecommendation, error: null };
    } catch (err) {
      console.error("Unexpected error saving recommendation:", err);
      return { data: null, error: "Failed to save recommendation" };
    }
  }

  /**
   * Get user recommendations with filtering and sorting
   */
  async getUserRecommendations(
    filters?: FilterOptions
  ): Promise<{ data: Recommendation[]; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: [], error: "User not authenticated" };
      }

      let query = supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", user.id);

      // Apply filters
      if (filters?.contentType && filters.contentType !== "both") {
        query = query.eq("type", filters.contentType);
      }

      if (filters?.isFavorited !== undefined) {
        query = query.eq("is_favorited", filters.isFavorited);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "favorites_first":
          query = query
            .order("is_favorited", { ascending: false })
            .order("created_at", { ascending: false });
          break;
        default: // newest
          query = query.order("created_at", { ascending: false });
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 20) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching recommendations:", error);
        return { data: [], error: error.message };
      }

      // Convert database records to Recommendation type
      const recommendations: Recommendation[] = (data || []).map(
        (rec: Record<string, unknown>) => ({
          id: rec.id,
          user_id: rec.user_id,
          type: rec.type,
          title: rec.title,
          director: rec.director,
          author: rec.author,
          year: rec.year,
          rating: rec.rating || 0,
          genres: rec.genre ? rec.genre.split(", ").filter(Boolean) : [],
          poster_url: rec.poster_url,
          explanation: rec.explanation,
          is_favorited: rec.is_favorited || false,
          content_type: rec.content_type,
          created_at: rec.created_at,
          description: rec.description,
        })
      );

      return { data: recommendations, error: null };
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      return { data: [], error: "Failed to fetch recommendations" };
    }
  }

  /**
   * Toggle favorite status of a recommendation
   */
  async toggleFavorite(
    recommendationId: string
  ): Promise<{ error: string | null }> {
    try {
      const { data: rec, error: fetchError } = await supabase
        .from("recommendations")
        .select("is_favorited")
        .eq("id", recommendationId)
        .single();

      if (fetchError) {
        console.error("Error fetching recommendation:", fetchError);
        return { error: fetchError.message };
      }

      const { error } = await supabase
        .from("recommendations")
        .update({ is_favorited: !rec.is_favorited })
        .eq("id", recommendationId);

      if (error) {
        console.error("Error updating favorite status:", error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error toggling favorite:", err);
      return { error: "Failed to toggle favorite" };
    }
  }

  /**
   * Delete a recommendation
   */
  async deleteRecommendation(
    recommendationId: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from("recommendations")
        .delete()
        .eq("id", recommendationId);

      if (error) {
        console.error("Error deleting recommendation:", error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error deleting recommendation:", err);
      return { error: "Failed to delete recommendation" };
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(
    updates: ProfileUpdates
  ): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "User not authenticated" };
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.age && { age: updates.age }),
          ...(updates.email && { email: updates.email }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error updating profile:", err);
      return { error: "Failed to update profile" };
    }
  }

  /**
   * Get user stats
   */
  async getUserStats(): Promise<{
    data: UserStats | null;
    error: string | null;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: "User not authenticated" };
      }

      const { data: recommendations, error } = await supabase
        .from("recommendations")
        .select("type, is_favorited, created_at")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user stats:", error);
        return { data: null, error: error.message };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: UserStats = {
        totalRecommendations: recommendations.length,
        favoriteCount: recommendations.filter((r) => r.is_favorited).length,
        movieCount: recommendations.filter((r) => r.type === "movie").length,
        bookCount: recommendations.filter((r) => r.type === "book").length,
        thisMonthCount: recommendations.filter(
          (r) => new Date(r.created_at) >= startOfMonth
        ).length,
      };

      return { data: stats, error: null };
    } catch (err) {
      console.error("Unexpected error fetching user stats:", err);
      return { data: null, error: "Failed to fetch user statistics" };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<{
    data: User | null;
    error: string | null;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: "User not authenticated" };
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return { data: null, error: error.message };
      }

      const userData: User = {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        email: profile.email || user.email || "",
        created_at: profile.created_at || new Date().toISOString(),
      };

      return { data: userData, error: null };
    } catch (err) {
      console.error("Unexpected error fetching user profile:", err);
      return { data: null, error: "Failed to fetch user profile" };
    }
  }
}

export const databaseService = new DatabaseService();

// Export individual functions for backward compatibility
export const {
  saveRecommendation,
  getUserRecommendations,
  toggleFavorite,
  deleteRecommendation,
  updateUserProfile,
  getUserStats,
  getCurrentUserProfile,
} = databaseService;
