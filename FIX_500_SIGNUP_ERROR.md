# Fix 500 Error on Signup

## Problem

You're getting a **500 Internal Server Error** when trying to sign up:
```
POST https://...supabase.co/auth/v1/signup 500 (Internal Server Error)
```

This happens because:
- Supabase has **email confirmation enabled**
- But **SMTP is not configured** in Supabase
- Supabase tries to send verification email but fails → 500 error

## Solution

Since we're using our **custom Edge Function** to send verification emails (more reliable), we need to **disable Supabase's built-in email confirmation**.

### Step 1: Disable Email Confirmation in Supabase

1. Go to **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Auth**
4. Scroll down to **"Email Auth"** section
5. Find **"Enable email confirmations"**
6. Toggle it to **OFF**
7. Click **"Save"**

### Step 2: Verify Function is Deployed

1. Go to **Edge Functions** in Supabase Dashboard
2. Make sure `send-verification-email` function exists
3. Check it's deployed and active

### Step 3: Set Environment Variables

Make sure these are set in the function:
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `SITE_URL`

### Step 4: Test Signup

1. Try signing up again
2. Signup should succeed (no 500 error)
3. Check browser console for function call logs
4. Check Supabase Edge Function logs
5. Check your email inbox

## How It Works Now

1. **User signs up** → Supabase creates account (no email sent)
2. **Frontend calls our function** → `send-verification-email`
3. **Function generates verification link** → Using Supabase Admin API
4. **Function sends email via Brevo** → Beautiful custom email
5. **User clicks link** → Email verified → User logged in

## Important Notes

⚠️ **Security Consideration**: 
- With email confirmation disabled, users can sign up without verifying
- BUT our function still sends verification emails
- Users should verify their email before using the app
- You can add checks in your app to require email verification

## Alternative: Configure Supabase SMTP (Not Recommended)

If you want to keep Supabase's email confirmation enabled:

1. Configure SMTP in Supabase (see `SUPABASE_EMAIL_SETUP.md`)
2. Users will receive TWO emails:
   - One from Supabase (default template)
   - One from our function (custom template)
3. This is not ideal - better to disable Supabase's email

## Verification

After disabling email confirmation:

✅ Signup should work (no 500 error)
✅ User account is created
✅ Our function sends verification email
✅ User can verify email and log in

## Troubleshooting

### Still Getting 500 Error?

1. **Check Supabase Auth Logs**:
   - Supabase Dashboard → Logs → Auth Logs
   - Look for specific error messages

2. **Verify Email Confirmation is Disabled**:
   - Settings → Auth → Email Auth
   - Make sure "Enable email confirmations" is OFF

3. **Check Function is Deployed**:
   - Edge Functions → send-verification-email
   - Should show as "Active"

4. **Check Environment Variables**:
   - Edge Functions → send-verification-email → Settings
   - Verify all required variables are set

### Function Not Sending Emails?

See `TEST_VERIFICATION_EMAIL.md` for debugging steps.

