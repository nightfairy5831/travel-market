// supabase/functions/save-traveller-data-on-signup/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
        JSON.stringify({
          success: false,
          error: "Form data is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 🧩 Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
        JSON.stringify({
          success: false,
          error: "Invalid or expired token",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Authenticated user:", user.id);

    // 🔍 Check if traveller record already exists for this user
    const { data: existingTraveller, error: fetchError } = await supabase
      .from("travellers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing traveller:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 🧠 Prepare traveller data - only include fields that have values
    const travellerUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields that are not null/undefined/empty
    if (formData?.basics?.firstName) 
      travellerUpdates.first_name = formData.basics.firstName;
    
    if (formData?.basics?.lastName) 
      travellerUpdates.last_name = formData.basics.lastName;
    
    if (formData?.basics?.email) 
      travellerUpdates.email = formData.basics.email;
    
    if (formData?.basics?.phone) 
      travellerUpdates.phone = formData.basics.phone;

    if (formData?.basics?.language) {
  travellerUpdates.language = Array.isArray(formData.basics.language)
    ? formData.basics.language
    : [formData.basics.language]; // wrap string in array
}

    if (formData?.basics?.gender) 
      travellerUpdates.gender = formData.basics.gender;
    
    if (formData?.basics?.specialNeeds) 
      travellerUpdates.special_needs = formData.basics.specialNeeds;
    
    if (profilePhoto) 
      travellerUpdates.profile_photo_url = profilePhoto;

    // Only add verification fields if they are explicitly true
    if (formData?.basics?.phoneVerified === true) 
      travellerUpdates.is_phone_verified = true;
    
    if (formData?.basics?.emailVerified === true) 
      travellerUpdates.is_email_verified = true;

    console.log("Traveller updates prepared:", travellerUpdates);

    let result;
    
    if (existingTraveller) {
      // 🗃️ UPDATE existing traveller record
      console.log("📝 Updating existing traveller record:", existingTraveller.id);
      
      const { data, error } = await supabase
        .from("travellers")
        .update(travellerUpdates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating traveller data:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      result = data;
      console.log("✅ Traveller data updated successfully:", data.id);
    } else {
      // 🗃️ INSERT new traveller record
      console.log("🆕 Creating new traveller record");
      
      const newTravellerData = {
        ...travellerUpdates,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("travellers")
        .insert([newTravellerData])
        .select()
        .single();

      if (error) {
        console.error("Error saving traveller data:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      result = data;
      console.log("✅ Traveller data saved successfully:", data.id);
    }

    // ✅ Update user status to "active"
    const { error: userStatusError } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", user.id);

    if (userStatusError) {
      console.error("⚠️ Failed to update user status:", userStatusError);
    } else {
      console.log("✅ User status updated to active");
    }

    return new Response(
      JSON.stringify({
        success: true,
        travellerData: result,
        message: existingTraveller 
          ? "Traveller data updated successfully" 
          : "Traveller data saved successfully",
        action: existingTraveller ? "updated" : "created",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in save-traveller-data-on-signup:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});