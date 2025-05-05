import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get user's customer ID
    const { data: userData, error: userError } = await supabase
      .from("subscriptions")
      .select("customer_id")
      .eq("user_id", user.id)
      .single();

    if (userError || !userData || !userData.customer_id) {
      return res.status(404).json({ error: "No subscription found" });
    }

    // Create Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.customer_id,
      return_url: `${
        process.env.VERCEL_URL || "http://localhost:3000"
      }/subscription.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return res.status(500).json({
      error: "Failed to create customer portal session",
      details: error.message,
    });
  }
}
