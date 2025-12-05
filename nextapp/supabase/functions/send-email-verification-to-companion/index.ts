// supabase/functions/send-email-verification/index.ts
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
    const email: string | undefined = body?.email;

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract and verify JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user?.id) {
      console.error("JWT verification failed:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Authenticated user:", user.id);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store verification code in database
    const { error: dbError } = await supabase
      .from("email_otps")
      .insert([{
        user_id: user.id,
        email: email,
        verification_code: verificationCode,
        expires_at: expiresAt,
        verified: false
      }]);

    if (dbError) {
      console.error("Error storing verification code:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate verification code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Postmark
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
              .code { font-size: 32px; font-weight: bold; text-align: center; color: #ff7a00; margin: 20px 0; }
              .instructions { color: #666; line-height: 1.6; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Verify Your Email Address</h2>
              </div>
              <p class="instructions">
                Hello! Please use the verification code below to verify your email address for your AidHandy companion account.
              </p>
              <div class="code">${verificationCode}</div>
              <p class="instructions">
                This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
              </p>
              <div class="footer">
                <p>© 2024 AidHandy. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        TextBody: `
          Verify Your Email Address

          Hello! Please use the verification code below to verify your email address for your AidHandy companion account.

          Verification Code: ${verificationCode}

          This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.

          © 2024 AidHandy. All rights reserved.
        `,
        MessageStream: "outbound"
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
        message: "Verification code sent to your email" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("send-email-verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});