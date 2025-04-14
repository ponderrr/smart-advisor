import { getUserProfile } from "./firebase-utils.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getMoviePoster } from "./services/movie-service.js";
import { getBookCover } from "./services/book-service.js";

// Global variables to store recommendation data
let allMovieRecommendations = [];
let allBookRecommendations = [];
let currentMovieIndex = 0;
let currentBookIndex = 0;
let isAuthCheckComplete = false;

// Utility function to get current theme - prevents redeclaration issues
function getCurrentTheme() {
  return document.body.getAttribute("data-theme") || "light";
}

// Get theme-specific color - prevents variable redeclaration issues
function getThemeColor(lightColor, darkColor) {
  return getCurrentTheme() === "dark" ? darkColor : lightColor;
}

// Initialize the account page
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded - setting up auth listener");

  // Add animation keyframes
  addKeyframes();

  // Display loading state
  const loadingState = createLoadingState();
  document.querySelector(".account-container")?.prepend(loadingState);

  // Set up auth state listener
  onAuthStateChanged(auth, handleAuthStateChanged);
});

// Handle Firebase Auth state changes
function handleAuthStateChanged(user) {
  console.log("Auth state changed:", user);
  isAuthCheckComplete = true;

  if (!user && !localStorage.getItem("userId")) {
    console.log("No user logged in, redirecting to sign-in page");
    // Remove loading state before redirect
    document.getElementById("account-loading-state")?.remove();
    window.location.href = "sign-in.html?redirectTo=account.html";
    return;
  }

  // User is logged in - initialize the account page
  initializeAccountPage(user);
}

// Initialize the account page after auth check
async function initializeAccountPage(user) {
  try {
    const userId = user?.uid || localStorage.getItem("userId");
    console.log("Initializing account page for user:", userId);

    // Remove loading state
    document.getElementById("account-loading-state")?.remove();

    if (!userId) {
      console.error("No user ID found even though auth check passed");
      displayError("Authentication error. Please try logging in again.");
      return;
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);
    console.log("User profile loaded:", userProfile);

    // Update user info display
    updateUserInfoDisplay(userProfile);

    // Initialize recommendation history
    initializeRecommendationHistory(userProfile);
  } catch (error) {
    console.error("Error initializing account page:", error);
    displayError("Failed to load account data. Please try again later.");
  }
}

// Update user info display
function updateUserInfoDisplay(userProfile) {
  if (!userProfile) return;

  const userNameElement = document.querySelector(".user-info h2");
  if (userNameElement) {
    userNameElement.textContent = userProfile.email || "User Profile";
  }

  // Update current email field if present
  const currentEmailField = document.getElementById("current-email");
  if (currentEmailField && userProfile.email) {
    currentEmailField.value = userProfile.email;
  }

  // Update current age field if present
  const currentAgeField = document.getElementById("current-age");
  if (currentAgeField && userProfile.age) {
    currentAgeField.value = userProfile.age;
  }
}

// Initialize recommendation history display
function initializeRecommendationHistory(userProfile) {
  if (!userProfile) return;

  const recommendations = userProfile.recommendationss || {};
  console.log("Processing recommendations:", recommendations);

  // Process recommendations based on their structure
  processRecommendations(recommendations);
}

// Process recommendations from user profile
function processRecommendations(recommendations) {
  // Handle empty recommendations
  if (!recommendations || Object.keys(recommendations).length === 0) {
    displayNoRecommendations();
    return;
  }

  // Get all recommendation items as an array
  let recommendationItems = [];

  // Handle both object and array formats
  if (Array.isArray(recommendations)) {
    recommendationItems = recommendations;
  } else {
    // Convert object format to array
    recommendationItems = Object.values(recommendations);
  }

  console.log("Recommendation items:", recommendationItems);

  // Sort by timestamp (newest first)
  const sortedRecs = sortRecommendationsByTimestamp(recommendationItems);

  // Extract movie and book recommendations
  extractRecommendationsByType(sortedRecs);

  // Display the most recent recommendations
  displayLatestRecommendations();

  // Add "View All" buttons after a short delay to ensure DOM is ready
  setTimeout(() => {
    addViewAllButtons();
  }, 500);
}

// Sort recommendations by timestamp
function sortRecommendationsByTimestamp(recommendations) {
  return [...recommendations].sort((a, b) => {
    try {
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);

      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }

      return dateB - dateA;
    } catch (error) {
      console.warn("Error sorting recommendations:", error);
      return 0;
    }
  });
}

// Extract recommendations by type
function extractRecommendationsByType(sortedRecs) {
  // Clear previous data
  allMovieRecommendations = [];
  allBookRecommendations = [];

  // Process each recommendation
  sortedRecs.forEach((rec) => {
    if (!rec || !rec.recommendationDetails) return;

    // Handle 'both' type recommendations
    if (rec.type === "both") {
      if (rec.recommendationDetails.movie) {
        allMovieRecommendations.push({
          ...rec,
          type: "movie",
          recommendationDetails: rec.recommendationDetails.movie,
        });
      }

      if (rec.recommendationDetails.book) {
        allBookRecommendations.push({
          ...rec,
          type: "book",
          recommendationDetails: rec.recommendationDetails.book,
        });
      }
    }
    // Handle single type recommendations
    else if (rec.type === "movie") {
      allMovieRecommendations.push(rec);
    } else if (rec.type === "book") {
      allBookRecommendations.push(rec);
    }
  });

  console.log("Extracted movie recommendations:", allMovieRecommendations);
  console.log("Extracted book recommendations:", allBookRecommendations);
}

// Display latest recommendations
async function displayLatestRecommendations() {
  // Display latest movie recommendation
  if (allMovieRecommendations.length > 0) {
    const movieContainer = document.querySelector(
      ".recommendations-section.movies .recommendation-content"
    );
    if (movieContainer) {
      await displayRecommendationInContainer(
        movieContainer,
        allMovieRecommendations[0],
        "movie"
      );
    }
  } else {
    const movieSection = document.querySelector(
      ".recommendations-section.movies"
    );
    if (movieSection) {
      displayNoRecommendationsInSection(movieSection, "movie");
    }
  }

  // Display latest book recommendation
  if (allBookRecommendations.length > 0) {
    const bookContainer = document.querySelector(
      ".recommendations-section.books .recommendation-content"
    );
    if (bookContainer) {
      await displayRecommendationInContainer(
        bookContainer,
        allBookRecommendations[0],
        "book"
      );
    }
  } else {
    const bookSection = document.querySelector(
      ".recommendations-section.books"
    );
    if (bookSection) {
      displayNoRecommendationsInSection(bookSection, "book");
    }
  }
}

// Display a recommendation in a container
async function displayRecommendationInContainer(
  container,
  recommendation,
  type
) {
  if (!container || !recommendation || !recommendation.recommendationDetails) {
    console.warn("Invalid recommendation data:", recommendation);
    container.innerHTML =
      '<div class="error-message">Could not display recommendation</div>';
    return;
  }

  const recDetails = recommendation.recommendationDetails;
  console.log(`Displaying ${type} recommendation:`, recDetails);

  try {
    // Get poster/cover image
    let imageUrl;
    if (type === "movie") {
      imageUrl = await getMoviePoster(recDetails.title);
    } else {
      imageUrl = await getBookCover(recDetails.title);
    }

    // Update poster container
    const posterContainer = container.querySelector(".poster-container img");
    if (posterContainer) {
      posterContainer.src = imageUrl || "/api/placeholder/300/450";
      posterContainer.alt = `${recDetails.title || "Untitled"} ${
        type === "movie" ? "Poster" : "Cover"
      }`;
    }

    // Update details
    const detailsContainer = container.querySelector(".recommendation-details");
    if (detailsContainer) {
      // Update title
      const titleElement = detailsContainer.querySelector(
        ".recommendation-title"
      );
      if (titleElement) {
        titleElement.textContent = recDetails.title || "Untitled";
      }

      // Update age rating
      const ageRatingElement = detailsContainer.querySelector(".age-rating");
      if (ageRatingElement) {
        ageRatingElement.textContent = recDetails.ageRating || "Not Rated";
      }

      // Update genres
      const genresElement = detailsContainer.querySelector(".genres");
      if (genresElement) {
        let genresText = "Not Available";
        if (recDetails.genres && Array.isArray(recDetails.genres)) {
          genresText = recDetails.genres.join(", ");
        } else if (recDetails.genres && typeof recDetails.genres === "string") {
          genresText = recDetails.genres;
        }
        genresElement.textContent = genresText;
      }

      // Update rating
      const ratingElement = detailsContainer.querySelector(".rating");
      if (ratingElement) {
        ratingElement.innerHTML = generateStarRating(recDetails.rating || 0);
      }

      // Update description
      const descriptionElement = detailsContainer.querySelector(
        ".recommendation-description"
      );
      if (descriptionElement) {
        descriptionElement.textContent =
          recDetails.description || "No description available.";
      }
    }
  } catch (error) {
    console.error(`Error displaying ${type} recommendation:`, error);
    container.innerHTML = `<div class="error-message">Error loading ${type} recommendation: ${error.message}</div>`;
  }
}

// Generate star rating display
function generateStarRating(rating) {
  const validRating = Math.min(Math.max(0, rating), 5);
  const fullStars = Math.floor(validRating);
  const hasHalfStar = validRating % 1 >= 0.5;
  const emptyStars = 5 - Math.ceil(validRating);

  return `
        ${fullStars > 0 ? "★".repeat(fullStars) : ""}
        ${hasHalfStar ? "½" : ""}
        ${emptyStars > 0 ? "☆".repeat(emptyStars) : ""}
        <span class="rating-number">(${validRating.toFixed(1)}/5)</span>
    `;
}

// Add "View All" buttons if there are multiple recommendations
function addViewAllButtons() {
  console.log("Adding view all buttons");
  const movieSection = document.querySelector(
    ".recommendations-section.movies"
  );
  const bookSection = document.querySelector(".recommendations-section.books");

  // Add movie section button if we have multiple recommendations
  if (allMovieRecommendations.length > 1 && movieSection) {
    const existingButton = movieSection.querySelector(".view-all-button");
    if (!existingButton) {
      const viewAllButton = createViewAllButton("movie");
      movieSection.appendChild(viewAllButton);
    }
  }

  // Add book section button if we have multiple recommendations
  if (allBookRecommendations.length > 1 && bookSection) {
    const existingButton = bookSection.querySelector(".view-all-button");
    if (!existingButton) {
      const viewAllButton = createViewAllButton("book");
      bookSection.appendChild(viewAllButton);
    }
  }
}

// Create a "View All" button
function createViewAllButton(type) {
  const button = document.createElement("button");
  button.className = "view-all-button";
  button.textContent = "View All Recommendations";

  button.addEventListener("click", () => {
    console.log(`View All ${type} button clicked`);
    openRecommendationsModal(type);
  });

  return button;
}

// Display "No recommendations" message
function displayNoRecommendations() {
  const movieSection = document.querySelector(
    ".recommendations-section.movies"
  );
  const bookSection = document.querySelector(".recommendations-section.books");

  if (movieSection) {
    displayNoRecommendationsInSection(movieSection, "movie");
  }

  if (bookSection) {
    displayNoRecommendationsInSection(bookSection, "book");
  }
}

// Display "No recommendations" in a specific section
function displayNoRecommendationsInSection(section, type) {
  const container = section.querySelector(".recommendation-content");
  if (!container) return;

  container.innerHTML = `
        <div class="no-recommendations" style="width: 100%; text-align: center; padding: 2rem;">
            <p>No ${type} recommendations yet!</p>
            <p>Try getting some recommendations from our home page.</p>
        </div>
    `;
}

// Display error message
function displayError(message) {
  // Remove loading state if present
  document.getElementById("account-loading-state")?.remove();

  // Create error message
  const errorContainer = document.createElement("div");
  errorContainer.className = "error-message";
  errorContainer.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
  errorContainer.style.color = "#dc3545";
  errorContainer.style.padding = "1rem";
  errorContainer.style.borderRadius = "0.5rem";
  errorContainer.style.margin = "1rem 0";
  errorContainer.style.textAlign = "center";
  errorContainer.style.border = "1px solid rgba(220, 53, 69, 0.3)";
  errorContainer.textContent = message;

  // Add error message to page
  const accountContainer = document.querySelector(".account-container");
  if (accountContainer) {
    accountContainer.prepend(errorContainer);
  }

  // Hide recommendation sections
  const recommendationSections = document.querySelectorAll(
    ".recommendations-section"
  );
  recommendationSections.forEach((section) => {
    section.style.display = "none";
  });
}

// Create loading state element
function createLoadingState() {
  const loadingState = document.createElement("div");
  loadingState.id = "account-loading-state";
  loadingState.style.display = "flex";
  loadingState.style.flexDirection = "column";
  loadingState.style.alignItems = "center";
  loadingState.style.justifyContent = "center";
  loadingState.style.padding = "2rem";
  loadingState.style.margin = "2rem auto";
  loadingState.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
  loadingState.style.borderRadius = "1rem";
  loadingState.style.textAlign = "center";

  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.style.width = "60px";
  spinner.style.height = "60px";
  spinner.style.borderRadius = "50%";

  // Use theme-appropriate colors for spinner
  const spinnerBorderColor = getThemeColor(
    "rgba(227, 66, 117, 0.2)",
    "rgba(186, 38, 43, 0.2)"
  );
  const spinnerTopColor = getThemeColor("#E34275", "#BA262B");

  spinner.style.border = `5px solid ${spinnerBorderColor}`;
  spinner.style.borderTopColor = spinnerTopColor;
  spinner.style.animation = "spin 1s infinite linear";
  spinner.style.marginBottom = "1rem";

  const loadingText = document.createElement("p");
  loadingText.textContent = "Loading your account...";
  loadingText.style.fontSize = "1.2rem";
  loadingText.style.color = "#ffffff";
  loadingText.style.marginTop = "1rem";

  loadingState.appendChild(spinner);
  loadingState.appendChild(loadingText);

  return loadingState;
}

// Add keyframes for animations
function addKeyframes() {
  if (!document.getElementById("account-keyframes")) {
    const styleEl = document.createElement("style");
    styleEl.id = "account-keyframes";
    styleEl.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slideOut {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(50px); opacity: 0; }
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
    document.head.appendChild(styleEl);
  }
}

// Open modal to display all recommendations
function openRecommendationsModal(type) {
  console.log(`Opening ${type} recommendations modal`);

  // Create modal container
  const modal = document.createElement("div");
  modal.className = "recommendations-modal";
  modal.setAttribute("id", `${type}-recommendations-modal`);
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", `${type}-modal-title`);

  // Modal container styles
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  // Modal content styles - use the theme utility function
  modalContent.style.background =
    getCurrentTheme() === "dark"
      ? "linear-gradient(45deg, #810020, #900A22, #A41726, #BA262B, #CA302D)"
      : "linear-gradient(45deg, #401F59, #61265F, #812D64, #A2346A, #C23B6F, #E34275)";

  modalContent.style.width = "90%";
  modalContent.style.maxWidth = "900px";
  modalContent.style.maxHeight = "90vh";
  modalContent.style.overflowY = "auto";
  modalContent.style.borderRadius = "1rem";
  modalContent.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.5)";

  // Create header with close button
  const header = document.createElement("div");
  header.className = "modal-header";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.padding = "1.5rem";
  header.style.borderBottom = "1px solid rgba(255, 255, 255, 0.2)";

  const title = document.createElement("h2");
  title.id = `${type}-modal-title`;
  title.textContent =
    type === "movie" ? "All Movie Recommendations" : "All Book Recommendations";
  title.style.color = "#ffffff";
  title.style.margin = "0";

  const closeButton = document.createElement("span");
  closeButton.className = "close-modal";
  closeButton.innerHTML = "&times;";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.setAttribute("role", "button");
  closeButton.setAttribute("tabindex", "0");
  closeButton.style.color = "#ffffff";
  closeButton.style.fontSize = "2rem";
  closeButton.style.cursor = "pointer";

  closeButton.addEventListener("click", () => {
    console.log("Close button clicked");
    // Add closing animation
    modal.style.animation = "fadeOut 0.3s forwards";
    modalContent.style.animation = "slideOut 0.3s forwards";

    // Remove after animation completes
    setTimeout(() => modal.remove(), 300);
  });

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create body with loading state first
  const body = document.createElement("div");
  body.className = "modal-body";
  body.style.padding = "1.5rem";

  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "loading-spinner";
  loadingIndicator.style.display = "flex";
  loadingIndicator.style.flexDirection = "column";
  loadingIndicator.style.alignItems = "center";
  loadingIndicator.style.justifyContent = "center";
  loadingIndicator.style.padding = "3rem";
  loadingIndicator.style.color = "#ffffff";

  // Use theme utility to get spinner color
  const spinnerColor = getThemeColor("#E34275", "#BA262B");

  loadingIndicator.innerHTML = `
        <div class="spinner" style="width: 60px; height: 60px; border-radius: 50%; border: 5px solid rgba(255, 255, 255, 0.2); border-top-color: ${spinnerColor}; animation: spin 1s infinite linear; margin-bottom: 1rem;"></div>
        <p style="font-size: 1.2rem; margin-top: 1rem;">Loading recommendations...</p>
    `;

  body.appendChild(loadingIndicator);

  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modal.appendChild(modalContent);

  // Add modal to page
  document.body.appendChild(modal);

  // Add keyboard navigation
  modal.addEventListener("keydown", function handleKeyDown(event) {
    // Close on escape
    if (event.key === "Escape") {
      closeButton.click();
      return;
    }

    // Handle arrow key navigation for recommendations
    if (event.key === "ArrowLeft") {
      const prevButton = modal.querySelector(".nav-button.prev");
      if (prevButton && !prevButton.disabled) {
        prevButton.click();
        event.preventDefault();
      }
    } else if (event.key === "ArrowRight") {
      const nextButton = modal.querySelector(".nav-button.next");
      if (nextButton && !nextButton.disabled) {
        nextButton.click();
        event.preventDefault();
      }
    }
  });

  // Create the carousel after a short delay (for animation)
  setTimeout(() => {
    console.log("Creating carousel");
    loadingIndicator.remove();
    const carousel = createRecommendationCarousel(type);
    body.appendChild(carousel);

    // Display first recommendation
    navigateRecommendation(type, 0);

    // Focus the first button for accessibility
    const firstButton = modal.querySelector("button");
    if (firstButton) {
      firstButton.focus();
    }
  }, 600);

  // Close modal when clicking outside
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeButton.click();
    }
  });
}

// Create a recommendation carousel with navigation buttons
function createRecommendationCarousel(type) {
  console.log(`Creating ${type} recommendation carousel`);
  const container = document.createElement("div");
  container.className = `recommendation-carousel ${type}-carousel`;

  // Create recommendation display area
  const display = document.createElement("div");
  display.className = "recommendation-display";
  display.setAttribute("id", `${type}-recommendation-display`);
  display.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
  display.style.borderRadius = "0.8rem";
  display.style.minHeight = "400px";
  display.style.margin = "1rem 0";

  // Create navigation controls
  const controls = document.createElement("div");
  controls.className = "carousel-controls";
  controls.style.display = "flex";
  controls.style.justifyContent = "space-between";
  controls.style.alignItems = "center";
  controls.style.marginTop = "1rem";
  controls.style.padding = "0.5rem 1rem";
  controls.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
  controls.style.borderRadius = "0.5rem";

  // Get theme-specific button color
  const buttonBgColor = getThemeColor(
    "rgba(227, 66, 117, 0.3)",
    "rgba(186, 38, 43, 0.3)"
  );

  const prevButton = document.createElement("button");
  prevButton.className = "nav-button prev";
  prevButton.textContent = "Previous";
  prevButton.style.backgroundColor = buttonBgColor;
  prevButton.style.color = "#ffffff";
  prevButton.style.border = "none";
  prevButton.style.borderRadius = "0.5rem";
  prevButton.style.padding = "0.8rem 1.2rem";
  prevButton.style.cursor = "pointer";
  prevButton.style.fontSize = "1rem";

  prevButton.addEventListener("click", () => {
    if (!prevButton.disabled) {
      navigateRecommendation(type, -1);
    }
  });

  const nextButton = document.createElement("button");
  nextButton.className = "nav-button next";
  nextButton.textContent = "Next";
  nextButton.style.backgroundColor = buttonBgColor;
  nextButton.style.color = "#ffffff";
  nextButton.style.border = "none";
  nextButton.style.borderRadius = "0.5rem";
  nextButton.style.padding = "0.8rem 1.2rem";
  nextButton.style.cursor = "pointer";
  nextButton.style.fontSize = "1rem";

  nextButton.addEventListener("click", () => {
    if (!nextButton.disabled) {
      navigateRecommendation(type, 1);
    }
  });

  // Create counter display
  const counter = document.createElement("div");
  counter.className = "recommendation-counter";
  counter.setAttribute("id", `${type}-recommendation-counter`);
  counter.style.color = "#ffffff";
  counter.style.fontSize = "1.1rem";
  counter.style.fontWeight = "bold";
  counter.style.padding = "0.4rem 1rem";
  counter.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  counter.style.borderRadius = "2rem";

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
  console.log(`Navigating ${type} recommendation, direction: ${direction}`);
  const recommendations =
    type === "movie" ? allMovieRecommendations : allBookRecommendations;

  if (recommendations.length === 0) {
    const display = document.getElementById(`${type}-recommendation-display`);
    if (display) {
      display.innerHTML = `
                <div class="recommendation-placeholder" style="display: flex; align-items: center; justify-content: center; height: 400px; background-color: rgba(255, 255, 255, 0.1); border-radius: 0.8rem; color: rgba(255, 255, 255, 0.7); font-style: italic;">
                    <p>No ${type} recommendations found. Try getting new recommendations from the home page!</p>
                </div>
            `;
    }

    // Hide navigation controls
    const controls = document.querySelector(".carousel-controls");
    if (controls) {
      controls.style.display = "none";
    }
    return;
  }

  // Show loading state
  const display = document.getElementById(`${type}-recommendation-display`);
  if (display) {
    // Use theme utility to get spinner color
    const spinnerColor = getThemeColor("#E34275", "#BA262B");

    display.innerHTML = `
            <div class="loading-spinner" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: #ffffff;">
                <div class="spinner" style="width: 60px; height: 60px; border-radius: 50%; border: 5px solid rgba(255, 255, 255, 0.2); border-top-color: ${spinnerColor}; animation: spin 1s infinite linear; margin-bottom: 1rem;"></div>
                <p style="font-size: 1.2rem; margin-top: 1rem;">Loading recommendation...</p>
            </div>
        `;
  }

  // Update current index
  if (type === "movie") {
    if (direction === -1) {
      currentMovieIndex =
        (currentMovieIndex - 1 + recommendations.length) %
        recommendations.length;
    } else if (direction === 1) {
      currentMovieIndex = (currentMovieIndex + 1) % recommendations.length;
    } else {
      currentMovieIndex = Math.min(
        Math.max(0, direction),
        recommendations.length - 1
      );
    }
  } else {
    if (direction === -1) {
      currentBookIndex =
        (currentBookIndex - 1 + recommendations.length) %
        recommendations.length;
    } else if (direction === 1) {
      currentBookIndex = (currentBookIndex + 1) % recommendations.length;
    } else {
      currentBookIndex = Math.min(
        Math.max(0, direction),
        recommendations.length - 1
      );
    }
  }

  const currentIndex = type === "movie" ? currentMovieIndex : currentBookIndex;
  const recommendation = recommendations[currentIndex];
  console.log(
    `Current ${type} index: ${currentIndex}, recommendation:`,
    recommendation
  );

  // Update counter display
  const counter = document.getElementById(`${type}-recommendation-counter`);
  if (counter) {
    counter.textContent = `${currentIndex + 1} of ${recommendations.length}`;
  }

  // Update button states
  const prevButton = document.querySelector(
    `.${type}-carousel .nav-button.prev`
  );
  const nextButton = document.querySelector(
    `.${type}-carousel .nav-button.next`
  );

  if (prevButton) {
    prevButton.disabled = currentIndex === 0;
    prevButton.style.opacity = currentIndex === 0 ? "0.5" : "1";
    prevButton.style.cursor = currentIndex === 0 ? "not-allowed" : "pointer";
  }

  if (nextButton) {
    nextButton.disabled = currentIndex === recommendations.length - 1;
    nextButton.style.opacity =
      currentIndex === recommendations.length - 1 ? "0.5" : "1";
    nextButton.style.cursor =
      currentIndex === recommendations.length - 1 ? "not-allowed" : "pointer";
  }

  // Display recommendation (after a short delay to show loading animation)
  setTimeout(async () => {
    if (display) {
      await displayRecommendationInModal(display, recommendation, type);
    }
  }, 400);
}

// Display a recommendation in the modal
async function displayRecommendationInModal(container, recommendation, type) {
  console.log(`Displaying ${type} recommendation in modal:`, recommendation);
  if (!container || !recommendation || !recommendation.recommendationDetails) {
    console.warn("Invalid recommendation data:", recommendation);
    container.innerHTML =
      '<div class="error-message" style="background-color: rgba(255, 0, 0, 0.2); color: #ffffff; padding: 1rem; border-radius: 0.5rem; text-align: center; margin: 1rem; border: 1px solid rgba(255, 0, 0, 0.3);">Error: Could not display this recommendation.</div>';
    return;
  }

  // Clear existing content
  container.innerHTML = "";

  const recDetails = recommendation.recommendationDetails;

  // Create recommendation content
  const content = document.createElement("div");
  content.className = "recommendation-content";
  content.style.display = "flex";
  content.style.gap = "2rem";
  content.style.padding = "2rem";
  content.style.borderRadius = "12px";
  content.style.position = "relative";
  content.style.zIndex = "2";
  content.style.animation = "fadeIn 0.5s ease-in-out";

  // Create poster container
  const posterContainer = document.createElement("div");
  posterContainer.className = "poster-container";
  posterContainer.style.flex = "0 0 200px";
  posterContainer.style.maxWidth = "200px";
  posterContainer.style.transition = "transform 0.3s ease";

  const posterImg = document.createElement("img");
  posterImg.className = "recommendation-poster";
  posterImg.alt = `${recDetails.title || "Untitled"} ${
    type === "movie" ? "Poster" : "Cover"
  }`;
  posterImg.style.width = "100%";
  posterImg.style.height = "auto";
  posterImg.style.borderRadius = "8px";
  posterImg.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
  posterImg.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";

  // Get poster URL
  let posterUrl;
  try {
    if (type === "movie") {
      posterUrl = await getMoviePoster(recDetails.title);
    } else {
      posterUrl = await getBookCover(recDetails.title);
    }
  } catch (error) {
    console.error("Error fetching poster:", error);
    posterUrl = null;
  }

  posterImg.src = posterUrl || "/api/placeholder/300/450";
  posterImg.onerror = () => {
    posterImg.src = "/api/placeholder/300/450";
  };

  posterContainer.appendChild(posterImg);

  // Create details container
  const details = document.createElement("div");
  details.className = "recommendation-details";
  details.style.flex = "1";
  details.style.display = "flex";
  details.style.flexDirection = "column";
  details.style.gap = "1rem";

  // Add title
  const title = document.createElement("h3");
  title.className = "recommendation-title";
  title.textContent = recDetails.title || "Untitled";
  title.style.fontSize = "1.8rem";
  title.style.color = "#ffffff";
  title.style.marginBottom = "0.5rem";
  details.appendChild(title);

  // Add metadata
  const meta = document.createElement("div");
  meta.className = "recommendation-meta";
  meta.style.display = "flex";
  meta.style.flexDirection = "column";
  meta.style.gap = "0.5rem";

  // Add age rating
  const ageRating = document.createElement("p");
  ageRating.className = "recommendation-age-rating";
  ageRating.style.margin = "0";

  const ageLabel = document.createElement("span");
  ageLabel.className = "meta-label";
  ageLabel.textContent = "Age Rating: ";
  ageLabel.style.fontWeight = "bold";
  ageLabel.style.color = "#ffffff";
  ageLabel.style.marginRight = "0.5rem";
  ageRating.appendChild(ageLabel);

  ageRating.appendChild(
    document.createTextNode(recDetails.ageRating || "Not Rated")
  );
  meta.appendChild(ageRating);

  // Add genres
  const genres = document.createElement("p");
  genres.className = "recommendation-genres";
  genres.style.margin = "0";

  const genresLabel = document.createElement("span");
  genresLabel.className = "meta-label";
  genresLabel.textContent = "Genres: ";
  genresLabel.style.fontWeight = "bold";
  genresLabel.style.color = "#ffffff";
  genresLabel.style.marginRight = "0.5rem";
  genres.appendChild(genresLabel);

  let genresText = "Not Available";
  if (recDetails.genres && Array.isArray(recDetails.genres)) {
    genresText = recDetails.genres.join(", ");
  } else if (recDetails.genres && typeof recDetails.genres === "string") {
    genresText = recDetails.genres;
  }

  genres.appendChild(document.createTextNode(genresText));
  meta.appendChild(genres);

  // Add rating
  const rating = document.createElement("p");
  rating.className = "recommendation-rating";
  rating.style.margin = "0";

  const ratingLabel = document.createElement("span");
  ratingLabel.className = "meta-label";
  ratingLabel.textContent = "Rating: ";
  ratingLabel.style.fontWeight = "bold";
  ratingLabel.style.color = "#ffffff";
  ratingLabel.style.marginRight = "0.5rem";
  rating.appendChild(ratingLabel);

  rating.innerHTML += generateStarRating(recDetails.rating || 0);
  meta.appendChild(rating);

  details.appendChild(meta);

  // Add description
  const description = document.createElement("p");
  description.className = "recommendation-description";
  description.textContent =
    recDetails.description || "No description available.";
  description.style.fontSize = "1rem";
  description.style.lineHeight = "1.6";
  description.style.color = "#ffffff";
  description.style.marginTop = "0.5rem";
  description.style.flexGrow = "1";
  details.appendChild(description);

  // Add timestamp
  if (recommendation.timestamp) {
    try {
      const timestamp = document.createElement("p");
      timestamp.className = "recommendation-timestamp";
      timestamp.style.fontSize = "0.9rem";
      timestamp.style.color = "rgba(255, 255, 255, 0.7)";
      timestamp.style.fontStyle = "italic";
      timestamp.style.marginTop = "1rem";

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
