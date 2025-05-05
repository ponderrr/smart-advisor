import { supabase } from "../supabase-config.js";

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

export async function getUserSubscription() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { tier: "free", isActive: false };
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      return { tier: "free", isActive: false };
    }

    if (!data) {
      return { tier: "free", isActive: false };
    }

    return {
      tier: data.tier,
      isActive: data.status === "active",
      startDate: data.current_period_start,
      endDate: data.current_period_end,
      autoRenew: !data.cancel_at_period_end,
    };
  } catch (error) {
    console.error("Error getting user subscription:", error);
    return { tier: "free", isActive: false };
  }
}

export async function startSubscription(plan) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to subscribe");
    }

    const response = await fetch("/api/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: plan,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to start subscription");
    }

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    }

    return {
      success: true,
      message: "Subscription started successfully",
      ...data,
    };
  } catch (error) {
    console.error("Error starting subscription:", error);
    return {
      success: false,
      message: error.message || "Failed to start subscription",
    };
  }
}

export async function cancelSubscription() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to cancel subscription");
    }

    const response = await fetch("/api/cancel-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to cancel subscription");
    }

    const data = await response.json();

    return {
      success: true,
      message:
        data.message ||
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

export async function updateSubscriptionPlan(newPlan) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to update subscription");
    }

    const response = await fetch("/api/update-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: newPlan,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update subscription");
    }

    const data = await response.json();

    return {
      success: true,
      message: "Subscription updated successfully",
      ...data,
    };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return {
      success: false,
      message: error.message || "Failed to update subscription",
    };
  }
}

export async function getManagePortalUrl() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to manage your subscription");
    }

    const response = await fetch("/api/customer-portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get portal URL");
    }

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    }

    return { success: true };
  } catch (error) {
    console.error("Error getting customer portal URL:", error);
    return {
      success: false,
      message: error.message || "Failed to get portal URL",
    };
  }
}
