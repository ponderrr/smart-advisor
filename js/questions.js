import { getQuestionsAndRecommendation } from "./openai-service.js";
import { getUserAge } from "./register.js";
import { saveUserRecommendation } from "./firebase-utils.js";

document.addEventListener("DOMContentLoaded", function () {
  const questionCountSlider = document.getElementById("question-count-slider");
  const countDisplay = document.getElementById("count-display");
  const startQuizButton = document.getElementById("start-quiz");
  const questionCountSection = document.getElementById(
    "question-count-section"
  );
  const questionsSection = document.getElementById("questions-section");
  const questionNumber = document.getElementById("question-number");
  const questionElement = document.getElementById("question");
  const answerForm = document.getElementById("answer-form");
  const answerInput = document.getElementById("answer-input");
  const loadingContainer = document.getElementById("loading-container");
  const themeToggleButton = document.getElementById("theme-toggle");
  const rootElement = document.documentElement;
  const generatingContainer = document.getElementById(
    "generating-questions-container"
  );

  // Initialize state variables
  let currentQuestions = [];
  let currentAnswers = [];
  let currentQuestionIndex = 0;

  // Set up initial state
  const savedTheme = localStorage.getItem("theme") || "light";
  rootElement.setAttribute("data-theme", savedTheme);
  updateToggleIcon(savedTheme);

  // Initialize slider
  if (questionCountSlider) {
    questionCountSlider.value = 3;
    updateQuestionCount(3);
  }

  // Add event listeners
  if (questionCountSlider) {
    questionCountSlider.addEventListener("input", (e) => {
      updateQuestionCount(e.target.value);
    });
  }

  if (themeToggleButton) {
    themeToggleButton.addEventListener("click", () => {
      const currentTheme = rootElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      rootElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateToggleIcon(newTheme);
    });
  }

  // Check user authentication
  const user = localStorage.getItem("userId");
  const recommendationType = localStorage.getItem("recommendationType");

  if (!user || !recommendationType) {
    window.location.href = "index.html";
    return;
  }

  // Start Quiz Button Handler
  if (startQuizButton) {
    startQuizButton.addEventListener("click", async () => {
      const userConfirmed = window.confirm(
        "Are you sure you want to start the quiz? Your progress will be lost if you leave."
      );

      if (!userConfirmed) {
        return;
      }

      try {
        const questionCount = parseInt(questionCountSlider.value);
        const userAge = await getUserAge();
        const type = localStorage.getItem("recommendationType");

        // Show loading state
        generatingContainer.style.display = "flex";
        questionCountSection.style.display = "none";

        // Set up beforeunload warning
        window.addEventListener("beforeunload", handleBeforeUnload);

        // Calculate delay based on question count
        const delay = Math.min(5000, 1000 + questionCount * 100);

        setTimeout(async () => {
          try {
            const result = await getQuestionsAndRecommendation({
              numberOfQuestions: questionCount,
              age: userAge,
              type: type,
            });

            // Update questions and answers
            currentQuestions = result.questions;
            currentAnswers = new Array(currentQuestions.length).fill("");

            // Update UI
            generatingContainer.style.display = "none";
            questionsSection.style.display = "block";
            questionsSection.classList.add("visible");

            // Show first question
            displayCurrentQuestion();
          } catch (error) {
            handleError("Failed to generate questions. Please try again.");
          }
        }, delay);
      } catch (error) {
        handleError("Failed to start the quiz. Please try again.");
      }
    });
  }

  // Answer Form Handler
  if (answerForm) {
    answerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const answer = answerInput.value.trim();
      clearFeedback();

      if (!answer) {
        showFeedback("Please provide an answer.", true);
        return;
      }

      // Save answer and proceed
      currentAnswers[currentQuestionIndex] = answer;
      answerInput.value = "";

      if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
        showSuccess("Answer submitted!");
      } else {
        await submitAllAnswers();
      }
    });
  }

  // Helper Functions
  function updateQuestionCount(value) {
    if (countDisplay) {
      countDisplay.textContent = `Number of Questions: ${value}`;
    }
  }

  function displayCurrentQuestion() {
    if (questionNumber && questionElement) {
      questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${
        currentQuestions.length
      }`;
      questionElement.textContent = currentQuestions[currentQuestionIndex];
      answerInput?.focus();
    }
  }

  function clearFeedback() {
    const feedbackElement = document.getElementById("feedback");
    if (feedbackElement) {
      feedbackElement.textContent = "";
    }
  }

  function showFeedback(message, isError = false) {
    const feedbackElement = document.getElementById("feedback");
    if (feedbackElement) {
      feedbackElement.textContent = message;
      feedbackElement.className = isError ? "shake error" : "";
      setTimeout(() => feedbackElement.classList.remove("shake"), 500);
    }
  }

  function showSuccess(message) {
    const successElement = document.getElementById("success");
    if (successElement) {
      successElement.textContent = message;
      successElement.style.opacity = 1;
      setTimeout(() => {
        successElement.style.opacity = 0;
      }, 2000);
    }
  }

  async function submitAllAnswers() {
    try {
      hideQuestionsSection();
      if (loadingContainer) {
        loadingContainer.style.display = "flex";
      }

      const userAge = await getUserAge();
      const type = localStorage.getItem("recommendationType");

      const result = await getQuestionsAndRecommendation({
        answers: currentAnswers,
        age: userAge,
        type: type,
      });

      const recommendationData = {
        type: type,
        questionData: currentQuestions.reduce(
          (acc, q, i) => ({ ...acc, [`question${i + 1}`]: q }),
          {}
        ),
        answerData: currentAnswers.reduce(
          (acc, a, i) => ({ ...acc, [`answer${i + 1}`]: a }),
          {}
        ),
        recommendationDetails: result.recommendation,
        timestamp: new Date().toISOString(),
      };

      await saveUserRecommendation(recommendationData);

      setTimeout(() => {
        window.location.href = "results.html";
      }, 3000);
    } catch (error) {
      console.error("Error submitting answers:", error);
      if (loadingContainer) {
        loadingContainer.style.display = "none";
      }
      showFeedback("Error getting recommendation. Please try again.", true);
    }
  }

  function hideQuestionsSection() {
    if (questionsSection) {
      questionsSection.classList.remove("visible");
      setTimeout(() => {
        questionsSection.style.display = "none";
      }, 300);
    }
  }

  function handleError(message) {
    console.error(message);
    if (generatingContainer) {
      generatingContainer.style.display = "none";
    }
    if (questionCountSection) {
      questionCountSection.style.display = "block";
    }
    showFeedback(message, true);
  }

  function handleBeforeUnload(event) {
    const message =
      "Are you sure you want to leave? Your progress will be lost.";
    event.returnValue = message;
    return message;
  }

  function updateToggleIcon(theme) {}
});

export { getQuestionsAndRecommendation };
