import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase-config.js";

export async function createUserProfile(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      email: userData.email,
      age: parseInt(userData.age),
      recommendationss: [],
      // Add new fields for user preferences
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
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

// Fix for saveUserRecommendation function to properly append recommendations
export async function saveUserRecommendation(recommendationData) {
  console.log("Starting saveUserRecommendation");
  const user = auth.currentUser;
  console.log("Current user:", user);

  if (!user) {
    console.error("No user logged in");
    return;
  }

  const userRef = doc(db, "users", user.uid);

  try {
    // First get the current user data
    const userDoc = await getDoc(userRef);
    let currentRecommendations = [];

    // If the user exists, get their current recommendations
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Check if recommendations exist and is an array
      if (
        userData.recommendationss &&
        Array.isArray(userData.recommendationss)
      ) {
        currentRecommendations = [...userData.recommendationss];
      }
      // If it's an object, convert to array
      else if (
        userData.recommendationss &&
        typeof userData.recommendationss === "object"
      ) {
        currentRecommendations = Object.values(userData.recommendationss);
      }
      // If it doesn't exist, create an empty array
      else {
        currentRecommendations = [];
      }
    } else {
      // Create user profile if it doesn't exist
      await createUserProfile(user.uid, {
        email: user.email,
        age: localStorage.getItem("userAge"),
      });
    }

    // Add the new recommendation to the array
    currentRecommendations.push({
      type: recommendationData.type,
      questionData: recommendationData.questionData,
      answerData: recommendationData.answerData,
      recommendationDetails: recommendationData.recommendationDetails,
      timestamp: recommendationData.timestamp,
    });

    // Add the recommendation to history to prevent duplicates
    let recommendationHistory = [];
    if (userDoc.exists() && userDoc.data().preferences?.recommendationHistory) {
      recommendationHistory = [
        ...userDoc.data().preferences.recommendationHistory,
      ];
    }

    // Add the new recommendation to history
    const titleToAdd = recommendationData.recommendationDetails.title;
    if (titleToAdd && !recommendationHistory.includes(titleToAdd)) {
      recommendationHistory.push(titleToAdd);
    }

    // Update with the new recommendations array and history
    await updateDoc(userRef, {
      recommendationss: currentRecommendations,
      "preferences.recommendationHistory": recommendationHistory,
    });

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
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

// Handle both single and combined recommendations
export async function saveUserRecommendations(recommendationData) {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return;
  }

  const userRef = doc(db, "users", user.uid);

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await createUserProfile(user.uid, {
        email: user.email,
        age: localStorage.getItem("userAge"),
      });
    }

    const userData = userDoc.data();
    const currentRecommendations = userData.recommendationss || [];
    const recommendationHistory =
      userData.preferences?.recommendationHistory || [];
    const newTimestamp = new Date().toISOString();

    // Titles to add to history
    const titlesToAdd = [];

    if (recommendationData.type === "both") {
      // Handle movie recommendation
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

      // Handle book recommendation
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
      // Handle single recommendation (movie or book)
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

    // Update recommendations and history
    await updateDoc(userRef, {
      recommendationss: currentRecommendations,
      "preferences.recommendationHistory": [
        ...recommendationHistory,
        ...titlesToAdd,
      ],
    });
  } catch (error) {
    console.error("Error saving recommendations:", error);
    throw error;
  }
}

// New function to update user accessibility preferences
export async function updateAccessibilityPreferences(preferences) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user logged in");
  }

  const userRef = doc(db, "users", user.uid);

  try {
    await updateDoc(userRef, {
      "preferences.accessibility": preferences,
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating accessibility preferences:", error);
    throw error;
  }
}

// New function to get user recommendation history
export async function getUserRecommendationHistory() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user logged in");
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.preferences?.recommendationHistory || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting recommendation history:", error);
    throw error;
  }
}
