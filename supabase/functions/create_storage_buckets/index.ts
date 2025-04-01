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
      },
    });
  }

  try {
    // Parse the request body
    const { createBuckets } = await req.json();

    // Get the Supabase URL and key from environment variables
    // Try to get credentials from multiple sources
    let supabaseUrl = Deno.env.get("SUPABASE_URL");
    let supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    // Extract credentials from Authorization header if not found in env vars
    if (!supabaseUrl || !supabaseKey) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        try {
          const credentials = JSON.parse(atob(authHeader.split(" ")[1]));
          supabaseUrl = credentials.supabaseUrl || supabaseUrl;
          supabaseKey = credentials.supabaseKey || supabaseKey;
        } catch (e) {
          console.error("Failed to parse Authorization header:", e);
        }
      }
    }

    // Try to get from request headers directly
    if (!supabaseUrl) {
      supabaseUrl = req.headers.get("x-supabase-url") || supabaseUrl;
    }
    if (!supabaseKey) {
      supabaseKey = req.headers.get("x-supabase-key") || supabaseKey;
    }

    console.log("Credentials check:", {
      supabaseUrlExists: !!supabaseUrl,
      supabaseKeyExists: !!supabaseKey,
    });

    // Validate credentials
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        `Supabase credentials not found. Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in the environment.`,
      );
    }

    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Results object
    const results = {};

    // Create task_files bucket if requested
    if (!createBuckets || createBuckets.includes("task_files")) {
      try {
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const taskFilesBucket = buckets.find(
          (bucket) => bucket.name === "task_files",
        );

        if (!taskFilesBucket) {
          const result = await supabaseAdmin.storage.createBucket(
            "task_files",
            {
              public: true,
              fileSizeLimit: 52428800, // 50MB
              allowedMimeTypes: [
                "image/*",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain",
                "text/csv",
                "application/json",
                "application/zip",
                "application/x-rar-compressed",
              ],
            },
          );
          results.taskFiles = { success: !result.error, error: result.error };
        } else {
          results.taskFiles = {
            success: true,
            message: "Bucket already exists",
          };
        }
      } catch (error) {
        results.taskFiles = { success: false, error: error.message };
      }
    }

    // Create avatars bucket if requested
    if (!createBuckets || createBuckets.includes("avatars")) {
      try {
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const avatarsBucket = buckets.find(
          (bucket) => bucket.name === "avatars",
        );

        if (!avatarsBucket) {
          const result = await supabaseAdmin.storage.createBucket("avatars", {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ["image/*"],
          });
          results.avatars = { success: !result.error, error: result.error };
        } else {
          results.avatars = { success: true, message: "Bucket already exists" };
        }
      } catch (error) {
        results.avatars = { success: false, error: error.message };
      }
    }

    // Return the results
    return new Response(JSON.stringify(results), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: {
          envVarsPresent: {
            urlEnv: !!Deno.env.get("SUPABASE_URL"),
            keyEnv: !!Deno.env.get("SUPABASE_SERVICE_KEY"),
          },
        },
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
          "Content-Type": "application/json",
        },
        status: 400,
      },
    );
  }
});
