document.addEventListener('DOMContentLoaded', () => {
    displayRecommendations();
    handleAccountNav();
});

function handleAccountNav() {
    const accountNav = document.getElementById('account-nav');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (accountNav) {
        accountNav.style.display = isLoggedIn ? 'block' : 'none';
    }
}

function displayRecommendations() {
    try {
        const recommendationData = JSON.parse(localStorage.getItem('recommendationDetails'));
        console.log('Recommendation Data:', recommendationData);
        console.log('Recommendation Type:', localStorage.getItem('recommendationType'));
        if (!recommendationData) {
            showError('No recommendation data found. Please try the questionnaire again.');
            return;
        }

        const type = localStorage.getItem('recommendationType');
        
        // Hide both sections initially
        document.getElementById('movieSection').style.display = 'none';
        document.getElementById('bookSection').style.display = 'none';

        if (type === 'movie') {
            displayMovieRecommendation(recommendationData);
        } else if (type === 'book') {
            displayBookRecommendation(recommendationData);
        } else if (type === 'both') {
            const movieData = recommendationData.movie || recommendationData;
            const bookData = recommendationData.book || recommendationData;
            
            displayMovieRecommendation(movieData);
            displayBookRecommendation(bookData);
        } else {
            showError('Invalid recommendation type.');
        }
    } catch (error) {
        console.error('Error displaying recommendations:', error);
        showError('An error occurred while loading your recommendations.');
    }
}

function displayMovieRecommendation(data) {
    const movieSection = document.getElementById('movieSection');
    if (!movieSection) return;

    movieSection.style.display = 'block';
    
    const movieContent = `
        <div class="recommendation-content">
            <div class="poster-container">
                <img src="${data.posterPath || '/api/placeholder/300/450'}" 
                     alt="${data.title} Poster" 
                     class="recommendation-poster"
                     onerror="this.src='/api/placeholder/300/450'">
            </div>
            <div class="recommendation-details">
                <h3 class="recommendation-title">${data.title || 'Title Not Available'}</h3>
                <div class="recommendation-meta">
                    <p class="recommendation-age-rating">
                        <span class="meta-label">Age Rating:</span> 
                        ${data.ageRating || 'Not Rated'}
                    </p>
                    <p class="recommendation-genres">
                        <span class="meta-label">Genres:</span> 
                        ${data.genres ? data.genres.join(', ') : 'Not Available'}
                    </p>
                    <p class="recommendation-rating">
                        <span class="meta-label">Rating:</span> 
                        ${generateStarRating(data.rating)}
                    </p>
                </div>
                <p class="recommendation-description">
                    ${data.description || 'No description available.'}
                </p>
            </div>
        </div>
    `;

    const recommendationContainer = movieSection.querySelector('.recommendation-item');
    if (recommendationContainer) {
        recommendationContainer.innerHTML = movieContent;
    }
}

function displayBookRecommendation(data) {
    const bookSection = document.getElementById('bookSection');
    if (!bookSection) return;

    bookSection.style.display = 'block';
    
    const bookContent = `
        <div class="recommendation-content">
            <div class="poster-container">
                <img src="${data.posterPath || '/api/placeholder/300/450'}" 
                     alt="${data.title} Cover" 
                     class="recommendation-poster"
                     onerror="this.src='/api/placeholder/300/450'">
            </div>
            <div class="recommendation-details">
                <h3 class="recommendation-title">${data.title || 'Title Not Available'}</h3>
                <div class="recommendation-meta">
                    <p class="recommendation-age-rating">
                        <span class="meta-label">Age Rating:</span> 
                        ${data.ageRating || 'Not Rated'}
                    </p>
                    <p class="recommendation-genres">
                        <span class="meta-label">Genres:</span> 
                        ${data.genres ? data.genres.join(', ') : 'Not Available'}
                    </p>
                    <p class="recommendation-rating">
                        <span class="meta-label">Rating:</span> 
                        ${generateStarRating(data.rating)}
                    </p>
                </div>
                <p class="recommendation-description">
                    ${data.description || 'No description available.'}
                </p>
            </div>
        </div>
    `;

    const recommendationContainer = bookSection.querySelector('.recommendation-item');
    if (recommendationContainer) {
        recommendationContainer.innerHTML = bookContent;
    }
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);
    
    return `
        ${'★'.repeat(fullStars)}
        ${hasHalfStar ? '½' : ''}
        ${'☆'.repeat(emptyStars)}
        <span class="rating-number">(${rating}/5)</span>
    `;
}

function showError(message) {
    const resultsContainer = document.querySelector('.results-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        color: var(--text-color);
        padding: 20px;
        text-align: center;
        background-color: var(--box-color-light);
        border-radius: 8px;
        margin: 20px 0;
        border: 2px solid var(--button-bg-color);
    `;
    errorDiv.textContent = message;
    
    const introParagraph = resultsContainer.querySelector('p');
    introParagraph.parentNode.insertBefore(errorDiv, introParagraph.nextSibling);
}