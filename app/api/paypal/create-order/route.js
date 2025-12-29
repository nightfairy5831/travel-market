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

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = "USD", flightDetails, userId, companionId } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
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

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: flightDetails?.description || "Flight Booking - AidHandy",
            custom_id: JSON.stringify({
              user_id: userId,
              companion_id: companionId || null,
              flight_number: flightDetails?.flightNumber || "",
              departure: flightDetails?.departure || "",
              arrival: flightDetails?.arrival || "",
              flight_date: flightDetails?.flightDate || "",
            }),
          },
        ],
        application_context: {
          brand_name: "AidHandy",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${process.env.NEXTAUTH_URL}/api/paypal/capture`,
          cancel_url: `${process.env.NEXTAUTH_URL}/stripe/flight-cancelled`,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("PayPal order creation failed:", orderData);
      return NextResponse.json(
        { error: orderData.message || "Failed to create PayPal order" },
        { status: orderResponse.status }
      );
    }

    // Find approval URL
    const approvalUrl = orderData.links?.find(
      (link) => link.rel === "approve"
    )?.href;

    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl,
      status: orderData.status,
    });
  } catch (error) {
    console.error("PayPal create order error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
