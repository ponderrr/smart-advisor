import { auth } from "./firebase-config.js";
import { getUserProfile } from "./firebase-utils.js";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  if (!auth.currentUser && !localStorage.getItem("userId")) {
    window.location.href = "sign-in.html?redirectTo=subscription.html";
    return;
  }

  // Initialize FAQ toggles
  initFaqToggles();

  // Set up subscription buttons
  setupSubscriptionButtons();

  // Check user's current subscription status
  await checkSubscriptionStatus();
});

/**
 * Initialize FAQ accordion toggles
 */
function initFaqToggles() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all items
      faqItems.forEach((faqItem) => {
        faqItem.classList.remove("active");
      });

      // If the clicked item wasn't active, open it
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

/**
 * Set up subscription buttons
 */
function setupSubscriptionButtons() {
  const premiumMonthlyButton = document.getElementById(
    "premium-monthly-button"
  );
  const premiumAnnualButton = document.getElementById("premium-annual-button");
  const finalCtaButton = document.getElementById("final-cta-button");

  if (premiumMonthlyButton) {
    premiumMonthlyButton.addEventListener("click", () => {
      startSubscription("premium-monthly");
    });
  }

  if (premiumAnnualButton) {
    premiumAnnualButton.addEventListener("click", () => {
      startSubscription("premium-annual");
    });
  }

  if (finalCtaButton) {
    finalCtaButton.addEventListener("click", () => {
      startSubscription("premium-monthly");
    });
  }
}

/**
 * Start the subscription process
 * @param {string} plan - The subscription plan
 */
function startSubscription(plan) {
  // This function would integrate with your payment provider
  // For now, we'll just show a mock payment modal

  // Create a simple modal for demonstration
  const modal = document.createElement("div");
  modal.className = "payment-modal";
  modal.innerHTML = `
    <div class="payment-modal-content">
      <span class="close-modal">&times;</span>
      <h2>Subscribe to ${
        plan === "premium-monthly" ? "Premium Monthly" : "Premium Annual"
      }</h2>
      <p>This is a demonstration of the payment flow. In a production environment, this would connect to a payment processor like Stripe.</p>
      <div class="payment-buttons">
        <button class="modal-button cancel">Cancel</button>
        <button class="modal-button confirm">Confirm Payment</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add styles for the modal
  const style = document.createElement("style");
  style.textContent = `
    .payment-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .payment-modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 0.5rem;
      max-width: 500px;
      width: 90%;
      position: relative;
    }
    
    .close-modal {
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 1.5rem;
      cursor: pointer;
    }
    
    .payment-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .modal-button {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 0.3rem;
      cursor: pointer;
    }
    
    .modal-button.cancel {
      background-color: #f1f1f1;
    }
    
    .modal-button.confirm {
      background-color: var(--button-bg-color);
      color: white;
    }
  `;

  document.head.appendChild(style);

  // Add event listeners
  const closeButton = modal.querySelector(".close-modal");
  const cancelButton = modal.querySelector(".modal-button.cancel");
  const confirmButton = modal.querySelector(".modal-button.confirm");

  // Close modal on X button click
  closeButton.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Close modal on Cancel button click
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Handle confirmation
  confirmButton.addEventListener("click", async () => {
    // In a real app, this would process the payment and update the subscription
    try {
      await simulatePaymentProcessing();
      await updateUserSubscription(plan);

      // Show success message
      modal.querySelector(".payment-modal-content").innerHTML = `
        <h2>Payment Successful!</h2>
        <p>Thank you for subscribing to Smart Advisor Premium! Your account has been upgraded.</p>
        <div class="payment-buttons">
          <button class="modal-button confirm">Close</button>
        </div>
      `;

      // Add event listener to close button
      modal
        .querySelector(".modal-button.confirm")
        .addEventListener("click", () => {
          document.body.removeChild(modal);
          window.location.reload(); // Reload page to reflect changes
        });
    } catch (error) {
      // Show error message
      modal.querySelector(".payment-modal-content").innerHTML = `
        <h2>Payment Failed</h2>
        <p>There was an error processing your payment. Please try again later.</p>
        <p class="error-message">${error.message}</p>
        <div class="payment-buttons">
          <button class="modal-button confirm">Close</button>
        </div>
      `;

      // Add event listener to close button
      modal
        .querySelector(".modal-button.confirm")
        .addEventListener("click", () => {
          document.body.removeChild(modal);
        });
    }
  });
}

/**
 * Simulate payment processing
 * @returns {Promise} Resolves when payment is "processed"
 */
function simulatePaymentProcessing() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000); // Simulate a 2-second payment process
  });
}

/**
 * Update user subscription in database
 * @param {string} plan - The subscription plan
 */
async function updateUserSubscription(plan) {
  const userId = auth.currentUser?.uid || localStorage.getItem("userId");
  if (!userId) {
    throw new Error("User ID not found");
  }

  const userRef = doc(db, "users", userId);

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
  await updateDoc(userRef, {
    subscription: {
      plan: plan,
      startDate: startDate,
      endDate: endDate.toISOString(),
      isActive: true,
      autoRenew: true,
    },
  });
}

/**
 * Check user's current subscription status
 */
async function checkSubscriptionStatus() {
  try {
    const userId = auth.currentUser?.uid || localStorage.getItem("userId");
    if (!userId) return;

    const userProfile = await getUserProfile(userId);
    if (!userProfile) return;

    const subscription = userProfile.subscription;

    // If user has an active subscription, update UI
    if (subscription && subscription.isActive) {
      updateUIForSubscriber(subscription.plan);
    }
  } catch (error) {
    console.error("Error checking subscription status:", error);
  }
}

/**
 * Update UI for a subscribed user
 * @param {string} plan - The user's subscription plan
 */
function updateUIForSubscriber(plan) {
  // Update buttons based on current plan
  const premiumMonthlyButton = document.getElementById(
    "premium-monthly-button"
  );
  const premiumAnnualButton = document.getElementById("premium-annual-button");
  const finalCtaButton = document.getElementById("final-cta-button");

  if (plan === "premium-monthly") {
    if (premiumMonthlyButton) {
      premiumMonthlyButton.textContent = "Current Plan";
      premiumMonthlyButton.classList.add("current");
      premiumMonthlyButton.disabled = true;
    }

    if (finalCtaButton) {
      finalCtaButton.textContent = "Upgrade to Annual";
      finalCtaButton.addEventListener(
        "click",
        () => {
          startSubscription("premium-annual");
        },
        { once: true }
      );
    }
  } else if (plan === "premium-annual") {
    if (premiumAnnualButton) {
      premiumAnnualButton.textContent = "Current Plan";
      premiumAnnualButton.classList.add("current");
      premiumAnnualButton.disabled = true;
    }

    if (finalCtaButton) {
      finalCtaButton.textContent = "Manage Subscription";
      finalCtaButton.addEventListener(
        "click",
        () => {
          // In a real app, this would open subscription management
          alert("Subscription management would open here");
        },
        { once: true }
      );
    }
  }

  // Add subscriber badge to the header
  const header = document.querySelector(".navbar");
  if (header) {
    const badge = document.createElement("div");
    badge.className = "subscriber-badge";
    badge.textContent =
      plan === "premium-annual" ? "Annual Member" : "Premium Member";

    // Add styles for the badge
    badge.style.backgroundColor = "var(--button-bg-color)";
    badge.style.color = "white";
    badge.style.padding = "0.5rem 1rem";
    badge.style.borderRadius = "2rem";
    badge.style.fontSize = "0.8rem";
    badge.style.fontWeight = "bold";
    badge.style.marginLeft = "1rem";

    // Add badge to header
    const navLinks = header.querySelector(".nav-links");
    if (navLinks) {
      navLinks.appendChild(badge);
    }
  }
}
