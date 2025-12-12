// supabase/functions/send-otp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(message: string) {
  const enc = new TextEncoder();
  const msgUint8 = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

    const body = await req.json().catch(() => ({}));
    const phone: string | undefined = body?.phone;

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number is required" }),
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

    const user_id = user.id;
    console.log("✅ Authenticated user:", user_id);

    // ✅ RATE LIMITING: Check recent OTP attempts
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from("phone_otps")
      .select("created_at")
      .eq("user_id", user_id)
      .gte("created_at", tenMinutesAgo)
      .order("created_at", { ascending: false });

    if (attemptsError) {
      console.error("Error checking attempts:", attemptsError);
    } else if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many attempts. Please try again in 10 minutes." 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ RATE LIMITING: Check if last OTP was sent less than 60 seconds ago
    if (recentAttempts && recentAttempts.length > 0) {
      const lastAttempt = new Date(recentAttempts[0].created_at);
      const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
      const sixtySeconds = 60 * 1000;
      
      if (timeSinceLastAttempt < sixtySeconds) {
        const secondsLeft = Math.ceil((sixtySeconds - timeSinceLastAttempt) / 1000);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Please wait ${secondsLeft} seconds before requesting a new OTP.` 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_hash = await sha256Hex(otp);
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store hashed OTP with user_id
    const { error: insertError } = await supabase
      .from("phone_otps")
      .insert([{ user_id, phone, otp_hash, expires_at, verified: false, used: false }]);

    if (insertError) {
      console.error("DB Insert Error:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: insertError.message,
          column: insertError.details,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Twilio setup ---
    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
    const TWILIO_FROM = Deno.env.get("TWILIO_FROM") ?? "";

    if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
      console.warn(`⚠️ Twilio credentials missing. OTP for ${phone}: ${otp}`);
    } else {
      // Format phone number exactly like your working Next.js API
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
      console.log(`Sending SMS to: ${formattedPhone}`);
      
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
      const payload = new URLSearchParams({
        From: TWILIO_FROM,
        To: formattedPhone,
        Body: `Your verification code is ${otp}`,
      });

      const authHeader = `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`;
      const twilioResp = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      if (!twilioResp.ok) {
        const errText = await twilioResp.text().catch(() => "no-response-body");
        console.error("Twilio send failed:", twilioResp.status, errText);
      } else {
        console.log("✅ SMS sent successfully via Twilio");
      }
    }

    // Calculate attempts left for client-side display
    const attemptsLeft = Math.max(0, 3 - (recentAttempts?.length || 0));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP generated and sent (or logged)",
        attempts_left: attemptsLeft
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});