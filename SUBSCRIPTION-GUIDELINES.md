// SUBSCRIPTION RULES AND GUIDELINES
// This document defines the features and restrictions for each subscription tier

/\*\*

- SUBSCRIPTION TIERS
-
- The application offers the following subscription tiers:
-
- 1.  Free Tier - Default for all users
- 2.  Premium Monthly - $4.99/month
- 3.  Premium Annual - $39.99/year (equivalent to $3.33/month)
-
- Each tier has specific limits and features that are enforced throughout the application.
  \*/

/\*\*

- FEATURE ACCESS BY TIER
-
- This section defines which features are available to each tier.
- This can be used as a reference when implementing tier-based restrictions.
-
- FREE TIER:
- - Basic movie & book recommendations
- - Up to 5 questions per recommendation
- - Limited to 1 recommendation per query
- - Basic accessibility options
- - Saves up to 10 recommendations in history
- - Standard recommendation algorithm
-
- PREMIUM MONTHLY:
- - Advanced AI-powered recommendations
- - Up to 15 questions per recommendation
- - Up to 5 recommendations per query
- - Enhanced accessibility options
- - Saves up to 50 recommendations in history
- - Ad-free experience
- - Create custom recommendation lists
- - Share recommendations with friends
- - Early access to new features
-
- PREMIUM ANNUAL:
- - All Premium Monthly features
- - Up to 10 recommendations per query
- - Saves up to 100 recommendations in history
- - Priority customer support
- - Exclusive annual subscriber content
    \*/

/\*\*

- IMPLEMENTATION GUIDELINES
-
- When implementing subscription tiers, follow these guidelines:
-
- 1.  Always check the user's subscription tier before allowing access to premium features
- 2.  Show appropriate upgrade messages when a user tries to access a premium feature
- 3.  Provide clear information about what each tier offers
- 4.  Make it easy for users to upgrade their subscription
- 5.  Respect subscription limits strictly to maintain fairness
      \*/

/\*\*

- HOW TO USE THE SUBSCRIPTION GUARD
-
- The subscription-guard.js module provides utility functions to implement tier-based restrictions.
- Here are some examples of how to use it:
-
- Example 1: Checking feature access in JavaScript
- ```javascript

  ```
- import { checkFeatureAccess, showUpgradeModal } from './subscription-guard.js';
-
- async function handleSaveRecommendation() {
- // Check if user has reached their history limit
- const accessCheck = await checkFeatureAccess("maxHistory", currentCount + 1);
-
- if (!accessCheck.hasAccess) {
-     // Show upgrade modal if they've reached their limit
-     const wantsToUpgrade = await showUpgradeModal("maxHistory", accessCheck);
-
-     if (wantsToUpgrade) {
-       // Redirect to subscription page
-       window.location.href = "subscription.html";
-       return;
-     } else {
-       // User doesn't want to upgrade, handle accordingly
-       return;
-     }
- }
-
- // Continue with saving the recommendation
- saveRecommendation();
- }
- ```

  ```
-
- Example 2: Restricting elements in HTML
- ```html

  ```
- <!-- This element will only be visible to premium subscribers -->
- <div data-subscription-required="premium-monthly,premium-annual">
- <h3>Premium Feature</h3>
- <p>This is a premium-only feature.</p>
- </div>
-
- <!-- This element will show an upgrade button for free users -->
- <div data-subscription-required="premium-monthly,premium-annual"
-      data-subscription-show-upgrade-button="true"
-      data-subscription-button-text="Upgrade to Access">
- <h3>Advanced Analytics</h3>
- <p>Get detailed insights into your recommendation patterns.</p>
- </div>
- ```

  ```
-
- Example 3: Protecting an entire page
- ```javascript

  ```
- import { protectPageBySubscription } from './subscription-guard.js';
-
- document.addEventListener('DOMContentLoaded', async () => {
- // This will redirect non-premium users to the subscription page
- const hasAccess = await protectPageBySubscription(['premium-monthly', 'premium-annual']);
-
- if (!hasAccess) {
-     return; // Page access blocked, user redirected
- }
-
- // Initialize premium page content
- initPremiumPage();
- });
- ```
  */
  ```

/\*\*

- TESTING SUBSCRIPTION FEATURES
-
- To test premium features during development:
-
- 1.  Create a test user
- 2.  In Firebase console, manually set subscription data for this user:
- - subscription.plan: "premium-monthly" or "premium-annual"
- - subscription.isActive: true
- - subscription.startDate: Current date (ISO string)
- - subscription.endDate: Future date (ISO string)
- - subscription.autoRenew: true
-
- You can then log in as this user to test premium features.
  \*/

/\*\*

- INTEGRATION WITH STRIPE
-
- The current subscription implementation uses a mock system that simulates payment
- processing. When you're ready to integrate with Stripe, follow these steps:
-
- 1.  Create a Stripe account and get your API keys
- 2.  Create Products and Prices in the Stripe dashboard that match your subscription tiers
- 3.  Implement the checkout flow using Stripe Checkout
- 4.  Set up webhooks to handle subscription lifecycle events
- 5.  Update the subscription service to use the Stripe API
-
- Refer to js/services/stripe-integration.js for more details on Stripe integration.
  \*/
