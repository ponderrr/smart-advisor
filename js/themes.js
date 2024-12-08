// Theme toggle functionality
function toggleTheme() {
    const rootElement = document.documentElement;
    const currentTheme = rootElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update theme attribute
    rootElement.setAttribute('data-theme', newTheme);
    
    // Update moon/sun icon
    const modeIcon = document.getElementById('mode-icon');
    if (modeIcon) {
        modeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const modeIcon = document.getElementById('mode-icon');
    if (modeIcon) {
        modeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Make functions available globally
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;

// Apply theme when DOM loads
document.addEventListener('DOMContentLoaded', initializeTheme);