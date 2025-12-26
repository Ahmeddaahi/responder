# Test Email Function - Setup & Usage

## 🎯 Purpose

This Edge Function helps you test your SMTP configuration by sending a test email. It will:
1. **First try**: Use Supabase's built-in SMTP (configured in Dashboard)
2. **Fallback**: Use Brevo API if Supabase SMTP fails

---

## 🚀 Deploy the Function

### Option A: Using Supabase CLI

```bash
supabase functions deploy test-email
```

### Option B: Using Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. Name it: `test-email`
4. Copy the contents of `supabase/functions/test-email/index.ts`
5. Paste into the function editor
6. Click **"Deploy"**

---

## 🧪 How to Test

### Method 1: Using cURL (Terminal)

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-email' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "message": "This is a test email from Supabase SMTP"
  }'
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference (e.g., `ilcxoakgntprququdgok`)
- `YOUR_SUPABASE_ANON_KEY` with your Supabase anon/public key
- `your-email@example.com` with your actual email address

### Method 2: Using Browser Console

Open your browser console (F12) and run:

```javascript
fetch('https://ilcxoakgntprququdgok.supabase.co/functions/v1/test-email', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'your-email@example.com',
    subject: 'Test Email',
    message: 'This is a test email'
  })
})
.then(res => res.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));
```

### Method 3: Using Postman or Similar Tool

1. **Method**: POST
2. **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-email`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_SUPABASE_ANON_KEY`
   - `Content-Type`: `application/json`
4. **Body** (JSON):
   ```json
   {
     "to": "your-email@example.com",
     "subject": "Test Email",
     "message": "This is a test email"
   }
   ```

### Method 4: Using Supabase Dashboard Test Feature

1. Go to **Supabase Dashboard** → **Edge Functions** → **test-email**
2. Click **"Invoke"** or **"Test"**
3. Enter the request body:
   ```json
   {
     "to": "your-email@example.com"
   }
   ```
4. Click **"Invoke Function"**

---

## 📋 Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `to` | ✅ Yes | string | Recipient email address |
| `subject` | ❌ No | string | Email subject (default: "Test Email from Supabase") |
| `message` | ❌ No | string | Email message/body (default: HTML template) |

**Minimal Request:**
```json
{
  "to": "your-email@example.com"
}
```

**Full Request:**
```json
{
  "to": "your-email@example.com",
  "subject": "My Custom Test Email",
  "message": "This is my custom test message"
}
```

---

## ✅ Expected Response

### Success Response (200)

```json
{
  "message": "Test email sent successfully via Supabase SMTP",
  "method": "Supabase Auth (signup verification)",
  "recipient": "your-email@example.com",
  "note": "Check your inbox (including spam folder) for the verification email"
}
```

### Error Response (400/500)

```json
{
  "error": "Error message here",
  "details": "Additional error details"
}
```

---

## 🔍 How It Works

1. **First Attempt - Supabase SMTP:**
   - Creates a temporary test user with the provided email
   - Supabase automatically sends a verification email using your configured SMTP
   - This tests if Supabase SMTP is working correctly
   - Test user is automatically deleted after 5 seconds

2. **Fallback - Brevo API:**
   - If Supabase SMTP test fails, it tries Brevo API
   - Uses `BREVO_API_KEY` from Edge Function secrets
   - Sends email directly via Brevo API
   - This helps verify if Brevo is configured correctly

---

## 🐛 Troubleshooting

### Error: "Email address (to) is required"
- Make sure you're sending the `to` field in the request body

### Error: "Invalid email address format"
- Check that the email address is valid (e.g., `user@example.com`)

### Error: "Supabase SMTP test failed and Brevo API key not configured"
- Either configure Supabase SMTP in Dashboard, or
- Add `BREVO_API_KEY` to Edge Function secrets

### Email Not Received?

1. **Check Spam Folder**
   - Test emails often go to spam initially
   - Mark as "Not Spam" if found

2. **Check Supabase Logs**
   - Go to **Edge Functions** → **test-email** → **Logs**
   - Look for error messages

3. **Check Brevo Dashboard** (if using Brevo fallback)
   - Go to **Statistics** → **Emails**
   - Check if email was sent
   - Check delivery status

4. **Wait 1-2 Minutes**
   - Emails can be delayed
   - Check again after waiting

---

## 🎯 What This Tests

✅ **Supabase SMTP Configuration:**
- Verifies SMTP settings in Dashboard are correct
- Tests if emails can be sent via Supabase's email system
- Confirms email templates are working

✅ **Brevo API Configuration:**
- Tests if Brevo API key is set correctly
- Verifies Brevo sender email is configured
- Confirms Brevo can send emails

---

## 📝 Notes

- **Test User Cleanup**: The function automatically deletes test users after sending emails
- **Rate Limits**: Be mindful of email sending limits (Brevo free tier: 300/day)
- **Spam**: Test emails may go to spam folder initially
- **Verification Emails**: If using Supabase SMTP method, you'll receive a verification email (this is expected)

---

## 🔄 Alternative: Use Supabase Dashboard Test Email

The easiest way to test Supabase SMTP is directly in the Dashboard:

1. Go to **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**
2. Click **"Send Test Email"**
3. Enter your email address
4. Click **"Send"**
5. Check your inbox

This tests the SMTP configuration directly without needing the Edge Function.

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Function returns success response (200)
- ✅ Email received in inbox (or spam folder)
- ✅ Email content matches what you sent
- ✅ No errors in function logs

---

## 🆘 Need Help?

If the test fails:
1. Check function logs for detailed error messages
2. Verify SMTP settings in Supabase Dashboard
3. Check Brevo configuration (if using fallback)
4. Ensure email address is valid and accessible
5. Check spam folder

---

**Ready to test?** Deploy the function and send a test email! 🚀

