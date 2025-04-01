// Follow this setup guide to integrate the Deno runtime and the Supabase JS library with your project:
// https://deno.land/manual/examples/supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials in environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the user is authenticated and has admin privileges
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required");
    }

    // Get the user ID to delete from the request body
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("Missing userId in request body");
    }

    // Delete the user using the admin API
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 400,
    });
  }
});
