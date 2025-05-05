import { supabase } from "./supabase-config.js";
import { getUserProfile } from "./supabase-utils.js";
import { SUBSCRIPTION_PLANS } from "./services/subscription-service.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "sign-in.html?redirectTo=subscription.html";
    return;
  }

  // Initialize FAQ toggles
  initFaqToggles();

  // Set up subscription buttons
  setupSubscriptionButtons();

  // Check user's current subscription status
  await checkSubscriptionStatus();

  // Add check for URL parameters (for Stripe redirect handling)
  handleUrlParameters();
});

/**
 * Initialize FAQ accordion toggles
 */
function initFaqToggles() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (!question) return;

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
      handleSubscriptionClick("premium-monthly");
    });
  }

  if (premiumAnnualButton) {
    premiumAnnualButton.addEventListener("click", () => {
      handleSubscriptionClick("premium-annual");
    });
  }

  if (finalCtaButton) {
    finalCtaButton.addEventListener("click", () => {
      handleSubscriptionClick("premium-monthly");
    });
  }
}

/**
 * Handle subscription button click
 * @param {string} plan - Plan ID ('premium-monthly' or 'premium-annual')
 */
async function handleSubscriptionClick(plan) {
  try {
    // Check if user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = `sign-in.html?redirectTo=subscription.html&plan=${plan}`;
      return;
    }

    // Get current subscription status
    const { data: userData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    const subscription = {
      isActive: userData?.status === "active",
      tier: userData?.tier || "free",
    };

    // Different handling based on subscription status
    if (subscription.isActive) {
      // User already has a subscription
      if (subscription.tier === plan) {
        // User clicked on their current plan
        showModal({
          title: "Current Plan",
          message: "You are already subscribed to this plan.",
          confirmText: "Manage Subscription",
          cancelText: "Close",
          onConfirm: () => {
            // Show subscription management modal
            showSubscriptionManagementModal(subscription);
          },
        });
      } else {
        // User wants to change plans
        showModal({
          title: "Change Subscription",
          message: `Would you like to change your subscription from ${formatPlanName(
            subscription.tier
          )} to ${formatPlanName(plan)}?`,
          confirmText: "Change Plan",
          cancelText: "Cancel",
          onConfirm: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch("/api/update-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ planId: plan }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error || "Failed to update subscription"
                );
              }

              const result = await response.json();

              if (result.success) {
                showSuccessModal(
                  "Plan Changed",
                  result.message || "Your subscription has been updated",
                  () => {
                    window.location.reload();
                  }
                );
              } else {
                showErrorModal(
                  "Error",
                  result.message || "Failed to update subscription"
                );
              }
            } catch (error) {
              console.error("Error updating subscription:", error);
              showErrorModal(
                "Error",
                error.message || "An error occurred updating your subscription"
              );
            }
          },
        });
      }
    } else {
      // New subscription
      showPaymentModal(plan);
    }
  } catch (error) {
    console.error("Error handling subscription click:", error);
    showErrorModal(
      "Error",
      "An unexpected error occurred. Please try again later."
    );
  }
}

/**
 * Show payment modal
 * @param {string} plan - Plan ID
 */
function showPaymentModal(plan) {
  // Get plan details
  const planDetails = SUBSCRIPTION_PLANS[plan];
  if (!planDetails) {
    showErrorModal("Error", "Invalid subscription plan");
    return;
  }

  // Create payment modal
  const modal = document.createElement("div");
  modal.className = "payment-modal";

  modal.innerHTML = `
    <div class="payment-modal-content">
      <span class="close-modal">&times;</span>
      <h2>Subscribe to ${planDetails.name}</h2>
      <p class="plan-price">$${planDetails.price.toFixed(2)}/${
    planDetails.interval || "month"
  }</p>
      
      <!-- Payment Method Section -->
      <div class="payment-section">
        <h3>Payment Method</h3>
        <div class="payment-options">
          <div class="payment-option selected">
            <div class="payment-option-header">
              <input type="radio" id="credit-card" name="payment-method" checked>
              <label for="credit-card">Credit Card</label>
            </div>
            <div class="payment-option-body">
              <div class="form-group">
                <label for="card-number">Card Number</label>
                <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="expiry-date">Expiry Date</label>
                  <input type="text" id="expiry-date" placeholder="MM/YY" maxlength="5">
                </div>
                <div class="form-group">
                  <label for="cvv">CVV</label>
                  <input type="text" id="cvv" placeholder="123" maxlength="3">
                </div>
              </div>
              <div class="form-group">
                <label for="card-name">Name on Card</label>
                <input type="text" id="card-name" placeholder="John Doe">
              </div>
            </div>
          </div>
          <div class="payment-option">
            <div class="payment-option-header">
              <input type="radio" id="paypal" name="payment-method">
              <label for="paypal">PayPal</label>
            </div>
            <div class="payment-option-body" style="display: none;">
              <p>You will be redirected to PayPal to complete your payment.</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Order Summary -->
      <div class="order-summary">
        <h3>Order Summary</h3>
        <div class="order-item">
          <span>${planDetails.name}</span>
          <span>$${planDetails.price.toFixed(2)}</span>
        </div>
        <div class="order-total">
          <span>Total</span>
          <span>$${planDetails.price.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="payment-buttons">
        <button class="modal-button cancel">Cancel</button>
        <button class="modal-button confirm">Confirm Payment</button>
      </div>
      
      <div class="secure-payment-info">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Secure payment processing</span>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners for modal
  const closeButton = modal.querySelector(".close-modal");
  const cancelButton = modal.querySelector(".modal-button.cancel");
  const confirmButton = modal.querySelector(".modal-button.confirm");
  const paymentOptions = modal.querySelectorAll(".payment-option-header");

  // Close modal functions
  const closeModal = () => {
    modal.remove();
  };

  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);

  // Toggle payment options
  paymentOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Unselect all options
      modal.querySelectorAll(".payment-option").forEach((opt) => {
        opt.classList.remove("selected");
        opt.querySelector(".payment-option-body").style.display = "none";
        opt.querySelector("input[type='radio']").checked = false;
      });

      // Select clicked option
      const parentOption = option.closest(".payment-option");
      parentOption.classList.add("selected");
      parentOption.querySelector(".payment-option-body").style.display =
        "block";
      parentOption.querySelector("input[type='radio']").checked = true;
    });
  });

  // Handle payment confirmation
  confirmButton.addEventListener("click", async () => {
    // Show processing state
    confirmButton.disabled = true;
    confirmButton.textContent = "Processing...";

    try {
      // Get authentication token
      const token = await getAuthToken();

      // Call API to create subscription
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const result = await response.json();

      // If subscription creation was successful and we have a checkout URL
      if (result.url) {
        window.location.href = result.url;
        return;
      }

      // Close payment modal
      closeModal();

      // Show success message
      showSuccessModal(
        "Payment Successful",
        "Your subscription has been activated successfully!",
        () => {
          window.location.reload();
        }
      );
    } catch (error) {
      console.error("Payment error:", error);

      // Reset button state
      confirmButton.disabled = false;
      confirmButton.textContent = "Confirm Payment";

      // Show error message
      const errorMessage = document.createElement("div");
      errorMessage.className = "payment-error";
      errorMessage.textContent =
        error.message ||
        "An error occurred while processing payment. Please try again.";

      // Insert error message above the buttons
      const buttonsContainer = modal.querySelector(".payment-buttons");
      buttonsContainer.parentNode.insertBefore(errorMessage, buttonsContainer);
    }
  });

  // Format credit card number with spaces
  const cardNumberInput = modal.querySelector("#card-number");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
      let formattedValue = "";

      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += " ";
        }
        formattedValue += value[i];
      }

      e.target.value = formattedValue;
    });
  }

  // Format expiry date
  const expiryDateInput = modal.querySelector("#expiry-date");
  if (expiryDateInput) {
    expiryDateInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");

      if (value.length > 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }

      e.target.value = value;
    });
  }
}

/**
 * Show subscription management modal
 * @param {Object} subscription - User's subscription details
 */
function showSubscriptionManagementModal(subscription) {
  // Format dates
  const startDate = new Date(subscription.current_period_start);
  const endDate = new Date(subscription.current_period_end);

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Create modal
  const modal = document.createElement("div");
  modal.className = "subscription-modal";

  modal.innerHTML = `
    <div class="subscription-modal-content">
      <span class="close-modal">&times;</span>
      <h2>Manage Your Subscription</h2>
      
      <div class="subscription-details">
        <div class="detail-item">
          <span class="detail-label">Current Plan:</span>
          <span class="detail-value">${formatPlanName(subscription.tier)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="detail-value ${
            subscription.isActive ? "active" : "inactive"
          }">${subscription.isActive ? "Active" : "Inactive"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Start Date:</span>
          <span class="detail-value">${formatDate(startDate)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Next Billing Date:</span>
          <span class="detail-value">${formatDate(endDate)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Auto-Renew:</span>
          <span class="detail-value">${
            subscription.cancel_at_period_end ? "Disabled" : "Enabled"
          }</span>
        </div>
      </div>
      
      <div class="subscription-actions">
        ${
          subscription.tier === "premium-monthly"
            ? `<button class="action-button upgrade">Upgrade to Annual Plan</button>`
            : ""
        }
        ${
          subscription.cancel_at_period_end
            ? `<button class="action-button renew">Enable Auto-Renewal</button>`
            : `<button class="action-button cancel">Cancel Auto-Renewal</button>`
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  const closeButton = modal.querySelector(".close-modal");
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  // Handle upgrade button
  const upgradeButton = modal.querySelector(".action-button.upgrade");
  if (upgradeButton) {
    upgradeButton.addEventListener("click", async () => {
      modal.remove();
      handleSubscriptionClick("premium-annual");
    });
  }

  // Handle cancel auto-renewal button
  const cancelButton = modal.querySelector(".action-button.cancel");
  if (cancelButton) {
    cancelButton.addEventListener("click", async () => {
      try {
        // Show confirmation modal
        showModal({
          title: "Cancel Auto-Renewal",
          message:
            "Are you sure you want to cancel auto-renewal? Your subscription will remain active until the end date, then will not renew.",
          confirmText: "Cancel Auto-Renewal",
          cancelText: "Keep Subscription",
          onConfirm: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch("/api/cancel-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error || "Failed to cancel subscription"
                );
              }

              const result = await response.json();

              if (result.success) {
                showSuccessModal(
                  "Auto-Renewal Cancelled",
                  result.message ||
                    "Your subscription will be canceled at the end of the billing period",
                  () => {
                    window.location.reload();
                  }
                );
              } else {
                showErrorModal(
                  "Error",
                  result.message || "Failed to cancel auto-renewal"
                );
              }
            } catch (error) {
              console.error("Error canceling subscription:", error);
              showErrorModal(
                "Error",
                error.message || "An error occurred canceling your subscription"
              );
            }
          },
        });
      } catch (error) {
        console.error("Error canceling subscription:", error);
        showErrorModal(
          "Error",
          "Failed to cancel auto-renewal. Please try again later."
        );
      }
    });
  }

  // Handle enable auto-renewal button
  const renewButton = modal.querySelector(".action-button.renew");
  if (renewButton) {
    renewButton.addEventListener("click", async () => {
      try {
        // Show confirmation modal
        showModal({
          title: "Enable Auto-Renewal",
          message:
            "Would you like to enable auto-renewal for your subscription?",
          confirmText: "Enable Auto-Renewal",
          cancelText: "Cancel",
          onConfirm: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch("/api/update-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  enableAutoRenew: true,
                  planId: subscription.tier,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error || "Failed to enable auto-renewal"
                );
              }

              const result = await response.json();

              if (result.success) {
                showSuccessModal(
                  "Auto-Renewal Enabled",
                  "Your subscription will now automatically renew at the end of your billing period.",
                  () => {
                    window.location.reload();
                  }
                );
              } else {
                showErrorModal(
                  "Error",
                  result.message || "Failed to enable auto-renewal"
                );
              }
            } catch (error) {
              console.error("Error enabling auto-renewal:", error);
              showErrorModal(
                "Error",
                error.message || "An error occurred enabling auto-renewal"
              );
            }
          },
        });
      } catch (error) {
        console.error("Error enabling auto-renewal:", error);
        showErrorModal(
          "Error",
          "Failed to enable auto-renewal. Please try again later."
        );
      }
    });
  }
}

/**
 * Show success modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {Function} onClose - Function to call when modal is closed
 */
function showSuccessModal(title, message, onClose) {
  const modal = document.createElement("div");
  modal.className = "message-modal success-modal";

  modal.innerHTML = `
    <div class="message-modal-content">
      <div class="success-icon">✓</div>
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="modal-button confirm">OK</button>
    </div>
  `;

  document.body.appendChild(modal);

  const confirmButton = modal.querySelector(".modal-button.confirm");
  confirmButton.addEventListener("click", () => {
    modal.remove();
    if (typeof onClose === "function") {
      onClose();
    }
  });
}

/**
 * Show error modal
 * @param {string} title - Modal title
 * @param {string} message - Error message
 */
function showErrorModal(title, message) {
  const modal = document.createElement("div");
  modal.className = "message-modal error-modal";

  modal.innerHTML = `
    <div class="message-modal-content">
      <div class="error-icon">✕</div>
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="modal-button confirm">OK</button>
    </div>
  `;

  document.body.appendChild(modal);

  const confirmButton = modal.querySelector(".modal-button.confirm");
  confirmButton.addEventListener("click", () => {
    modal.remove();
  });
}

/**
 * Show confirmation modal
 * @param {Object} options - Modal options
 */
function showModal(options) {
  const {
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
  } = options;

  const modal = document.createElement("div");
  modal.className = "confirm-modal";

  modal.innerHTML = `
    <div class="confirm-modal-content">
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="modal-buttons">
        <button class="modal-button cancel">${cancelText}</button>
        <button class="modal-button confirm">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const confirmButton = modal.querySelector(".modal-button.confirm");
  const cancelButton = modal.querySelector(".modal-button.cancel");

  // Close the modal
  const closeModal = () => {
    modal.remove();
  };

  // Confirm button handler
  confirmButton.addEventListener("click", () => {
    closeModal();
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  });

  // Cancel button handler
  cancelButton.addEventListener("click", () => {
    closeModal();
    if (typeof onCancel === "function") {
      onCancel();
    }
  });
}

/**
 * Check user's current subscription status
 */
async function checkSubscriptionStatus() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: subscriptionData, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching subscription:", error);
      return;
    }

    // Update UI based on subscription status
    if (subscriptionData && subscriptionData.status === "active") {
      updateUIForSubscription(subscriptionData);
    }
  } catch (error) {
    console.error("Error checking subscription status:", error);
  }
}

/**
 * Update UI for a subscribed user
 * @param {Object} subscription - User's subscription details
 */
function updateUIForSubscription(subscription) {
  // Update buttons based on current plan
  const premiumMonthlyButton = document.getElementById(
    "premium-monthly-button"
  );
  const premiumAnnualButton = document.getElementById("premium-annual-button");
  const finalCtaButton = document.getElementById("final-cta-button");
  const freePlanButton = document.querySelector(
    ".pricing-card.free .cta-button"
  );

  // Helper function to reset all buttons
  const resetButtons = () => {
    [premiumMonthlyButton, premiumAnnualButton, freePlanButton].forEach(
      (button) => {
        if (button) {
          button.textContent = "Subscribe Now";
          button.classList.remove("current");
          button.disabled = false;
        }
      }
    );

    if (finalCtaButton) {
      finalCtaButton.textContent = "Subscribe to Premium";
    }
  };

  // First reset all buttons
  resetButtons();

  // If user has an active subscription, update UI accordingly
  if (subscription.status === "active") {
    if (subscription.tier === "premium-monthly") {
      if (premiumMonthlyButton) {
        premiumMonthlyButton.textContent = "Current Plan";
        premiumMonthlyButton.classList.add("current");
        premiumMonthlyButton.disabled = true;
      }

      if (finalCtaButton) {
        finalCtaButton.textContent = "Manage Subscription";
        finalCtaButton.removeEventListener("click", handleSubscriptionClick);
        finalCtaButton.addEventListener("click", () => {
          showSubscriptionManagementModal(subscription);
        });
      }
    } else if (subscription.tier === "premium-annual") {
      if (premiumAnnualButton) {
        premiumAnnualButton.textContent = "Current Plan";
        premiumAnnualButton.classList.add("current");
        premiumAnnualButton.disabled = true;
      }

      if (finalCtaButton) {
        finalCtaButton.textContent = "Manage Subscription";
        finalCtaButton.removeEventListener("click", handleSubscriptionClick);
        finalCtaButton.addEventListener("click", () => {
          showSubscriptionManagementModal(subscription);
        });
      }
    }
  } else {
    // If not subscribed, free plan is current
    if (freePlanButton) {
      freePlanButton.textContent = "Current Plan";
      freePlanButton.classList.add("current");
      freePlanButton.disabled = true;
    }
  }

  // Add subscriber badge to the header
  const header = document.querySelector(".navbar");
  if (header && subscription.status === "active") {
    // Remove existing badge if any
    const existingBadge = header.querySelector(".subscriber-badge");
    if (existingBadge) {
      existingBadge.remove();
    }

    const badge = document.createElement("div");
    badge.className = "subscriber-badge";
    badge.textContent =
      subscription.tier === "premium-annual"
        ? "Annual Member"
        : "Premium Member";

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

/**
 * Format plan name for display
 * @param {string} planId - Plan ID
 * @returns {string} Formatted plan name
 */
function formatPlanName(planId) {
  const plans = {
    free: "Free Plan",
    "premium-monthly": "Premium Monthly",
    "premium-annual": "Premium Annual",
  };

  return plans[planId] || planId;
}

/**
 * Handle URL parameters for Stripe redirects
 */
function handleUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);

  // Check for success parameter
  if (urlParams.has("success") && urlParams.get("success") === "true") {
    showSuccessModal(
      "Payment Successful",
      "Your subscription has been activated successfully!"
    );
  }

  // Check for canceled parameter
  if (urlParams.has("canceled") && urlParams.get("canceled") === "true") {
    showModal({
      title: "Payment Canceled",
      message: "Your payment was canceled. Would you like to try again?",
      confirmText: "Try Again",
      cancelText: "Not Now",
      onConfirm: () => {
        // Get the plan from URL if available
        const plan = urlParams.get("plan") || "premium-monthly";
        handleSubscriptionClick(plan);
      },
    });
  }

  // Check for plan parameter
  if (urlParams.has("plan")) {
    const plan = urlParams.get("plan");
    // Automatic open subscription dialog for the specified plan
    setTimeout(() => {
      handleSubscriptionClick(plan);
    }, 1000);
  }
}

/**
 * Get the user's auth token from Supabase
 * @returns {Promise<string>} The user's auth token
 */
async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}
