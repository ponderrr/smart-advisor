/**
 * Forgot Password Module
 * Handles the forgot password functionality with Firebase Auth
 */

import { auth } from "./firebase-config.js";
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from "firebase/auth";

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Result of reset attempt
 */
export async function sendPasswordResetEmail(email) {
  try {
    // Validate email
    if (!email || !email.trim()) {
      return {
        success: false,
        errorCode: 'auth/missing-email',
        errorMessage: "Please enter your email address"
      };
    }

    // Send password reset email
    await firebaseSendPasswordResetEmail(auth, email);
    
    return { 
      success: true, 
      message: "Password reset email sent. Please check your inbox." 
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    
    // Return user-friendly error message
    let errorMessage = "Failed to send password reset email";
    
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account exists with this email address";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address";
          break;
        case 'auth/missing-email':
          errorMessage = "Please enter your email address";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many requests. Please try again later";
          break;
        default:
          errorMessage = error.message || "Failed to send password reset email";
      }
    }
    
    return { 
      success: false, 
      errorCode: error.code,
      errorMessage: errorMessage 
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
    modalId = 'forgot-password-modal',
    triggerLinkId = 'forgot-password-link',
    formId = 'reset-password-form',
    emailInputId = 'reset-email',
    messageContainerId = 'reset-message-container',
    submitButtonId = 'reset-submit-button',
    loginEmailInputId = 'email'
  } = options;

  document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with ID "${modalId}" not found`);
      return;
    }

    const closeBtn = modal.querySelector('.close-modal');
    const forgotPasswordLink = document.getElementById(triggerLinkId);
    const resetForm = document.getElementById(formId);
    const resetEmailInput = document.getElementById(emailInputId);
    const resetButton = document.getElementById(submitButtonId);
    const messageContainer = document.getElementById(messageContainerId);
    const loginEmailInput = document.getElementById(loginEmailInputId);
    
    if (!forgotPasswordLink || !resetForm || !resetEmailInput || !resetButton || !messageContainer) {
      console.error('One or more required elements not found');
      return;
    }
    
    // Pre-fill email if available
    if (loginEmailInput) {
      loginEmailInput.addEventListener('input', function() {
        resetEmailInput.value = this.value;
      });
    }
    
    // Show modal when clicking the forgot password link
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Pre-fill email if it's already entered in the login form
      if (loginEmailInput && loginEmailInput.value) {
        resetEmailInput.value = loginEmailInput.value;
      }
      
      modal.style.display = 'block';
      resetEmailInput.focus();
    });
    
    // Close modal when clicking the close button
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        closeModal();
      });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Close modal when pressing Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
      }
    });
    
    // Function to close modal with animation
    function closeModal() {
      const modalContent = modal.querySelector('.auth-modal-content');
      if (modalContent) {
        modalContent.classList.add('modal-closing');
        setTimeout(() => {
          modal.style.display = 'none';
          modalContent.classList.remove('modal-closing');
        }, 300);
      } else {
        modal.style.display = 'none';
      }
    }
    
    // Show message in the reset form
    function showResetMessage(message, isError = false) {
      if (!messageContainer) return;
      
      // Clear previous messages
      messageContainer.innerHTML = '';
      
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = isError ? 'auth-message error' : 'auth-message success';
      messageElement.textContent = message;
      
      // Add to container
      messageContainer.appendChild(messageElement);
    }
    
    // Handle form submission
    resetForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = resetEmailInput.value.trim();
      
      if (!email) {
        showResetMessage('Please enter your email address', true);
        return;
      }
      
      // Show loading state
      resetButton.disabled = true;
      resetButton.textContent = 'Sending...';
      
      try {
        // Call the password reset function
        const result = await sendPasswordResetEmail(email);
        
        if (result.success) {
          showResetMessage(result.message, false);
          
          // Automatically close the modal after 5 seconds
          setTimeout(() => {
            closeModal();
          }, 5000);
        } else {
          showResetMessage(result.errorMessage, true);
        }
      } catch (error) {
        showResetMessage('An unexpected error occurred. Please try again.', true);
        console.error('Error in password reset:', error);
      } finally {
        // Reset button state
        resetButton.disabled = false;
        resetButton.textContent = 'Send Reset Link';
      }
    });
  });
}

export default {
  sendPasswordResetEmail,
  initForgotPassword
};