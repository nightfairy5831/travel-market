import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client with service role key (bypasses RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { companionId } = body;

    if (!companionId) {
      return NextResponse.json({ error: "Companion ID is required" }, { status: 400 });
    }

    // Update companion approval status to rejected
    const { data: updatedCompanion, error: updateError } = await supabase
      .from("companions")
      .update({
        is_kyc_approved: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error rejecting companion:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Companion rejected successfully",
      companion: updatedCompanion,
    });
  } catch (error) {
    console.error("Reject companion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject companion" },
      { status: 500 }
    );
  }
}
