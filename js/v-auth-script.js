let isQuizActive = false;  // Flag to track if the quiz is active
const answerForm = document.getElementById('answer-form');
const answerInput = document.getElementById('answer-input');
const feedbackElement = document.getElementById('feedback');
const successElement = document.getElementById('success');
const startQuizButton = document.getElementById('start-quiz');
const questionCountSlider = document.getElementById('question-count-slider');
const countDisplay = document.getElementById('count-display');
const loadingContainer = document.getElementById('loading-container');
const showResultsButton = document.getElementById('show-results-button');

// Set up question count slider
questionCountSlider.addEventListener('input', function() {
    const questionCount = questionCountSlider.value;
    countDisplay.textContent = `Number of Questions: ${questionCount}`;
});

// Start quiz button click handler
startQuizButton.addEventListener('click', function() {
    startQuizButton.style.display = 'none';
    questionCountSlider.style.display = 'none';
    countDisplay.style.display = 'none';
    isQuizActive = true;  // Set quiz as active
});

// Handle form submission for each answer
answerForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const answer = answerInput.value.trim();

    if (answer === "") {
        feedbackElement.textContent = "Please provide an answer.";
        feedbackElement.classList.add('shake', 'error');  // Add 'error' class for red color
        setTimeout(() => feedbackElement.classList.remove('shake'), 500);
        return;
    }

    feedbackElement.textContent = "";
    successElement.textContent = "Answer submitted!";
    successElement.style.color = "green";  // Set the success message color to green
    successElement.style.opacity = 1;

    setTimeout(() => {
        successElement.style.opacity = 0;
    }, 0);
});

// Redirect function for showing results
function redirectToResults() {
    loadingContainer.style.display = 'flex';
    setTimeout(() => {
        window.location.href = 'results.html'; // Redirect after showing loading animation
    }, 3000); // Optional delay to display the loading animation
}

// Toggle Dark Mode Function
function toggleDarkMode() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save theme preference
}

// Check theme on load and apply it
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    if (!document.getElementById('toggle-dark-mode')) {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<button id="toggle-dark-mode" onclick="toggleDarkMode()">🌙</button>'
        );
    }

    const darkModeButton = document.getElementById('toggle-dark-mode');
    if (darkModeButton) {
        darkModeButton.style.position = 'fixed';
        darkModeButton.style.bottom = '20px';
        darkModeButton.style.right = '20px';
        darkModeButton.style.padding = '10px';
        darkModeButton.style.fontSize = '1.2em';
        darkModeButton.style.cursor = 'pointer';
        darkModeButton.style.backgroundColor = 'var(--button-bg-color)';
        darkModeButton.style.color = 'var(--button-text-color)';
        darkModeButton.style.border = 'none';
        darkModeButton.style.borderRadius = '50%';
        darkModeButton.style.boxShadow = '0 4px 8px var(--shadow-color)';
        darkModeButton.style.transition = 'background-color 0.3s, color 0.3s, box-shadow 0.3s';
    }
});

// Confirmation for navigation only when quiz is active
function confirmNavigation(event) {
    if (isQuizActive) {
        const userConfirmed = confirm('Are you sure you want to leave this page? Your changes may not be saved.');
        if (!userConfirmed) {
            event.preventDefault();
        }
    }
}

window.addEventListener('beforeunload', function (event) {
    if (isQuizActive) {
        event.returnValue = 'Are you sure you want to leave this page? Your changes may not be saved.';
    }
});

function setupLinkConfirmation() {
    const linksToConfirm = document.querySelectorAll('.confirm-leave');
    linksToConfirm.forEach(link => {
        link.addEventListener('click', confirmNavigation);
    });
}

document.addEventListener('DOMContentLoaded', setupLinkConfirmation);

showResultsButton.addEventListener('click', function() {
    showResultsButton.textContent = "Grabbing your results...";
    
    setTimeout(function() {
        window.location.href = 'results.html';
    }, 3000);
});
