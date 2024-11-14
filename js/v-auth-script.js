// Function to shuffle an array (optional)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

// Array of questions
const questions = [
    "What book could you read over and over again?",
    "What movie can you watch repeatedly without getting tired of it?",
    "Who is your favorite character in a book?",
    "What is the best adaptation of a book into a movie?",
    "What book do you think deserves a sequel?",
    "Which book has had the most impact on your life?",
    "What genre of books do you prefer?",
    "Who is your favorite author?",
    "What movie do you think is underrated?",
    "What fictional world would you like to live in?",
    "Which book character do you relate to the most?",
    "What is your all-time favorite book?",
    "What is your favorite movie quote?",
    "Which movie's soundtrack do you love the most?",
    "What book or movie do you recommend to everyone?",
    "What character's journey inspired you the most?",
    "What’s the last book you read, and how did you find it?",
    "If you could meet any author, dead or alive, who would it be?",
    "What book or movie has a twist ending that shocked you?",
    "Which book do you think everyone should read at least once?",
    "What was your favorite book or movie as a child?",
    "What is your favorite classic novel?",
    "Which book series do you wish had never ended?",
    "What book or movie made you cry?",
    "What is the most memorable scene from a movie you’ve seen?",
    "What character would you want as your best friend?",
    "Which book has the most beautiful writing style?",
    "If you could live in any book, which would it be?",
    "What is the most surprising book you’ve read?",
    "What movie do you think has the best plot twist?"
];

// Shuffle the questions (optional, if desired)
shuffle(questions);

// Use the first 'n' questions as needed
let selectedQuestions = questions.slice(0, 3); // Example: Select the first 3 questions after shuffling

let currentQuestionIndex = 0;
let questionCount = 3;
let isQuizActive = false;  // Flag to track if the quiz is active
const questionElement = document.getElementById('question');
const questionNumberElement = document.getElementById('question-number');
const answerForm = document.getElementById('answer-form');
const answerInput = document.getElementById('answer-input');
const feedbackElement = document.getElementById('feedback');
const successElement = document.getElementById('success');
const startQuizButton = document.getElementById('start-quiz');
const questionCountSlider = document.getElementById('question-count');
const countDisplay = document.getElementById('count-display');
const loadingContainer = document.getElementById('loading-container');

// Set up question count slider
questionCountSlider.addEventListener('input', function() {
    questionCount = questionCountSlider.value;
    countDisplay.textContent = `Number of Questions: ${questionCount}`;
});

// Start quiz button click handler
startQuizButton.addEventListener('click', function() {
    startQuizButton.style.display = 'none';
    questionCountSlider.style.display = 'none';
    countDisplay.style.display = 'none';
    currentQuestionIndex = 0;
    isQuizActive = true;  // Set quiz as active
    showQuestion();
});

// Show question
function showQuestion() {
    if (currentQuestionIndex < questionCount) {
        questionElement.textContent = questions[currentQuestionIndex];
        questionNumberElement.textContent = `Question ${currentQuestionIndex + 1} of ${questionCount}`;
        questionElement.style.opacity = 1;
        answerForm.style.display = 'flex';
        answerInput.value = '';
        answerInput.focus();
    }
}

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

    currentQuestionIndex++;
    setTimeout(() => {
        successElement.style.opacity = 0;
        if (currentQuestionIndex < questionCount) {
            // Show next question
            showQuestion();
        } else {
            // Redirect to results.html after the last question
            redirectToResults();
        }
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

    // Only add the dark mode button if it doesn't already exist
    if (!document.getElementById('toggle-dark-mode')) {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<button id="toggle-dark-mode" onclick="toggleDarkMode()">🌙</button>'
        );
    }

    // Format the dark mode button to stay in the bottom right
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