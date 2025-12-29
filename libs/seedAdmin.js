/**
 * Seed Admin User Script
 *
 * This script creates an admin user in the database.
 *
 * Usage:
 *   node libs/seedAdmin.js
 *
 * Or run from package.json:
 *   npm run seed:admin
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const ADMIN_EMAIL = "admin@aidhandy.com";
const ADMIN_PASSWORD = "admin123!";

async function seedAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Creating admin user...");

  try {
    // Check if admin already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", ADMIN_EMAIL)
      .single();

    if (existingUser) {
      console.log("Admin user already exists:", existingUser.email);

      // Update role to admin if not already
      if (existingUser.role !== "admin") {
        const { error: updateError } = await supabase
          .from("users")
          .update({ role: "admin" })
          .eq("id", existingUser.id);

        if (updateError) {
          console.error("Error updating role:", updateError.message);
        } else {
          console.log("Updated user role to admin");
        }
      }
      return;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating auth user:", authError.message);
      process.exit(1);
    }

    console.log("Auth user created:", authData.user.id);

    // Create user record in users table with admin role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: ADMIN_EMAIL,
        role: "admin",
        status: "active",
        full_name: "Admin User",
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError.message);
      process.exit(1);
    }

    console.log("\n========================================");
    console.log("Admin user created successfully!");
    console.log("========================================");
    console.log("Email:", ADMIN_EMAIL);
    console.log("Password:", ADMIN_PASSWORD);
    console.log("Role:", userData.role);
    console.log("========================================");
    console.log("\nYou can now login at /auth/login and access /admin");

  } catch (error) {
    console.error("Unexpected error:", error.message);
    process.exit(1);
  }
}

seedAdmin();
