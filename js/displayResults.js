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
    
    document.getElementById('movieTitle').textContent = data.title || 'Title Not Available';
    document.getElementById('movieAgeRating').textContent = `Age Rating: ${data.ageRating || 'Not Rated'}`;
    document.getElementById('movieGenres').textContent = `Genres: ${data.genres ? data.genres.join(', ') : 'Not Available'}`;
    document.getElementById('movieRating').textContent = `Rating: ${data.rating || '0'}/5`;
}

function displayBookRecommendation(data) {
    const bookSection = document.getElementById('bookSection');
    if (!bookSection) return;

    bookSection.style.display = 'block';
    
    document.getElementById('bookTitle').textContent = data.title || 'Title Not Available';
    document.getElementById('bookAgeRating').textContent = `Age Rating: ${data.ageRating || 'Not Rated'}`;
    document.getElementById('bookGenres').textContent = `Genres: ${data.genres ? data.genres.join(', ') : 'Not Available'}`;
    document.getElementById('bookRating').textContent = `Rating: ${data.rating || '0'}/5`;
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