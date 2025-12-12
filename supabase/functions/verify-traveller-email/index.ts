// supabase/functions/verify-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log("🔍 Verifying token:", token);

    // Check if a record exists with this token
    const { data: checkData, error: checkError } = await supabaseClient
      .from("travellers")
      .select("id, email, is_email_verified , user_id")
      .eq("email_verification_token", token)
      .single();

    if (checkError || !checkData) {
      console.log("❌ Invalid token or record not found");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired verification link" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Record found:", checkData.email);

    // Update the record
    const { data, error } = await supabaseClient
      .from("travellers")
      .update({
        is_email_verified: true,
        email_verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("email_verification_token", token)
      .select()
      .single();

    if (error) {
      console.error("❌ Update failed:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Verification failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🎉 Email verified successfully:", data.email);
     if (checkData.user_id) {
      console.log("🔄 Updating user status to 'active' for user_id:", checkData.user_id);
      
      const { data: userData, error: userError } = await supabaseClient
        .from("users")
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkData.user_id)
        .select()
        .single();

      if (userError) {
        console.error("❌ User status update failed:", userError);
        // Don't fail the entire verification if user update fails, but log it
        console.log("⚠️ Email verified but user status update failed");
      } else {
        console.log("✅ User status updated to 'active':", userData);
      }
    } else {
      console.log("⚠️ No user_id found in traveller record, skipping user status update");
    }

    console.log("🎉 Email verified successfully:", checkData.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email: data.email,
        message: "Email verified successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  
});