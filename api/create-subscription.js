import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PLAN_PRICE_IDS = {
  "premium-monthly": "price_monthly_id",
  "premium-annual": "price_annual_id",
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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_id: user.id,
        },
      });

      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: PLAN_PRICE_IDS[planId],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.DOMAIN_URL}/subscription?success=true`,
      cancel_url: `${process.env.DOMAIN_URL}/subscription?canceled=true&plan=${planId}`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({
      error: "Failed to create subscription",
      details: error.message,
    });
  }
}
