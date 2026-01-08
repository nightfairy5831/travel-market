// supabase/functions/process-refund/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  const apiUrl = Deno.env.get("PAYPAL_API_URL") || "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    return null;
  }

  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
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

// Process PayPal refund
async function processPayPalRefund(captureId: string, amount?: number): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const accessToken = await getPayPalAccessToken();
  const apiUrl = Deno.env.get("PAYPAL_API_URL") || "https://api-m.sandbox.paypal.com";

  if (!accessToken) {
    return { success: false, error: "Failed to authenticate with PayPal" };
  }

  const refundBody: Record<string, unknown> = {};
  if (amount) {
    refundBody.amount = {
      value: amount.toFixed(2),
      currency_code: "USD",
    };
  }

  const response = await fetch(`${apiUrl}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: Object.keys(refundBody).length > 0 ? JSON.stringify(refundBody) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.message || "PayPal refund failed" };
  }

  const refundData = await response.json();
  return { success: true, refundId: refundData.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const body = await req.json();
    const { bookingId, reason } = body;

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "Booking ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, payouts(*)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (booking.status === "refunded") {
      return new Response(
        JSON.stringify({ error: "Booking already refunded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (booking.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: "Cannot refund cancelled booking" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine payment method from payout record
    const payout = booking.payouts?.[0];
    const paymentMethod = payout?.payment_method || "stripe";

    let refundResult: Record<string, unknown> | null = null;

    if (paymentMethod === "paypal") {
      // PayPal refund
      const captureId = payout?.paypal_capture_id;

      if (captureId) {
        const paypalResult = await processPayPalRefund(captureId);
        if (paypalResult.success) {
          refundResult = {
            provider: "paypal",
            refundId: paypalResult.refundId,
            status: "succeeded",
          };
        } else {
          return new Response(
            JSON.stringify({ error: paypalResult.error || "PayPal refund failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        refundResult = { provider: "paypal", status: "manual_required", reason: "No capture ID found" };
      }
    } else {
      // Stripe refund
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

      if (!stripeSecretKey) {
        refundResult = { provider: "stripe", status: "manual_required", reason: "Stripe not configured" };
      } else {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2023-10-16",
        });

        // Find the payment intent for this booking
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
        });

        const matchingSession = sessions.data.find(
          (s) => s.metadata?.user_id === booking.traveler_id
        );

        if (matchingSession?.payment_intent) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: matchingSession.payment_intent as string,
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
            return new Response(
              JSON.stringify({ error: (stripeError as Error).message || "Stripe refund failed" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          refundResult = { provider: "stripe", status: "manual_required", reason: "No payment found" };
        }
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Refund processed successfully",
        refund: refundResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Refund error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Refund failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
