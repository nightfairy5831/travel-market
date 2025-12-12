import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const { email, user_id } = body;

    if (!email || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Verify auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.id) {
      console.error("JWT verification failed:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Authenticated user:", user.id);

    // ✅ Generate unique verification token
    const verificationToken = crypto.randomUUID();

    // ✅ Save token AND email in traveller table
    const { data: updateData, error: updateError } = await supabase
      .from("travellers")
      .update({
        email: email, // ✅ SET THE EMAIL FIELD
        email_verification_token: verificationToken,
        is_email_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select() // Return the updated record
      .single();

    if (updateError) {
      console.error("Error updating traveller:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to store verification token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Traveller record updated:", updateData);

    // ✅ Create verification URL (React route instead of API)
    const baseUrl = Deno.env.get("NEXTAUTH_URL") ?? "https://aidhandy.com";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // ✅ Send email via Postmark
    const postmarkResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "",
      },
      body: JSON.stringify({
        From: Deno.env.get("POSTMARK_FROM_EMAIL") ?? "support@aidhandy.com",
        To: email,
        Subject: "Verify Your Email - AidHandy",
        HtmlBody: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .btn { display: inline-block; padding: 10px 20px; background-color: #ff7a00; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Verify Your Email Address</h2>
              </div>
              <p>Hello! Please verify your email address by clicking the button below.</p>
              <p style="text-align:center;margin:20px;">
                <a href="${verificationUrl}" class="btn">Verify Email</a>
              </p>
              <p>If you didn't request this verification, please ignore this email.</p>
              <div class="footer">
                <p>© 2025 AidHandy. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        MessageStream: "outbound",
      }),
    });

    if (!postmarkResponse.ok) {
      const errorText = await postmarkResponse.text();
      console.error("Postmark error:", postmarkResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send verification email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Verification email sent successfully to:", email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification email sent successfully",
        verification_token: verificationToken, // For debugging
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-traveller-verification-email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});