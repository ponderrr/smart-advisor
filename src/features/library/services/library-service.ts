import { supabase } from "@/integrations/supabase/client";
import type {
  LibraryItem,
  LogLibraryInput,
  UpdateLibraryInput,
} from "../types/library";

interface RawLibraryRow {
  id: string;
  user_id: string;
  medium: string;
  title: string;
  creator: string | null;
  year: number | null;
  poster_url: string | null;
  status: string;
  rating: number | null;
  reaction: string | null;
  source_recommendation_id: string | null;
  logged_at: string;
  finished_at: string | null;
  updated_at: string;
}

/** user_library isn't in the generated supabase types yet — narrow by hand. */
const supabaseLibrary = () =>
  (supabase as unknown as { from: typeof supabase.from }).from(
    "user_library" as never,
  );

const cast = (row: RawLibraryRow): LibraryItem => ({
  ...row,
  medium: row.medium as LibraryItem["medium"],
  status: row.status as LibraryItem["status"],
  rating: row.rating as LibraryItem["rating"],
});

class LibraryService {
  /** Insert or update a library row (upserts on user_id + medium + lower(title)). */
  async log(
    input: LogLibraryInput,
  ): Promise<{ data: LibraryItem | null; error: string | null }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "You must be signed in." };

    const status = input.status ?? "finished";
    const finished_at =
      status === "finished" ? new Date().toISOString() : null;

    const payload = {
      user_id: user.id,
      medium: input.medium,
      title: input.title.trim(),
      creator: input.creator?.trim() || null,
      year: input.year ?? null,
      poster_url: input.poster_url ?? null,
      status,
      rating: input.rating ?? null,
      reaction: input.reaction?.trim() || null,
      source_recommendation_id: input.source_recommendation_id ?? null,
      finished_at,
    };

    const { data, error } = await supabaseLibrary()
      .upsert(payload, {
        onConflict: "user_id,medium,title",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[library/log] failed", error);
      return { data: null, error: "Couldn't save to your library." };
    }
    return { data: cast(data as RawLibraryRow), error: null };
  }

  async list(filter?: {
    medium?: LibraryItem["medium"];
    status?: LibraryItem["status"];
    limit?: number;
  }): Promise<{ data: LibraryItem[]; error: string | null }> {
    let query = supabaseLibrary()
      .select("*")
      .order("logged_at", { ascending: false });

    if (filter?.medium) query = query.eq("medium", filter.medium);
    if (filter?.status) query = query.eq("status", filter.status);
    if (filter?.limit) query = query.limit(filter.limit);

    const { data, error } = await query;
    if (error) {
      console.error("[library/list] failed", error);
      return { data: [], error: "Couldn't load your library." };
    }
    return {
      data: (data ?? []).map((row: RawLibraryRow) => cast(row)),
      error: null,
    };
  }

  async update(
    id: string,
    input: UpdateLibraryInput,
  ): Promise<{ error: string | null }> {
    const patch: Record<string, unknown> = {};
    if (input.status !== undefined) {
      patch.status = input.status;
      if (input.status === "finished") {
        patch.finished_at = new Date().toISOString();
      }
    }
    if (input.rating !== undefined) patch.rating = input.rating;
    if (input.reaction !== undefined) {
      patch.reaction = input.reaction?.trim() || null;
    }

    if (Object.keys(patch).length === 0) return { error: null };

    const { error } = await supabaseLibrary().update(patch).eq("id", id);
    if (error) {
      console.error("[library/update] failed", error);
      return { error: "Couldn't update this entry." };
    }
    return { error: null };
  }

  async remove(id: string): Promise<{ error: string | null }> {
    const { error } = await supabaseLibrary().delete().eq("id", id);
    if (error) {
      console.error("[library/remove] failed", error);
      return { error: "Couldn't remove this entry." };
    }
    return { error: null };
  }

  /** Recent rated items, used as a taste signal in the recommendation prompt. */
  async recentRated(
    limit = 12,
  ): Promise<{ data: LibraryItem[]; error: string | null }> {
    const { data, error } = await supabaseLibrary()
      .select("*")
      .not("rating", "is", null)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[library/recentRated] failed", error);
      return { data: [], error: "Couldn't load taste signal." };
    }
    return {
      data: (data ?? []).map((row: RawLibraryRow) => cast(row)),
      error: null,
    };
  }
}

export const libraryService = new LibraryService();
