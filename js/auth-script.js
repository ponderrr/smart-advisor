// Dark Mode Toggle Function
function toggleDarkMode() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save theme preference
}

// Preserve Dark Mode when navigating between Sign In and Sign Up
function preserveDarkMode() {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        localStorage.setItem('theme', 'dark');
    }
}

// Check theme on load and apply it
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
});

