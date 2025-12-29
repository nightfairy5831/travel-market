// supabase/functions/amadeus-confirm-booking-using-stripe/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Platform fee percentage (10%)
const PLATFORM_FEE_PERCENT = 10;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: corsHeaders,
      });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user)
      return new Response(JSON.stringify({ error: "Unauthorized user" }), {
        status: 401,
        headers: corsHeaders,
      });

    // Parse body
    const { selectedFlight, profile, companionId } = await req.json();
    if (!selectedFlight || !profile?.email)
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
        headers: corsHeaders,
      });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    // Calculate amount from Amadeus flight offer format
    const price = selectedFlight?.price || selectedFlight?.travelerPricings?.[0]?.price;
    const amount = Math.round(
      Number(price?.total || price?.grandTotal || selectedFlight?.total_amount || 100) * 100
    );
    const currency = (price?.currency || selectedFlight?.total_currency || "usd").toLowerCase();

    // Get flight details for description
    const itinerary = selectedFlight?.itineraries?.[0];
    const firstSegment = itinerary?.segments?.[0];
    const lastSegment = itinerary?.segments?.[itinerary.segments.length - 1];

    const flightDescription = firstSegment
      ? `${firstSegment.departure?.iataCode} to ${lastSegment?.arrival?.iataCode} - ${firstSegment.carrierCode}${firstSegment.number}`
      : `Flight Booking`;

    // Check if companion is assigned and has Stripe Connect account
    let connectedAccountId: string | null = null;
    let applicationFeeAmount: number | null = null;

    if (companionId) {
      const { data: companion } = await supabaseAdmin
        .from("companions")
        .select("stripe_account_id, stripe_charges_enabled")
        .eq("id", companionId)
        .single();

      if (companion?.stripe_account_id && companion?.stripe_charges_enabled) {
        connectedAccountId = companion.stripe_account_id;
        // Calculate platform fee (10% of total)
        applicationFeeAmount = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
      }
    }

    // Build checkout session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Flight Booking`,
              description: `${flightDescription} for ${profile.email}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: profile.email,
      metadata: {
        flight_offer_id: selectedFlight.id,
        user_id: user.id,
        departure: firstSegment?.departure?.iataCode || "",
        arrival: lastSegment?.arrival?.iataCode || "",
        flight_date: firstSegment?.departure?.at?.split("T")[0] || "",
        carrier: firstSegment?.carrierCode || "",
        flight_number: firstSegment?.number || "",
        companion_id: companionId || "",
        platform_fee: applicationFeeAmount?.toString() || "",
      },
      success_url: `${Deno.env.get("NEXTAUTH_URL")}/stripe/flight-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("NEXTAUTH_URL")}/stripe/flight-cancelled`,
    };

    // Add payment_intent_data with transfer if companion has connected account
    if (connectedAccountId && applicationFeeAmount) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: connectedAccountId,
        },
      };
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Return the checkout session URL to redirect frontend
    return new Response(
      JSON.stringify({
        url: session.url,
        message: "Stripe Checkout session created successfully",
        platformFee: applicationFeeAmount ? applicationFeeAmount / 100 : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error creating Stripe Checkout session:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
