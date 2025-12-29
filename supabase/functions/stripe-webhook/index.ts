// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe-signature header");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For development/testing without webhook secret
      console.warn("STRIPE_WEBHOOK_SECRET not set, skipping signature verification");
      event = JSON.parse(body);
    }

    console.log("Received Stripe event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        // Get metadata from session
        const userId = session.metadata?.user_id;
        const companionId = session.metadata?.companion_id;
        const platformFee = session.metadata?.platform_fee;

        if (userId) {
          // Find and update booking
          const { data: bookings, error: fetchError } = await supabase
            .from("bookings")
            .select("id")
            .eq("traveler_id", userId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (fetchError) {
            console.error("Error fetching booking:", fetchError);
          } else if (bookings && bookings.length > 0) {
            const bookingId = bookings[0].id;

            // Update booking status
            const { error: updateError } = await supabase
              .from("bookings")
              .update({
                status: "confirmed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", bookingId);

            if (updateError) {
              console.error("Error updating booking status:", updateError);
            } else {
              console.log("Booking confirmed:", bookingId);
            }

            // Create payout record for companion if applicable
            if (companionId && session.amount_total) {
              const platformFeeAmount = platformFee ? parseInt(platformFee) : 0;
              const companionAmount = session.amount_total - platformFeeAmount;

              // Create payout record (payment will be auto-transferred via Stripe Connect)
              const { error: payoutError } = await supabase
                .from("payouts")
                .insert({
                  booking_id: bookingId,
                  amount: companionAmount / 100, // Convert from cents
                  currency: session.currency?.toUpperCase() || "USD",
                  payment_status: "pending", // Will be updated when transfer completes
                  payment_method: "stripe_connect",
                });

              if (payoutError) {
                console.error("Error creating payout record:", payoutError);
              } else {
                console.log("Payout record created for booking:", bookingId);
              }
            }
          }
        }
        break;
      }

      case "transfer.created": {
        // Handle transfer to connected account (companion payout)
        const transfer = event.data.object as Stripe.Transfer;
        console.log("Transfer created:", transfer.id);

        // Update payout record
        if (transfer.destination) {
          // Find companion by stripe account id
          const { data: companion } = await supabase
            .from("companions")
            .select("id")
            .eq("stripe_account_id", transfer.destination)
            .single();

          if (companion) {
            // Update related payout to paid
            const { error: updateError } = await supabase
              .from("payouts")
              .update({
                payment_status: "paid",
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("payment_status", "pending")
              .order("created_at", { ascending: false })
              .limit(1);

            if (updateError) {
              console.error("Error updating payout status:", updateError);
            } else {
              console.log("Payout marked as paid for companion:", companion.id);
            }
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge refunded:", charge.id);

        // Get payment intent to find related booking
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Retrieve checkout session by payment intent
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntentId,
            limit: 1,
          });

          if (sessions.data.length > 0) {
            const session = sessions.data[0];
            const userId = session.metadata?.user_id;

            if (userId) {
              // Find most recent booking for this user and mark as refunded
              const { data: bookings, error: fetchError } = await supabase
                .from("bookings")
                .select("id")
                .eq("traveler_id", userId)
                .eq("status", "confirmed")
                .order("created_at", { ascending: false })
                .limit(1);

              if (!fetchError && bookings && bookings.length > 0) {
                const bookingId = bookings[0].id;

                // Update booking status
                const { error: updateError } = await supabase
                  .from("bookings")
                  .update({
                    status: "refunded",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", bookingId);

                if (updateError) {
                  console.error("Error updating booking to refunded:", updateError);
                } else {
                  console.log("Booking refunded:", bookingId);
                }

                // Update payout status to refunded
                const { error: payoutError } = await supabase
                  .from("payouts")
                  .update({
                    payment_status: "refunded",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("booking_id", bookingId);

                if (payoutError) {
                  console.error("Error updating payout to refunded:", payoutError);
                } else {
                  console.log("Payout marked as refunded for booking:", bookingId);
                }
              }
            }
          }
        }
        break;
      }

      case "account.updated": {
        // Handle Stripe Connect account updates (companion onboarding)
        const account = event.data.object as Stripe.Account;
        console.log("Account updated:", account.id);

        // Update companion's Stripe status
        const { error: updateError } = await supabase
          .from("companions")
          .update({
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
            stripe_account_status: account.charges_enabled ? "active" : "pending",
            stripe_requirements: account.requirements?.currently_due ?? [],
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", account.id);

        if (updateError) {
          console.error("Error updating companion Stripe status:", updateError);
        } else {
          console.log("Companion Stripe status updated for account:", account.id);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Webhook handler failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
