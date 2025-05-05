import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PLAN_PRICE_IDS = {
  "premium-monthly": process.env.STRIPE_MONTHLY_PRICE_ID,
  "premium-annual": process.env.STRIPE_ANNUAL_PRICE_ID,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId } = req.body;
    if (!planId || !PLAN_PRICE_IDS[planId]) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    // Get user's subscription data
    const { data: subscriptionData, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (
      subError ||
      !subscriptionData ||
      !subscriptionData.stripe_subscription_id
    ) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Update the subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionData.stripe_subscription_id,
      {
        items: [
          {
            id: subscriptionData.stripe_subscription_item_id, // Make sure this is stored in your database
            price: PLAN_PRICE_IDS[planId],
          },
        ],
        proration_behavior: "create_prorations",
      }
    );

    // Update the subscription in your database
    await supabase
      .from("subscriptions")
      .update({
        tier: planId,
        price_id: PLAN_PRICE_IDS[planId],
        current_period_start: new Date(
          updatedSubscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          updatedSubscription.current_period_end * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return res.status(500).json({
      error: "Failed to update subscription",
      details: error.message,
    });
  }
}
