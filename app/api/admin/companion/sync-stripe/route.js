import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabase admin client with service role key (bypasses RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { companionId } = body;

    if (!companionId) {
      return NextResponse.json({ error: "Companion ID is required" }, { status: 400 });
    }

    // Get companion details
    const { data: companion, error: fetchError } = await supabase
      .from("companions")
      .select("*")
      .eq("id", companionId)
      .single();

    if (fetchError || !companion) {
      return NextResponse.json({ error: "Companion not found" }, { status: 404 });
    }

    if (!companion.stripe_account_id) {
      return NextResponse.json({ error: "Companion has no Stripe account" }, { status: 400 });
    }

    // Fetch current status from Stripe
    const stripeAccount = await stripe.accounts.retrieve(companion.stripe_account_id);

    // Update companion with Stripe status
    const { data: updatedCompanion, error: updateError } = await supabase
      .from("companions")
      .update({
        stripe_charges_enabled: stripeAccount.charges_enabled,
        stripe_payouts_enabled: stripeAccount.payouts_enabled,
        stripe_account_status: stripeAccount.charges_enabled ? "active" : "pending",
        stripe_requirements: stripeAccount.requirements?.currently_due ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", companionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating companion:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Stripe status synced successfully",
      companion: updatedCompanion,
      stripeStatus: {
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted,
      },
    });
  } catch (error) {
    console.error("Sync Stripe error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Stripe status" },
      { status: 500 }
    );
  }
}
