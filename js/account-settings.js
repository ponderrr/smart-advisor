import { supabase } from "./supabase-config.js";
import {
  updateUserEmail,
  updateUserPassword,
  updateUserAge,
  updateUserUsername,
} from "./auth-manager.js";

function setupSectionToggles() {
  const sectionHeaders = document.querySelectorAll(".section-header");

  sectionHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const section = this.closest(".settings-section");
      const content = section.querySelector(".section-content");
      const icon = this.querySelector(".toggle-icon");

      content.classList.toggle("active");

      if (content.classList.contains("active")) {
        icon.style.transform = "rotate(45deg)";
      } else {
        icon.style.transform = "rotate(0deg)";
      }
    });
  });
}

function setupUpdateButtons() {
  const emailUpdateBtn = document.getElementById("email-update-btn");
  const newEmailInput = document.getElementById("new-email");
  const confirmEmailInput = document.getElementById("confirm-email");

  if (emailUpdateBtn) {
    emailUpdateBtn.addEventListener("click", handleEmailUpdate);
  }

  if (newEmailInput) {
    newEmailInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmEmailInput?.focus();
      }
    });
  }

  if (confirmEmailInput) {
    confirmEmailInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleEmailUpdate();
      }
    });
  }

  const passwordUpdateBtn = document.getElementById("password-update-btn");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");

  if (passwordUpdateBtn) {
    passwordUpdateBtn.addEventListener("click", handlePasswordUpdate);
  }

  if (newPasswordInput) {
    newPasswordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmPasswordInput?.focus();
      }
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handlePasswordUpdate();
      }
    });
  }

  const ageUpdateBtn = document.getElementById("age-update-btn");
  const newAgeInput = document.getElementById("new-age");

  if (ageUpdateBtn) {
    ageUpdateBtn.addEventListener("click", handleAgeUpdate);
  }

  if (newAgeInput) {
    newAgeInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAgeUpdate();
      }
    });
  }

  const usernameUpdateBtn = document.getElementById("username-update-btn");
  const newUsernameInput = document.getElementById("new-username");

  if (usernameUpdateBtn) {
    usernameUpdateBtn.addEventListener("click", handleUsernameUpdate);
  }

  if (newUsernameInput) {
    newUsernameInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUsernameUpdate();
      }
    });
  }

  const deleteAccountBtn = document.getElementById("delete-account-btn");
  const deleteConfirmation = document.getElementById("delete-confirmation");

  if (deleteAccountBtn && deleteConfirmation) {
    deleteAccountBtn.disabled = true;

    deleteConfirmation.addEventListener("input", function () {
      deleteAccountBtn.disabled = this.value !== "DELETE";
    });

    deleteAccountBtn.addEventListener("click", handleDeleteAccount);
  }

  if (deleteConfirmation) {
    deleteConfirmation.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && this.value === "DELETE") {
        e.preventDefault();
        handleDeleteAccount();
      }
    });
  }
}

function handleEmailUpdate() {
  const newEmail = document.getElementById("new-email")?.value;
  const confirmEmail = document.getElementById("confirm-email")?.value;
  const currentEmail = document.getElementById("current-email")?.value;

  clearSectionMessages();

  if (!newEmail || !confirmEmail) {
    showSectionMessage("email", "Please fill in all email fields", true);
    return;
  }

  if (newEmail === currentEmail) {
    showSectionMessage(
      "email",
      "New email must be different from your current email",
      true
    );
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    showSectionMessage("email", "Please enter a valid email address", true);
    return;
  }

  if (newEmail !== confirmEmail) {
    showSectionMessage("email", "Email addresses do not match", true);
    return;
  }

  const message =
    "To confirm changing your email, please enter your current password:";
  const password = prompt(message, "");

  if (password === null) {
    return;
  }

  if (!password) {
    showSectionMessage("email", "Password is required to update email", true);
    return;
  }

  updateEmailWithPassword(password, newEmail);
}

function handlePasswordUpdate() {
  const newPassword = document.getElementById("new-password")?.value;
  const confirmPassword = document.getElementById("confirm-password")?.value;

  clearSectionMessages();

  if (!newPassword || !confirmPassword) {
    showSectionMessage("password", "Please fill in all password fields", true);
    return;
  }

  if (newPassword.length < 6) {
    showSectionMessage(
      "password",
      "Password must be at least 6 characters long",
      true
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    showSectionMessage("password", "Passwords do not match", true);
    return;
  }

  const message =
    "To confirm changing your password, please enter your current password:";
  const currentPassword = prompt(message, "");

  if (currentPassword === null) {
    return;
  }

  if (!currentPassword) {
    showSectionMessage(
      "password",
      "Current password is required to update password",
      true
    );
    return;
  }

  if (newPassword === currentPassword) {
    showSectionMessage(
      "password",
      "New password must be different from your current password",
      true
    );
    return;
  }

  updatePasswordWithConfirmation(currentPassword, newPassword);
}

function handleAgeUpdate() {
  const newAge = document.getElementById("new-age")?.value;
  const currentAge = document.getElementById("current-age")?.value;

  clearSectionMessages();

  if (!newAge) {
    showSectionMessage("age", "Please enter your new age", true);
    return;
  }

  const ageNum = parseInt(newAge);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    showSectionMessage("age", "Please enter a valid age (1-120)", true);
    return;
  }

  if (parseInt(currentAge) === ageNum) {
    showSectionMessage(
      "age",
      "New age must be different from your current age",
      true
    );
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to update your age to ${ageNum}?`
  );
  if (!confirmed) {
    return;
  }

  updateAgeWithConfirmation(ageNum);
}

function handleUsernameUpdate() {
  const newUsername = document.getElementById("new-username")?.value;

  clearSectionMessages();

  if (!newUsername) {
    showSectionMessage("username", "Please enter your new username", true);
    return;
  }

  if (newUsername.length < 3 || newUsername.length > 20) {
    showSectionMessage(
      "username",
      "Username must be between 3 and 20 characters",
      true
    );
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(newUsername)) {
    showSectionMessage(
      "username",
      "Username can only contain letters, numbers, underscores and hyphens",
      true
    );
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to update your username to ${newUsername}?`
  );
  if (!confirmed) {
    return;
  }

  updateUsernameWithConfirmation(newUsername);
}

async function updateEmailWithPassword(password, newEmail) {
  try {
    showSectionMessage("email", "Processing...", false);

    let result = await updateUserEmail(password, newEmail);

    if (result.success) {
      const currentEmailField = document.getElementById("current-email");
      if (currentEmailField) {
        currentEmailField.value = newEmail;
      }

      document.getElementById("new-email").value = "";
      document.getElementById("confirm-email").value = "";

      showSectionMessage("email", "Email updated successfully!", false);
    } else {
      let errorMessage = "Authentication failed";

      if (result.error?.message) {
        errorMessage = result.error.message;
      }

      showSectionMessage("email", errorMessage, true);
    }
  } catch (error) {
    console.error("Error updating email:", error);

    let errorMessage = "An error occurred while updating email";

    if (error?.message) {
      errorMessage = error.message;
    }

    showSectionMessage("email", errorMessage, true);
  }
}

async function updatePasswordWithConfirmation(currentPassword, newPassword) {
  try {
    showSectionMessage("password", "Processing...", false);

    let result = await updateUserPassword(currentPassword, newPassword);

    if (result.success) {
      document.getElementById("new-password").value = "";
      document.getElementById("confirm-password").value = "";

      showSectionMessage("password", "Password updated successfully!", false);
    } else {
      let errorMessage = "Authentication failed";

      if (result.error?.message) {
        errorMessage = result.error.message;
      }

      showSectionMessage("password", errorMessage, true);
    }
  } catch (error) {
    console.error("Error updating password:", error);

    let errorMessage = "An error occurred while updating password";

    if (error?.message) {
      errorMessage = error.message;
    }

    showSectionMessage("password", errorMessage, true);
  }
}

async function updateAgeWithConfirmation(newAge) {
  try {
    showSectionMessage("age", "Processing...", false);

    let result = await updateUserAge(newAge);

    if (result.success) {
      const currentAgeField = document.getElementById("current-age");
      if (currentAgeField) {
        currentAgeField.value = newAge;
      }

      document.getElementById("new-age").value = "";

      showSectionMessage("age", "Age updated successfully!", false);
    } else {
      let errorMessage = "Failed to update age";

      if (result.error?.message) {
        errorMessage = result.error.message;
      }

      showSectionMessage("age", errorMessage, true);
    }
  } catch (error) {
    console.error("Error updating age:", error);

    let errorMessage = "An error occurred while updating age";

    if (error?.message) {
      errorMessage = error.message;
    }

    showSectionMessage("age", errorMessage, true);
  }
}

async function updateUsernameWithConfirmation(newUsername) {
  try {
    showSectionMessage("username", "Processing...", false);

    let result = await updateUserUsername(newUsername);

    if (result.success) {
      const currentUsernameField = document.getElementById("current-username");
      if (currentUsernameField) {
        currentUsernameField.value = newUsername;
      }

      const usernameDisplay = document.querySelector(".user-info h2");
      if (usernameDisplay) {
        usernameDisplay.textContent = newUsername;
      }

      const navbarUsername = document.getElementById("navbar-username");
      if (navbarUsername) {
        navbarUsername.textContent = newUsername;
      }

      document.getElementById("new-username").value = "";

      showSectionMessage("username", "Username updated successfully!", false);
    } else {
      let errorMessage = "Failed to update username";

      if (result.error?.message) {
        errorMessage = result.error.message;
      }

      showSectionMessage("username", errorMessage, true);
    }
  } catch (error) {
    console.error("Error updating username:", error);

    let errorMessage = "An error occurred while updating username";

    if (error?.message) {
      errorMessage = error.message;
    }

    showSectionMessage("username", errorMessage, true);
  }
}

async function handleDeleteAccount() {
  try {
    const confirmationText = document.getElementById(
      "delete-confirmation"
    ).value;

    if (confirmationText !== "DELETE") {
      showSectionMessage(
        "delete-account",
        'Please type "DELETE" to confirm account deletion',
        true
      );
      return;
    }

    const confirmDelete = confirm(
      "Are you absolutely sure you want to delete your account? This action cannot be undone, and all your data will be permanently deleted."
    );

    if (confirmDelete) {
      const deleteButton = document.getElementById("delete-account-btn");
      if (deleteButton) {
        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting Account...";
      }

      showSectionMessage("delete-account", "Processing your request...", false);

      await deleteUserAccount();
    }
  } catch (error) {
    console.error("Error in delete account process:", error);
    showSectionMessage(
      "delete-account",
      `Error: ${
        error.message || "An error occurred while processing your request"
      }`,
      true
    );

    const deleteButton = document.getElementById("delete-account-btn");
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete My Account";
    }
  }
}

async function deleteUserAccount() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to delete your account");
    }

    const password = prompt(
      "Please enter your password to confirm account deletion:"
    );

    if (password === null || password === "") {
      const deleteButton = document.getElementById("delete-account-btn");
      if (deleteButton) {
        deleteButton.disabled = false;
        deleteButton.textContent = "Delete My Account";
      }

      showSectionMessage("delete-account", "Account deletion canceled", true);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (signInError) {
      throw signInError;
    }

    await deleteUserData(user.id);

    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      throw error;
    }

    localStorage.clear();

    alert(
      "Your account has been successfully deleted. You will now be redirected to the home page."
    );

    window.location.href = "index.html";
  } catch (error) {
    console.error("Error deleting account:", error);

    const deleteButton = document.getElementById("delete-account-btn");
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete My Account";
    }

    let errorMessage = "Failed to delete account";

    if (error.message && error.message.includes("password")) {
      errorMessage = "Incorrect password. Please try again.";
    } else if (error.message && error.message.includes("too many requests")) {
      errorMessage = "Too many unsuccessful attempts. Please try again later.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    showSectionMessage("delete-account", errorMessage, true);
  }
}

/**
 * Delete user data from Supabase
 * @param {string} userId - User ID to delete data for
 */
async function deleteUserData(userId) {
  try {
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      throw error;
    }

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", userId);

    if (subscriptionError) {
      console.warn("Error deleting subscription data:", subscriptionError);
    }

    console.log("User data deleted successfully");
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw new Error("Failed to delete user data");
  }
}

/**
 * Show message specific to a section
 * @param {string} section - Section identifier (email, password, age, username)
 * @param {string} message - Message text
 * @param {boolean} isError - Whether it's an error message
 */
function showSectionMessage(section, message, isError) {
  const sectionEl = document.querySelector(
    `.settings-section[data-section="${section}"]`
  );
  if (!sectionEl) return;

  let messageContainer = sectionEl.querySelector(".section-message");
  if (!messageContainer) {
    messageContainer = document.createElement("div");
    messageContainer.className = "section-message";

    const sectionContent = sectionEl.querySelector(".section-content");
    if (sectionContent) {
      sectionContent.insertBefore(messageContainer, sectionContent.firstChild);
    }
  }

  messageContainer.textContent = message;
  messageContainer.className = isError
    ? "section-message error-message"
    : "section-message success-message";

  const sectionContent = sectionEl.querySelector(".section-content");
  if (sectionContent && !sectionContent.classList.contains("active")) {
    sectionContent.classList.add("active");

    const toggleIcon = sectionEl.querySelector(".toggle-icon");
    if (toggleIcon) {
      toggleIcon.style.transform = "rotate(45deg)";
    }
  }

  if (!isError) {
    setTimeout(() => {
      if (messageContainer.parentNode) {
        messageContainer.remove();
      }
    }, 5000);
  }
}

function clearSectionMessages() {
  const messages = document.querySelectorAll(".section-message");
  messages.forEach((msg) => msg.remove());
}

/**
 * Show message in the page (global message)
 * @param {string} message - Message text
 * @param {boolean} isError - Whether it's an error message
 */
function showMessage(message, isError) {
  const messagesContainer = document.getElementById("form-messages");
  if (!messagesContainer) return;

  const messageEl = document.createElement("div");
  messageEl.className = isError
    ? "form-message error-message"
    : "form-message success-message";
  messageEl.textContent = message;

  clearMessages();

  messagesContainer.appendChild(messageEl);

  if (!isError) {
    setTimeout(() => {
      if (messageEl.parentNode === messagesContainer) {
        messageEl.remove();
      }
    }, 5000);
  }
}

function clearMessages() {
  const messagesContainer = document.getElementById("form-messages");
  if (messagesContainer) {
    messagesContainer.innerHTML = "";
  }
}

function initAccountSettings() {
  setupSectionToggles();
  setupUpdateButtons();

  const hash = window.location.hash;
  if (hash) {
    const sectionName = hash.substring(1);
    const section = document.querySelector(
      `.settings-section[data-section="${sectionName}"]`
    );
    if (section) {
      const content = section.querySelector(".section-content");
      const icon = section.querySelector(".toggle-icon");

      content.classList.add("active");
      icon.style.transform = "rotate(45deg)";

      setTimeout(() => {
        section.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }
}

document.addEventListener("DOMContentLoaded", initAccountSettings);

export { initAccountSettings, handleUsernameUpdate };
