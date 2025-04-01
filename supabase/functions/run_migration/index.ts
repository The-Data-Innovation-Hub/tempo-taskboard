// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/runtime/manual/vscode_deno

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.supabase.co https://images.unsplash.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  }

  try {
    // Parse the request body
    const { sql_content } = await req.json();

    if (!sql_content) {
      throw new Error("SQL content is required");
    }

    // Get the authorization header which should contain the service key
    const authHeader = req.headers.get("authorization") || "";
    const apiKey = authHeader.replace("Bearer ", "");

    // Get the project URL and ID from environment variables
    const projectUrl = Deno.env.get("SUPABASE_URL");
    const projectId = Deno.env.get("SUPABASE_PROJECT_ID");

    // In production, we should minimize logging of sensitive information
    const envVars = Object.keys(Deno.env.toObject());
    const isProd = Deno.env.get("ENVIRONMENT") === "production";

    if (!isProd) {
      console.log(`Available environment variables: ${envVars.join(", ")}`);
      console.log(`SUPABASE_URL: ${projectUrl || "Not found"}`);
      console.log(`SUPABASE_PROJECT_ID: ${projectId || "Not found"}`);
    }

    // Determine the Supabase URL with multiple fallbacks
    let supabaseUrl = projectUrl;
    if (!supabaseUrl && projectId) {
      supabaseUrl = `https://${projectId}.supabase.co`;
      console.log(`Constructed URL from project ID: ${supabaseUrl}`);
    }

    // If still no URL, try to extract from request origin
    if (!supabaseUrl) {
      const requestUrl = new URL(req.url);
      // If this is a Supabase Edge Function, the origin should be the project URL
      if (
        requestUrl.hostname.includes(".supabase.co") ||
        requestUrl.hostname.includes(".functions.supabase.co")
      ) {
        // Extract the project ID from the hostname
        const hostnameParts = requestUrl.hostname.split(".");
        if (hostnameParts.length >= 1) {
          const extractedProjectId = hostnameParts[0];
          supabaseUrl = `https://${extractedProjectId}.supabase.co`;
          console.log(`Extracted URL from request origin: ${supabaseUrl}`);
        }
      }
    }

    // Directly use the service key from environment variables
    // This is more reliable than trying to extract from headers
    let supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (supabaseKey) {
      console.log("Found SUPABASE_SERVICE_KEY in environment variables");
    } else {
      // Try alternative environment variable names
      supabaseKey =
        Deno.env.get("SERVICE_ROLE_KEY") ||
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
        Deno.env.get("SUPABASE_KEY");

      if (supabaseKey) {
        console.log("Found service key in alternative environment variables");
      } else if (apiKey) {
        // Use the key from authorization header if available
        supabaseKey = apiKey;
        console.log("Using key from authorization header");
      } else {
        // Last resort - try the anon key (not recommended for admin operations)
        supabaseKey =
          Deno.env.get("SUPABASE_ANON_KEY") ||
          Deno.env.get("VITE_SUPABASE_ANON_KEY");

        if (supabaseKey) {
          console.log(
            "WARNING: Using anon key as fallback. This is not recommended for admin operations.",
          );
        }
      }
    }

    // Log what we're using - only in non-production environments
    const isProd = Deno.env.get("ENVIRONMENT") === "production";
    if (!isProd) {
      console.log(`Using Supabase URL: ${supabaseUrl || "Not found"}`);
      console.log(
        `Using Supabase Key: ${supabaseKey ? "Present" : "Not found"}`,
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      // Include detailed information in the error
      const errorDetails = {
        supabaseUrl: supabaseUrl ? "present" : "missing",
        supabaseKey: supabaseKey ? "present" : "missing",
        availableEnvVars: envVars,
        requestInfo: {
          url: req.url,
          headers: Object.fromEntries([...req.headers.entries()]),
        },
      };

      console.error("Environment variables missing:", errorDetails);
      throw new Error(
        `Supabase credentials not found. Check logs for details. Available env vars: ${envVars.join(", ")}`,
      );
    }

    // Create a Supabase client with the Admin key
    console.log(`Creating Supabase client with URL: ${supabaseUrl}`);
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Execute the SQL query
    console.log("Executing SQL query...");
    // In production, don't log SQL content for security
    const isProd = Deno.env.get("ENVIRONMENT") === "production";
    if (!isProd) {
      console.log(
        "SQL content (first 100 chars):",
        sql_content.substring(0, 100),
      );
    }

    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      query: sql_content,
    });

    if (error) {
      console.error("SQL execution error:", error);
      throw new Error(`Error executing SQL: ${error.message}`);
    }

    console.log("SQL executed successfully");
    return new Response(JSON.stringify({ success: true, data }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.supabase.co https://images.unsplash.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.supabase.co https://images.unsplash.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        status: 400,
      },
    );
  }
});
