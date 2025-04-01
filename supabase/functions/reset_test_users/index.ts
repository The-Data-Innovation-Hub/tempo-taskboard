// Function to reset test users with proper credentials
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.supabase.co https://images.unsplash.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables");
    }

    // Create a Supabase client with the Admin key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Delete existing test users
    await supabase.auth.admin.deleteUser(
      "00000000-0000-0000-0000-000000000001",
    );
    await supabase.auth.admin.deleteUser(
      "00000000-0000-0000-0000-000000000002",
    );

    // Create regular user
    const { data: regularUser, error: regularError } =
      await supabase.auth.admin.createUser({
        email: "user@example.com",
        password: "password123",
        email_confirm: true,
        user_metadata: { name: "Regular User" },
        app_metadata: { role: "user" },
      });

    // Create admin user
    const { data: adminUser, error: adminError } =
      await supabase.auth.admin.createUser({
        email: "admin@example.com",
        password: "password123",
        email_confirm: true,
        user_metadata: { name: "Admin User" },
        app_metadata: { role: "admin" },
      });

    return new Response(
      JSON.stringify({
        message: "Test users reset successfully",
        regularUser: regularError
          ? { error: regularError.message }
          : regularUser,
        adminUser: adminError ? { error: adminError.message } : adminUser,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
