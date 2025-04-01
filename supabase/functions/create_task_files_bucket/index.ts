import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

// Enhanced CORS headers to ensure preflight requests work properly
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.supabase.co https://images.unsplash.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// Hardcoded fallback values for development and testing
const FALLBACK_SUPABASE_URL = "https://gwyfopiauplascaofhii.supabase.co";
const FALLBACK_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eWZvcGlhdXBsYXNjYW9maGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MjQ1NTksImV4cCI6MjA1ODQwMDU1OX0.bHQnCfb5GM3IUh_Y6U-LF2LzL0FBrgRPSqbcVVPbtec";

serve(async (req) => {
  // Handle CORS preflight requests - always respond with 200 OK
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    console.log("Starting create_task_files_bucket function...");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);

    // Log all headers for debugging
    console.log("All request headers:");
    for (const [key, value] of req.headers.entries()) {
      console.log(`${key}: ${value}`);
    }

    // Extract request body if available
    let requestBody = {};
    try {
      if (req.body) {
        requestBody = await req.json();
        console.log("Request body:", requestBody);
      }
    } catch (e) {
      console.log("No request body or invalid JSON");
    }

    // Get Supabase URL and API keys with fallback values
    // Try to get from request headers first - check multiple header formats
    const authHeader =
      req.headers.get("Authorization") || req.headers.get("authorization");
    const supabaseUrlHeader =
      req.headers.get("x-supabase-url") ||
      req.headers.get("X-Supabase-Url") ||
      requestBody.supabaseUrl;

    // Try different auth header formats
    let supabaseKeyHeader = null;
    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        supabaseKeyHeader = authHeader.replace("Bearer ", "");
      } else {
        supabaseKeyHeader = authHeader;
      }
    } else if (req.headers.get("apikey") || req.headers.get("Apikey")) {
      supabaseKeyHeader =
        req.headers.get("apikey") || req.headers.get("Apikey");
    } else if (requestBody.supabaseKey) {
      supabaseKeyHeader = requestBody.supabaseKey;
    }

    console.log("Headers check:", {
      hasAuthHeader: !!authHeader,
      hasUrlHeader: !!supabaseUrlHeader,
      authHeaderLength: authHeader ? authHeader.length : 0,
      urlHeaderLength: supabaseUrlHeader ? supabaseUrlHeader.length : 0,
      supabaseKeyHeader: supabaseKeyHeader ? "[set]" : "[not set]",
    });

    // Then try environment variables
    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKeyEnv = Deno.env.get("SUPABASE_SERVICE_KEY");
    const supabaseAnonKeyEnv = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("Environment variables check:", {
      hasUrlEnv: !!supabaseUrlEnv,
      hasServiceKeyEnv: !!supabaseServiceKeyEnv,
      hasAnonKeyEnv: !!supabaseAnonKeyEnv,
    });

    // Use the first available value with fallback to hardcoded values
    const supabaseUrl =
      supabaseUrlHeader || supabaseUrlEnv || FALLBACK_SUPABASE_URL;
    const supabaseKey =
      supabaseKeyHeader ||
      supabaseServiceKeyEnv ||
      supabaseAnonKeyEnv ||
      FALLBACK_SUPABASE_KEY;

    console.log("Using credentials:", {
      usingUrl: supabaseUrl === FALLBACK_SUPABASE_URL ? "fallback" : "provided",
      usingKey: supabaseKey === FALLBACK_SUPABASE_KEY ? "fallback" : "provided",
      urlLength: supabaseUrl.length,
      keyLength: supabaseKey.length,
    });

    // Create a Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created");

    // Create the task_files bucket if it doesn't exist
    let buckets = [];
    let bucketsError = null;

    try {
      console.log("Listing storage buckets...");
      const result = await supabaseClient.storage.listBuckets();
      buckets = result.data || [];
      bucketsError = result.error;
      console.log("Buckets list result:", {
        success: !bucketsError,
        count: buckets?.length || 0,
        names: buckets?.map((b) => b.name).join(", ") || "none",
        error: bucketsError ? bucketsError.message : null,
      });
    } catch (error) {
      bucketsError = error;
      console.error("Error listing buckets:", error.message);
    }

    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }

    // Check for task_files bucket
    const taskFilesBucketExists = buckets.some(
      (bucket) => bucket.name === "task_files",
    );

    // Check for avatars bucket
    const avatarsBucketExists = buckets.some(
      (bucket) => bucket.name === "avatars",
    );

    console.log("Bucket existence check:", {
      taskFilesBucketExists,
      avatarsBucketExists,
    });

    // Create task_files bucket if it doesn't exist
    let taskFilesBucketCreated = taskFilesBucketExists;
    let taskFilesBucketError = null;

    if (!taskFilesBucketExists) {
      console.log("Creating task_files bucket...");
      try {
        const result = await supabaseClient.storage.createBucket("task_files", {
          public: true,
          fileSizeLimit: 10485760, // 10MB
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
        });

        if (result.error) {
          taskFilesBucketError = result.error;
          console.error(
            "Error creating task_files bucket:",
            result.error.message,
          );
        } else {
          taskFilesBucketCreated = true;
          console.log("task_files bucket created successfully");
        }
      } catch (error) {
        taskFilesBucketError = error;
        console.error("Exception creating task_files bucket:", error.message);
      }
    }

    // Create avatars bucket if it doesn't exist
    let avatarsBucketCreated = avatarsBucketExists;
    let avatarsBucketError = null;

    if (!avatarsBucketExists) {
      console.log("Creating avatars bucket...");
      try {
        const result = await supabaseClient.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/*"],
        });

        if (result.error) {
          avatarsBucketError = result.error;
          console.error("Error creating avatars bucket:", result.error.message);
        } else {
          avatarsBucketCreated = true;
          console.log("avatars bucket created successfully");
        }
      } catch (error) {
        avatarsBucketError = error;
        console.error("Exception creating avatars bucket:", error.message);
      }
    }

    // Verify buckets were created by listing them again
    let verifiedBuckets = [];
    let verificationError = null;

    try {
      console.log("Verifying bucket creation...");
      const result = await supabaseClient.storage.listBuckets();
      verifiedBuckets = result.data || [];
      verificationError = result.error;
      console.log("Verification result:", {
        success: !verificationError,
        count: verifiedBuckets?.length || 0,
        names: verifiedBuckets?.map((b) => b.name).join(", ") || "none",
        error: verificationError ? verificationError.message : null,
      });
    } catch (error) {
      verificationError = error;
      console.error("Exception verifying buckets:", error.message);
    }

    // Check verification results
    const taskFilesBucketVerified = verifiedBuckets.some(
      (b) => b.name === "task_files",
    );
    const avatarsBucketVerified = verifiedBuckets.some(
      (b) => b.name === "avatars",
    );

    console.log("Verification check:", {
      taskFilesBucketVerified,
      avatarsBucketVerified,
    });

    // Determine overall success
    const allBucketsAvailable =
      taskFilesBucketVerified && avatarsBucketVerified;
    const success = allBucketsAvailable;

    // Prepare response
    const response = {
      success,
      message: success
        ? taskFilesBucketExists && avatarsBucketExists
          ? "Required buckets already exist"
          : "Required buckets created successfully"
        : "Failed to create all required buckets",
      details: {
        taskFilesBucket: {
          existed: taskFilesBucketExists,
          created: !taskFilesBucketExists && taskFilesBucketCreated,
          verified: taskFilesBucketVerified,
          error: taskFilesBucketError ? taskFilesBucketError.message : null,
        },
        avatarsBucket: {
          existed: avatarsBucketExists,
          created: !avatarsBucketExists && avatarsBucketCreated,
          verified: avatarsBucketVerified,
          error: avatarsBucketError ? avatarsBucketError.message : null,
        },
        verificationError: verificationError ? verificationError.message : null,
      },
      buckets: {
        taskFilesBucketExists: taskFilesBucketVerified,
        avatarsBucketExists: avatarsBucketVerified,
      },
      credentials: {
        usingFallbackUrl: supabaseUrl === FALLBACK_SUPABASE_URL,
        usingFallbackKey: supabaseKey === FALLBACK_SUPABASE_KEY,
        headersPassed: !!supabaseUrlHeader && !!supabaseKeyHeader,
        envVarsAvailable:
          !!supabaseUrlEnv && (!!supabaseServiceKeyEnv || !!supabaseAnonKeyEnv),
      },
    };

    console.log("Function completed successfully");
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: success ? 200 : 400,
    });
  } catch (error) {
    console.error(`Function error: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: {
          message: "Error checking or creating required buckets",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
