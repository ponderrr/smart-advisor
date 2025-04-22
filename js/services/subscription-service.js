import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase-config.js";
import { getUserProfile } from "../firebase-utils.js";

/**
 * Get the current user's subscription status
 * @returns {Promise<Object>} User's subscription details
 */
export async function getUserSubscription() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { tier: "free", isActive: false };
    }

    const userProfile = await getUserProfile(user.uid);
    if (!userProfile || !userProfile.subscription) {
      return { tier: "free", isActive: false };
    }

    return {
      tier: userProfile.subscription.plan || "free",
      isActive: userProfile.subscription.isActive || false,
      startDate: userProfile.subscription.startDate,
      endDate: userProfile.subscription.endDate,
      autoRenew: userProfile.subscription.autoRenew || false,
    };
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return { tier: "free", isActive: false };
  }
}

/**
 * Check if user has access to a premium feature
 * @param {string} featureKey - Key of the feature to check
 * @returns {Promise<boolean>} Whether user has access to the feature
 */
export async function hasFeatureAccess(featureKey) {
  const subscription = await getUserSubscription();

  // Define feature access rules
  const featureAccess = {
    // Features restricted to premium and above
    premiumQuestions: subscription.tier !== "free" && subscription.isActive,
    multipleRecommendations:
      subscription.tier !== "free" && subscription.isActive,
    customLists: subscription.tier !== "free" && subscription.isActive,
    socialSharing: subscription.tier !== "free" && subscription.isActive,

    // Features restricted to annual plan only
    prioritySupport:
      subscription.tier === "premium-annual" && subscription.isActive,
    exclusiveContent:
      subscription.tier === "premium-annual" && subscription.isActive,
  };

  return featureAccess[featureKey] || false;
}

/**
 * Start a subscription (mock implementation, to be replaced with Stripe)
 * @param {string} plan - Plan ID ('premium-monthly' or 'premium-annual')
 * @returns {Promise<Object>} Result of subscription attempt
 */
export async function startSubscription(plan) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("You must be logged in to subscribe");
    }

    // Validate plan
    if (!SUBSCRIPTION_PLANS[plan]) {
      throw new Error("Invalid subscription plan");
    }

    // Get current date for start date
    const startDate = new Date().toISOString();

    // Calculate end date based on plan
    const endDate = new Date();
    if (plan === "premium-annual") {
      endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
    }

    // Update user document with subscription info
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      subscription: {
        plan: plan,
        startDate: startDate,
        endDate: endDate.toISOString(),
        isActive: true,
        autoRenew: true,
      },
    });

    return {
      success: true,
      message: "Subscription started successfully",
      subscription: {
        plan,
        startDate,
        endDate: endDate.toISOString(),
        isActive: true,
        autoRenew: true,
      },
    };
  } catch (error) {
    console.error("Error starting subscription:", error);
    return {
      success: false,
      message: error.message || "Failed to start subscription",
    };
  }
}

/**
 * Cancel a subscription (mock implementation, to be replaced with Stripe)
 * @returns {Promise<Object>} Result of cancellation attempt
 */
export async function cancelSubscription() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("You must be logged in to cancel subscription");
    }

    // Get current subscription
    const userProfile = await getUserProfile(user.uid);
    if (
      !userProfile ||
      !userProfile.subscription ||
      !userProfile.subscription.isActive
    ) {
      throw new Error("No active subscription found");
    }

    // Update user document to turn off auto-renewal
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      "subscription.autoRenew": false,
    });

    return {
      success: true,
      message:
        "Your subscription will remain active until the end date, then will not renew.",
    };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      message: error.message || "Failed to cancel subscription",
    };
  }
}

/**
 * Update a subscription plan (mock implementation, to be replaced with Stripe)
 * @param {string} newPlan - New plan ID ('premium-monthly' or 'premium-annual')
 * @returns {Promise<Object>} Result of update attempt
 */
export async function updateSubscriptionPlan(newPlan) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("You must be logged in to update subscription");
    }

    // Validate plan
    if (!SUBSCRIPTION_PLANS[newPlan]) {
      throw new Error("Invalid subscription plan");
    }

    // Get current subscription
    const userProfile = await getUserProfile(user.uid);
    if (
      !userProfile ||
      !userProfile.subscription ||
      !userProfile.subscription.isActive
    ) {
      throw new Error("No active subscription found");
    }

    // Calculate new end date based on plan
    const currentEndDate = new Date(userProfile.subscription.endDate);
    const newEndDate = new Date();

    if (newPlan === "premium-annual") {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1); // Add 1 year
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1); // Add 1 month
    }

    // If upgrading from monthly to annual, give some bonus time
    if (
      userProfile.subscription.plan === "premium-monthly" &&
      newPlan === "premium-annual"
    ) {
      // Add the remaining time from the monthly subscription to the annual one
      const timeLeftOnCurrentSub = currentEndDate.getTime() - Date.now();
      if (timeLeftOnCurrentSub > 0) {
        newEndDate.setTime(newEndDate.getTime() + timeLeftOnCurrentSub);
      }
    }

    // Update user document with new subscription info
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      "subscription.plan": newPlan,
      "subscription.endDate": newEndDate.toISOString(),
    });

    return {
      success: true,
      message: "Subscription updated successfully",
      subscription: {
        plan: newPlan,
        endDate: newEndDate.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return {
      success: false,
      message: error.message || "Failed to update subscription",
    };
  }
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "Basic movie & book recommendations",
      "Up to 5 questions per recommendation",
      "Basic accessibility options",
      "Standard recommendation history",
    ],
    limits: {
      maxQuestions: 5,
      maxRecommendations: 1,
      maxHistory: 10,
    },
  },
  "premium-monthly": {
    name: "Premium Monthly",
    price: 4.99,
    interval: "month",
    features: [
      "Advanced AI-powered recommendations",
      "Unlimited questions per recommendation",
      "Enhanced accessibility options",
      "Ad-free experience",
      "Create custom recommendation lists",
      "Share recommendations with friends",
      "Early access to new features",
    ],
    limits: {
      maxQuestions: 15,
      maxRecommendations: 5,
      maxHistory: 50,
    },
  },
  "premium-annual": {
    name: "Premium Annual",
    price: 39.99,
    interval: "year",
    features: [
      "All Premium features",
      "Priority customer support",
      "Exclusive annual subscriber content",
      "Two months free",
    ],
    limits: {
      maxQuestions: 15,
      maxRecommendations: 10,
      maxHistory: 100,
    },
  },
};
