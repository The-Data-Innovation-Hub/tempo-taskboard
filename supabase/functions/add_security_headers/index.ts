// Follow this setup guide to integrate the Deno runtime and the Supabase JS library with your project:
// https://deno.land/manual/examples/supabase

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
    // Define security headers
    const securityHeaders = {
      // Content Security Policy
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://storage.googleapis.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com https://images.unsplash.com; img-src 'self' data: https://*.supabase.co https://api.dicebear.com https://images.unsplash.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none';",

      // Strict Transport Security (HSTS)
      "Strict-Transport-Security":
        "max-age=63072000; includeSubDomains; preload",

      // X-Content-Type-Options
      "X-Content-Type-Options": "nosniff",

      // X-Frame-Options
      "X-Frame-Options": "DENY",

      // X-XSS-Protection
      "X-XSS-Protection": "1; mode=block",

      // Referrer Policy
      "Referrer-Policy": "strict-origin-when-cross-origin",

      // Permissions Policy
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(self), interest-cohort=()",

      // Access control headers
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",

      // Cache control
      "Cache-Control": "no-store, max-age=0",

      // Content type
      "Content-Type": "application/json",
    };

    // Return the security headers
    return new Response(
      JSON.stringify({
        success: true,
        message: "Security headers retrieved successfully",
        headers: securityHeaders,
      }),
      {
        headers: securityHeaders,
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
