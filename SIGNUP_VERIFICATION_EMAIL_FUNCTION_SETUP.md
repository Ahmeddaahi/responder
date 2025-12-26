# Signup Verification Email Function Setup

This guide explains how to set up the custom signup verification email function that sends beautiful, branded emails via Brevo (similar to the password reset function).

## 📋 Overview

Instead of using Supabase's built-in email templates, we now use a custom Edge Function (`send-verification-email`) that:
- Sends verification emails via Brevo API (more reliable)
- Uses the same modern design as password reset emails
- Provides better control and error handling
- Works consistently across all environments

## 🚀 Step 1: Deploy the Edge Function

### Option A: Using Supabase CLI

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy send-verification-email
   ```

### Option B: Using Supabase Dashboard

1. Go to your **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click **"Create a new function"** or find `send-verification-email` if it exists
5. Name it: `send-verification-email`
6. Copy the contents of `supabase/functions/send-verification-email/index.ts`
7. Paste it into the function editor
8. Click **"Deploy"**

## 🔧 Step 2: Configure Environment Variables

The function needs these environment variables in Supabase:

1. Go to **Supabase Dashboard** → **Edge Functions** → **send-verification-email** → **Settings**
2. Add the following secrets:

   ```
   BREVO_API_KEY=your_brevo_api_key_here
   BREVO_SENDER_EMAIL=your-verified-email@yourdomain.com
   BREVO_SENDER_NAME=Reply Ready Bot
   SITE_URL=https://responder-eight.vercel.app
   ```

   **Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase - you don't need to set these.

### How to Get Brevo API Key

1. Go to **Brevo Dashboard**: [https://app.brevo.com/](https://app.brevo.com/)
2. Navigate to **Settings** → **SMTP & API** → **API Keys** tab
3. Click **"Generate a new API key"** or use an existing one
4. Give it a name (e.g., "Supabase Edge Functions")
5. Copy the API key (starts with `xkeysib-...`)
6. Paste it as `BREVO_API_KEY` in Supabase

## ⚙️ Step 3: Disable Supabase's Automatic Email (Optional but Recommended)

To avoid sending duplicate emails, you can disable Supabase's built-in email sending:

1. Go to **Supabase Dashboard** → **Settings** → **Auth**
2. Scroll to **"Email Auth"** section
3. Toggle **"Enable email confirmations"** to **OFF**
4. Click **"Save"**

**⚠️ Important**: If you disable email confirmations:
- Users can sign up without verifying email (less secure)
- You MUST use the custom function to send verification emails
- The function will handle all email verification

**Alternative**: Keep email confirmations ON but the custom function will send a nicer email. Users might receive two emails (one from Supabase, one from our function). This is fine for testing but you should disable Supabase's email in production.

## 🧪 Step 4: Test the Function

### Test via Frontend

1. Go to your website's signup page
2. Enter a new email address
3. Enter a password (at least 6 characters)
4. Click "Sign Up"
5. Check your email inbox (including spam folder)
6. You should receive the custom verification email
7. Click the "Verify Email Address" button
8. You should be redirected and logged in

### Test via API (Optional)

You can test the function directly using curl:

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/send-verification-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "redirectTo": "https://responder-eight.vercel.app/auth"
  }'
```

Replace:
- `your-project-ref` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon key
- `test@example.com` with a valid user email

## 📝 Step 5: Verify Integration

The function is automatically called from `src/pages/Auth.tsx`:

1. **After signup**: The function is called automatically when a user signs up
2. **Resend email**: The "Resend verification email" button also uses this function

### How It Works

1. User signs up → Supabase creates the user account
2. Frontend calls `send-verification-email` function
3. Function generates confirmation token using Supabase Admin API
4. Function sends beautiful email via Brevo
5. User clicks verification link → Email verified → User logged in

## 🔍 Troubleshooting

### Function Not Deployed?

**Error**: "Function not found" or 404 error

**Solution**:
1. Check function is deployed: Supabase Dashboard → Edge Functions
2. Verify function name is exactly `send-verification-email`
3. Redeploy the function

### Email Not Sending?

**Error**: "BREVO_API_KEY not configured"

**Solution**:
1. Check environment variables in Supabase Dashboard
2. Verify `BREVO_API_KEY` is set correctly
3. Make sure API key has email sending permissions in Brevo

**Error**: "Failed to send email"

**Solution**:
1. Check Brevo Dashboard → Statistics → Emails
2. Verify sender email is verified in Brevo
3. Check daily email limits (300/day for free tier)
4. Check Supabase function logs for detailed errors

### User Not Found Error?

**Error**: "User not found"

**Solution**:
1. Make sure user exists in Supabase Auth
2. Check email is correct (case-insensitive)
3. Verify user was created before calling the function

### Email Already Verified?

**Error**: "Email already verified"

**Solution**:
- This is normal if the user already verified their email
- The function returns success but doesn't send another email

## 📊 Monitoring

### Check Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **send-verification-email**
2. Click **"Logs"** tab
3. View real-time logs and errors

### Check Brevo Statistics

1. Go to **Brevo Dashboard** → **Statistics** → **Emails**
2. See how many emails were sent
3. Check delivery status (sent, delivered, opened, bounced)

## ✅ Success Checklist

- [ ] Function deployed to Supabase
- [ ] Environment variables configured (BREVO_API_KEY, BREVO_SENDER_EMAIL, etc.)
- [ ] Brevo sender email verified
- [ ] Tested signup flow
- [ ] Received custom verification email
- [ ] Verification link works
- [ ] User can log in after verification
- [ ] Resend email button works

## 🔄 Updating the Function

If you need to update the email template or function code:

1. Edit `supabase/functions/send-verification-email/index.ts`
2. Redeploy using:
   ```bash
   supabase functions deploy send-verification-email
   ```
   Or update via Supabase Dashboard

## 📚 Related Documentation

- **Password Reset Function**: `supabase/functions/password-reset/index.ts` (similar implementation)
- **Brevo API Docs**: [https://developers.brevo.com/docs/send-emails-with-api](https://developers.brevo.com/docs/send-emails-with-api)
- **Supabase Edge Functions**: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

## 🎉 Success!

Your signup verification emails are now sent via a reliable Edge Function with beautiful, branded design matching your password reset emails!

