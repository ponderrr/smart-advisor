/**
 * Account Settings Module
 * Handles the account settings functionality with native browser authentication
 */

import { updateUserEmail, updateUserPassword, updateUserAge } from "./auth-manager.js";

// Set up section toggles
function setupSectionToggles() {
  const sectionHeaders = document.querySelectorAll('.section-header');
  
  sectionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      // Get the section content element
      const section = this.closest('.settings-section');
      const content = section.querySelector('.section-content');
      const icon = this.querySelector('.toggle-icon');
      
      // Toggle active class
      content.classList.toggle('active');
      
      // Update icon by rotating instead of changing text
      if (content.classList.contains('active')) {
        icon.style.transform = 'rotate(45deg)';
      } else {
        icon.style.transform = 'rotate(0deg)';
      }
    });
  });
}

/**
 * Set up update buttons and enter key behavior
 */
function setupUpdateButtons() {
  // Email update setup
  const emailUpdateBtn = document.getElementById('email-update-btn');
  const newEmailInput = document.getElementById('new-email');
  const confirmEmailInput = document.getElementById('confirm-email');
  
  if (emailUpdateBtn) {
    emailUpdateBtn.addEventListener('click', handleEmailUpdate);
  }
  
  // Add enter key support for email fields
  if (newEmailInput) {
    newEmailInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmEmailInput?.focus();
      }
    });
  }
  
  if (confirmEmailInput) {
    confirmEmailInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEmailUpdate();
      }
    });
  }
  
  // Password update setup
  const passwordUpdateBtn = document.getElementById('password-update-btn');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  if (passwordUpdateBtn) {
    passwordUpdateBtn.addEventListener('click', handlePasswordUpdate);
  }
  
  // Add enter key support for password fields
  if (newPasswordInput) {
    newPasswordInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmPasswordInput?.focus();
      }
    });
  }
  
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePasswordUpdate();
      }
    });
  }
  
  // Age update setup
  const ageUpdateBtn = document.getElementById('age-update-btn');
  const newAgeInput = document.getElementById('new-age');
  
  if (ageUpdateBtn) {
    ageUpdateBtn.addEventListener('click', handleAgeUpdate);
  }
  
  // Add enter key support for age field
  if (newAgeInput) {
    newAgeInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAgeUpdate();
      }
    });
  }
}

/**
 * Handle email update request
 */
function handleEmailUpdate() {
  const newEmail = document.getElementById('new-email')?.value;
  const confirmEmail = document.getElementById('confirm-email')?.value;
  
  // Clear previous messages
  clearSectionMessages();
  
  // Validate fields
  if (!newEmail || !confirmEmail) {
    showSectionMessage('email', 'Please fill in all email fields', true);
    return;
  }
  
  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    showSectionMessage('email', 'Please enter a valid email address', true);
    return;
  }
  
  if (newEmail !== confirmEmail) {
    showSectionMessage('email', 'Email addresses do not match', true);
    return;
  }
  
  // Use native browser confirmation
  const message = 'To confirm changing your email, please enter your current password:';
  const password = prompt(message, '');
  
  // If user cancels the prompt, password will be null
  if (password === null) {
    return;
  }
  
  if (!password) {
    showSectionMessage('email', 'Password is required to update email', true);
    return;
  }
  
  // Handle authentication and update
  updateEmailWithPassword(password, newEmail);
}

/**
 * Handle password update request
 */
function handlePasswordUpdate() {
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  
  // Clear previous messages
  clearSectionMessages();
  
  // Validate fields
  if (!newPassword || !confirmPassword) {
    showSectionMessage('password', 'Please fill in all password fields', true);
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showSectionMessage('password', 'Passwords do not match', true);
    return;
  }
  
  // Use native browser confirmation
  const message = 'To confirm changing your password, please enter your current password:';
  const currentPassword = prompt(message, '');
  
  // If user cancels the prompt, password will be null
  if (currentPassword === null) {
    return;
  }
  
  if (!currentPassword) {
    showSectionMessage('password', 'Current password is required to update password', true);
    return;
  }
  
  // Handle authentication and update
  updatePasswordWithConfirmation(currentPassword, newPassword);
}

/**
 * Handle age update request
 */
function handleAgeUpdate() {
  const newAge = document.getElementById('new-age')?.value;
  
  // Clear previous messages
  clearSectionMessages();
  
  // Validate field
  if (!newAge) {
    showSectionMessage('age', 'Please enter your new age', true);
    return;
  }
  
  // Validate age
  const ageNum = parseInt(newAge);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    showSectionMessage('age', 'Please enter a valid age (1-120)', true);
    return;
  }
  
  // Confirm with user
  const confirmed = confirm(`Are you sure you want to update your age to ${ageNum}?`);
  if (!confirmed) {
    return;
  }
  
  // For age update, we might not need a password confirmation
  // but if you want to add it, use the same pattern as above
  updateAgeWithConfirmation(ageNum);
}

/**
 * Update email with password authentication
 */
async function updateEmailWithPassword(password, newEmail) {
  try {
    // Show processing message
    showSectionMessage('email', 'Processing...', false);
    
    // For demo/testing: Allow a test password
    const isTestMode = password === 'testpassword123';
    let result = { success: false };
    
    if (isTestMode) {
      // Simulate a delay for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      result = { success: true };
    } else {
      // Use the actual update function from auth-manager.js
      result = await updateUserEmail(password, newEmail);
    }
    
    if (result.success) {
      // Update UI
      const currentEmailField = document.getElementById('current-email');
      if (currentEmailField) {
        currentEmailField.value = newEmail;
      }
      
      // Clear fields
      document.getElementById('new-email').value = '';
      document.getElementById('confirm-email').value = '';
      
      // Show success message only in the section
      showSectionMessage('email', 'Email updated successfully!', false);
    } else {
      // Show user-friendly error message based on error code
      let errorMessage = 'Authentication failed';
      
      if (result.error?.code) {
        switch (result.error.code) {
          case 'auth/wrong-password':
            errorMessage = 'The password you entered is incorrect. Please try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many unsuccessful attempts. Please try again later.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use by another account.';
            break;
          default:
            errorMessage = result.error.message || 'Authentication failed';
        }
      }
      
      showSectionMessage('email', errorMessage, true);
    }
  } catch (error) {
    console.error('Error updating email:', error);
    
    // User-friendly error message
    let errorMessage = 'An error occurred while updating email';
    
    if (error?.code) {
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'The password you entered is incorrect. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many unsuccessful attempts. Please try again later.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use by another account.';
          break;
        default:
          errorMessage = error.message || 'An error occurred while updating email';
      }
    }
    
    showSectionMessage('email', errorMessage, true);
  }
}

/**
 * Update password with confirmation
 */
async function updatePasswordWithConfirmation(currentPassword, newPassword) {
  try {
    // Show processing message
    showSectionMessage('password', 'Processing...', false);
    
    // For demo/testing: Allow a test password
    const isTestMode = currentPassword === 'testpassword123';
    let result = { success: false };
    
    if (isTestMode) {
      // Simulate a delay for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      result = { success: true };
    } else {
      // Use the actual update function from auth-manager.js
      result = await updateUserPassword(currentPassword, newPassword);
    }
    
    if (result.success) {
      // Clear fields
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      
      // Show success message only in the section
      showSectionMessage('password', 'Password updated successfully!', false);
    } else {
      // Show user-friendly error message based on error code
      let errorMessage = 'Authentication failed';
      
      if (result.error?.code) {
        switch (result.error.code) {
          case 'auth/wrong-password':
            errorMessage = 'The password you entered is incorrect. Please try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many unsuccessful attempts. Please try again later.';
            break;
          default:
            errorMessage = result.error.message || 'Authentication failed';
        }
      }
      
      showSectionMessage('password', errorMessage, true);
    }
  } catch (error) {
    console.error('Error updating password:', error);
    
    // User-friendly error message
    let errorMessage = 'An error occurred while updating password';
    
    if (error?.code) {
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'The password you entered is incorrect. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many unsuccessful attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An error occurred while updating password';
      }
    }
    
    showSectionMessage('password', errorMessage, true);
  }
}

/**
 * Update age with confirmation
 */
async function updateAgeWithConfirmation(newAge) {
  try {
    // Show processing message
    showSectionMessage('age', 'Processing...', false);
    
    // For testing/demo purposes
    let result = await updateUserAge(newAge);
    
    if (result.success) {
      // Update UI
      const currentAgeField = document.getElementById('current-age');
      if (currentAgeField) {
        currentAgeField.value = newAge;
      }
      
      // Clear field
      document.getElementById('new-age').value = '';
      
      // Show success message only in the section
      showSectionMessage('age', 'Age updated successfully!', false);
    } else {
      // Show user-friendly error message
      let errorMessage = 'Failed to update age';
      
      if (result.error?.code) {
        switch (result.error.code) {
          case 'auth/requires-recent-login':
            errorMessage = 'For security reasons, please log out and log back in before making this change.';
            break;
          default:
            errorMessage = result.error.message || 'Failed to update age';
        }
      }
      
      showSectionMessage('age', errorMessage, true);
    }
  } catch (error) {
    console.error('Error updating age:', error);
    
    // User-friendly error message
    let errorMessage = 'An error occurred while updating age';
    
    if (error?.code) {
      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'For security reasons, please log out and log back in before making this change.';
          break;
        default:
          errorMessage = error.message || 'An error occurred while updating age';
      }
    }
    
    showSectionMessage('age', errorMessage, true);
  }
}

/**
 * Show message specific to a section
 * @param {string} section - Section identifier (email, password, age)
 * @param {string} message - Message text
 * @param {boolean} isError - Whether it's an error message
 */
function showSectionMessage(section, message, isError) {
  // Get the section element
  const sectionEl = document.querySelector(`.settings-section[data-section="${section}"]`);
  if (!sectionEl) return;
  
  // Check if message container exists, create if not
  let messageContainer = sectionEl.querySelector('.section-message');
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.className = 'section-message';
    
    // Insert at the top of the section content
    const sectionContent = sectionEl.querySelector('.section-content');
    if (sectionContent) {
      sectionContent.insertBefore(messageContainer, sectionContent.firstChild);
    }
  }
  
  // Set message and class
  messageContainer.textContent = message;
  messageContainer.className = isError ? 
    'section-message error-message' : 
    'section-message success-message';
  
  // Show the section if it's not already visible
  const sectionContent = sectionEl.querySelector('.section-content');
  if (sectionContent && !sectionContent.classList.contains('active')) {
    sectionContent.classList.add('active');
    
    // Update the icon
    const toggleIcon = sectionEl.querySelector('.toggle-icon');
    if (toggleIcon) {
      toggleIcon.textContent = '−';
    }
  }
  
  // Auto-remove success messages after 5 seconds
  if (!isError) {
    setTimeout(() => {
      if (messageContainer.parentNode) {
        messageContainer.remove();
      }
    }, 5000);
  }
}

/**
 * Clear all section-specific messages
 */
function clearSectionMessages() {
  const messages = document.querySelectorAll('.section-message');
  messages.forEach(msg => msg.remove());
}

/**
 * Show message in the page (global message)
 * @param {string} message - Message text
 * @param {boolean} isError - Whether it's an error message
 */
function showMessage(message, isError) {
  const messagesContainer = document.getElementById('form-messages');
  if (!messagesContainer) return;
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = isError ? 'form-message error-message' : 'form-message success-message';
  messageEl.textContent = message;
  
  // Clear previous messages
  clearMessages();
  
  // Add new message
  messagesContainer.appendChild(messageEl);
  
  // Auto-remove success messages
  if (!isError) {
    setTimeout(() => {
      if (messageEl.parentNode === messagesContainer) {
        messageEl.remove();
      }
    }, 5000);
  }
}

/**
 * Clear all global messages
 */
function clearMessages() {
  const messagesContainer = document.getElementById('form-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }
}

/**
 * Initialize the account settings
 */
function initAccountSettings() {
  setupSectionToggles();
  setupUpdateButtons();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initAccountSettings);

// Export the functions for potential external use
export { initAccountSettings };