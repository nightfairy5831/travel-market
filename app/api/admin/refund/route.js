import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

// Supabase client
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
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, payouts(*)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "refunded") {
      return NextResponse.json({ error: "Booking already refunded" }, { status: 400 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Cannot refund cancelled booking" }, { status: 400 });
    }

    // Determine payment method from payout record
    const payout = booking.payouts?.[0];
    const paymentMethod = payout?.payment_method || "stripe";

    let refundResult = null;

    if (paymentMethod === "paypal") {
      // PayPal refund
      const accessToken = await getPayPalAccessToken();

      if (!accessToken) {
        return NextResponse.json(
          { error: "Failed to authenticate with PayPal" },
          { status: 500 }
        );
      }

      // Note: For PayPal refunds, we need the capture ID which should be stored
      // For now, we'll update the status and note that manual PayPal refund may be needed
      refundResult = { provider: "paypal", status: "manual_required" };
    } else {
      // Stripe refund
      // Find the payment intent for this booking
      // We search for checkout sessions with the user_id in metadata
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
      });

      const matchingSession = sessions.data.find(
        (s) => s.metadata?.user_id === booking.traveler_id
      );

      if (matchingSession?.payment_intent) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: matchingSession.payment_intent,
            reason: "requested_by_customer",
            metadata: {
              booking_id: bookingId,
              admin_reason: reason || "Admin initiated refund",
            },
          });

          refundResult = {
            provider: "stripe",
            refundId: refund.id,
            status: refund.status,
            amount: refund.amount / 100,
          };
        } catch (stripeError) {
          console.error("Stripe refund error:", stripeError);
          return NextResponse.json(
            { error: stripeError.message || "Stripe refund failed" },
            { status: 500 }
          );
        }
      } else {
        // If no Stripe session found, update status manually
        refundResult = { provider: "stripe", status: "manual_required" };
      }
    }

    // Update booking status
    await supabase
      .from("bookings")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    // Update payout status if exists
    if (payout) {
      await supabase
        .from("payouts")
        .update({
          payment_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id);
    }

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully",
      refund: refundResult,
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json(
      { error: error.message || "Refund failed" },
      { status: 500 }
    );
  }
}
