import {
  getUserSubscription,
  SUBSCRIPTION_PLANS,
} from "./services/subscription-service.js";

export async function checkFeatureAccess(feature, requestedValue) {
  try {
    const subscription = await getUserSubscription();
    const planLimits = SUBSCRIPTION_PLANS[subscription.tier || "free"].limits;

    if (!(feature in planLimits)) {
      return {
        hasAccess: false,
        message: `Unknown feature: ${feature}`,
        currentLimit: 0,
        planName: SUBSCRIPTION_PLANS[subscription.tier || "free"].name,
      };
    }

    const limit = planLimits[feature];
    const hasAccess = requestedValue <= limit;

    return {
      hasAccess,
      message: hasAccess
        ? "Access granted"
        : `Your ${
            SUBSCRIPTION_PLANS[subscription.tier || "free"].name
          } plan is limited to ${limit} ${feature}. Upgrade to access more.`,
      currentLimit: limit,
      planName: SUBSCRIPTION_PLANS[subscription.tier || "free"].name,
    };
  } catch (error) {
    console.error("Error checking feature access:", error);
    const planLimits = SUBSCRIPTION_PLANS.free.limits;
    const limit = feature in planLimits ? planLimits[feature] : 0;

    return {
      hasAccess: requestedValue <= limit,
      message: `Error checking access. Using free plan limits.`,
      currentLimit: limit,
      planName: "Free",
    };
  }
}

/**
 * Display upgrade modal when user attempts to access premium feature
 * @param {string} feature - Feature name for display
 * @param {Object} accessCheck - Result from checkFeatureAccess()
 * @returns {Promise<boolean>} Whether user wants to upgrade
 */
export function showUpgradeModal(feature, accessCheck) {
  return new Promise((resolve) => {
    const featureDisplayNames = {
      maxQuestions: "questions per recommendation",
      maxRecommendations: "recommendations per query",
      maxHistory: "saved recommendations in history",
    };

    const displayName = featureDisplayNames[feature] || feature;

    const modal = document.createElement("div");
    modal.className = "upgrade-modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "2000";
    modal.style.backdropFilter = "blur(3px)";

    const modalContent = document.createElement("div");
    modalContent.className = "upgrade-modal-content";
    modalContent.style.backgroundColor = "var(--card-bg)";
    modalContent.style.borderRadius = "1rem";
    modalContent.style.padding = "2rem";
    modalContent.style.maxWidth = "500px";
    modalContent.style.width = "90%";
    modalContent.style.textAlign = "center";
    modalContent.style.boxShadow = "0 5px 20px rgba(0, 0, 0, 0.3)";

    const title = document.createElement("h2");
    title.textContent = "Premium Feature";
    title.style.marginBottom = "1rem";
    title.style.color = "var(--text-color)";

    const message = document.createElement("p");
    message.textContent = `Your ${accessCheck.planName} plan is limited to ${accessCheck.currentLimit} ${displayName}. Upgrade to Premium for more!`;
    message.style.marginBottom = "1.5rem";
    message.style.color = "var(--text-color)";

    const comparisonDiv = document.createElement("div");
    comparisonDiv.style.display = "flex";
    comparisonDiv.style.justifyContent = "space-around";
    comparisonDiv.style.marginBottom = "2rem";
    comparisonDiv.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
    comparisonDiv.style.padding = "1rem";
    comparisonDiv.style.borderRadius = "0.5rem";

    const currentPlan = document.createElement("div");
    currentPlan.innerHTML = `
      <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem; color: var(--text-color)">Current Plan</h3>
      <div style="font-size: 1.5rem; font-weight: bold; color: var(--text-color)">${accessCheck.currentLimit}</div>
      <div style="color: var(--text-light)">${displayName}</div>
    `;

    const premiumPlan = document.createElement("div");
    const premiumLimit = SUBSCRIPTION_PLANS["premium-monthly"].limits[feature];
    premiumPlan.innerHTML = `
      <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem; color: var(--accent-color)">Premium Plan</h3>
      <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent-color)">${premiumLimit}</div>
      <div style="color: var(--text-light)">${displayName}</div>
    `;

    comparisonDiv.appendChild(currentPlan);
    comparisonDiv.appendChild(premiumPlan);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "1rem";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Not Now";
    cancelButton.style.flex = "1";
    cancelButton.style.padding = "0.8rem";
    cancelButton.style.border = "1px solid var(--border-color)";
    cancelButton.style.borderRadius = "0.5rem";
    cancelButton.style.backgroundColor = "transparent";
    cancelButton.style.color = "var(--text-color)";
    cancelButton.style.cursor = "pointer";

    const upgradeButton = document.createElement("button");
    upgradeButton.textContent = "Upgrade Now";
    upgradeButton.style.flex = "1";
    upgradeButton.style.padding = "0.8rem";
    upgradeButton.style.border = "none";
    upgradeButton.style.borderRadius = "0.5rem";
    upgradeButton.style.backgroundColor = "var(--button-bg-color)";
    upgradeButton.style.color = "white";
    upgradeButton.style.cursor = "pointer";

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(upgradeButton);

    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(comparisonDiv);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);

    cancelButton.addEventListener("click", () => {
      modal.remove();
      resolve(false);
    });

    upgradeButton.addEventListener("click", () => {
      modal.remove();
      resolve(true);
      window.location.href = "subscription.html";
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(false);
      }
    });
  });
}

/**
 * Protect a page by subscription tier
 * @param {Array<string>} requiredTiers - Array of allowed subscription tiers
 * @param {string} redirectUrl - URL to redirect if access denied
 * @returns {Promise<boolean>} Whether access is granted
 */
export async function protectPageBySubscription(
  requiredTiers = ["premium-monthly", "premium-annual"],
  redirectUrl = "subscription.html"
) {
  try {
    if (!auth.currentUser) {
      window.location.href = `sign-in.html?redirectTo=${window.location.pathname}`;
      return false;
    }

    const subscription = await getUserSubscription();

    const hasAccess =
      requiredTiers.includes(subscription.tier) && subscription.isActive;

    if (!hasAccess) {
      window.location.href = redirectUrl;
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error protecting page:", error);
    window.location.href = redirectUrl;
    return false;
  }
}

/**
 * Check if current element should be restricted based on subscription
 * @param {HTMLElement} element - Element to check
 * @returns {Promise<boolean>} Whether element should be shown
 */
export async function checkElementAccess(element) {
  const requiredTier = element.dataset.subscriptionRequired;
  if (!requiredTier) return true;

  const subscription = await getUserSubscription();

  const requiredTiers = requiredTier.split(",");
  const hasAccess =
    requiredTiers.includes(subscription.tier) && subscription.isActive;

  return hasAccess;
}

/**
 * Process all elements on page with subscription restrictions
 * Add this to DOMContentLoaded event
 */
export async function processRestrictedElements() {
  const restrictedElements = document.querySelectorAll(
    "[data-subscription-required]"
  );

  for (const element of restrictedElements) {
    const hasAccess = await checkElementAccess(element);

    if (!hasAccess) {
      if (element.dataset.subscriptionShowUpgradeButton === "true") {
        const originalContent = element.innerHTML;
        element.innerHTML = "";

        const upgradeButton = document.createElement("button");
        upgradeButton.className = "upgrade-feature-button";
        upgradeButton.textContent =
          element.dataset.subscriptionButtonText || "Upgrade to Premium";
        upgradeButton.addEventListener("click", () => {
          window.location.href = "subscription.html";
        });

        element.appendChild(upgradeButton);
      } else {
        element.style.display = "none";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  processRestrictedElements();
});
