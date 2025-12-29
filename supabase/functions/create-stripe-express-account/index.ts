// supabase/functions/create-stripe-express-account/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const body = await req.json().catch(() => ({}));
    const companionData = body?.companionData;

    if (!companionData) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing companion data"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing authorization token"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user?.id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid or expired token"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating US Stripe Express account for testing...");

    // Extract first and last name from fullName
    const nameParts = (companionData.fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "Unknown";

    console.log("Creating Stripe account for:", { firstName, lastName, email: companionData.email });

    // CREATE STRIPE EXPRESS ACCOUNT (TEST MODE - forced to US)
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: companionData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      business_profile: {
        name: companionData.fullName,
      },
      individual: {
        first_name: firstName,
        last_name: lastName,
        email: companionData.email,
        phone: "+13105551234", // US TEST PHONE
      },
      metadata: {
        companion_id: companionData.id,
      },
    });

    // CREATE ONBOARDING LINK
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/retry`,
      return_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/success`,
      type: "account_onboarding",
    });

    // SAVE STRIPE DATA TO DATABASE
    const { error: dbError } = await supabase
      .from("companions")
      .update({
        stripe_account_id: account.id,
        is_kyc_approved: false,
        stripe_onboarding_status: "in_progress",
        stripe_account_status: "pending",
        stripe_payouts_enabled: account.payouts_enabled ?? false,
        stripe_charges_enabled: account.charges_enabled ?? false,
        stripe_requirements: account.requirements?.currently_due ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", companionData.id);

    if (dbError) console.error("DB save error:", dbError);

    return new Response(JSON.stringify({
      success: true,
      onboardingUrl: link.url,
      stripeAccountId: account.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.log("Stripe Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
