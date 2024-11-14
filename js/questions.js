import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-functions.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const getQuestionsAndRecommendation = httpsCallable(functions, 'getQuestionsAndRecommendation');

// Get questions based on user input
async function loadQuestions(numberOfQuestions, age) {
  try {
    const response = await getQuestionsAndRecommendation({ numberOfQuestions, age });
    const questions = response.data.questions;
    displayQuestions(questions);
  } catch (error) {
    console.error("Error loading questions:", error);
  }
}

// Display the generated questions
function displayQuestions(questions) {
  const questionContainer = document.getElementById("question-container");
  questionContainer.innerHTML = "";

  questions.forEach((questionText, index) => {
    const questionElement = document.createElement("div");
    questionElement.className = "question";
    questionElement.innerHTML = `<p>${index + 1}. ${questionText}</p><input type="text" class="answer-input" />`;
    questionContainer.appendChild(questionElement);
  });

  // Show submit button after questions are displayed
  document.getElementById("submit-answers").style.display = "block";
}

// Submit answers and get recommendation
async function submitAnswers(age) {
  const answerInputs = document.querySelectorAll(".answer-input");
  const answers = Array.from(answerInputs).map(input => input.value);

  try {
    const response = await getQuestionsAndRecommendation({ age, answers });
    const recommendation = response.data.recommendation;
    displayRecommendation(recommendation);
  } catch (error) {
    console.error("Error getting recommendation:", error);
  }
}

// Display the recommendation on the results page
function displayRecommendation(recommendation) {
  document.getElementById("recommendation-container").innerText = recommendation;
}

// Event listener for submitting answers
document.getElementById("submit-answers").addEventListener("click", () => {
  const age = parseInt(document.getElementById("user-age").value); // Assuming user age is available
  submitAnswers(age);
});

// Assuming there's a slider or input for selecting question count
document.getElementById("start-questions").addEventListener("click", () => {
  const numberOfQuestions = parseInt(document.getElementById("question-count").value);
  const age = parseInt(document.getElementById("user-age").value); // Assuming user age is available
  loadQuestions(numberOfQuestions, age);
});
