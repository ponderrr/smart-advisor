import { getUserProfile } from './firebase-utils.js';
import { auth } from './firebase-config.js';
import { getMoviePoster } from './tmdb-service.js';
import { getBookCover } from './google-books-service.js';

// Global variables to store recommendation data
let allMovieRecommendations = [];
let allBookRecommendations = [];
let currentMovieIndex = 0;
let currentBookIndex = 0;

// Load all user recommendations on page load
export async function loadAllRecommendations() {
    try {
        if (!auth.currentUser) {
            console.error("User not logged in");
            return;
        }

        const userProfile = await getUserProfile(auth.currentUser.uid);
        if (!userProfile || !userProfile.recommendationss) {
            console.log("No recommendations found");
            return;
        }

        const recommendations = userProfile.recommendationss || {};
        
        // Sort recommendations by timestamp (newest first)
        const sortedRecs = Object.values(recommendations).sort((a, b) => {
            // Handle recommendations without timestamps or invalid dates
            try {
                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
                
                // Check if dates are valid
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    return 0; // Keep original order if dates are invalid
                }
                
                return dateB - dateA;
            } catch (error) {
                console.warn("Error sorting recommendations by timestamp:", error);
                return 0; // Keep original order on error
            }
        });

        // Separate recommendations by type
        allMovieRecommendations = sortedRecs.filter(rec => {
            return rec.type === 'movie' || 
                  (rec.type === 'both' && rec.recommendationDetails && rec.recommendationDetails.movie);
        }).map(rec => {
            return rec.type === 'both' ? 
                { ...rec, recommendationDetails: rec.recommendationDetails.movie } : 
                rec;
        });

        allBookRecommendations = sortedRecs.filter(rec => {
            return rec.type === 'book' || 
                  (rec.type === 'both' && rec.recommendationDetails && rec.recommendationDetails.book);
        }).map(rec => {
            return rec.type === 'both' ? 
                { ...rec, recommendationDetails: rec.recommendationDetails.book } : 
                rec;
        });

        // Add view all buttons if there are multiple recommendations
        addViewAllButtons();

    } catch (error) {
        console.error("Error loading recommendations:", error);
    }
}

// Add "View All" buttons if there are multiple recommendations
function addViewAllButtons() {
    const movieSection = document.querySelector('.recommendations-section.movies');
    const bookSection = document.querySelector('.recommendations-section.books');
    
    // Only add movie section button if we have multiple recommendations
    if (allMovieRecommendations.length > 1 && movieSection) {
        // Check if button already exists to prevent duplicates
        const existingButton = movieSection.querySelector('.view-all-button');
        if (!existingButton) {
            const viewAllButton = createViewAllButton('movie');
            movieSection.appendChild(viewAllButton);
        }
    } else if (allMovieRecommendations.length === 1 && movieSection) {
        // If there's only one recommendation, add a disabled button with a tooltip
        const existingButton = movieSection.querySelector('.view-all-button');
        if (!existingButton) {
            const singleRecButton = document.createElement('button');
            singleRecButton.className = 'view-all-button disabled';
            singleRecButton.textContent = 'Only 1 Recommendation Available';
            singleRecButton.setAttribute('disabled', 'disabled');
            singleRecButton.setAttribute('title', 'Get more recommendations to see your history');
            movieSection.appendChild(singleRecButton);
        }
    }
    
    // Only add book section button if we have multiple recommendations
    if (allBookRecommendations.length > 1 && bookSection) {
        // Check if button already exists to prevent duplicates
        const existingButton = bookSection.querySelector('.view-all-button');
        if (!existingButton) {
            const viewAllButton = createViewAllButton('book');
            bookSection.appendChild(viewAllButton);
        }
    } else if (allBookRecommendations.length === 1 && bookSection) {
        // If there's only one recommendation, add a disabled button with a tooltip
        const existingButton = bookSection.querySelector('.view-all-button');
        if (!existingButton) {
            const singleRecButton = document.createElement('button');
            singleRecButton.className = 'view-all-button disabled';
            singleRecButton.textContent = 'Only 1 Recommendation Available';
            singleRecButton.setAttribute('disabled', 'disabled');
            singleRecButton.setAttribute('title', 'Get more recommendations to see your history');
            bookSection.appendChild(singleRecButton);
        }
    }
}

// Create a "View All" button
function createViewAllButton(type) {
    const button = document.createElement('button');
    button.className = 'view-all-button';
    button.textContent = 'View All Recommendations';
    button.addEventListener('click', () => {
        openRecommendationsModal(type);
    });
    return button;
}

// Open modal to display all recommendations
function openRecommendationsModal(type) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'recommendations-modal';
    modal.setAttribute('id', `${type}-recommendations-modal`);
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `${type}-modal-title`);
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Create header with close button
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const title = document.createElement('h2');
    title.id = `${type}-modal-title`;
    title.textContent = type === 'movie' ? 'All Movie Recommendations' : 'All Book Recommendations';
    
    const closeButton = document.createElement('span');
    closeButton.className = 'close-modal';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.setAttribute('role', 'button');
    closeButton.setAttribute('tabindex', '0');
    closeButton.addEventListener('click', () => {
        // Add closing animation
        modal.style.animation = 'fadeOut 0.3s forwards';
        modalContent.style.animation = 'slideOut 0.3s forwards';
        
        // Remove after animation completes
        setTimeout(() => modal.remove(), 300);
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create body with loading state first
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-spinner';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Loading recommendations...</p>
    `;
    body.appendChild(loadingIndicator);
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);
    
    // Add modal to page
    document.body.appendChild(modal);
    
    // Focus trap for accessibility
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Add keyboard navigation
    modal.addEventListener('keydown', function handleKeyDown(event) {
        // Close on escape
        if (event.key === 'Escape') {
            closeButton.click();
            document.removeEventListener('keydown', handleKeyDown);
            return;
        }
        
        // Handle arrow key navigation for recommendations
        if (event.key === 'ArrowLeft') {
            const prevButton = modal.querySelector('.nav-button.prev');
            if (prevButton && !prevButton.classList.contains('disabled')) {
                prevButton.click();
                event.preventDefault();
            }
        } else if (event.key === 'ArrowRight') {
            const nextButton = modal.querySelector('.nav-button.next');
            if (nextButton && !nextButton.classList.contains('disabled')) {
                nextButton.click();
                event.preventDefault();
            }
        }
        
        // Handle tab key for focus trap
        if (event.key === 'Tab') {
            if (event.shiftKey && document.activeElement === firstFocusable) {
                lastFocusable.focus();
                event.preventDefault();
            } else if (!event.shiftKey && document.activeElement === lastFocusable) {
                firstFocusable.focus();
                event.preventDefault();
            }
        }
    });
    
    // Create the carousel after a short delay (for animation)
    setTimeout(() => {
        loadingIndicator.remove();
        const carousel = createRecommendationCarousel(type);
        body.appendChild(carousel);
        
        // Display first recommendation
        navigateRecommendation(type, 0);
        
        // Focus the first button for accessibility
        const firstButton = modal.querySelector('button');
        if (firstButton) {
            firstButton.focus();
        }
    }, 600);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeButton.click();
        }
    });
}

// Create a recommendation carousel with navigation buttons
function createRecommendationCarousel(type) {
    const container = document.createElement('div');
    container.className = `recommendation-carousel ${type}-carousel`;
    
    // Create recommendation display area
    const display = document.createElement('div');
    display.className = 'recommendation-display';
    display.setAttribute('id', `${type}-recommendation-display`);
    
    // Create navigation controls
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'nav-button prev';
    prevButton.textContent = 'Previous';
    prevButton.addEventListener('click', () => {
        if (!prevButton.classList.contains('disabled')) {
            navigateRecommendation(type, -1);
        }
    });
    
    const nextButton = document.createElement('button');
    nextButton.className = 'nav-button next';
    nextButton.textContent = 'Next';
    nextButton.addEventListener('click', () => {
        if (!nextButton.classList.contains('disabled')) {
            navigateRecommendation(type, 1);
        }
    });
    
    // Create counter display
    const counter = document.createElement('div');
    counter.className = 'recommendation-counter';
    counter.setAttribute('id', `${type}-recommendation-counter`);
    
    // Assemble controls
    controls.appendChild(prevButton);
    controls.appendChild(counter);
    controls.appendChild(nextButton);
    
    // Assemble carousel
    container.appendChild(display);
    container.appendChild(controls);
    
    return container;
}

// Navigate to a recommendation (prev, next, or specific index)
async function navigateRecommendation(type, direction) {
    const recommendations = type === 'movie' ? allMovieRecommendations : allBookRecommendations;
    
    if (recommendations.length === 0) {
        const display = document.getElementById(`${type}-recommendation-display`);
        if (display) {
            display.innerHTML = `
                <div class="recommendation-placeholder">
                    <p>No ${type} recommendations found. Try getting new recommendations from the home page!</p>
                </div>
            `;
        }
        
        // Hide navigation controls
        const controls = document.querySelector('.carousel-controls');
        if (controls) {
            controls.style.display = 'none';
        }
        return;
    }
    
    // Show loading state
    const display = document.getElementById(`${type}-recommendation-display`);
    if (display) {
        display.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading recommendation...</p>
            </div>
        `;
    }
    
    // Update current index
    if (type === 'movie') {
        if (direction === -1) {
            currentMovieIndex = (currentMovieIndex - 1 + recommendations.length) % recommendations.length;
        } else if (direction === 1) {
            currentMovieIndex = (currentMovieIndex + 1) % recommendations.length;
        } else {
            currentMovieIndex = Math.min(Math.max(0, direction), recommendations.length - 1);
        }
    } else {
        if (direction === -1) {
            currentBookIndex = (currentBookIndex - 1 + recommendations.length) % recommendations.length;
        } else if (direction === 1) {
            currentBookIndex = (currentBookIndex + 1) % recommendations.length;
        } else {
            currentBookIndex = Math.min(Math.max(0, direction), recommendations.length - 1);
        }
    }
    
    const currentIndex = type === 'movie' ? currentMovieIndex : currentBookIndex;
    const recommendation = recommendations[currentIndex];
    
    // Update counter display
    const counter = document.getElementById(`${type}-recommendation-counter`);
    if (counter) {
        counter.textContent = `${currentIndex + 1} of ${recommendations.length}`;
    }
    
    // Update button states
    const prevButton = document.querySelector(`.${type}-carousel .nav-button.prev`);
    const nextButton = document.querySelector(`.${type}-carousel .nav-button.next`);
    
    if (prevButton) {
        if (currentIndex === 0) {
            prevButton.classList.add('disabled');
            prevButton.setAttribute('aria-disabled', 'true');
        } else {
            prevButton.classList.remove('disabled');
            prevButton.removeAttribute('aria-disabled');
        }
    }
    
    if (nextButton) {
        if (currentIndex === recommendations.length - 1) {
            nextButton.classList.add('disabled');
            nextButton.setAttribute('aria-disabled', 'true');
        } else {
            nextButton.classList.remove('disabled');
            nextButton.removeAttribute('aria-disabled');
        }
    }
    
    // Display recommendation (after a short delay to show loading animation)
    setTimeout(async () => {
        if (display) {
            await displayRecommendation(display, recommendation, type);
        }
    }, 400);
}

// Display a recommendation in the container
async function displayRecommendation(container, recommendation, type) {
    if (!container || !recommendation || !recommendation.recommendationDetails) {
        console.warn("Invalid recommendation data:", recommendation);
        container.innerHTML = '<div class="error-message">Error: Could not display this recommendation.</div>';
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    const recDetails = recommendation.recommendationDetails;
    
    // Create recommendation content
    const content = document.createElement('div');
    content.className = 'recommendation-content';
    
    // Create poster container
    const posterContainer = document.createElement('div');
    posterContainer.className = 'poster-container';
    
    const posterImg = document.createElement('img');
    posterImg.className = 'recommendation-poster';
    posterImg.alt = `${recDetails.title || 'Untitled'} ${type === 'movie' ? 'Poster' : 'Cover'}`;
    
    // Get poster URL
    let posterUrl;
    try {
        if (type === 'movie') {
            posterUrl = await getMoviePoster(recDetails.title);
        } else {
            posterUrl = await getBookCover(recDetails.title);
        }
    } catch (error) {
        console.error("Error fetching poster:", error);
        posterUrl = null;
    }
    
    posterImg.src = posterUrl || '/api/placeholder/300/450';
    posterImg.onerror = () => {
        posterImg.src = '/api/placeholder/300/450';
    };
    
    posterContainer.appendChild(posterImg);
    
    // Create details container
    const details = document.createElement('div');
    details.className = 'recommendation-details';
    
    // Add title
    const title = document.createElement('h3');
    title.className = 'recommendation-title';
    title.textContent = recDetails.title || 'Untitled';
    details.appendChild(title);
    
    // Add metadata
    const meta = document.createElement('div');
    meta.className = 'recommendation-meta';
    
    // Add age rating
    const ageRating = document.createElement('p');
    ageRating.className = 'recommendation-age-rating';
    
    const ageLabel = document.createElement('span');
    ageLabel.className = 'meta-label';
    ageLabel.textContent = 'Age Rating: ';
    ageRating.appendChild(ageLabel);
    
    ageRating.appendChild(document.createTextNode(
        recDetails.ageRating || 'Not Rated'
    ));
    meta.appendChild(ageRating);
    
    // Add genres
    const genres = document.createElement('p');
    genres.className = 'recommendation-genres';
    
    const genresLabel = document.createElement('span');
    genresLabel.className = 'meta-label';
    genresLabel.textContent = 'Genres: ';
    genres.appendChild(genresLabel);
    
    let genresText = 'Not Available';
    if (recDetails.genres && Array.isArray(recDetails.genres)) {
        genresText = recDetails.genres.join(', ');
    } else if (recDetails.genres && typeof recDetails.genres === 'string') {
        genresText = recDetails.genres;
    }
    
    genres.appendChild(document.createTextNode(genresText));
    meta.appendChild(genres);
    
    // Add rating
    const rating = document.createElement('p');
    rating.className = 'recommendation-rating';
    
    const ratingLabel = document.createElement('span');
    ratingLabel.className = 'meta-label';
    ratingLabel.textContent = 'Rating: ';
    rating.appendChild(ratingLabel);
    
    rating.innerHTML += generateStarRating(recDetails.rating || 0);
    meta.appendChild(rating);
    
    details.appendChild(meta);
    
    // Add description
    const description = document.createElement('p');
    description.className = 'recommendation-description';
    description.textContent = recDetails.description || 'No description available.';
    details.appendChild(description);
    
    // Add timestamp
    if (recommendation.timestamp) {
        try {
            const timestamp = document.createElement('p');
            timestamp.className = 'recommendation-timestamp';
            
            const date = new Date(recommendation.timestamp);
            if (!isNaN(date.getTime())) {
                timestamp.textContent = `Recommended on: ${date.toLocaleDateString()}`;
                details.appendChild(timestamp);
            }
        } catch (error) {
            console.warn("Invalid timestamp:", recommendation.timestamp, error);
        }
    }
    
    // Assemble recommendation
    content.appendChild(posterContainer);
    content.appendChild(details);
    container.appendChild(content);
}

// Generate star rating display
function generateStarRating(rating) {
    // Ensure rating is a number
    const numRating = Number(rating) || 0;
    const validRating = Math.min(Math.max(0, numRating), 5);
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

// Initialize component
document.addEventListener('DOMContentLoaded', () => {
    loadAllRecommendations();
});