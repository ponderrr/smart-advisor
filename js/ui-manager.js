/**
 * Initialize navbar scroll behavior
 * Shows/hides navbar based on scroll direction
 */
export function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const threshold = 100; // Scroll threshold to hide navbar
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.scrollY > lastScrollY && window.scrollY > threshold) {
      // Scroll Down - hide navbar
      navbar.classList.add("hidden");
      navbar.classList.remove("visible");
    } else if (window.scrollY < lastScrollY || window.scrollY < threshold) {
      // Scroll Up - show navbar
      navbar.classList.add("visible");
      navbar.classList.remove("hidden");
    }
    lastScrollY = window.scrollY;
  });
}

/**
 * Show loading indicator
 * @param {string} containerId - ID of the container element
 * @param {string} message - Loading message to display
 */
export function showLoading(containerId, message = "Loading...") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const loadingContainer = document.createElement("div");
  loadingContainer.className = "loading-container";
  loadingContainer.innerHTML = `
      <p class="loading-text">${message}</p>
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;

  // Clear previous content
  container.innerHTML = "";
  container.appendChild(loadingContainer);
  container.style.display = "flex";
}

/**
 * Hide loading indicator
 * @param {string} containerId - ID of the container element
 */
export function hideLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const loadingContainer = container.querySelector(".loading-container");
  if (loadingContainer) {
    loadingContainer.remove();
  }
}

/**
 * Show error message
 * @param {string} containerId - ID of the container element
 * @param {string} message - Error message to display
 */
export function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;

  // Clear previous content
  container.innerHTML = "";
  container.appendChild(errorElement);
  container.style.display = "block";
}

/**
 * Show success message
 * @param {string} containerId - ID of the container element
 * @param {string} message - Success message to display
 * @param {number} duration - Duration to show message before fading (ms)
 */
export function showSuccess(containerId, message, duration = 3000) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const successElement = document.createElement("div");
  successElement.className = "success-message";
  successElement.textContent = message;

  // Clear previous content
  container.innerHTML = "";
  container.appendChild(successElement);
  container.style.display = "block";

  // Auto-hide success message after duration
  if (duration > 0) {
    setTimeout(() => {
      successElement.style.opacity = "0";
      setTimeout(() => {
        if (successElement.parentNode === container) {
          container.removeChild(successElement);
        }
      }, 300);
    }, duration);
  }
}

/**
 * Create star rating display
 * @param {number} rating - Rating value (0-5)
 * @returns {string} HTML string with star rating
 */
export function generateStarRating(rating) {
  // Ensure rating is between 0 and 5
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

/**
 * Add password visibility toggle to password inputs
 * Finds all password inputs and adds toggle buttons
 */
export function initPasswordToggles() {
  // Find all password input fields
  const passwordFields = document.querySelectorAll('input[type="password"]');

  // Add toggle buttons to each password field
  passwordFields.forEach((field) => {
    addPasswordToggle(field);
  });
}

/**
 * Add a password visibility toggle to a specific password input
 * @param {HTMLInputElement} inputField - Password input field
 */
function addPasswordToggle(inputField) {
  // Only proceed if the input is still in the DOM
  if (!inputField.parentNode) return;

  // Get the parent element's position style
  const parentPosition = window.getComputedStyle(
    inputField.parentNode
  ).position;

  // Check if the parent already has relative positioning
  const needsRelativeParent =
    parentPosition !== "relative" &&
    parentPosition !== "absolute" &&
    parentPosition !== "fixed";

  // Create wrapper only if needed
  let wrapper = inputField.parentNode;

  // If parent doesn't have relative positioning, create a new wrapper
  if (needsRelativeParent) {
    wrapper = document.createElement("div");
    wrapper.className = "password-field-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.display = "block";
    wrapper.style.width = "100%";

    // Insert wrapper before the input field
    inputField.parentNode.insertBefore(wrapper, inputField);

    // Move input into wrapper
    wrapper.appendChild(inputField);
  }

  // Check if the toggle button already exists to prevent duplicates
  const existingToggle = wrapper.querySelector(".password-toggle");
  if (existingToggle) return;

  // Create toggle button
  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "password-toggle";
  toggleButton.setAttribute("aria-label", "Toggle password visibility");
  toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="eye-icon show-password" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" class="eye-icon hide-password" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;

  // Style the toggle button
  Object.assign(toggleButton.style, {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    zIndex: "10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px",
    width: "30px",
    height: "30px",
    marginRight: "2px",
  });

  // Get current theme color
  const isDarkTheme = document.body.getAttribute("data-theme") === "dark";
  const eyeColor = isDarkTheme ? "#ffffff" : "#333333";

  // Style the eye icons
  const eyeIcons = toggleButton.querySelectorAll(".eye-icon");
  eyeIcons.forEach((icon) => {
    icon.style.color = eyeColor;
    icon.style.opacity = "0.7";
    icon.style.transition = "opacity 0.3s ease";
  });

  // Add hover effect to toggle button
  toggleButton.addEventListener("mouseenter", () => {
    eyeIcons.forEach((icon) => {
      icon.style.opacity = "1";
    });
  });

  toggleButton.addEventListener("mouseleave", () => {
    eyeIcons.forEach((icon) => {
      icon.style.opacity = "0.7";
    });
  });

  // Add padding to input field to make room for toggle button
  inputField.style.paddingRight = "40px";

  // Add toggle functionality
  toggleButton.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent form submission
    const isPassword = inputField.type === "password";

    // Toggle password visibility
    inputField.type = isPassword ? "text" : "password";

    // Toggle eye icon visibility
    const showPasswordIcon = toggleButton.querySelector(".show-password");
    const hidePasswordIcon = toggleButton.querySelector(".hide-password");

    showPasswordIcon.style.display = isPassword ? "none" : "block";
    hidePasswordIcon.style.display = isPassword ? "block" : "none";
  });

  // Add toggle button to the wrapper
  wrapper.appendChild(toggleButton);
}

/**
 * Initialize common UI functionality
 */
export function initUI() {
  initNavbarScroll();
  initPasswordToggles();
}

// Initialize UI on page load
document.addEventListener("DOMContentLoaded", initUI);
