import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db, auth } from './firebase-config.js';

export async function saveUserRecommendation(recommendationData) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    try {
        await updateDoc(userRef, {
            recommendations: arrayUnion({
                type: recommendationData.type,
                questionData: recommendationData.questionData,
                answerData: recommendationData.answerData,
                recommendationDetails: recommendationData.recommendationDetails,
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error("Error saving recommendation:", error);
        throw error;
    }
}

export async function createUserProfile(userId, userData) {
    try {
        await setDoc(doc(db, "users", userId), {
            email: userData.email,
            age: Number(userData.age),
            recommendations: []
        });
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
}

// Keep this function - it's used to get all user data
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