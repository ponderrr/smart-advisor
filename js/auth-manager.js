import { supabase } from "./supabase-config.js";
import { getUserProfile, createUserProfile } from "./supabase-utils.js";
import { loadProfilePicture } from "./profile-picture.js";

export function storeRecommendationType(type) {
  localStorage.setItem("recommendationType", type);
}

export function getStoredRecommendationType() {
  return localStorage.getItem("recommendationType");
}

export function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

export function clearRecommendationType() {
  localStorage.removeItem("recommendationType");
}

function saveLoginState(user, userData) {
  console.log("Saving login state:", user, userData);

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userEmail", user.email);

  if (userData) {
    if (userData.age) {
      localStorage.setItem("userAge", userData.age.toString());
    }
    if (userData.username) {
      localStorage.setItem("username", userData.username);
    }
    if (userData.profilePictureURL) {
      localStorage.setItem("profilePictureURL", userData.profilePictureURL);
    } else {
      localStorage.removeItem("profilePictureURL");
    }
  }
}

function clearLoginState() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("recommendationType");
  localStorage.removeItem("userAge");
  localStorage.removeItem("username");
  localStorage.removeItem("profilePictureURL");
}

export async function handleAuthRedirect(type) {
  storeRecommendationType(type);

  if (isLoggedIn()) {
    window.location.href = "questions.html";
  } else {
    window.location.href = `sign-in.html?redirectTo=questions.html`;
  }
}

export function handleAccountClick() {
  if (isLoggedIn()) {
    window.location.href = "account.html";
  } else {
    window.location.href = "sign-in.html?redirectTo=account.html";
  }
}

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

export function protectRoute(redirectTo = "sign-in.html") {
  if (!isLoggedIn()) {
    window.location.href = `${redirectTo}?redirectTo=${window.location.pathname}`;
    return false;
  }
  return true;
}

export async function signup(email, password, age, username, redirectTo) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) throw error;

    if (!user) {
      return {
        success: false,
        errorMessage: "Registration failed. Please try again.",
      };
    }

    await createUserProfile(user.id, { email, age, username });

    console.log("User signed up and details saved to Supabase:", user);

    const userProfile = await getUserProfile(user.id);
    saveLoginState(user, userProfile);

    loadProfilePicture();

    const recommendationType = localStorage.getItem("recommendationType");
    if (recommendationType) {
      window.location.href = "questions.html";
    } else {
      window.location.href = redirectTo || "index.html";
    }

    return { success: true };
  } catch (error) {
    console.error("Error during sign-up:", error);

    return {
      success: false,
      errorCode: error.code,
      errorMessage: getErrorMessage(error.code || error.message),
    };
  }
}

export async function login(email, password, redirectTo) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    const userProfile = await getUserProfile(user.id);
    if (userProfile) {
      saveLoginState(user, userProfile);
    } else {
      console.error("User profile not found");
      saveLoginState(user);
    }

    console.log("User logged in:", user);

    loadProfilePicture();

    const recommendationType = localStorage.getItem("recommendationType");
    if (recommendationType) {
      window.location.href = "questions.html";
    } else {
      window.location.href = redirectTo || "index.html";
    }

    return { success: true };
  } catch (error) {
    console.error("Error during login:", error);

    return {
      success: false,
      errorCode: error.code || "auth_error",
      errorMessage: getErrorMessage(error.code || error.message),
    };
  }
}

export function getErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-credential":
    case "invalid-credential":
    case "invalid_credentials":
    case "invalid_login_credentials":
      return "Invalid email or password. Please try again.";
    case "auth/user-disabled":
    case "user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "user-not-found":
      return "No account found with this email. Please check your email or sign up.";
    case "auth/wrong-password":
    case "wrong-password":
    case "invalid_password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
    case "invalid-email":
    case "invalid_email":
      return "Invalid email address format. Please check your email.";
    case "auth/too-many-requests":
    case "too-many-requests":
      return "Too many unsuccessful login attempts. Please try again later or reset your password.";
    case "auth/network-request-failed":
    case "network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/email-already-in-use":
    case "email-already-in-use":
    case "email-already-exists":
    case "email_already_in_use":
      return "This email is already in use by another account.";
    case "auth/weak-password":
    case "weak-password":
    case "weak_password":
      return "Password is too weak. Please use a stronger password.";
    case "auth/operation-not-allowed":
    case "operation-not-allowed":
      return "This operation is not allowed. Please contact support.";
    default:
      if (errorCode.includes("email") && errorCode.includes("already")) {
        return "This email is already in use by another account.";
      }
      if (
        errorCode.includes("password") &&
        (errorCode.includes("weak") || errorCode.includes("strength"))
      ) {
        return "Password is too weak. Please use a stronger password.";
      }
      return "Authentication error. Please try again later.";
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    clearLoginState();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
}

export async function getUserAge() {
  const userAge = localStorage.getItem("userAge");
  if (userAge) {
    return Number(userAge);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      const userProfile = await getUserProfile(user.id);
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

export async function getUsername() {
  const username = localStorage.getItem("username");
  if (username) {
    return username;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      const userProfile = await getUserProfile(user.id);
      if (userProfile && userProfile.username) {
        localStorage.setItem("username", userProfile.username);
        return userProfile.username;
      }
    } catch (error) {
      console.error("Error fetching username:", error);
    }
  }
  return null;
}

export async function updateUserEmail(currentPassword, newEmail) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        error: {
          code: "auth/wrong-password",
          message: "Current password is incorrect",
        },
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (updateError) throw updateError;

    const { error: dbError } = await supabase
      .from("users")
      .update({ email: newEmail })
      .eq("id", user.id);

    if (dbError) throw dbError;

    localStorage.setItem("userEmail", newEmail);

    return { success: true };
  } catch (error) {
    console.error("Error updating email:", error);
    return { success: false, error };
  }
}

export async function updateUserPassword(currentPassword, newPassword) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        error: {
          code: "auth/wrong-password",
          message: "Current password is incorrect",
        },
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error };
  }
}

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
 * Update user's password during password reset flow
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} Result of password update
 */
export async function updatePasswordAfterReset(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("Error confirming password reset:", error);

    let errorMessage = "Failed to reset password";

    if (error.message) {
      if (error.message.includes("weak")) {
        errorMessage =
          "This password is too weak. Please choose a stronger password.";
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

export async function updateUserAge(age) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { error } = await supabase
      .from("users")
      .update({ age: parseInt(age) })
      .eq("id", user.id);

    if (error) throw error;

    localStorage.setItem("userAge", age.toString());

    return { success: true };
  } catch (error) {
    console.error("Error updating age:", error);
    return { success: false, error };
  }
}

export async function updateUserUsername(username) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { error } = await supabase
      .from("users")
      .update({ username: username })
      .eq("id", user.id);

    if (error) throw error;

    localStorage.setItem("username", username);

    return { success: true };
  } catch (error) {
    console.error("Error updating username:", error);
    return { success: false, error };
  }
}

export async function updateUserAccessibilityPreferences(preferences) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .single();

    if (fetchError) throw fetchError;

    const updatedPreferences = {
      ...(userData.preferences || {}),
      accessibility: preferences,
    };

    const { error } = await supabase
      .from("users")
      .update({ preferences: updatedPreferences })
      .eq("id", user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating accessibility preferences:", error);
    return { success: false, error };
  }
}

export function initializeAuthStateListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Supabase Auth event:", event);

    if (event === "SIGNED_IN" && session?.user) {
      try {
        const userProfile = await getUserProfile(session.user.id);
        if (userProfile) {
          saveLoginState(session.user, userProfile);
          loadProfilePicture();
        } else {
          saveLoginState(session.user);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        saveLoginState(session.user);
      }
    } else if (event === "SIGNED_OUT") {
      clearLoginState();
    }
  });
}

export function initializeAuth() {
  initializeAuthStateListener();

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

document.addEventListener("DOMContentLoaded", () => {
  initializeAuth();
});
