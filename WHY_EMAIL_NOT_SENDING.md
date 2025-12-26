# Why Email Not Sending After Disabling Email Confirmation

## The Problem

When you disable email confirmation in Supabase:
- ✅ Signup works (no 500 error)
- ✅ User is automatically logged in
- ❌ Verification email is NOT sent

## Why This Happens

1. **Email confirmation is disabled** → Supabase auto-confirms users
2. **User is immediately confirmed** → `user.email_confirmed_at` is set
3. **Function checks confirmation status** → Sees user is already confirmed
4. **Function returns early** → Doesn't send email

## The Solution

I've updated the code to:
1. **Send email even if user is confirmed** → Function now sends welcome email regardless
2. **Use magic link for confirmed users** → Generates a login link instead of verification link
3. **Call function regardless of status** → Frontend calls function for all new signups

## What Changed

### Edge Function (`send-verification-email/index.ts`)
- Now sends email even if user is already confirmed
- Uses `magiclink` type for confirmed users (logs them in)
- Uses `signup` type for unconfirmed users (verifies email)

### Frontend (`src/pages/Auth.tsx`)
- Calls function for ALL new signups (not just unconfirmed)
- Shows appropriate message based on response

## How to Test

1. **Sign up with a new email**
2. **Check browser console** - Should see:
   ```
   📧 Attempting to send welcome email...
   🔗 Calling Edge Function: https://...
   📥 Response status: 200
   ✅ Welcome email function called successfully
   ```

3. **Check Supabase Edge Function logs** - Should see:
   ```
   📧 send-verification-email function called
   ✅ User found: { id: "...", email: "...", confirmed: true }
   ⚠️ User email already verified, sending welcome email with magic link
   🔑 Generating link (type: magiclink)...
   ✅ Confirmation link generated
   📤 Sending email via Brevo...
   ✅ Email sent successfully via Brevo
   ```

4. **Check your email inbox** - Should receive welcome email

## If Email Still Not Sending

### Check 1: Function is Being Called
- Open browser console (F12)
- Look for logs starting with `📧`
- If no logs, function is not being called

### Check 2: Function is Deployed
- Supabase Dashboard → Edge Functions
- Verify `send-verification-email` exists and is active

### Check 3: Environment Variables
- Supabase Dashboard → Edge Functions → send-verification-email → Settings
- Verify `BREVO_API_KEY` is set
- Verify `BREVO_SENDER_EMAIL` is set

### Check 4: Supabase Function Logs
- Supabase Dashboard → Edge Functions → send-verification-email → Logs
- Look for error messages
- Check if Brevo API is being called

### Check 5: Brevo Dashboard
- Go to Brevo Dashboard → Statistics → Emails
- Check if emails are being sent
- Check delivery status

## Expected Behavior Now

1. **User signs up** → Account created, user logged in
2. **Function is called** → Sends welcome email via Brevo
3. **Email received** → User gets welcome email with login link
4. **User clicks link** → Logs in (if not already logged in)

## Important Notes

- **Email confirmation is disabled** → Users can use the app without verifying
- **Welcome email is still sent** → For onboarding and security
- **Magic link in email** → Allows easy login from email
- **Function works for both** → Confirmed and unconfirmed users

## Troubleshooting

### Still Not Receiving Emails?

1. **Check spam folder**
2. **Check Brevo dashboard** for email status
3. **Check Supabase function logs** for errors
4. **Verify Brevo API key** is correct
5. **Check daily email limits** (300/day for free tier)

### Function Not Being Called?

1. **Check browser console** for errors
2. **Check network tab** (F12 → Network)
3. **Look for failed requests** to `/functions/v1/send-verification-email`
4. **Verify environment variables** are set correctly

### Function Called But Email Not Sent?

1. **Check Supabase function logs** for Brevo API errors
2. **Verify BREVO_API_KEY** is correct
3. **Check Brevo sender email** is verified
4. **Check Brevo dashboard** for delivery status

