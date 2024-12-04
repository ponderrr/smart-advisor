import { getQuestionsAndRecommendation } from './openai-service.js';
import { getUserAge } from './register.js';
import { saveUserRecommendation } from './firebase-utils.js';

// DOM Elements
const questionCountSlider = document.getElementById('question-count-slider');
const countDisplay = document.getElementById('count-display');
const startQuizButton = document.getElementById('start-quiz');
const questionCountSection = document.getElementById('question-count-section');
const questionsSection = document.getElementById('questions-section');
const questionNumber = document.getElementById('question-number');
const questionElement = document.getElementById('question');
const answerForm = document.getElementById('answer-form');
const answerInput = document.getElementById('answer-input');
const loadingContainer = document.getElementById('loading-container');

let currentQuestions = [];
let currentAnswers = [];
let currentQuestionIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const user = localStorage.getItem('userId');
    const recommendationType = localStorage.getItem('recommendationType');
    
    if (!user || !recommendationType) {
        window.location.href = 'index.html';
        return;
    }

    questionCountSlider.addEventListener('input', (e) => {
        countDisplay.textContent = `Number of Questions: ${e.target.value}`;
    });

    questionsSection.classList.add('questions-section');
});

startQuizButton.addEventListener('click', async () => {
    try {
        const questionCount = parseInt(questionCountSlider.value);
        const userAge = await getUserAge();
        const type = localStorage.getItem('recommendationType');

        loadingContainer.style.display = 'flex';
        
        const result = await getQuestionsAndRecommendation({ 
            numberOfQuestions: questionCount,
            age: userAge,
            type: type
        });

        currentQuestions = result.questions;
        currentAnswers = new Array(currentQuestions.length).fill('');
        
        questionCountSection.style.display = 'none';
        questionsSection.style.display = 'block';
        loadingContainer.style.display = 'none';
        
        questionsSection.classList.add('visible');
        
        displayCurrentQuestion();
    } catch (error) {
        console.error('Error starting quiz:', error);
        loadingContainer.style.display = 'none';
    }
});

answerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const answer = answerInput.value.trim();
    if (!answer) {
        showFeedback('Please provide an answer.', true);
        return;
    }

    currentAnswers[currentQuestionIndex] = answer;
    answerInput.value = '';
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
        showSuccess('Answer submitted!');
    } else {
        await submitAllAnswers();
    }
});

async function submitAllAnswers() {
    try {
        hideQuestionsSection();
        loadingContainer.style.display = 'flex';

        const userAge = await getUserAge();
        const type = localStorage.getItem('recommendationType');
        
        const result = await getQuestionsAndRecommendation({
            answers: currentAnswers,
            age: userAge,
            type: type
        });

        const recommendationData = {
            type: type,
            questionData: currentQuestions.reduce((acc, q, i) => ({ ...acc, [`question${i + 1}`]: q }), {}),
            answerData: currentAnswers.reduce((acc, a, i) => ({ ...acc, [`answer${i + 1}`]: a }), {}),
            recommendationDetails: result.recommendation,
            timestamp: new Date().toISOString()
        };
        console.log('About to save:', recommendationData);
        try {
            await saveUserRecommendation(recommendationData);
            console.log('Save successful');
        } catch (err) {
            console.error('Save failed:', err);
        }
        window.location.href = 'results.html';
    } catch (error) {
        console.error('Error submitting answers:', error);
        loadingContainer.style.display = 'none';
        showFeedback('Error getting recommendation. Please try again.', true);
    }
}

function displayCurrentQuestion() {
    questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    questionElement.textContent = currentQuestions[currentQuestionIndex];
    answerInput.focus();
}

function showFeedback(message, isError = false) {
    const feedbackElement = document.getElementById('feedback');
    feedbackElement.textContent = message;
    feedbackElement.className = isError ? 'shake error' : '';
    setTimeout(() => feedbackElement.classList.remove('shake'), 500);
}

function showSuccess(message) {
    const successElement = document.getElementById('success');
    successElement.textContent = message;
    successElement.style.opacity = 1;
    setTimeout(() => {
        successElement.style.opacity = 0;
    }, 2000);
}

function hideQuestionsSection() {
    questionsSection.classList.remove('visible');
    setTimeout(() => {
        questionsSection.style.display = 'none';
    }, 300);
}

export { getQuestionsAndRecommendation };