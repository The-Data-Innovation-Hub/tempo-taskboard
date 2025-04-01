// Edge function to ensure a project has a Completed column
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const { projectId } = await req.json();

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // Get Supabase client from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if a Completed column already exists for this project
    const { data: existingColumns, error: columnsError } = await supabaseAdmin
      .from("columns")
      .select("id, title")
      .eq("project_id", projectId)
      .ilike("title", "completed");

    if (columnsError) {
      throw new Error(
        `Error checking for Completed column: ${columnsError.message}`,
      );
    }

    // If no Completed column exists, create one
    if (!existingColumns || existingColumns.length === 0) {
      // Get the maximum order value for columns in this project
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("columns")
        .select("order")
        .eq("project_id", projectId)
        .order("order", { ascending: false })
        .limit(1);

      if (orderError) {
        throw new Error(`Error getting max order: ${orderError.message}`);
      }

      const maxOrder =
        orderData && orderData.length > 0 ? orderData[0].order : 0;

      // Insert a new Completed column
      const { data: newColumn, error: insertError } = await supabaseAdmin
        .from("columns")
        .insert({
          title: "Completed",
          project_id: projectId,
          order: maxOrder + 1,
        })
        .select();

      if (insertError) {
        throw new Error(
          `Error creating Completed column: ${insertError.message}`,
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Completed column created successfully",
          column: newColumn[0],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Completed column already exists",
        column: existingColumns[0],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});

// End of edge function
