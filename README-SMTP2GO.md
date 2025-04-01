# SMTP2GO Integration Guide

## Overview

This project uses SMTP2GO as the email provider for sending invitation emails to users. SMTP2GO offers a reliable and scalable email delivery service with features like email tracking, analytics, and a generous free tier.

## Setup Instructions

### 1. Create an SMTP2GO Account

1. Sign up for a free account at [SMTP2GO](https://www.smtp2go.com/)
2. Verify your account and domain
3. Navigate to the SMTP Settings page to get your credentials

### 2. Configure Environment Variables

You need to set the following environment variables in your Supabase project:

```
SMTP2GO_HOST=mail.smtp2go.com
SMTP2GO_PORT=2525
SMTP2GO_USERNAME=brendan@thedatainnovationhub.com
SMTP2GO_PASSWORD=H3althcare1!
FROM_EMAIL=noreply@thedatainnovsationhub.com
```

To set these variables in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Scroll down to "Project Settings"
4. Add each environment variable

### 3. Deploy the Edge Function

The Edge Function for sending emails has already been created at `supabase/functions/send_invitation_email/index.ts`. To deploy it:

```bash
npx supabase functions deploy send_invitation_email --project-ref your-project-ref
```

Replace `your-project-ref` with your Supabase project reference ID.

## Usage

To send an invitation email, use the `sendProjectInvitation` function from `src/lib/email.ts`:

```typescript
import { sendProjectInvitation } from "@/lib/email";

// Inside your component or function
const result = await sendProjectInvitation(
  "recipient@example.com",
  "project-123",
  "My Project",
  { id: "user-123", name: "John Doe", email: "john@example.com" },
  "Optional custom message"
);

if (result.success) {
  // Handle success
} else {
  // Handle error
  console.error(result.error);
}
```

## Troubleshooting

### Common Issues

1. **Emails not being sent**: Check that your SMTP2GO credentials are correct and that you haven't exceeded your daily sending limit.

2. **Edge Function errors**: Check the Supabase logs for any errors in the Edge Function execution.

3. **CORS issues**: If you're getting CORS errors, make sure the Edge Function's CORS headers are properly configured.

### Debugging

To debug email sending issues:

1. Check the Supabase Edge Function logs in your Supabase dashboard
2. Verify that the SMTP2GO credentials are correctly set in the environment variables
3. Test sending an email directly through the SMTP2GO dashboard to confirm your account is working

## Limitations

- The free tier of SMTP2GO allows for 1,000 emails per month
- Email templates are currently hardcoded in the Edge Function
- There's no email queue system for handling retries if sending fails

## Future Improvements

- Add email templates that can be customized through the UI
- Implement an email queue system for handling retries
- Add email tracking and analytics
- Support for more email types (welcome emails, password reset, etc.)
