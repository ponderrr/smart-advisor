import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await buffer(req);
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

async function handleCheckoutSessionCompleted(session) {
  const { user_id, plan_id } = session.metadata;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription
  );

  await upsertSubscription(user_id, subscription, plan_id);
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !userData) {
    console.error("User not found for customer:", customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  let planId = "free";

  for (const [key, value] of Object.entries(PLAN_PRICE_IDS)) {
    if (value === priceId) {
      planId = key;
      break;
    }
  }

  await upsertSubscription(userData.id, subscription, planId);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !userData) {
    console.error("User not found for customer:", customerId);
    return;
  }

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userData.id);
}

async function handleInvoicePaymentSucceeded(invoice) {
  if (
    invoice.billing_reason !== "subscription_create" &&
    invoice.billing_reason !== "subscription_cycle"
  ) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription
  );
  const customerId = invoice.customer;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !userData) {
    console.error("User not found for customer:", customerId);
    return;
  }

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq("user_id", userData.id);
}

async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !userData) {
    console.error("User not found for customer:", customerId);
    return;
  }

  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userData.id);
}

async function upsertSubscription(userId, subscription, planId) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  const subscriptionData = {
    user_id: userId,
    tier: planId,
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
    price_id: subscription.items.data[0].price.id,
    customer_id: subscription.customer,
  };

  if (data) {
    await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("id", data.id);
  } else {
    subscriptionData.created_at = new Date().toISOString();
    await supabase.from("subscriptions").insert([subscriptionData]);
  }
}
