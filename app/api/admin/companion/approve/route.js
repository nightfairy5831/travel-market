import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

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

    // Prepare update data
    const updateData = {
      is_kyc_approved: true,
      updated_at: new Date().toISOString(),
    };

    // If companion has a Stripe account and Stripe is configured, sync the status
    if (companion.stripe_account_id && stripe) {
      try {
        const stripeAccount = await stripe.accounts.retrieve(companion.stripe_account_id);
        updateData.stripe_charges_enabled = stripeAccount.charges_enabled;
        updateData.stripe_payouts_enabled = stripeAccount.payouts_enabled;
        updateData.stripe_account_status = stripeAccount.charges_enabled ? "active" : "pending";
        updateData.stripe_requirements = stripeAccount.requirements?.currently_due ?? [];
      } catch (stripeError) {
        console.error("Error fetching Stripe account:", stripeError);
        // Continue with approval even if Stripe sync fails
      }
    }

    // Update companion approval status and Stripe info
    const { data: updatedCompanion, error: updateError } = await supabase
      .from("companions")
      .update(updateData)
      .eq("id", companionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating companion:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update user status to active
    if (companion.user_id) {
      const { error: userError } = await supabase
        .from("users")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", companion.user_id);

      if (userError) {
        console.error("Error updating user status:", userError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Companion approved successfully",
      companion: updatedCompanion,
    });
  } catch (error) {
    console.error("Approve companion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve companion" },
      { status: 500 }
    );
  }
}
