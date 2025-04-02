import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth, db } from "./firebase-config.js";
import { createUserProfile, getUserProfile } from "./firebase-utils.js";

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

// Check Auth State
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

// Utility function to check if user is logged in
export function isUserLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Utility function to get user age
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
