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

// Check if redirected from a specific page (movies, books, etc.)
const redirectTo = localStorage.getItem('redirectTo');

// Form submission for Sign In
document.getElementById('signInForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    
    if (redirectTo) {
        localStorage.removeItem('redirectTo');
        window.location.href = 'questions.html';
    } else {
        window.location.href = 'account.html';
    }
});

// Form submission for Sign Up
document.getElementById('signUpForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const age = parseInt(document.getElementById('age').value);

    if (age >= 1 && age <= 13) {
        document.body.classList.add('kids-mode');
    }

    if (redirectTo) {
        localStorage.removeItem('redirectTo');
        window.location.href = 'questions.html';
    } else {
        window.location.href = 'index.html';
    }
});

// Function to simulate Google login
function googleLogin() {
    if (redirectTo) {
        window.location.href = 'questions.html';
    } else {
        window.location.href = 'account.html';
    }
}

// Save where the user is coming from to handle redirection
function setRedirectTo(targetPage) {
    localStorage.setItem('redirectTo', targetPage);
}
