import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase-config.js";

export async function migrateUserRecommendations(userId) {
  const userRef = doc(db, "users", userId);

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const oldRecs = userData.recommendationss || [];
    const newRecs = [];

    // Extract unique titles for history
    const recommendationHistory = [];

    for (const rec of oldRecs) {
      if (rec.type === "both") {
        // Split old 'both' recommendations into separate entries
        const commonData = {
          questionData: rec.questionData,
          answerData: rec.answerData,
          timestamp: rec.timestamp,
        };

        // Create movie recommendation
        if (rec.recommendationDetails?.title) {
          recommendationHistory.push(rec.recommendationDetails.title);
        }

        newRecs.push({
          ...commonData,
          type: "movie",
          recommendationDetails: {
            title: rec.recommendationDetails.title,
            rating: rec.recommendationDetails.rating,
            genres: rec.recommendationDetails.genres,
            ageRating: rec.recommendationDetails.ageRating,
            type: "movie",
          },
        });

        // Create separate book recommendation if it exists
        if (rec.recommendationDetails.book) {
          if (rec.recommendationDetails.book?.title) {
            recommendationHistory.push(rec.recommendationDetails.book.title);
          }

          newRecs.push({
            ...commonData,
            type: "book",
            recommendationDetails: rec.recommendationDetails.book,
          });
        }
      } else {
        if (rec.recommendationDetails?.title) {
          recommendationHistory.push(rec.recommendationDetails.title);
        }

        newRecs.push(rec);
      }
    }

    // Create preferences object if it doesn't exist
    const preferences = userData.preferences || {
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

    // Add unique titles to history
    preferences.recommendationHistory = [...new Set(recommendationHistory)];

    // Update the user document with migrated recommendations and preferences
    await updateDoc(userRef, {
      recommendationss: newRecs,
      preferences: preferences,
    });
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

// Add a new migration function to update all users with the new preferences structure
export async function migrateAllUsersToNewStructure() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));

    for (const userDoc of querySnapshot.docs) {
      const userData = userDoc.data();
      const userRef = doc(db, "users", userDoc.id);

      // Skip if already migrated
      if (userData.preferences) continue;

      // Create preferences object
      const preferences = {
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

      // Extract recommendation titles for history
      if (userData.recommendationss && userData.recommendationss.length > 0) {
        const titles = userData.recommendationss
          .map((rec) => rec.recommendationDetails?.title)
          .filter((title) => title);

        preferences.recommendationHistory = [...new Set(titles)];
      }

      // Update user document
      await updateDoc(userRef, { preferences });
      console.log(`Migrated user: ${userDoc.id}`);
    }

    console.log("Migration complete");
    return { success: true };
  } catch (error) {
    console.error("Error during all users migration:", error);
    throw error;
  }
}
