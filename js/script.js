// Dark Mode Toggle
function toggleDarkMode() {
    const currentTheme = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
}

// Redirect to account page based on login status
function redirectToAccount() {
    if (isLoggedIn()) {
        window.location.href = 'account.html';
    } else {
        window.location.href = 'sign-in.html';
    }
}

// Simulated login check
function isLoggedIn() {
    return localStorage.getItem('loggedIn') === 'true';
}

// Choose Recommendation Functionality
function chooseRecommendation(type) {
    if (isLoggedIn()) {
        // Redirect to questions page with the selected type of recommendation
        window.location.href = `questions.html?type=${type}`;
    } else {
        window.location.href = 'sign-in.html';
    }
}

// Dark Mode Toggle Button
document.body.insertAdjacentHTML(
    'beforeend',
    '<button id="toggle-dark-mode" onclick="toggleDarkMode()">🌙</button>'
);