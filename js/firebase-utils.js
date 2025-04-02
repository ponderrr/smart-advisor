import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";

export async function createUserProfile(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      email: userData.email,
      age: parseInt(userData.age),
      recommendationss: [],
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

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
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await createUserProfile(user.uid, {
        email: user.email,
        age: localStorage.getItem("userAge"),
      });
    }

    const currentRecs = userDoc.exists()
      ? userDoc.data().recommendationss || {}
      : {};
    const nextIndex = Object.keys(currentRecs).length;

    const newRec = {
      [`${nextIndex}`]: {
        type: recommendationData.type,
        questionData: recommendationData.questionData,
        answerData: recommendationData.answerData,
        recommendationDetails: recommendationData.recommendationDetails,
        timestamp: recommendationData.timestamp,
      },
    };

    await setDoc(userRef, { recommendationss: newRec }, { merge: true });
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

    const currentRecommendations = userDoc.exists()
      ? userDoc.data().recommendationss || []
      : [];

    if (recommendationData.type === "both") {
      // Handle movie recommendation
      const movieRecommendation = {
        type: "movie",
        questionData: recommendationData.questionData,
        answerData: recommendationData.answerData,
        recommendationDetails: recommendationData.recommendationDetails.movie,
        timestamp: new Date().toISOString(),
      };
      currentRecommendations.push(movieRecommendation);

      // Handle book recommendation
      const bookRecommendation = {
        type: "book",
        questionData: recommendationData.questionData,
        answerData: recommendationData.answerData,
        recommendationDetails: recommendationData.recommendationDetails.book,
        timestamp: new Date().toISOString(),
      };
      currentRecommendations.push(bookRecommendation);
    } else {
      // Handle single recommendation (movie or book)
      const recommendation = {
        type: recommendationData.type,
        questionData: recommendationData.questionData,
        answerData: recommendationData.answerData,
        recommendationDetails: recommendationData.recommendationDetails,
        timestamp: new Date().toISOString(),
      };
      currentRecommendations.push(recommendation);
    }

    await updateDoc(userRef, {
      recommendationss: currentRecommendations,
    });
  } catch (error) {
    console.error("Error saving recommendations:", error);
    throw error;
  }
}
