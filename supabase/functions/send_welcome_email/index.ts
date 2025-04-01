// No need for Supabase client import - we're just sending emails
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Standard CORS headers for edge functions
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { email, name, password } = await req.json();

    // Validate required fields
    if (!email || !name) {
      throw new Error("Missing required fields: email, name");
    }

    // Get SMTP2GO credentials from environment variables
    const smtp2goHost = Deno.env.get("SMTP2GO_HOST") || "mail.smtp2go.com";
    const smtp2goPort = parseInt(Deno.env.get("SMTP2GO_PORT") || "2525");
    const smtp2goUsername =
      Deno.env.get("SMTP2GO_USERNAME") || "brendan@thedatainnovationhub.com";
    const smtp2goPassword = Deno.env.get("SMTP2GO_PASSWORD") || "H3althcare1!";
    const fromEmail =
      Deno.env.get("FROM_EMAIL") || "noreply@thedatainnovationhub.com";

    // Log configuration for debugging
    console.log("SMTP Configuration:");
    console.log(`Host: ${smtp2goHost}`);
    console.log(`Port: ${smtp2goPort}`);
    console.log(`Username: ${smtp2goUsername}`);
    console.log(`From Email: ${fromEmail}`);

    try {
      // Configure SMTP client
      const client = new SmtpClient();
      await client.connectTLS({
        hostname: smtp2goHost,
        port: smtp2goPort,
        username: smtp2goUsername,
        password: smtp2goPassword,
      });

      // Create email content
      const subject = `Welcome to TaskBoard, ${name}!`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0089AD; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TaskBoard</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Welcome to TaskBoard!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for creating an account with TaskBoard. Your account has been successfully created with the following details:</p>
            <ul style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Name:</strong> ${name}</li>
              ${password ? `<li><strong>Password:</strong> ${password}</li>` : ""}
            </ul>
            <p>You can now log in to your account and start creating projects, managing tasks, and collaborating with your team.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${req.headers.get("origin") || "https://your-app-url.com"}/login" style="background-color: #0089AD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log In Now</a>
            </div>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The TaskBoard Team</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      `;

      // Send the email
      await client.send({
        from: fromEmail,
        to: email,
        subject: subject,
        content: htmlBody,
        html: htmlBody,
      });

      await client.close();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Welcome email sent successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } catch (smtpError) {
      console.error("SMTP Error:", smtpError);

      // Fallback to a mock response if SMTP fails
      return new Response(
        JSON.stringify({
          success: true,
          message: "Welcome email simulation successful (SMTP unavailable)",
          note: "This is a fallback response. The actual email was not sent due to SMTP configuration issues.",
          error: smtpError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
