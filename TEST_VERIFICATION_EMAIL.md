# Testing Verification Email Function

This guide shows you how to test the verification email function and view console logs to debug issues.

## 🔍 Where to View Logs

### 1. Browser Console (Frontend Logs)

**How to open:**
1. Open your website in the browser
2. Press `F12` or `Right-click` → `Inspect`
3. Click the **"Console"** tab

**What you'll see:**
- When the function is called
- Request/response details
- Any errors from the frontend

**Look for these logs:**
```
📧 Attempting to send verification email...
🔗 Calling Edge Function: https://...
📤 Request payload: { email: "...", redirectTo: "..." }
📥 Response status: 200
✅ Verification email sent successfully
```

### 2. Supabase Edge Function Logs (Backend Logs)

**How to view:**
1. Go to **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click on **`send-verification-email`**
5. Click the **"Logs"** tab
6. You'll see real-time logs

**What you'll see:**
- Function execution details
- User lookup results
- Token generation
- Brevo API calls
- Any errors

**Look for these logs:**
```
📧 send-verification-email function called
🔧 Initializing Supabase client...
✅ Supabase client initialized
🔍 Looking up user by email: user@example.com
✅ User found: { id: "...", email: "...", confirmed: false }
🔑 Generating confirmation token...
✅ Confirmation link generated
📤 Sending email via Brevo...
✅ Email sent successfully via Brevo
```

## 🧪 Step-by-Step Testing

### Test 1: Sign Up Flow

1. **Open Browser Console** (F12 → Console tab)
2. **Go to your signup page**
3. **Enter a new email address** (one that doesn't exist)
4. **Enter a password** (at least 6 characters)
5. **Click "Sign Up"**
6. **Watch the console** for logs

**Expected logs in browser:**
```
📧 Attempting to send verification email...
User: { id: "...", email: "...", confirmed: false }
🔗 Calling Edge Function: https://...
📤 Request payload: { email: "...", redirectTo: "..." }
📥 Response status: 200
✅ Verification email function called successfully
```

**Then check Supabase logs:**
- Go to Supabase Dashboard → Edge Functions → send-verification-email → Logs
- You should see the function execution logs

### Test 2: Resend Email

1. **Open Browser Console** (F12 → Console tab)
2. **Go to your signup/login page**
3. **Enter an email** that's registered but not verified
4. **Click "Resend verification email"** (or similar button)
5. **Watch the console** for logs

**Expected logs:**
```
📧 Resending verification email...
Email: user@example.com
🔗 Calling Edge Function: https://...
📤 Request payload: { email: "...", redirectTo: "..." }
📥 Response status: 200
✅ Verification email sent successfully
```

### Test 3: Direct API Test (Optional)

You can test the function directly using curl or Postman:

```bash
curl -X POST 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-verification-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "redirectTo": "https://responder-eight.vercel.app/auth"
  }'
```

Replace:
- `YOUR-PROJECT-REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon key
- `test@example.com` with a valid user email

## 🐛 Common Issues and How to Debug

### Issue 1: Function Not Being Called

**Symptoms:**
- No logs in browser console
- No logs in Supabase

**Debug:**
1. Check browser console for errors
2. Verify `VITE_SUPABASE_URL` is set correctly
3. Check network tab in browser (F12 → Network)
4. Look for failed requests to `/functions/v1/send-verification-email`

**Fix:**
- Check environment variables
- Verify function is deployed
- Check function name is correct

### Issue 2: Function Called But Email Not Sent

**Symptoms:**
- Logs show function was called
- Response status is 200
- But no email received

**Debug:**
1. Check Supabase Edge Function logs
2. Look for Brevo API errors
3. Check if `BREVO_API_KEY` is configured
4. Verify sender email is verified in Brevo

**Check Supabase logs for:**
```
❌ BREVO_API_KEY not configured
❌ Brevo API error: { status: 401, ... }
```

**Fix:**
- Set `BREVO_API_KEY` in Supabase Edge Function settings
- Verify Brevo API key has email sending permissions
- Check Brevo dashboard for email delivery status

### Issue 3: User Not Found Error

**Symptoms:**
- Logs show "User not found"
- Response status is 404

**Debug:**
1. Check if user exists in Supabase Auth
2. Verify email is correct (case-insensitive)
3. Check Supabase logs for user lookup details

**Fix:**
- Make sure user signed up first
- Wait a moment after signup before calling function
- Verify email address is correct

### Issue 4: CORS Error

**Symptoms:**
- Browser console shows CORS error
- Request fails with CORS message

**Debug:**
1. Check browser console for CORS error
2. Verify function has CORS headers
3. Check if function is deployed correctly

**Fix:**
- Function should handle OPTIONS requests
- Check `corsHeaders` in function code
- Redeploy function if needed

### Issue 5: 401 Unauthorized

**Symptoms:**
- Response status is 401
- "Unauthorized" error

**Debug:**
1. Check if `VITE_SUPABASE_PUBLISHABLE_KEY` is set
2. Verify the key is correct
3. Check if key has function invocation permissions

**Fix:**
- Set correct `VITE_SUPABASE_PUBLISHABLE_KEY` in environment
- Verify key is the anon/public key (not service role key)

## 📊 Checking Email Delivery

### Brevo Dashboard

1. Go to **Brevo Dashboard**: [https://app.brevo.com/](https://app.brevo.com/)
2. Navigate to **Statistics** → **Emails**
3. Check recent emails:
   - **Sent**: Email was sent successfully
   - **Delivered**: Email reached recipient's server
   - **Opened**: Recipient opened the email
   - **Bounced**: Email was rejected
   - **Blocked**: Email was blocked

### Email Inbox

1. Check **inbox** (primary folder)
2. Check **spam/junk folder**
3. Check **promotions folder** (Gmail)
4. Wait 1-2 minutes for email to arrive

## ✅ Success Indicators

You'll know it's working when:

1. **Browser Console shows:**
   - ✅ Function called successfully
   - Response status: 200
   - No errors

2. **Supabase Logs show:**
   - ✅ User found
   - ✅ Confirmation link generated
   - ✅ Email sent successfully via Brevo

3. **Brevo Dashboard shows:**
   - Email in "Sent" status
   - Email in "Delivered" status (after a few seconds)

4. **Email Received:**
   - Beautiful verification email in inbox
   - "Verify Email Address" button works
   - Clicking button verifies email and logs in user

## 🔧 Quick Debug Checklist

- [ ] Browser console open (F12)
- [ ] Supabase Edge Function logs open
- [ ] Function deployed and active
- [ ] Environment variables set (BREVO_API_KEY, etc.)
- [ ] Brevo sender email verified
- [ ] User exists in Supabase Auth
- [ ] User email not already confirmed
- [ ] Network tab shows function call
- [ ] No CORS errors
- [ ] No 401/403 errors
- [ ] Brevo API key valid
- [ ] Daily email limit not exceeded

## 📝 Log Examples

### Successful Execution

**Browser Console:**
```
📧 Attempting to send verification email...
User: { id: "abc123", email: "test@example.com", confirmed: false }
🔗 Calling Edge Function: https://xyz.supabase.co/functions/v1/send-verification-email
📤 Request payload: { email: "test@example.com", redirectTo: "https://..." }
📥 Response status: 200
📥 Response data: { message: "Verification email sent successfully" }
✅ Verification email function called successfully
```

**Supabase Logs:**
```
📧 send-verification-email function called
Method: POST
🔧 Initializing Supabase client...
✅ Supabase client initialized
📥 Parsing request body...
Request data: { email: "test@example.com", redirectTo: "https://..." }
🔍 Looking up user by email: test@example.com
📊 Found 5 total users
✅ User found: { id: "abc123", email: "test@example.com", confirmed: false }
🔑 Generating confirmation token...
✅ Confirmation link generated
✅ Brevo API key found
📤 Sending email via Brevo...
📡 Brevo API response status: 201
✅ Brevo API success: { messageId: "..." }
✅ Email sent successfully via Brevo
✅ Function completed successfully
```

### Error Example

**Browser Console:**
```
📧 Attempting to send verification email...
❌ Error calling verification email function: { message: "User not found", ... }
```

**Supabase Logs:**
```
📧 send-verification-email function called
🔍 Looking up user by email: test@example.com
📊 Found 0 total users
❌ User not found for email: test@example.com
```

## 🆘 Still Not Working?

If you've checked all the above and emails still aren't sending:

1. **Check Supabase Status**: [https://status.supabase.com/](https://status.supabase.com/)
2. **Check Brevo Status**: [https://status.brevo.com/](https://status.brevo.com/)
3. **Review all logs** (browser + Supabase)
4. **Contact support** with log details


