// v1
// import { getUserProfile } from './firebase-utils.js';
// import { auth } from './firebase-config.js';
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// import { getMoviePoster } from './tmdb-service.js';
// import { getBookCover } from './google-books-service.js';

// document.addEventListener('DOMContentLoaded', () => {
//     console.log('DOM loaded');
//     onAuthStateChanged(auth, async (user) => {
//         console.log('Auth state changed:', user);
//         if (!user) {
//             window.location.href = 'sign-in.html';
//             return;
//         }

//         try {
//             const userProfile = await getUserProfile(user.uid);
//             console.log('User profile:', userProfile);

//             const userNameElement = document.querySelector('.user-info h2');
//             if (userNameElement) {
//                 userNameElement.textContent = userProfile.email;
//             }

//             const recommendations = userProfile.recommendationss || {};
//             console.log('Recommendations:', recommendations);

//             if (Object.keys(recommendations).length === 0) {
//                 displayNoRecommendations();
//                 return;
//             }

//             // Get the first recommendation (0 key)
//             const latestRec = recommendations['0'];
//             if (latestRec) {
//                 if (latestRec.recommendationDetails.movie) {
//                     await displayMovieRecommendation(latestRec.recommendationDetails.movie);
//                 }
//                 if (latestRec.recommendationDetails.book) {
//                     await displayBookRecommendation(latestRec.recommendationDetails.book);
//                 }
//             }

//         } catch (error) {
//             console.error('Error loading account data:', error);
//             displayError('An error occurred while loading your profile.');
//         }
//     });
// });

// async function displayMovieRecommendation(movieData) {
//     const container = document.querySelector('.recommendations-section.movies .recommendation-details');
//     if (!container) return;

//     // Get movie poster
//     const posterUrl = await getMoviePoster(movieData.title);
    
//     const description = movieData.recommendationDetails?.description || movieData.description || 'No description available.';

//     container.innerHTML = `
//         <h3 class="recommendation-title">${movieData.title}</h3>
//         <div class="recommendation-meta">
//             <p>
//                 <span class="meta-label">Age Rating:</span>
//                 ${movieData.ageRating || 'Not Rated'}
//             </p>
//             <p>
//                 <span class="meta-label">Genres:</span>
//                 ${movieData.genres ? movieData.genres.join(', ') : 'Not Available'}
//             </p>
//             <p>
//                 <span class="meta-label">Rating:</span>
//                 ${generateStarRating(movieData.rating)}
//             </p>
//         </div>
//         <p class="recommendation-description">${description}</p>
//     `;

//     // Update poster
//     const posterContainer = document.querySelector('.recommendations-section.movies .poster-container img');
//     if (posterContainer) {
//         posterContainer.src = posterUrl || '/api/placeholder/300/450';
//         posterContainer.alt = `${movieData.title} Poster`;
//     }
// }

// async function displayBookRecommendation(bookData) {
//     const container = document.querySelector('.recommendations-section.books .recommendation-details');
//     if (!container) return;

//     // Get book cover
//     const coverUrl = await getBookCover(bookData.title);
    
//     const description = bookData.recommendationDetails?.description || bookData.description || 'No description available.';

//     container.innerHTML = `
//         <h3 class="recommendation-title">${bookData.title}</h3>
//         <div class="recommendation-meta">
//             <p>
//                 <span class="meta-label">Age Rating:</span>
//                 ${bookData.ageRating || 'Not Rated'}
//             </p>
//             <p>
//                 <span class="meta-label">Genres:</span>
//                 ${bookData.genres ? bookData.genres.join(', ') : 'Not Available'}
//             </p>
//             <p>
//                 <span class="meta-label">Rating:</span>
//                 ${generateStarRating(bookData.rating)}
//             </p>
//         </div>
//         <p class="recommendation-description">${description}</p>
//     `;

//     // Update poster
//     const posterContainer = document.querySelector('.recommendations-section.books .poster-container img');
//     if (posterContainer) {
//         posterContainer.src = coverUrl || '/api/placeholder/300/450';
//         posterContainer.alt = `${bookData.title} Cover`;
//     }
// }

// function generateStarRating(rating) {
//     const validRating = Math.min(Math.max(0, rating), 5);
//     const fullStars = Math.floor(validRating);
//     const hasHalfStar = validRating % 1 >= 0.5;
//     const emptyStars = 5 - Math.ceil(validRating);
    
//     return `
//         ${fullStars > 0 ? '★'.repeat(fullStars) : ''}
//         ${hasHalfStar ? '½' : ''}
//         ${emptyStars > 0 ? '☆'.repeat(emptyStars) : ''}
//         <span class="rating-number">(${validRating.toFixed(1)}/5)</span>
//     `;
// }

// function displayNoRecommendations() {
//     const movieContainer = document.querySelector('.recommendations-section.movies .recommendation-content');
//     const bookContainer = document.querySelector('.recommendations-section.books .recommendation-content');

//     const message = `
//         <div class="no-recommendations" style="width: 100%; text-align: center;">
//             <p>No recommendations yet!</p>
//             <p>Try getting some recommendations from our home page.</p>
//         </div>
//     `;
    
//     if (movieContainer) movieContainer.innerHTML = message;
//     if (bookContainer) bookContainer.innerHTML = message;
// }

// function displayError(message) {
//     const containers = document.querySelectorAll('.recommendation-content');
//     containers.forEach(container => {
//         container.innerHTML = `
//             <div class="error-message" style="width: 100%; text-align: center;">
//                 <p>${message}</p>
//             </div>
//         `;
//     });
// }











// v2
// import { getUserProfile } from './firebase-utils.js';
// import { auth } from './firebase-config.js';
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// import { getMoviePoster } from './tmdb-service.js';
// import { getBookCover } from './google-books-service.js';

// document.addEventListener('DOMContentLoaded', () => {
//     console.log('DOM loaded');
//     onAuthStateChanged(auth, async (user) => {
//         console.log('Auth state changed:', user);
//         if (!user) {
//             window.location.href = 'sign-in.html';
//             return;
//         }

//         try {
//             const userProfile = await getUserProfile(user.uid);
//             console.log('User profile:', userProfile);

//             const userNameElement = document.querySelector('.user-info h2');
//             if (userNameElement) {
//                 userNameElement.textContent = userProfile.email;
//             }

//             const recommendations = userProfile.recommendationss || {};
//             console.log('Recommendations:', recommendations);

//             if (Object.keys(recommendations).length === 0) {
//                 displayNoRecommendations();
//                 return;
//             }

//             // Get the first recommendation (0 key)
//             const latestRec = recommendations['0'];
//             console.log('Latest recommendation:', latestRec);
            
//             if (latestRec) {
//                 if (latestRec.type === 'both') {
//                     if (latestRec.recommendationDetails.movie) {
//                         await displayMovieRecommendation(latestRec.recommendationDetails.movie);
//                     }
//                     if (latestRec.recommendationDetails.book) {
//                         await displayBookRecommendation(latestRec.recommendationDetails.book);
//                     }
//                 } else if (latestRec.type === 'movie') {
//                     await displayMovieRecommendation(latestRec.recommendationDetails);
//                 } else if (latestRec.type === 'book') {
//                     await displayBookRecommendation(latestRec.recommendationDetails);
//                 }
//             }

//         } catch (error) {
//             console.error('Error loading account data:', error);
//             displayError('An error occurred while loading your profile.');
//         }
//     });
// });

// async function displayMovieRecommendation(movieData) {
//     console.log('Movie Data:', movieData);
//     const container = document.querySelector('.recommendations-section.movies .recommendation-details');
//     if (!container) return;

//     // Get movie poster
//     const posterUrl = await getMoviePoster(movieData.title);

//     container.innerHTML = `
//         <h3 class="recommendation-title">${movieData.title}</h3>
//         <div class="recommendation-meta">
//             <p>
//                 <span class="meta-label">Age Rating:</span>
//                 ${movieData.ageRating || 'Not Rated'}
//             </p>
//             <p>
//                 <span class="meta-label">Genres:</span>
//                 ${movieData.genres ? movieData.genres.join(', ') : 'Not Available'}
//             </p>
//             <p>
//                 <span class="meta-label">Rating:</span>
//                 ${generateStarRating(movieData.rating)}
//             </p>
//         </div>
//         <p class="recommendation-description">${movieData.description || 'No description available.'}</p>
//     `;

//     // Update poster
//     const posterContainer = document.querySelector('.recommendations-section.movies .poster-container img');
//     if (posterContainer) {
//         posterContainer.src = posterUrl || '/api/placeholder/300/450';
//         posterContainer.alt = `${movieData.title} Poster`;
//     }
// }

// async function displayBookRecommendation(bookData) {
//     console.log('Book Data:', bookData);
//     const container = document.querySelector('.recommendations-section.books .recommendation-details');
//     if (!container) return;

//     // Get book cover
//     const coverUrl = await getBookCover(bookData.title);

//     container.innerHTML = `
//         <h3 class="recommendation-title">${bookData.title}</h3>
//         <div class="recommendation-meta">
//             <p>
//                 <span class="meta-label">Age Rating:</span>
//                 ${bookData.ageRating || 'Not Rated'}
//             </p>
//             <p>
//                 <span class="meta-label">Genres:</span>
//                 ${bookData.genres ? bookData.genres.join(', ') : 'Not Available'}
//             </p>
//             <p>
//                 <span class="meta-label">Rating:</span>
//                 ${generateStarRating(bookData.rating)}
//             </p>
//         </div>
//         <p class="recommendation-description">${bookData.description || 'No description available.'}</p>
//     `;

//     // Update poster
//     const posterContainer = document.querySelector('.recommendations-section.books .poster-container img');
//     if (posterContainer) {
//         coverUrl || '/api/placeholder/300/450';
//         bookContainer.alt = `${bookData.title} Cover`;
//     }
// }

// function generateStarRating(rating) {
//     const validRating = Math.min(Math.max(0, rating), 5);
//     const fullStars = Math.floor(validRating);
//     const hasHalfStar = validRating % 1 >= 0.5;
//     const emptyStars = 5 - Math.ceil(validRating);
    
//     return `
//         ${fullStars > 0 ? '★'.repeat(fullStars) : ''}
//         ${hasHalfStar ? '½' : ''}
//         ${emptyStars > 0 ? '☆'.repeat(emptyStars) : ''}
//         <span class="rating-number">(${validRating.toFixed(1)}/5)</span>
//     `;
// }

// function displayNoRecommendations() {
//     const movieContainer = document.querySelector('.recommendations-section.movies .recommendation-content');
//     const bookContainer = document.querySelector('.recommendations-section.books .recommendation-content');

//     const message = `
//         <div class="no-recommendations" style="width: 100%; text-align: center;">
//             <p>No recommendations yet!</p>
//             <p>Try getting some recommendations from our home page.</p>
//         </div>
//     `;
    
//     if (movieContainer) movieContainer.innerHTML = message;
//     if (bookContainer) bookContainer.innerHTML = message;
// }

// function displayError(message) {
//     const containers = document.querySelectorAll('.recommendation-content');
//     containers.forEach(container => {
//         container.innerHTML = `
//             <div class="error-message" style="width: 100%; text-align: center;">
//                 <p>${message}</p>
//             </div>
//         `;
//     });
// }








// import { getUserProfile } from './firebase-utils.js';
// import { auth } from './firebase-config.js';
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// import { getMoviePoster } from './tmdb-service.js';
// import { getBookCover } from './google-books-service.js';

// document.addEventListener('DOMContentLoaded', () => {
//     console.log('DOM loaded');
//     onAuthStateChanged(auth, async (user) => {
//         console.log('Auth state changed:', user);
//         if (!user) {
//             window.location.href = 'sign-in.html';
//             return;
//         }

//         try {
//             const userProfile = await getUserProfile(user.uid);
//             console.log('User profile:', userProfile);

//             const userNameElement = document.querySelector('.user-info h2');
//             if (userNameElement) {
//                 userNameElement.textContent = userProfile.email;
//             }

//             const recommendations = userProfile.recommendationss || {};
//             console.log('Recommendations:', recommendations);

//             if (Object.keys(recommendations).length === 0) {
//                 displayNoRecommendations();
//                 return;
//             }

//             // Get the first recommendation (1 key)
//             const latestRec = recommendations['1'];
//             console.log('Latest recommendation:', latestRec);

//             if (latestRec) {
//                 if (latestRec.recommendationDetails.movie) {
//                     await displayMovieRecommendation(latestRec.recommendationDetails.movie);
//                 }
//                 if (latestRec.recommendationDetails.book) {
//                     await displayBookRecommendation(latestRec.recommendationDetails.book);
//                 }
//             }

//         } catch (error) {
//             console.error('Error loading account data:', error);
//             displayError('An error occurred while loading your profile.');
//         }
//     });
// });

// async function displayMovieRecommendation(movieData) {
//     console.log('Movie Data:', movieData);
//     const container = document.querySelector('.recommendations-section.movies .recommendation-details');
//     if (!container) return;

//     // Get movie poster
//     const posterUrl = await getMoviePoster(movieData.title);

//     container.innerHTML = `
//         <h3 class="recommendation-title">${movieData.title}</h3>
//         <div class="recommendation-meta">
//             <p>
//                 <span class="meta-label">Age Rating:</span>
//                 ${movieData.ageRating || 'Not Rated'}
//             </p>
//             <p>
//                 <span class="meta-label">Genres:</span>
//                 ${movieData.genres ? movieData.genres.join(', ') : 'Not Available'}
//             </p>
//             <p>
//                 <span class="meta-label">Rating:</span>
//                 ${generateStarRating(movieData.rating)}
//             </p>
//         </div>
//         <p class="recommendation-description">${movieData.description || 'No description available.'}</p>
//     `;

//     // Update poster
//     const posterContainer = document.querySelector('.recommendations-section.movies .poster-container img');
//     if (posterContainer) {
//         posterContainer.src = posterUrl || '/api/placeholder/300/450';
//         posterContainer.alt = `${movieData.title} Poster`;
//     }
// }

// async function displayBookRecommendation(bookData) {
//     console.log('Book Data:', bookData);
//     const container = document.querySelector('.recommendations-section.books .recommendation-details');
//     if (!container) return;

//     // Get book cover
//     const coverUrl = await getBookCover(bookData.title);

//     container.innerHTML = `
//         <h3 class="recommendation-title">${bookData.title}</h3>
//         <div class="recommendation-meta">
//             <p>
//                 <span class="meta-label">Age Rating:</span>
//                 ${bookData.ageRating || 'Not Rated'}
//             </p>
//             <p>
//                 <span class="meta-label">Genres:</span>
//                 ${bookData.genres ? bookData.genres.join(', ') : 'Not Available'}
//             </p>
//             <p>
//                 <span class="meta-label">Rating:</span>
//                 ${generateStarRating(bookData.rating)}
//             </p>
//         </div>
//         <p class="recommendation-description">${bookData.description || 'No description available.'}</p>
//     `;

//     // Update poster
//     const posterContainer = document.querySelector('.recommendations-section.books .poster-container img');
//     if (posterContainer) {
//         posterContainer.src = coverUrl || '/api/placeholder/300/450';
//         posterContainer.alt = `${bookData.title} Cover`;
//     }
// }

// function generateStarRating(rating) {
//     const validRating = Math.min(Math.max(0, rating), 5);
//     const fullStars = Math.floor(validRating);
//     const hasHalfStar = validRating % 1 >= 0.5;
//     const emptyStars = 5 - Math.ceil(validRating);
    
//     return `
//         ${fullStars > 0 ? '★'.repeat(fullStars) : ''}
//         ${hasHalfStar ? '½' : ''}
//         ${emptyStars > 0 ? '☆'.repeat(emptyStars) : ''}
//         <span class="rating-number">(${validRating.toFixed(1)}/5)</span>
//     `;
// }

// function displayNoRecommendations() {
//     const movieContainer = document.querySelector('.recommendations-section.movies .recommendation-content');
//     const bookContainer = document.querySelector('.recommendations-section.books .recommendation-content');

//     const message = `
//         <div class="no-recommendations" style="width: 100%; text-align: center;">
//             <p>No recommendations yet!</p>
//             <p>Try getting some recommendations from our home page.</p>
//         </div>
//     `;
    
//     if (movieContainer) movieContainer.innerHTML = message;
//     if (bookContainer) bookContainer.innerHTML = message;
// }

// function displayError(message) {
//     const containers = document.querySelectorAll('.recommendation-content');
//     containers.forEach(container => {
//         container.innerHTML = `
//             <div class="error-message" style="width: 100%; text-align: center;">
//                 <p>${message}</p>
//             </div>
//         `;
//     });
// }




import { getUserProfile } from './firebase-utils.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getMoviePoster } from './tmdb-service.js';
import { getBookCover } from './google-books-service.js';

// Function to get the latest recommendation index
function getLatestRecommendationIndex(recommendations) {
    const keys = Object.keys(recommendations)
        .map(key => parseInt(key))
        .filter(key => !isNaN(key));
    
    return Math.max(...keys);
}

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

            // Get the most recent recommendation
            const latestIndex = getLatestRecommendationIndex(recommendations);
            const latestRec = recommendations[latestIndex];
            console.log('Latest recommendation:', latestRec);

            if (latestRec) {
                if (latestRec.recommendationDetails.movie) {
                    await displayMovieRecommendation(latestRec.recommendationDetails.movie);
                }
                if (latestRec.recommendationDetails.book) {
                    await displayBookRecommendation(latestRec.recommendationDetails.book);
                }
            }

        } catch (error) {
            console.error('Error loading account data:', error);
            displayError('An error occurred while loading your profile.');
        }
    });
});

async function displayMovieRecommendation(movieData) {
    console.log('Movie Data:', movieData);
    const container = document.querySelector('.recommendations-section.movies .recommendation-details');
    if (!container) return;

    // Get movie poster
    const posterUrl = await getMoviePoster(movieData.title);

    container.innerHTML = `
        <h3 class="recommendation-title">${movieData.title}</h3>
        <div class="recommendation-meta">
            <p>
                <span class="meta-label">Age Rating:</span>
                ${movieData.ageRating || 'Not Rated'}
            </p>
            <p>
                <span class="meta-label">Genres:</span>
                ${movieData.genres ? movieData.genres.join(', ') : 'Not Available'}
            </p>
            <p>
                <span class="meta-label">Rating:</span>
                ${generateStarRating(movieData.rating)}
            </p>
        </div>
        <p class="recommendation-description">${movieData.description || 'No description available.'}</p>
    `;

    // Update poster
    const posterContainer = document.querySelector('.recommendations-section.movies .poster-container img');
    if (posterContainer) {
        posterContainer.src = posterUrl || '/api/placeholder/300/450';
        posterContainer.alt = `${movieData.title} Poster`;
    }
}

async function displayBookRecommendation(bookData) {
    console.log('Book Data:', bookData);
    const container = document.querySelector('.recommendations-section.books .recommendation-details');
    if (!container) return;

    // Get book cover
    const coverUrl = await getBookCover(bookData.title);

    container.innerHTML = `
        <h3 class="recommendation-title">${bookData.title}</h3>
        <div class="recommendation-meta">
            <p>
                <span class="meta-label">Age Rating:</span>
                ${bookData.ageRating || 'Not Rated'}
            </p>
            <p>
                <span class="meta-label">Genres:</span>
                ${bookData.genres ? bookData.genres.join(', ') : 'Not Available'}
            </p>
            <p>
                <span class="meta-label">Rating:</span>
                ${generateStarRating(bookData.rating)}
            </p>
        </div>
        <p class="recommendation-description">${bookData.description || 'No description available.'}</p>
    `;

    // Update poster
    const posterContainer = document.querySelector('.recommendations-section.books .poster-container img');
    if (posterContainer) {
        posterContainer.src = coverUrl || '/api/placeholder/300/450';
        posterContainer.alt = `${bookData.title} Cover`;
    }
}

function generateStarRating(rating) {
    const validRating = Math.min(Math.max(0, rating), 5);
    const fullStars = Math.floor(validRating);
    const hasHalfStar = validRating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(validRating);
    
    return `
        ${fullStars > 0 ? '★'.repeat(fullStars) : ''}
        ${hasHalfStar ? '½' : ''}
        ${emptyStars > 0 ? '☆'.repeat(emptyStars) : ''}
        <span class="rating-number">(${validRating.toFixed(1)}/5)</span>
    `;
}

function displayNoRecommendations() {
    const movieContainer = document.querySelector('.recommendations-section.movies .recommendation-content');
    const bookContainer = document.querySelector('.recommendations-section.books .recommendation-content');

    const message = `
        <div class="no-recommendations" style="width: 100%; text-align: center;">
            <p>No recommendations yet!</p>
            <p>Try getting some recommendations from our home page.</p>
        </div>
    `;
    
    if (movieContainer) movieContainer.innerHTML = message;
    if (bookContainer) bookContainer.innerHTML = message;
}

function displayError(message) {
    const containers = document.querySelectorAll('.recommendation-content');
    containers.forEach(container => {
        container.innerHTML = `
            <div class="error-message" style="width: 100%; text-align: center;">
                <p>${message}</p>
            </div>
        `;
    });
}