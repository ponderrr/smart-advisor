import { getUserProfile } from './firebase-utils.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user);
        if (!user) {
            window.location.href = 'sign-in.html';
            return;
        }

        try {
            const userProfile = await getUserProfile(user.uid);
            console.log('User profile:', userProfile);

            const userNameElement = document.querySelector('.user-info h2');
            if (userNameElement) {
                userNameElement.textContent = userProfile.email;
            }

            const recommendations = userProfile.recommendationss || {};
            console.log('Recommendations:', recommendations);

            if (Object.keys(recommendations).length === 0) {
                displayNoRecommendations();
                return;
            }

            // Get the first recommendation (0 key)
            const latestRec = recommendations['0'];
            if (latestRec) {
                if (latestRec.recommendationDetails.movie) {
                    displayMovieRecommendation(latestRec.recommendationDetails.movie);
                }
                if (latestRec.recommendationDetails.book) {
                    displayBookRecommendation(latestRec.recommendationDetails.book);
                }
            }

        } catch (error) {
            console.error('Error loading account data:', error);
            displayError('An error occurred while loading your profile.');
        }
    });
});

function displayMovieRecommendation(movieData) {
    const container = document.querySelector('.recommendations-section.movies .recommendation-details');
    if (!container) return;

    container.innerHTML = `
        <div class="recommendation-content">
            <h3 class="recommendation-title">${movieData.title}</h3>
            <p class="recommendation-rating">Rating: ${movieData.rating}/5</p>
            <p class="recommendation-age">Age Rating: ${movieData.ageRating}</p>
            <p class="recommendation-genres">Genres: ${movieData.genres.join(', ')}</p>
        </div>
    `;
}

function displayBookRecommendation(bookData) {
    const container = document.querySelector('.recommendations-section.books .recommendation-details');
    if (!container) return;

    container.innerHTML = `
        <div class="recommendation-content">
            <h3 class="recommendation-title">${bookData.title}</h3>
            <p class="recommendation-rating">Rating: ${bookData.rating}/5</p>
            <p class="recommendation-age">Age Rating: ${bookData.ageRating}</p>
            <p class="recommendation-genres">Genres: ${bookData.genres.join(', ')}</p>
        </div>
    `;
}

function displayNoRecommendations() {
    const movieContainer = document.querySelector('.recommendations-section.movies .recommendation-details');
    const bookContainer = document.querySelector('.recommendations-section.books .recommendation-details');

    const message = `
        <div class="no-recommendations">
            <p>No recommendations yet!</p>
            <p>Try getting some recommendations from our home page.</p>
        </div>
    `;
    
    if (movieContainer) movieContainer.innerHTML = message;
    if (bookContainer) bookContainer.innerHTML = message;
}

function displayError(message) {
    const containers = document.querySelectorAll('.recommendation-details');
    containers.forEach(container => {
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    });
}