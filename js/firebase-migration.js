// firebase-migration.js
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db, auth } from './firebase-config.js';

export async function migrateUserRecommendations(userId) {
    const userRef = doc(db, "users", userId);
    
    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const oldRecs = userData.recommendationss || [];
        const newRecs = [];

        for (const rec of oldRecs) {
            if (rec.type === 'both') {
                // Split old 'both' recommendations into separate entries
                const commonData = {
                    questionData: rec.questionData,
                    answerData: rec.answerData,
                    timestamp: rec.timestamp
                };

                // Create movie recommendation
                newRecs.push({
                    ...commonData,
                    type: 'movie',
                    recommendationDetails: {
                        title: rec.recommendationDetails.title,
                        rating: rec.recommendationDetails.rating,
                        genres: rec.recommendationDetails.genres,
                        ageRating: rec.recommendationDetails.ageRating,
                        type: 'movie'
                    }
                });

                // Create separate book recommendation if it exists
                if (rec.recommendationDetails.book) {
                    newRecs.push({
                        ...commonData,
                        type: 'book',
                        recommendationDetails: rec.recommendationDetails.book
                    });
                }
            } else {
                // Keep single-type recommendations as is
                newRecs.push(rec);
            }
        }

        // Update the user document with migrated recommendations
        await updateDoc(userRef, {
            recommendationss: newRecs
        });

    } catch (error) {
        console.error("Error during migration:", error);
        throw error;
    }
}