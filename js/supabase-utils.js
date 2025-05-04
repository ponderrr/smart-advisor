import { supabase } from "./supabase-config.js";

export async function createUserProfile(userId, userData) {
  try {
    const { error } = await supabase.from("users").insert([
      {
        id: userId,
        email: userData.email,
        username: userData.username || userData.email.split("@")[0], // Default username from email
        age: parseInt(userData.age),
        recommendations: [],
        profile_picture_url: null,
        profile_picture_updated: null,
        preferences: {
          accessibility: {
            requireSubtitles: false,
            requireAudioDescription: false,
            requireClosedCaptions: false,
          },
          contentFilters: {
            excludeViolentContent: false,
            excludeSexualContent: false,
          },
          recommendationHistory: [],
        },
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

export async function saveUserRecommendation(recommendationData) {
  console.log("Starting saveUserRecommendation");

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Current user:", user);

    if (!user) {
      console.error("No user logged in");
      return;
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("recommendations, preferences")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    let currentRecommendations = [];
    let recommendationHistory = [];

    if (userData) {
      if (userData.recommendations && Array.isArray(userData.recommendations)) {
        currentRecommendations = [...userData.recommendations];
      }

      if (userData.preferences?.recommendationHistory) {
        recommendationHistory = [...userData.preferences.recommendationHistory];
      }
    } else {
      await createUserProfile(user.id, {
        email: user.email,
        age: localStorage.getItem("userAge"),
      });
    }

    currentRecommendations.push({
      type: recommendationData.type,
      questionData: recommendationData.questionData,
      answerData: recommendationData.answerData,
      recommendationDetails: recommendationData.recommendationDetails,
      timestamp: recommendationData.timestamp,
    });

    const titleToAdd = recommendationData.recommendationDetails.title;
    if (titleToAdd && !recommendationHistory.includes(titleToAdd)) {
      recommendationHistory.push(titleToAdd);
    }

    const preferences = userData?.preferences || {
      accessibility: {
        requireSubtitles: false,
        requireAudioDescription: false,
        requireClosedCaptions: false,
      },
      contentFilters: {
        excludeViolentContent: false,
        excludeSexualContent: false,
      },
      recommendationHistory: [],
    };

    preferences.recommendationHistory = recommendationHistory;

    const { error: updateError } = await supabase
      .from("users")
      .update({
        recommendations: currentRecommendations,
        preferences: preferences,
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    console.log(
      "Successfully saved recommendation, new count:",
      currentRecommendations.length
    );
  } catch (error) {
    console.error("Error saving recommendation:", error);
    throw error;
  }
}

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    if (data) {
      data.profilePictureURL = data.profile_picture_url;
      data.profilePictureUpdated = data.profile_picture_updated;
      data.recommendationss = data.recommendations;
    }

    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

export async function saveUserRecommendations(recommendationData) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("No user logged in");
      return;
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("recommendations, preferences")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!userData) {
      await createUserProfile(user.id, {
        email: user.email,
        age: localStorage.getItem("userAge"),
      });
    }

    const currentRecommendations = userData?.recommendations || [];
    const recommendationHistory =
      userData?.preferences?.recommendationHistory || [];
    const newTimestamp = new Date().toISOString();

    const titlesToAdd = [];

    if (recommendationData.type === "both") {
      const movieTitle = recommendationData.recommendationDetails.movie?.title;
      if (movieTitle && !recommendationHistory.includes(movieTitle)) {
        titlesToAdd.push(movieTitle);

        const movieRecommendation = {
          type: "movie",
          questionData: recommendationData.questionData,
          answerData: recommendationData.answerData,
          recommendationDetails: recommendationData.recommendationDetails.movie,
          timestamp: newTimestamp,
        };
        currentRecommendations.push(movieRecommendation);
      }

      const bookTitle = recommendationData.recommendationDetails.book?.title;
      if (bookTitle && !recommendationHistory.includes(bookTitle)) {
        titlesToAdd.push(bookTitle);

        const bookRecommendation = {
          type: "book",
          questionData: recommendationData.questionData,
          answerData: recommendationData.answerData,
          recommendationDetails: recommendationData.recommendationDetails.book,
          timestamp: newTimestamp,
        };
        currentRecommendations.push(bookRecommendation);
      }
    } else {
      const title = recommendationData.recommendationDetails?.title;
      if (title && !recommendationHistory.includes(title)) {
        titlesToAdd.push(title);

        const recommendation = {
          type: recommendationData.type,
          questionData: recommendationData.questionData,
          answerData: recommendationData.answerData,
          recommendationDetails: recommendationData.recommendationDetails,
          timestamp: newTimestamp,
        };
        currentRecommendations.push(recommendation);
      }
    }

    const preferences = userData?.preferences || {
      accessibility: {
        requireSubtitles: false,
        requireAudioDescription: false,
        requireClosedCaptions: false,
      },
      contentFilters: {
        excludeViolentContent: false,
        excludeSexualContent: false,
      },
      recommendationHistory: [],
    };

    preferences.recommendationHistory = [
      ...recommendationHistory,
      ...titlesToAdd,
    ];

    const { error: updateError } = await supabase
      .from("users")
      .update({
        recommendations: currentRecommendations,
        preferences: preferences,
      })
      .eq("id", user.id);

    if (updateError) throw updateError;
  } catch (error) {
    console.error("Error saving recommendations:", error);
    throw error;
  }
}

export async function updateAccessibilityPreferences(preferences) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .single();

    if (fetchError) throw fetchError;

    const updatedPreferences = {
      ...(data?.preferences || {}),
      accessibility: preferences,
    };

    const { error } = await supabase
      .from("users")
      .update({
        preferences: updatedPreferences,
      })
      .eq("id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating accessibility preferences:", error);
    throw error;
  }
}

export async function getUserRecommendationHistory() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    const { data, error } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return data?.preferences?.recommendationHistory || [];
  } catch (error) {
    console.error("Error getting recommendation history:", error);
    throw error;
  }
}

export async function checkUsernameAvailability(username) {
  try {
    const { data, error, count } = await supabase
      .from("users")
      .select("*", { count: "exact" })
      .eq("username", username);

    if (error) throw error;

    return { available: count === 0 };
  } catch (error) {
    console.error("Error checking username availability:", error);
    return { available: false, error: error.message };
  }
}

export async function updateProfilePictureURL(userId, url) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { error } = await supabase
      .from("users")
      .update({
        profile_picture_url: url,
        profile_picture_updated: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;

    localStorage.setItem("profilePictureURL", url);

    return { success: true };
  } catch (error) {
    console.error("Error updating profile picture URL:", error);
    throw error;
  }
}

export async function removeProfilePicture(userId) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { error } = await supabase
      .from("users")
      .update({
        profile_picture_url: null,
        profile_picture_updated: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;

    localStorage.removeItem("profilePictureURL");

    return { success: true };
  } catch (error) {
    console.error("Error removing profile picture:", error);
    throw error;
  }
}
