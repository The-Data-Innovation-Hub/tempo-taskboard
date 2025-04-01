// Function to check and report on authentication setup
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

    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("count(*)")
      .single();

    // Check profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("count(*)")
      .single();

    // Check auth.users table
    const { data: authConfig, error: authConfigError } = await supabase.rpc(
      "check_table_rls",
      { table_name: "users" },
    );

    return new Response(
      JSON.stringify({
        status: "success",
        users_table: usersError ? { error: usersError.message } : usersData,
        profiles_table: profilesError
          ? { error: profilesError.message }
          : profilesData,
        auth_config: authConfigError
          ? { error: authConfigError.message }
          : authConfig,
        message: "Auth setup check completed",
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
