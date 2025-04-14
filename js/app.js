import { initThemeToggle } from "./theme-manager.js";
import { initUI } from "./ui-manager.js";
import {
  handleAuthRedirect,
  handleAccountClick,
  isLoggedIn,
  initializeAuth,
} from "./auth-manager.js";

// Export recommendation handler for global access
window.handleRecommendationClick = function (type) {
  handleAuthRedirect(type);
};

// Export account handler for global access
window.handleAccountClick = handleAccountClick;

// Export theme toggle for global access
window.toggleDarkMode = function () {
  const themeToggleButton = document.getElementById("theme-toggle");
  if (themeToggleButton) {
    themeToggleButton.click();
  }
};

/**
 * Initialize all common functionality
 */
function initApp() {
  // Initialize theme system
  initThemeToggle();

  // Initialize UI components
  initUI();

  // Initialize authentication system
  initializeAuth();

  // Handle navbar scroll behavior
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const threshold = 100; // Scroll threshold to hide navbar
    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
      if (window.scrollY > lastScrollY && window.scrollY > threshold) {
        // Scroll Down
        navbar.classList.add("hidden");
        navbar.classList.remove("visible");
      } else if (window.scrollY < lastScrollY || window.scrollY < threshold) {
        // Scroll Up
        navbar.classList.add("visible");
        navbar.classList.remove("hidden");
      }
      lastScrollY = window.scrollY;
    });
  }
}

// Initialize everything on DOM load
document.addEventListener("DOMContentLoaded", initApp);
