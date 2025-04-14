import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth, db } from "./firebase-config.js";
import { createUserProfile, getUserProfile } from "./firebase-utils.js";

// ============================
// LocalStorage Management
// ============================

// Store recommendation type in localStorage
export function storeRecommendationType(type) {
  localStorage.setItem("recommendationType", type);
}

// Get stored recommendation type
export function getStoredRecommendationType() {
  return localStorage.getItem("recommendationType");
}

// Check if user is logged in
export function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Clear stored recommendation type
export function clearRecommendationType() {
  localStorage.removeItem("recommendationType");
}

// Save login state and user data in localStorage
function saveLoginState(user, age) {
  console.log("Saving login state:", user, age);

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userId", user.uid);
  localStorage.setItem("userEmail", user.email);
  if (age) {
    localStorage.setItem("userAge", age.toString());
  }
}

// Clear login state and user data from localStorage
function clearLoginState() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("recommendationType");
  localStorage.removeItem("userAge");
}

// ============================
// Navigation and Redirects
// ============================

// Check authentication and handle redirect
export async function handleAuthRedirect(type) {
  storeRecommendationType(type);

  if (isLoggedIn()) {
    window.location.href = "questions.html";
  } else {
    window.location.href = `sign-in.html?redirectTo=questions.html`;
  }
}

// Handle account button click
export function handleAccountClick() {
  if (isLoggedIn()) {
    window.location.href = "account.html";
  } else {
    window.location.href = "sign-in.html?redirectTo=account.html";
  }
}

// Handle redirect after authentication
export function handleRedirectAfterAuth() {
  const redirectTo = new URLSearchParams(window.location.search).get(
    "redirectTo"
  );
  const recommendationType = getStoredRecommendationType();

  if (redirectTo) {
    window.location.href = redirectTo;
  } else if (recommendationType) {
    window.location.href = "questions.html";
  } else {
    window.location.href = "index.html";
  }
}

// Protect routes that require authentication
export function protectRoute(redirectTo = "sign-in.html") {
  if (!isLoggedIn()) {
    window.location.href = `${redirectTo}?redirectTo=${window.location.pathname}`;
    return false;
  }
  return true;
}

// ============================
// Authentication Functions
// ============================

// Sign-Up Function
export async function signup(email, password, age, redirectTo) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Use utility function to create user profile
    await createUserProfile(user.uid, { email, age });

    console.log("User signed up and details saved to Firestore:", user);
    saveLoginState(user, age);

    // Auto sign in after signup
    await signInWithEmailAndPassword(auth, email, password);

    const recommendationType = localStorage.getItem("recommendationType");
    if (recommendationType) {
      window.location.href = "questions.html";
    } else {
      window.location.href = redirectTo || "index.html";
    }
  } catch (error) {
    console.error("Error during sign-up:", error);
    throw error;
  }
}

// Login Function
export async function login(email, password, redirectTo) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Use utility function to get user profile
    const userProfile = await getUserProfile(user.uid);
    if (userProfile) {
      saveLoginState(user, userProfile.age);
    } else {
      console.error("User profile not found");
      saveLoginState(user);
    }

    console.log("User logged in:", user);

    const recommendationType = localStorage.getItem("recommendationType");
    if (recommendationType) {
      window.location.href = "questions.html";
    } else {
      window.location.href = redirectTo || "index.html";
    }
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
}

// Logout Function
export async function logout() {
  try {
    await signOut(auth);
    clearLoginState();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
}

// Get user age
export async function getUserAge() {
  const userAge = localStorage.getItem("userAge");
  if (userAge) {
    return Number(userAge);
  }

  const user = auth.currentUser;
  if (user) {
    try {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        localStorage.setItem("userAge", userProfile.age);
        return Number(userProfile.age);
      }
    } catch (error) {
      console.error("Error fetching user age:", error);
    }
  }
  return null;
}

// Update email
export async function updateUserEmail(currentPassword, newEmail) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Update email in Firebase Auth
    await updateEmail(user, newEmail);

    // Update email in Firestore
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { email: newEmail });

    // Update local storage
    localStorage.setItem("userEmail", newEmail);

    return { success: true };
  } catch (error) {
    console.error("Error updating email:", error);
    return { success: false, error };
  }
}

// Update password
export async function updateUserPassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error };
  }
}

// Update user age
export async function updateUserAge(age) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Update age in Firestore
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { age: parseInt(age) });

    // Update local storage
    localStorage.setItem("userAge", age.toString());

    return { success: true };
  } catch (error) {
    console.error("Error updating age:", error);
    return { success: false, error };
  }
}

// Set up auth state listener
export function initializeAuthStateListener() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!localStorage.getItem("userAge")) {
        try {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile) {
            saveLoginState(user, userProfile.age);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        saveLoginState(user);
      }
    } else {
      clearLoginState();
    }
  });
}

// Initialize auth module
export function initializeAuth() {
  initializeAuthStateListener();

  // Set up logout handler if logout link exists
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await logout();
      } catch (error) {
        console.error("Error during logout:", error);
        alert("Failed to log out. Please try again.");
      }
    });
  }
}

// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeAuth();
});
