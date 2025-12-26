# Resend Email Setup Guide

This project uses [Resend](https://resend.com) for sending emails (verification, password resets, plan notifications).

## Setup Steps

1.  **Create a Resend Account:**
    Go to [resend.com](https://resend.com) and sign up.

2.  **Verify your Domain/Sender:**
    - Go to **Domains** in the Resend dashboard and add your domain.
    - Follow the DNS verification steps.
    - Alternatively, for testing, you can use the default `onboarding@resend.dev` sender (only to your own email).

3.  **Get your API Key:**
    Go to **API Keys** and create a new key with "Full Access" or at least "Sending" permissions.

4.  **Configure Supabase Secrets:**
    Run the following commands using the Supabase CLI, or add them manually in the Supabase Dashboard (**Edge Functions → Settings → Secrets**):

    ```bash
    supabase secrets set RESEND_API_KEY=re_your_api_key
    supabase secrets set RESEND_SENDER_EMAIL=noreply@yourdomain.com
    supabase secrets set RESEND_SENDER_NAME="Reply Ready Bot"
    supabase secrets set SITE_URL=https://yourdomain.com
    ```

    *Note: If you are using the onboarding email, use `onboarding@resend.dev` as the `RESEND_SENDER_EMAIL`.*

## Usage Limit Notifications

The system now automatically sends a professional email to the business owner when they reach their AI message limits.
- **Spam Prevention**: The email is only sent once per month (every 25 days) even if the limit is hit multiple times.
- **Automatic Enforcement**: Limits are checked and emails are triggered across WhatsApp, Telegram, and Web Chat.

---

5.  **Test the Integration:**
    You can use the `test-email` edge function to verify the setup:

    ```bash
    curl -X POST "https://your-project.supabase.co/functions/v1/test-email" \
      -H "Authorization: Bearer YOUR_ANON_KEY" \
      -H "Content-Type: application/json" \
      -d '{"to": "your-email@example.com"}'
    ```

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_SENDER_EMAIL` | The email address emails are sent from |
| `RESEND_SENDER_NAME` | The name displayed as the sender |
| `SITE_URL` | Your application's URL (used for links in emails) |
