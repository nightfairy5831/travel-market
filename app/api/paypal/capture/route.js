import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Get PayPal access token
async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const payerId = searchParams.get("PayerID");

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/stripe/flight-cancelled?error=missing_token`
      );
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/stripe/flight-cancelled?error=auth_failed`
      );
    }

    // Capture the PayPal order
    const captureResponse = await fetch(
      `${PAYPAL_API_URL}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok || captureData.status !== "COMPLETED") {
      console.error("PayPal capture failed:", captureData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/stripe/flight-cancelled?error=capture_failed`
      );
    }

    // Extract custom data from the order
    const purchaseUnit = captureData.purchase_units?.[0];
    let customData = {};
    try {
      customData = JSON.parse(purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id || "{}");
    } catch {
      customData = {};
    }

    const supabase = getSupabaseAdmin();

    // Update booking status if we have user_id
    if (customData.user_id) {
      // Find the most recent pending booking for this user
      const { data: bookings, error: fetchError } = await supabase
        .from("bookings")
        .select("id")
        .eq("traveler_id", customData.user_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!fetchError && bookings && bookings.length > 0) {
        const bookingId = bookings[0].id;

        // Update booking to confirmed
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId);

        // Create payout record if companion is assigned
        if (customData.companion_id) {
          const capturedAmount = parseFloat(
            purchaseUnit?.payments?.captures?.[0]?.amount?.value || "0"
          );
          const platformFee = capturedAmount * 0.1; // 10% platform fee
          const companionAmount = capturedAmount - platformFee;

          await supabase.from("payouts").insert({
            booking_id: bookingId,
            amount: companionAmount,
            currency: purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code || "USD",
            payment_status: "pending",
            payment_method: "paypal",
          });
        }
      }
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/stripe/flight-success?paypal_order_id=${token}&status=completed`
    );
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/stripe/flight-cancelled?error=server_error`
    );
  }
}

// POST method for programmatic capture
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get PayPal access token" },
        { status: 500 }
      );
    }

    // Capture the PayPal order
    const captureResponse = await fetch(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error("PayPal capture failed:", captureData);
      return NextResponse.json(
        { error: captureData.message || "Failed to capture payment" },
        { status: captureResponse.status }
      );
    }

    // Extract capture details
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

    return NextResponse.json({
      status: captureData.status,
      captureId: capture?.id,
      amount: capture?.amount,
      orderId: captureData.id,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
