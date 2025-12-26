# Troubleshoot Email Verification Not Sending

## 🔍 Step-by-Step Diagnosis

### Step 1: Verify Supabase SMTP Configuration

1. Go to **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**
2. Check that:
   - ✅ "Enable Custom SMTP" is **ON**
   - ✅ All fields are filled (no empty fields)
   - ✅ Sender email matches your verified Brevo sender
   - ✅ Host is: `smtp-relay.brevo.com`
   - ✅ Port is: `587` (or `465` for SSL)
   - ✅ Username is your Brevo account email
   - ✅ Password is the SMTP password (not account password)

3. **Test the connection:**
   - Click **"Send Test Email"**
   - Enter your email address
   - Click **"Send"**
   - **Did you receive the test email?**
     - ✅ **Yes** → SMTP is working, problem is elsewhere (go to Step 2)
     - ❌ **No** → SMTP configuration issue (go to Step 1 Fixes below)

---

### Step 1 Fixes: SMTP Not Working

#### Fix 1: Verify Brevo Sender Email

1. Go to **Brevo Dashboard** → **Settings** → **Senders**
2. Check your sender email:
   - Must show **"Verified"** status (green checkmark)
   - If not verified:
     - Check your email inbox
     - Click the verification link
     - Wait a few minutes and refresh

#### Fix 2: Regenerate SMTP Password

1. Go to **Brevo Dashboard** → **Settings** → **SMTP & API** → **SMTP**
2. Delete the old SMTP key (if exists)
3. Click **"Generate SMTP Password"** or **"Create SMTP Key"**
4. Copy the new password
5. Update it in **Supabase** → **Settings** → **Auth** → **SMTP Settings**
6. Save and test again

#### Fix 3: Try Different Port

- If port **587** doesn't work, try:
  - Port **465** with SSL
  - Or port **25** (if your server allows it)

#### Fix 4: Check Brevo Account Status

1. Go to **Brevo Dashboard** → **Statistics**
2. Check:
   - Email sending limits (free tier: 300/day)
   - Account status (should be active)
   - Any warnings or errors

---

### Step 2: Check Supabase Auth Settings

1. Go to **Supabase Dashboard** → **Settings** → **Auth**
2. Verify:
   - ✅ **"Enable email confirmations"** is **ON**
   - ✅ **"Enable email change confirmations"** is **ON** (optional)
   - ✅ **"Secure email change"** is configured (optional)

3. Check **"Site URL"**:
   - Should be: `https://responder-eight.vercel.app` (or your domain)
   - This is used for email redirect links

4. Check **"Redirect URLs"**:
   - Should include: `https://responder-eight.vercel.app/auth`
   - Add it if missing

---

### Step 3: Check Email Templates

1. Go to **Supabase Dashboard** → **Settings** → **Auth** → **Email Templates**
2. Click on **"Confirm signup"** template
3. Verify:
   - ✅ Template is enabled
   - ✅ Subject line is set
   - ✅ Body contains `{{ .ConfirmationURL }}` or similar
   - ✅ Redirect URL is correct

4. **Test the template:**
   - Click **"Send test email"**
   - Enter your email
   - Check if you receive it

---

### Step 4: Check Supabase Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for:
   - Signup attempts
   - Email sending errors
   - SMTP connection errors

3. **Common error messages:**
   - `535 Authentication failed` → Wrong SMTP password
   - `550 Sender not verified` → Sender email not verified in Brevo
   - `Connection timeout` → Wrong host/port
   - `Rate limit exceeded` → Too many emails sent

---

### Step 5: Check Brevo Dashboard

1. Go to **Brevo Dashboard** → **Statistics** → **Emails**
2. Check:
   - Are emails being sent?
   - What's the delivery status?
   - Any bounces or failures?

3. Check **"SMTP & API"** → **"Activity"**:
   - See recent SMTP connections
   - Check for authentication failures

---

### Step 6: Test with Different Email

1. Try signing up with a different email address
2. Use a well-known email provider (Gmail, Outlook, etc.)
3. Check both inbox and spam folder
4. Wait 1-2 minutes (emails can be delayed)

---

### Step 7: Check Spam Folder

- Brevo emails sometimes go to spam initially
- Check spam/junk folder
- Mark as "Not Spam" if found
- Add sender to contacts to improve deliverability

---

## 🔧 Common Issues & Solutions

### Issue 1: "Test Email Works, But Signup Emails Don't"

**Possible causes:**
- Email template issue
- Redirect URL not whitelisted
- Rate limiting

**Solutions:**
1. Check email template configuration (Step 3)
2. Verify redirect URLs in Supabase Auth settings
3. Check Brevo sending limits
4. Wait a few minutes and try again

### Issue 2: "SMTP Test Email Fails"

**Possible causes:**
- Wrong SMTP credentials
- Sender not verified
- Network/firewall blocking

**Solutions:**
1. Double-check all SMTP credentials
2. Verify sender email in Brevo
3. Try different port (587 → 465)
4. Check firewall/network settings

### Issue 3: "Emails Sent But Not Received"

**Possible causes:**
- In spam folder
- Email provider blocking
- Wrong email address

**Solutions:**
1. Check spam folder
2. Try different email provider
3. Verify email address is correct
4. Check Brevo delivery status

### Issue 4: "Rate Limit Exceeded"

**Possible causes:**
- Too many signup attempts
- Brevo free tier limit (300/day)

**Solutions:**
1. Wait 24 hours for limit reset
2. Upgrade Brevo plan
3. Reduce signup attempts

---

## 🧪 Manual Test Script

You can test the SMTP connection manually using this curl command:

```bash
curl -X POST 'https://api.brevo.com/v3/smtp/email' \
  -H 'api-key: YOUR_BREVO_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "sender": {
      "name": "Test",
      "email": "your-verified-email@yourdomain.com"
    },
    "to": [
      {
        "email": "test@example.com"
      }
    ],
    "subject": "Test Email",
    "htmlContent": "<p>This is a test email</p>"
  }'
```

If this works, Brevo API is fine. If it fails, check your API key and sender email.

---

## 📋 Diagnostic Checklist

Run through this checklist:

- [ ] Supabase SMTP enabled
- [ ] All SMTP fields filled correctly
- [ ] Brevo sender email verified
- [ ] SMTP test email works
- [ ] Email confirmations enabled in Supabase
- [ ] Site URL configured correctly
- [ ] Redirect URLs whitelisted
- [ ] Email template configured
- [ ] No errors in Supabase Auth logs
- [ ] No errors in Brevo dashboard
- [ ] Not exceeding Brevo limits
- [ ] Checked spam folder
- [ ] Tried different email address
- [ ] Waited 1-2 minutes for delivery

---

## 🆘 Still Not Working?

If you've tried everything above:

1. **Check Supabase Status:**
   - Go to [status.supabase.com](https://status.supabase.com)
   - Check if there are any service issues

2. **Check Brevo Status:**
   - Go to [status.brevo.com](https://status.brevo.com)
   - Check if there are any service issues

3. **Contact Support:**
   - Supabase: [support@supabase.com](mailto:support@supabase.com)
   - Brevo: [support@brevo.com](mailto:support@brevo.com)

4. **Provide Information:**
   - Screenshot of Supabase SMTP settings (hide password)
   - Screenshot of Brevo sender status
   - Error messages from Supabase logs
   - Brevo dashboard activity logs

---

## ✅ Quick Test Steps

1. **Test SMTP in Supabase:**
   - Settings → Auth → SMTP Settings → "Send Test Email"
   - ✅ Works? → Go to step 2
   - ❌ Fails? → Fix SMTP configuration

2. **Test Email Template:**
   - Settings → Auth → Email Templates → "Confirm signup" → "Send test email"
   - ✅ Works? → Go to step 3
   - ❌ Fails? → Check template configuration

3. **Test Signup:**
   - Try signing up with a new email
   - Check inbox and spam folder
   - Wait 1-2 minutes
   - ✅ Works? → Success!
   - ❌ Fails? → Check Supabase Auth logs

---

## 🎯 Most Common Fix

**90% of issues are caused by:**
1. **Sender email not verified in Brevo** → Verify it!
2. **Wrong SMTP password** → Regenerate and update!
3. **Email in spam folder** → Check spam!

Start with these three!

