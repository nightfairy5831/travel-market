// supabase/functions/save-companion-data-on-signup/index.ts

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

    // 🔍 Check if companion record already exists for this user
    const { data: existingCompanion, error: fetchError } = await supabase
      .from("companions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing companion:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 🧠 Prepare companion data - only include fields that have values
    const companionUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    // Basic information fields
    if (formData?.basics?.firstName) 
      companionUpdates.first_name = formData.basics.firstName;
    
    if (formData?.basics?.lastName) 
      companionUpdates.last_name = formData.basics.lastName;
    
    if (formData?.basics?.email) 
      companionUpdates.email = formData.basics.email;
    
    if (formData?.basics?.phone) 
      companionUpdates.phone = formData.basics.phone;

    // Language field (array)
    if (formData?.basics?.language) {
      companionUpdates.languages = Array.isArray(formData.basics.language)
        ? formData.basics.language
        : [formData.basics.language];
    }

    if (formData?.basics?.gender) 
      companionUpdates.gender = formData.basics.gender;

    // New fields
    if (formData?.basics?.dob) 
      companionUpdates.dob = formData.basics.dob;

    if (formData?.basics?.preferred_airports) {
      companionUpdates.preferred_airports = Array.isArray(formData.basics.preferred_airports)
        ? formData.basics.preferred_airports
        : [formData.basics.preferred_airports];
    }

    if (formData?.basics?.service_types) {
      companionUpdates.service_types = Array.isArray(formData.basics.service_types)
        ? formData.basics.service_types
        : [formData.basics.service_types];
    }

    if (formData?.basics?.skill_certificates) {
      companionUpdates.skill_certificates = Array.isArray(formData.basics.skill_certificates)
        ? formData.basics.skill_certificates
        : [formData.basics.skill_certificates];
    }

    if (formData?.basics?.short_bio) 
      companionUpdates.short_bio = formData.basics.short_bio;

    // KYC approval (boolean field)
    if (formData?.basics?.is_kyc_approved !== undefined) 
      companionUpdates.is_kyc_approved = formData.basics.is_kyc_approved;

    // Profile photo
    if (profilePhoto) 
      companionUpdates.profile_photo_url = profilePhoto;

    // Verification fields
    if (formData?.basics?.phoneVerified === true) 
      companionUpdates.is_phone_verified = true;
    
    if (formData?.basics?.emailVerified === true) 
      companionUpdates.is_email_verified = true;

    console.log("Companion updates prepared:", companionUpdates);

    let result;
    
    if (existingCompanion) {
      // 🗃️ UPDATE existing companion record
      console.log("📝 Updating existing companion record:", existingCompanion.id);
      
      const { data, error } = await supabase
        .from("companions")
        .update(companionUpdates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating companion data:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      result = data;
      console.log("✅ Companion data updated successfully:", data.id);
    } else {
      // 🗃️ INSERT new companion record
      console.log("🆕 Creating new companion record");
      
      const newCompanionData = {
        ...companionUpdates,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("companions")
        .insert([newCompanionData])
        .select()
        .single();

      if (error) {
        console.error("Error saving companion data:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      result = data;
      console.log("✅ Companion data saved successfully:", data.id);
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
        companionData: result,
        message: existingCompanion 
          ? "Companion data updated successfully" 
          : "Companion data saved successfully",
        action: existingCompanion ? "updated" : "created",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in save-companion-data-on-signup:", error);
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