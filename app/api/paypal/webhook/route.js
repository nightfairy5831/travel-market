import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

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

// Verify PayPal webhook signature
async function verifyWebhookSignature(headers, body) {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn("PAYPAL_WEBHOOK_ID not set, skipping verification");
    return true;
  }

  const accessToken = await getAccessToken();

  const verifyResponse = await fetch(
    `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: body,
      }),
    }
  );

  const verifyData = await verifyResponse.json();
  return verifyData.verification_status === "SUCCESS";
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
    const body = await request.json();
    const headers = request.headers;

    // Verify webhook signature (optional in sandbox)
    const isValid = await verifyWebhookSignature(headers, body);
    if (!isValid) {
      console.error("Invalid PayPal webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const eventType = body.event_type;
    const resource = body.resource;

    console.log("Received PayPal webhook:", eventType);

    const supabase = getSupabaseAdmin();

    switch (eventType) {
      // Payment completed
      case "PAYMENT.CAPTURE.COMPLETED": {
        console.log("Payment capture completed:", resource.id);

        let customData = {};
        try {
          customData = JSON.parse(resource.custom_id || "{}");
        } catch {
          customData = {};
        }

        if (customData.user_id) {
          // Find and update booking
          const { data: bookings } = await supabase
            .from("bookings")
            .select("id")
            .eq("traveler_id", customData.user_id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (bookings && bookings.length > 0) {
            const bookingId = bookings[0].id;

            await supabase
              .from("bookings")
              .update({
                status: "confirmed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", bookingId);

            console.log("Booking confirmed via PayPal webhook:", bookingId);
          }
        }
        break;
      }

      // Payment refunded
      case "PAYMENT.CAPTURE.REFUNDED": {
        console.log("Payment refunded:", resource.id);

        // Find booking by looking at recent confirmed bookings
        // PayPal refunds contain the original capture ID
        const captureId = resource.links?.find(
          (l) => l.rel === "up"
        )?.href?.split("/").pop();

        let customData = {};
        try {
          customData = JSON.parse(resource.custom_id || "{}");
        } catch {
          customData = {};
        }

        if (customData.user_id) {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("id")
            .eq("traveler_id", customData.user_id)
            .eq("status", "confirmed")
            .order("created_at", { ascending: false })
            .limit(1);

          if (bookings && bookings.length > 0) {
            const bookingId = bookings[0].id;

            // Update booking status
            await supabase
              .from("bookings")
              .update({
                status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("id", bookingId);

            // Update payout status
            await supabase
              .from("payouts")
              .update({
                payment_status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("booking_id", bookingId);

            console.log("Booking refunded via PayPal webhook:", bookingId);
          }
        }
        break;
      }

      // Payment denied
      case "PAYMENT.CAPTURE.DENIED": {
        console.log("Payment denied:", resource.id);

        let customData = {};
        try {
          customData = JSON.parse(resource.custom_id || "{}");
        } catch {
          customData = {};
        }

        if (customData.user_id) {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("id")
            .eq("traveler_id", customData.user_id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1);

          if (bookings && bookings.length > 0) {
            await supabase
              .from("bookings")
              .update({
                status: "cancelled",
                updated_at: new Date().toISOString(),
              })
              .eq("id", bookings[0].id);

            console.log("Booking cancelled due to payment denial:", bookings[0].id);
          }
        }
        break;
      }

      // Payment pending (e.g., eCheck)
      case "PAYMENT.CAPTURE.PENDING": {
        console.log("Payment pending:", resource.id);
        // Booking stays in pending status, no action needed
        break;
      }

      // Checkout order approved (user approved but not yet captured)
      case "CHECKOUT.ORDER.APPROVED": {
        console.log("Checkout order approved:", resource.id);
        // This is handled by the capture endpoint
        break;
      }

      default:
        console.log("Unhandled PayPal event:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
