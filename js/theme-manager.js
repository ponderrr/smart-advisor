/**
 * Toggle between light and dark mode
 */
export function toggleDarkMode() {
  const currentTheme = document.body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Animate theme toggle button if it exists
  const themeToggleButton = document.getElementById("theme-toggle");
  if (themeToggleButton) {
    themeToggleButton.classList.add("animated");
    setTimeout(() => {
      themeToggleButton.classList.remove("animated");
    }, 500);
  }
}

/**
 * Apply the saved theme or default to light
 */
export function applyTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
}

/**
 * Initialize theme toggle functionality
 */
export function initThemeToggle() {
  // Apply saved theme
  applyTheme();

  // Add event listener to theme toggle button
  const themeToggleButton = document.getElementById("theme-toggle");
  if (themeToggleButton) {
    themeToggleButton.addEventListener("click", toggleDarkMode);

    // Add pressed effect on click
    themeToggleButton.addEventListener("mousedown", () => {
      themeToggleButton.classList.add("pressed");
    });

    // Remove pressed effect
    themeToggleButton.addEventListener("mouseup", () => {
      themeToggleButton.classList.remove("pressed");
      themeToggleButton.classList.add("animated");
      setTimeout(() => {
        themeToggleButton.classList.remove("animated");
      }, 500);
    });

    // Remove pressed effect if mouse leaves button while pressed
    themeToggleButton.addEventListener("mouseleave", () => {
      themeToggleButton.classList.remove("pressed");
    });
  }
}

// Initialize theme system on page load
document.addEventListener("DOMContentLoaded", initThemeToggle);
