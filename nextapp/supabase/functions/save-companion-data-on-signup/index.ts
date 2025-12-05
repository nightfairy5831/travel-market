// supabase/functions/save-companion-data/index.ts
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
    const formData = body?.formData;
    const profilePhoto = body?.profilePhoto;

    if (!formData) {
      return new Response(
        JSON.stringify({ success: false, error: "Form data is required" }),
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

    // Prepare the companion data - EXACT SAME LOGIC as your server action
    const companionData = {
      full_name: formData?.basics?.fullName,
      email: formData?.basics?.email,
      phone: formData?.basics?.phone,
      dob: formData?.basics?.dob,
      gender: formData?.basics?.gender,

      // Extract just the values from arrays - EXACT SAME LOGIC
      service_types: Array.isArray(formData?.services?.serviceTypes)
        ? formData?.services?.serviceTypes.map((item) => {
            if (typeof item === "string") {
              try {
                const parsed = JSON.parse(item);
                return parsed.value || item;
              } catch {
                return item; // If it's already a string, return as is
              }
            } else if (item && typeof item === "object") {
              return item.value || item;
            }
            return item;
          })
        : [],

      preferred_airports: Array.isArray(formData?.services?.preferredAirports)
        ? formData?.services?.preferredAirports.map((item) => {
            if (typeof item === "string") {
              try {
                const parsed = JSON.parse(item);
                return parsed.value || item;
              } catch {
                return item;
              }
            } else if (item && typeof item === "object") {
              return item.value || item;
            }
            return item;
          })
        : [],

      languages: Array.isArray(formData?.services?.languages)
        ? formData?.services?.languages.map((item) => {
            if (typeof item === "string") {
              try {
                const parsed = JSON.parse(item);
                return parsed.value || item;
              } catch {
                return item;
              }
            } else if (item && typeof item === "object") {
              return item.value || item;
            }
            return item;
          })
        : [],

      short_bio: formData?.bio?.shortBio,
      skill_certificates: formData?.bio?.skillCertificates,
      profile_photo_url: profilePhoto,
      user_id: user.id,
      is_phone_verified: true,
      is_email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Companion data prepared:", companionData);

    // Insert into companions table - EXACT SAME LOGIC
    const { data, error } = await supabase
      .from("companions")
      .insert([companionData])
      .select()
      .single();

    if (error) {
      console.error("Error saving companion data:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Companion data saved successfully:", data.id);
    // ✅ After successful insert, update the corresponding user's status to 'active'
const { error: updateError } = await supabase
  .from("users")
  .update({ status: "active" })
  .eq("id", data.user_id); // assuming 'user_id' in companions links to 'id' in users

if (updateError) {
  console.error("Error updating user status:", updateError);
} else {
  console.log("✅ User status updated to 'active' successfully.");
}

    return new Response(
      JSON.stringify({
        success: true,
        companionData: data,
        message: "Companion data saved successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error in save-companion-data:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});