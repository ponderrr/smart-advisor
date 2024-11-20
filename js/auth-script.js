// Dark Mode Toggle Function
export function toggleDarkMode() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Preserve Dark Mode when navigating between Sign In and Sign Up
export function preserveDarkMode() {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        localStorage.setItem('theme', 'dark');
    }
}

// Handle redirect after authentication
export function handleRedirectAfterAuth() {
    const redirectTo = localStorage.getItem('redirectTo');
    if (redirectTo) {
        localStorage.removeItem('redirectTo');
        window.location.href = redirectTo;
    } else {
        window.location.href = 'index.html';
    }
}

// Apply theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
});