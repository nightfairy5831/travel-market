// // supabase/functions/create-stripe-express-account/index.ts
// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import Stripe from "https://esm.sh/stripe@14.0.0";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// // Helper function to get country from phone (replicate your utility)
// function getCountryFromPhone(phone: string): string {
//   // Simple country detection based on phone prefix
//   if (phone.startsWith('+1')) return 'US';
//   if (phone.startsWith('+44')) return 'GB';
//   if (phone.startsWith('+61')) return 'AU';
//   if (phone.startsWith('+91')) return 'IN';
//   if (phone.startsWith('+92')) return 'PK'; // Pakistan
//   // Add more country codes as needed
//   return 'US'; // Default to US
// }

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
//       apiVersion: "2023-10-16",
//     });

//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL") ?? "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
//     );

//     const body = await req.json().catch(() => ({}));
//     const companionData = body?.companionData;

//     if (!companionData) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Companion data is required" }),
//         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     // Extract and verify JWT token from Authorization header
//     const authHeader = req.headers.get('Authorization');
//     if (!authHeader) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Missing authorization header" }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const token = authHeader.replace('Bearer ', '');
    
//     // Verify the JWT token and get the user
//     const { data: { user }, error: userError } = await supabase.auth.getUser(token);

//     if (userError || !user?.id) {
//       console.error("JWT verification failed:", userError);
//       return new Response(
//         JSON.stringify({ success: false, error: "Invalid or expired token" }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     console.log("✅ Authenticated user:", user.id);

//     // Use test phone number for Stripe (as in your server action)
//     // const testPhoneNumber = '+13105551234';
//     const detectedCountry = getCountryFromPhone(companionData?.phone);

//     console.log(`Creating Stripe account with:
//       - Country: ${detectedCountry}
//       - Phone: ${companionData?.phone}
//       - Email: ${companionData.email}
//       - Name: ${companionData.fullName}`);

//     // 1. Create Express Account - EXACT SAME LOGIC as your server action
//     const account = await stripe.accounts.create({
//       type: 'express',
//       country: detectedCountry,
//       email: companionData.email,
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//       business_type: 'individual',
//       business_profile: {
//         name: companionData.fullName,
//         // Remove url or use a valid one as in your server action
//       },
//       individual: {
//         email: companionData.email,
//         first_name: companionData.fullName.split(' ')[0],
//         phone: companionData?.phone,
//       },
//       metadata: {
//         companion_id: companionData.id,
//       },
//     });

//     // 2. Create Account Link for Onboarding - EXACT SAME LOGIC
//     const accountLink = await stripe.accountLinks.create({
//       account: account.id,
//       refresh_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/retry`,
//       return_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/success`,
//       type: 'account_onboarding',
//     });

//     // 3. Save initial Stripe data to Supabase - EXACT SAME LOGIC
//     const { error: dbError } = await supabase
//       .from('companions')
//       .update({
//         stripe_account_id: account.id,
//         stripe_onboarding_status: 'in_progress',
//         stripe_account_status: account.requirements?.currently_due?.length > 0 ? 'action_required' : 'pending',
//         stripe_requirements: account.requirements,
//         stripe_created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', companionData.id);

//     if (dbError) {
//       console.error('Error saving Stripe data:', dbError);
//       // Don't fail the whole process if DB save fails - EXACT SAME LOGIC
//     }

//     console.log("✅ Stripe account created successfully:", account.id);

//     return new Response(
//       JSON.stringify({
//         success: true,
//         onboardingUrl: accountLink.url,
//         stripeAccountId: account.id,
//       }),
//       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );

//   } catch (error) {
//     console.error('Stripe account creation error:', error);
//     return new Response(
//       JSON.stringify({ 
//         success: false, 
//         error: error.message 
//       }),
//       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );
//   }
// });

// ! STRIPE PRODUCTION CODE
// // supabase/functions/create-stripe-express-account/index.ts
// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import Stripe from "https://esm.sh/stripe@14.0.0";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// // Helper function to get country from phone (replicate your utility)
// function getCountryFromPhone(phone: string): string {
//   // Simple country detection based on phone prefix
//   if (phone.startsWith('+1')) return 'US';
//   if (phone.startsWith('+44')) return 'GB';
//   if (phone.startsWith('+61')) return 'AU';
//   if (phone.startsWith('+91')) return 'IN';
//   if (phone.startsWith('+92')) return 'PK'; // Pakistan
//   // Add more country codes as needed
//   return 'US'; // Default to US
// }

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
//       apiVersion: "2023-10-16",
//     });

//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL") ?? "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
//     );

//     const body = await req.json().catch(() => ({}));
//     const companionData = body?.companionData;

//     if (!companionData) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Companion data is required" }),
//         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     // Extract and verify JWT token from Authorization header
//     const authHeader = req.headers.get('Authorization');
//     if (!authHeader) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Missing authorization header" }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const token = authHeader.replace('Bearer ', '');
    
//     // Verify the JWT token and get the user
//     const { data: { user }, error: userError } = await supabase.auth.getUser(token);

//     if (userError || !user?.id) {
//       console.error("JWT verification failed:", userError);
//       return new Response(
//         JSON.stringify({ success: false, error: "Invalid or expired token" }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     console.log("✅ Authenticated user:", user.id);

//     // Use test phone number for Stripe (as in your server action)
//     // const testPhoneNumber = '+13105551234';
//     const detectedCountry = getCountryFromPhone(companionData?.phone);

//     console.log(`Creating Stripe account with:
//       - Country: ${detectedCountry}
//       - Phone: ${companionData?.phone}
//       - Email: ${companionData.email}
//       - Name: ${companionData.fullName}`);

//     // 1. Create Express Account - EXACT SAME LOGIC as your server action
//     const account = await stripe.accounts.create({
//       type: 'express',
//       country: detectedCountry,
//       email: companionData.email,
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//       business_type: 'individual',
//       business_profile: {
//         name: companionData.fullName,
//         // Remove url or use a valid one as in your server action
//       },
//       individual: {
//         email: companionData.email,
//         first_name: companionData.fullName.split(' ')[0],
//         phone: companionData?.phone,
//       },
//       metadata: {
//         companion_id: companionData.id,
//       },
//     });

//     // 2. Create Account Link for Onboarding - EXACT SAME LOGIC
//     const accountLink = await stripe.accountLinks.create({
//       account: account.id,
//       refresh_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/retry`,
//       return_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/success`,
//       type: 'account_onboarding',
//     });

//     // 3. Save initial Stripe data to Supabase - EXACT SAME LOGIC
//     const { error: dbError } = await supabase
//       .from('companions')
//       .update({
//         stripe_account_id: account.id,
//         stripe_onboarding_status: 'in_progress',
//         stripe_account_status: account.requirements?.currently_due?.length > 0 ? 'action_required' : 'pending',
//         stripe_requirements: account.requirements,
//         stripe_created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', companionData.id);

//     if (dbError) {
//       console.error('Error saving Stripe data:', dbError);
//       // Don't fail the whole process if DB save fails - EXACT SAME LOGIC
//     }

//     console.log("✅ Stripe account created successfully:", account.id);

//     return new Response(
//       JSON.stringify({
//         success: true,
//         onboardingUrl: accountLink.url,
//         stripeAccountId: account.id,
//       }),
//       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );

//   } catch (error) {
//     console.error('Stripe account creation error:', error);
//     return new Response(
//       JSON.stringify({ 
//         success: false, 
//         error: error.message 
//       }),
//       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );
//   }
// });
// ! STRIPE TEST ACCOUNT CODE

// // supabase/functions/create-stripe-express-account/index.ts
// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import Stripe from "https://esm.sh/stripe@14.0.0";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// // ❗ FORCE USA TEST ACCOUNTS (since PK is not supported)
// function detectCountryAlwaysUS() {
//   return "US";
// }

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
//       apiVersion: "2023-10-16",
//     });

//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL") ?? "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
//     );

//     const body = await req.json().catch(() => ({}));
//     const companionData = body?.companionData;

//     if (!companionData) {
//       return new Response(JSON.stringify({
//         success: false, 
//         error: "Missing companion data"
//       }), {
//         status: 400,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // Validate token
//     const token = req.headers.get("Authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return new Response(JSON.stringify({
//         success: false, 
//         error: "Missing authorization token"
//       }), {
//         status: 401,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     const { data: { user }, error: userError } = await supabase.auth.getUser(token);
//     if (userError || !user?.id) {
//       return new Response(JSON.stringify({
//         success: false, 
//         error: "Invalid or expired token"
//       }), {
//         status: 401,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // FORCE U.S. ACCOUNT
//     const detectedCountry = detectCountryAlwaysUS();

//     console.log("Creating US Stripe Express account for testing...");

//     // CREATE STRIPE EXPRESS ACCOUNT (TEST MODE)
//     const account = await stripe.accounts.create({
//       type: "express",
//       country: "US", // FORCE U.S.
//       email: companionData.email,
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//       business_type: "individual",
//       business_profile: {
//         name: companionData.fullName,
//       },
//       individual: {
//         first_name: companionData.fullName.split(" ")[0],
//         email: companionData.email,
//         phone: "+13105551234", // US TEST PHONE
//       },
//       metadata: {
//         companion_id: companionData.id,
//       },
//     });

//     // CREATE ONBOARDING LINK
//     const link = await stripe.accountLinks.create({
//       account: account.id,
//       refresh_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/retry`,
//       return_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/success`,
//       type: "account_onboarding",
//     });

//     // SAVE ONLY SAFE DATA — NO BANK INFO (Stripe stores it)
//    const { error: dbError } = await supabase
//      .from("companions")
//      .update({
//        stripe_account_id: account.id,
//        is_kyc_approved: false, // default

//        stripe_onboarding_status: "in_progress",
//        stripe_account_status: "pending",

//        stripe_payouts_enabled: account.payouts_enabled ?? false,
//        stripe_charges_enabled: account.charges_enabled ?? false,

//        stripe_requirements: account.requirements?.currently_due ?? [],

//        updated_at: new Date().toISOString(),
//      })
//      .eq("id", companionData.id);

//     if (dbError) console.error("DB save error:", dbError);

//     return new Response(JSON.stringify({
//       success: true,
//       onboardingUrl: link.url,
//       stripeAccountId: account.id,
//     }), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" }
//     });

//   } catch (err) {
//     console.log("Stripe Error:", err);
//     return new Response(JSON.stringify({
//       success: false,
//       error: err?.message,
//     }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" }
//     });
//   }
// });
// ! STRIPE PRODUCTION CODE
// // supabase/functions/create-stripe-express-account/index.ts
// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import Stripe from "https://esm.sh/stripe@14.0.0";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// // Helper function to get country from phone (replicate your utility)
// function getCountryFromPhone(phone: string): string {
//   // Simple country detection based on phone prefix
//   if (phone.startsWith('+1')) return 'US';
//   if (phone.startsWith('+44')) return 'GB';
//   if (phone.startsWith('+61')) return 'AU';
//   if (phone.startsWith('+91')) return 'IN';
//   if (phone.startsWith('+92')) return 'PK'; // Pakistan
//   // Add more country codes as needed
//   return 'US'; // Default to US
// }

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
//       apiVersion: "2023-10-16",
//     });

//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL") ?? "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
//     );

//     const body = await req.json().catch(() => ({}));
//     const companionData = body?.companionData;

//     if (!companionData) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Companion data is required" }),
//         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     // Extract and verify JWT token from Authorization header
//     const authHeader = req.headers.get('Authorization');
//     if (!authHeader) {
//       return new Response(
//         JSON.stringify({ success: false, error: "Missing authorization header" }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const token = authHeader.replace('Bearer ', '');
    
//     // Verify the JWT token and get the user
//     const { data: { user }, error: userError } = await supabase.auth.getUser(token);

//     if (userError || !user?.id) {
//       console.error("JWT verification failed:", userError);
//       return new Response(
//         JSON.stringify({ success: false, error: "Invalid or expired token" }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     console.log("✅ Authenticated user:", user.id);

//     // Use test phone number for Stripe (as in your server action)
//     // const testPhoneNumber = '+13105551234';
//     const detectedCountry = getCountryFromPhone(companionData?.phone);

//     console.log(`Creating Stripe account with:
//       - Country: ${detectedCountry}
//       - Phone: ${companionData?.phone}
//       - Email: ${companionData.email}
//       - Name: ${companionData.fullName}`);

//     // 1. Create Express Account - EXACT SAME LOGIC as your server action
//     const account = await stripe.accounts.create({
//       type: 'express',
//       country: detectedCountry,
//       email: companionData.email,
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//       business_type: 'individual',
//       business_profile: {
//         name: companionData.fullName,
//         // Remove url or use a valid one as in your server action
//       },
//       individual: {
//         email: companionData.email,
//         first_name: companionData.fullName.split(' ')[0],
//         phone: companionData?.phone,
//       },
//       metadata: {
//         companion_id: companionData.id,
//       },
//     });

//     // 2. Create Account Link for Onboarding - EXACT SAME LOGIC
//     const accountLink = await stripe.accountLinks.create({
//       account: account.id,
//       refresh_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/retry`,
//       return_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/success`,
//       type: 'account_onboarding',
//     });

//     // 3. Save initial Stripe data to Supabase - EXACT SAME LOGIC
//     const { error: dbError } = await supabase
//       .from('companions')
//       .update({
//         stripe_account_id: account.id,
//         stripe_onboarding_status: 'in_progress',
//         stripe_account_status: account.requirements?.currently_due?.length > 0 ? 'action_required' : 'pending',
//         stripe_requirements: account.requirements,
//         stripe_created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', companionData.id);

//     if (dbError) {
//       console.error('Error saving Stripe data:', dbError);
//       // Don't fail the whole process if DB save fails - EXACT SAME LOGIC
//     }

//     console.log("✅ Stripe account created successfully:", account.id);

//     return new Response(
//       JSON.stringify({
//         success: true,
//         onboardingUrl: accountLink.url,
//         stripeAccountId: account.id,
//       }),
//       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );

//   } catch (error) {
//     console.error('Stripe account creation error:', error);
//     return new Response(
//       JSON.stringify({ 
//         success: false, 
//         error: error.message 
//       }),
//       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );
//   }
// });
// ! STRIPE TEST ACCOUNT CODE

// supabase/functions/create-stripe-express-account/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ❗ FORCE USA TEST ACCOUNTS (since PK is not supported)
function detectCountryAlwaysUS() {
  return "US";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const companionData = body?.companionData;

    if (!companionData) {
      return new Response(JSON.stringify({
        success: false, 
        error: "Missing companion data"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({
        success: false, 
        error: "Missing authorization token"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user?.id) {
      return new Response(JSON.stringify({
        success: false, 
        error: "Invalid or expired token"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // FORCE U.S. ACCOUNT
    const detectedCountry = detectCountryAlwaysUS();

    console.log("Creating US Stripe Express account for testing...");

    // CREATE STRIPE EXPRESS ACCOUNT (TEST MODE)
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // FORCE U.S.
      email: companionData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      business_profile: {
        name: companionData.fullName,
      },
      individual: {
        first_name: companionData.fullName,
        email: companionData.email,
        phone: "+13105551234", // US TEST PHONE
      },
      metadata: {
        companion_id: companionData.id,
      },
    });

    // CREATE ONBOARDING LINK
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/retry`,
      return_url: `${Deno.env.get("NEXTAUTH_URL")}/dashboard/companion/onboarding/success`,
      type: "account_onboarding",
    });

    // SAVE ONLY SAFE DATA — NO BANK INFO (Stripe stores it)
   const { error: dbError } = await supabase
     .from("companions")
     .update({
       stripe_account_id: account.id,
       is_kyc_approved: false, // default

       stripe_onboarding_status: "in_progress",
       stripe_account_status: "pending",

       stripe_payouts_enabled: account.payouts_enabled ?? false,
       stripe_charges_enabled: account.charges_enabled ?? false,

       stripe_requirements: account.requirements?.currently_due ?? [],

       updated_at: new Date().toISOString(),
     })
     .eq("id", companionData.id);

    if (dbError) console.error("DB save error:", dbError);

    return new Response(JSON.stringify({
      success: true,
      onboardingUrl: link.url,
      stripeAccountId: account.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.log("Stripe Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});