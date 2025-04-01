// Follow Deno's recommended import pattern for Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const results = [];

    // Create admin user
    try {
      const { data: adminUser, error: adminError } =
        await supabase.auth.admin.createUser({
          email: "brendan@thedatainnovationhub.com",
          password: "password123",
          email_confirm: true,
          user_metadata: { name: "Admin User" },
          app_metadata: { role: "admin" },
        });

      results.push({
        type: "admin",
        success: !adminError,
        ...(adminError ? { error: adminError.message } : { user: adminUser }),
      });
    } catch (err) {
      results.push({ type: "admin", success: false, error: err.message });
    }

    // Create regular user
    try {
      const { data: regularUser, error: regularError } =
        await supabase.auth.admin.createUser({
          email: "user@example.com",
          password: "password123",
          email_confirm: true,
          user_metadata: { name: "Regular User" },
          app_metadata: { role: "user" },
        });

      results.push({
        type: "regular",
        success: !regularError,
        ...(regularError
          ? { error: regularError.message }
          : { user: regularUser }),
      });
    } catch (err) {
      results.push({ type: "regular", success: false, error: err.message });
    }

    return new Response(
      JSON.stringify({ message: "Operation completed", results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
