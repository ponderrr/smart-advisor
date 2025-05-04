import { supabase } from "./supabase-config.js";

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Result of reset attempt
 */
export async function sendPasswordResetEmail(email) {
  try {
    if (!email || !email.trim()) {
      return {
        success: false,
        errorCode: "auth/missing-email",
        errorMessage: "Please enter your email address",
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/forgot-password.html",
    });

    if (error) throw error;

    return {
      success: true,
      message: "Password reset email sent. Please check your inbox.",
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);

    let errorMessage = "Failed to send password reset email";

    if (error.message) {
      if (error.message.includes("not found")) {
        errorMessage = "No account exists with this email address";
      } else if (error.message.includes("invalid email")) {
        errorMessage = "Please enter a valid email address";
      } else if (error.message.includes("too many requests")) {
        errorMessage = "Too many requests. Please try again later";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      errorCode: error.code || "reset_error",
      errorMessage: errorMessage,
    };
  }
}

/**
 * Initialize forgot password functionality
 * @param {Object} options - Configuration options
 * @param {string} options.modalId - ID of the forgot password modal
 * @param {string} options.triggerLinkId - ID of the link that opens the modal
 * @param {string} options.formId - ID of the reset password form
 * @param {string} options.emailInputId - ID of the email input field
 * @param {string} options.messageContainerId - ID of the container for messages
 * @param {string} options.submitButtonId - ID of the submit button
 * @param {string} options.loginEmailInputId - ID of the email input in the login form
 */
export function initForgotPassword(options = {}) {
  const {
    modalId = "forgot-password-modal",
    triggerLinkId = "forgot-password-link",
    formId = "reset-password-form",
    emailInputId = "reset-email",
    messageContainerId = "reset-message-container",
    submitButtonId = "reset-submit-button",
    loginEmailInputId = "email",
  } = options;

  document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with ID "${modalId}" not found`);
      return;
    }

    const closeBtn = modal.querySelector(".close-modal");
    const forgotPasswordLink = document.getElementById(triggerLinkId);
    const resetForm = document.getElementById(formId);
    const resetEmailInput = document.getElementById(emailInputId);
    const resetButton = document.getElementById(submitButtonId);
    const messageContainer = document.getElementById(messageContainerId);
    const loginEmailInput = document.getElementById(loginEmailInputId);

    if (
      !forgotPasswordLink ||
      !resetForm ||
      !resetEmailInput ||
      !resetButton ||
      !messageContainer
    ) {
      console.error("One or more required elements not found");
      return;
    }

    if (loginEmailInput) {
      loginEmailInput.addEventListener("input", function () {
        resetEmailInput.value = this.value;
      });
    }

    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();

      if (loginEmailInput && loginEmailInput.value) {
        resetEmailInput.value = loginEmailInput.value;
      }

      modal.style.display = "block";
      resetEmailInput.focus();
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeModal();
      });
    }

    window.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.style.display === "block") {
        closeModal();
      }
    });

    function closeModal() {
      const modalContent = modal.querySelector(".auth-modal-content");
      if (modalContent) {
        modalContent.classList.add("modal-closing");
        setTimeout(() => {
          modal.style.display = "none";
          modalContent.classList.remove("modal-closing");
        }, 300);
      } else {
        modal.style.display = "none";
      }
    }

    function showResetMessage(message, isError = false) {
      if (!messageContainer) return;

      messageContainer.innerHTML = "";

      const messageElement = document.createElement("div");
      messageElement.className = isError
        ? "auth-message error"
        : "auth-message success";
      messageElement.textContent = message;

      messageContainer.appendChild(messageElement);
    }

    resetForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = resetEmailInput.value.trim();

      if (!email) {
        showResetMessage("Please enter your email address", true);
        return;
      }

      resetButton.disabled = true;
      resetButton.textContent = "Sending...";

      try {
        const result = await sendPasswordResetEmail(email);

        if (result.success) {
          showResetMessage(result.message, false);

          setTimeout(() => {
            closeModal();
          }, 5000);
        } else {
          showResetMessage(result.errorMessage, true);
        }
      } catch (error) {
        showResetMessage(
          "An unexpected error occurred. Please try again.",
          true
        );
        console.error("Error in password reset:", error);
      } finally {
        resetButton.disabled = false;
        resetButton.textContent = "Send Reset Link";
      }
    });
  });
}

export default {
  sendPasswordResetEmail,
  initForgotPassword,
};
