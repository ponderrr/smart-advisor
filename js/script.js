// Import required functions
import { handleAuthRedirect, handleAccountClick, isLoggedIn } from './auth-redirect.js';

// Dark Mode Toggle
export function toggleDarkMode() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Export recommendation handler for global access
window.handleRecommendationClick = function(type) {
    handleAuthRedirect(type);
}

// Export account handler for global access
window.handleAccountClick = handleAccountClick;

// Apply theme on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
});
