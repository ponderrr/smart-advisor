document.addEventListener('DOMContentLoaded', () => {
    displayRecommendations();
    handleAccountNav();
});

function generateStarRating(rating) {
    // Ensure rating is between 0 and 5
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

function displayMovieRecommendation(data) {
    const movieSection = document.getElementById('movieSection');
    if (!movieSection) return;

    movieSection.style.display = 'block';

    console.log('Movie Poster URL:', data.posterPath);
    
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

function displayRecommendations() {
    try {
        const recommendationData = JSON.parse(localStorage.getItem('recommendationDetails'));
        console.log('Recommendation Data:', recommendationData);
        
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
            displayMovieRecommendation(recommendationData.movie || recommendationData);
            displayBookRecommendation(recommendationData.book || recommendationData);
        } else {
            showError('Invalid recommendation type.');
        }
    } catch (error) {
        console.error('Error displaying recommendations:', error);
        showError('An error occurred while loading your recommendations.');
    }
}

function showError(message) {
    const resultsContainer = document.querySelector('.results-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert error message after the title
    const titleElement = resultsContainer.querySelector('h1');
    if (titleElement && titleElement.nextSibling) {
        titleElement.parentNode.insertBefore(errorDiv, titleElement.nextSibling);
    } else {
        resultsContainer.appendChild(errorDiv);
    }
}

function handleAccountNav() {
    const accountNav = document.getElementById('account-nav');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (accountNav) {
        accountNav.style.display = isLoggedIn ? 'block' : 'none';
    }
}