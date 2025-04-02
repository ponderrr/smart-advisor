import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

// Handle logout functionality
export function setupLogout() {
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userAge");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error during logout:", error);
        alert("Failed to log out. Please try again.");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Setup form handlers
  setupEmailForm();
  setupPasswordForm();
  setupAgeForm();
  setupLogout();

  // Add keyframes for animations
  addKeyframes();
});

// Setup email update form
async function setupEmailForm() {
  const emailForm = document.getElementById("email-form");
  if (!emailForm) return;

  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newEmail = document.getElementById("new-email").value;
    const confirmEmail = document.getElementById("confirm-email").value;

    removeMessages(emailForm);

    if (newEmail !== confirmEmail) {
      showMessage(emailForm, "Emails do not match", true);
      return;
    }

    const password = prompt(
      "Please enter your password to confirm this change:"
    );
    if (!password) {
      showMessage(emailForm, "Password is required to update email", true);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        showMessage(
          emailForm,
          "You must be logged in to change your email",
          true
        );
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      await updateEmail(user, newEmail);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        email: newEmail,
      });

      document.getElementById("current-email").value = newEmail;
      localStorage.setItem("userEmail", newEmail);

      showMessage(emailForm, "Email updated successfully!", false);

      document.getElementById("new-email").value = "";
      document.getElementById("confirm-email").value = "";
    } catch (error) {
      console.error("Error updating email:", error);

      let errorMessage = "Failed to update email";
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in to change your email.";
      } else if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Try again later";
      } else {
        errorMessage = error.message;
      }

      showMessage(emailForm, errorMessage, true);
    }
  });
}

// Setup password update form
function setupPasswordForm() {
  const passwordForm = document.getElementById("password-form");
  if (!passwordForm) return;

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Clear previous messages
    removeMessages(passwordForm);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      showMessage(passwordForm, "New passwords do not match", true);
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      showMessage(passwordForm, "Password must be at least 6 characters", true);
      return;
    }

    try {
      // Re-authenticate user
      const user = auth.currentUser;
      if (!user) {
        showMessage(
          passwordForm,
          "You must be logged in to change your password",
          true
        );
        return;
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Show success message
      showMessage(passwordForm, "Password updated successfully!", false);

      // Clear form fields
      document.getElementById("current-password").value = "";
      document.getElementById("new-password").value = "";
      document.getElementById("confirm-password").value = "";
    } catch (error) {
      console.error("Error updating password:", error);

      let errorMessage = "Failed to update password";
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in to change your password";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      }

      showMessage(passwordForm, errorMessage, true);
    }
  });
}

// Setup age update form
function setupAgeForm() {
  const ageForm = document.getElementById("age-form");
  if (!ageForm) return;

  ageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newAge = document.getElementById("current-age").value;

    // Clear previous messages
    removeMessages(ageForm);

    // Validate age
    if (
      !newAge ||
      isNaN(newAge) ||
      parseInt(newAge) < 1 ||
      parseInt(newAge) > 120
    ) {
      showMessage(ageForm, "Please enter a valid age between 1 and 120", true);
      return;
    }

    try {
      // Update age in Firestore
      const user = auth.currentUser;
      if (!user) {
        showMessage(ageForm, "You must be logged in to update your age", true);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        age: parseInt(newAge),
      });

      // Update localStorage
      localStorage.setItem("userAge", newAge);

      // Show success message
      showMessage(ageForm, "Age updated successfully!", false);
    } catch (error) {
      console.error("Error updating age:", error);
      showMessage(ageForm, "Failed to update age", true);
    }
  });
}

// Helper function to show status message
function showMessage(form, message, isError) {
  const messageElement = document.createElement("div");
  messageElement.className = isError ? "error-message" : "success-message";
  messageElement.textContent = message;

  // Use theme-aware colors
  const isDarkTheme = document.body.getAttribute("data-theme") === "dark";

  if (isError) {
    messageElement.style.backgroundColor = isDarkTheme
      ? "rgba(255, 87, 87, 0.2)"
      : "rgba(220, 53, 69, 0.1)";
    messageElement.style.color = isDarkTheme ? "#ff5757" : "#dc3545";
  } else {
    messageElement.style.backgroundColor = isDarkTheme
      ? "rgba(75, 211, 105, 0.2)"
      : "rgba(40, 167, 69, 0.1)";
    messageElement.style.color = isDarkTheme ? "#4bd369" : "#28a745";
  }

  messageElement.style.padding = "0.75rem";
  messageElement.style.borderRadius = "0.5rem";
  messageElement.style.marginTop = "1rem";
  messageElement.style.textAlign = "center";
  messageElement.style.border = isError
    ? isDarkTheme
      ? "1px solid rgba(255, 87, 87, 0.4)"
      : "1px solid rgba(220, 53, 69, 0.3)"
    : isDarkTheme
    ? "1px solid rgba(75, 211, 105, 0.4)"
    : "1px solid rgba(40, 167, 69, 0.3)";

  messageElement.style.animation = "fadeIn 0.3s ease-in-out";

  // Append the message after the form's button
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.parentNode.insertBefore(
    messageElement,
    submitButton.nextSibling
  );

  // Auto-remove success messages after 5 seconds
  if (!isError) {
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.style.animation = "fadeOut 0.3s ease-in-out";
        setTimeout(() => {
          messageElement.remove();
        }, 300);
      }
    }, 5000);
  }
}

// Remove all status messages from a form
function removeMessages(form) {
  const messages = form.querySelectorAll(".error-message, .success-message");
  messages.forEach((msg) => msg.remove());
}

// Add keyframes for animations if they don't exist
function addKeyframes() {
  if (!document.getElementById("message-keyframes")) {
    const style = document.createElement("style");
    style.id = "message-keyframes";
    style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
    document.head.appendChild(style);
  }
}
