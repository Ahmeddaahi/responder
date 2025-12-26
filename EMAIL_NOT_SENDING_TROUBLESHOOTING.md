# Email Not Sending - Troubleshooting Guide

If signup verification emails are not being sent, follow these steps to diagnose and fix the issue.

## 🔍 Quick Diagnosis Checklist

Run through this checklist in order:

- [ ] **Step 1**: Check if SMTP is configured in Supabase
- [ ] **Step 2**: Test SMTP connection
- [ ] **Step 3**: Verify email template syntax
- [ ] **Step 4**: Check Supabase Auth logs
- [ ] **Step 5**: Check Brevo dashboard
- [ ] **Step 6**: Verify sender email is verified
- [ ] **Step 7**: Check daily email limits

---

## Step 1: Verify SMTP Configuration

### Check Supabase SMTP Settings

1. Go to **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**
2. Verify that **"Enable Custom SMTP"** is **ON** (toggle enabled)
3. Check all fields are filled:
   - **Sender email**: Must be a verified email in Brevo
   - **Sender name**: Your app name (e.g., "Reply Ready Bot")
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587` (or `465` for SSL)
   - **Username**: Your Brevo account email
   - **Password**: Your Brevo SMTP password (NOT your account password)

### Common SMTP Configuration Issues

**Issue**: "535 Authentication failed"
- **Solution**: Your SMTP password is incorrect
- **Fix**: Generate a new SMTP password in Brevo and update it in Supabase

**Issue**: "550 Sender not verified"
- **Solution**: Your sender email is not verified in Brevo
- **Fix**: Go to Brevo Dashboard → Settings → Senders → Verify your email

**Issue**: "Connection timeout"
- **Solution**: Wrong SMTP host or port
- **Fix**: Use `smtp-relay.brevo.com` with port `587` (TLS) or `465` (SSL)

---

## Step 2: Test SMTP Connection

1. In Supabase Dashboard → **Settings** → **Auth** → **SMTP Settings**
2. Click **"Send Test Email"** button
3. Enter your email address
4. Click **"Send"**
5. Check your inbox (including spam folder)

**If test email fails:**
- Check the error message
- Verify SMTP credentials again
- Try port `465` with SSL if `587` doesn't work

**If test email succeeds but signup emails don't:**
- The issue is likely with the email template (see Step 3)

---

## Step 3: Verify Email Template Syntax

### Check Template in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Settings** → **Auth** → **Email Templates**
2. Click on **"Confirm signup"** template
3. Verify the template is saved (not empty)

### Common Template Issues

**Issue**: Template variables not working
- **Check**: Ensure `{{ .ConfirmationURL }}` is present (with spaces around the dot)
- **Fix**: Use exact syntax: `{{ .ConfirmationURL }}` (not `{{.ConfirmationURL}}` or `{{ConfirmationURL}}`)

**Issue**: Template has HTML errors
- **Check**: Look for unclosed tags, invalid HTML
- **Fix**: Validate HTML using an online HTML validator

**Issue**: Template not saved
- **Check**: Make sure you clicked "Save" after pasting the template
- **Fix**: Re-paste the template and save again

### Verify Template Variables

Your template MUST include:
- `{{ .ConfirmationURL }}` - The verification link (REQUIRED)
- Optional: `{{ .SiteURL }}` - Your site URL
- Optional: `{{ .Token }}` - OTP code (if using OTP mode)

**Correct syntax:**
```html
<a href="{{ .ConfirmationURL }}">Verify Email</a>
```

**Incorrect syntax:**
```html
<a href="{{.ConfirmationURL}}">Verify Email</a>  <!-- Missing spaces -->
<a href="{{ConfirmationURL}}">Verify Email</a>   <!-- Missing dot -->
```

---

## Step 4: Check Supabase Auth Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for recent signup attempts
3. Check for error messages related to:
   - SMTP connection failures
   - Email sending errors
   - Template rendering errors

### Common Log Errors

**Error**: "Failed to send email"
- **Cause**: SMTP connection issue
- **Fix**: Check SMTP settings (Step 1)

**Error**: "Template render error"
- **Cause**: Invalid template syntax
- **Fix**: Check template syntax (Step 3)

**Error**: "422 Unprocessable Entity"
- **Cause**: Email confirmation enabled but SMTP not configured
- **Fix**: Configure SMTP (Step 1) or disable email confirmation temporarily

---

## Step 5: Check Brevo Dashboard

1. Go to **Brevo Dashboard**: [https://app.brevo.com/](https://app.brevo.com/)
2. Navigate to **Statistics** → **Emails**
3. Check if emails are being sent:
   - **Sent**: Email was sent successfully
   - **Delivered**: Email reached recipient's server
   - **Opened**: Recipient opened the email
   - **Bounced**: Email was rejected
   - **Blocked**: Email was blocked (spam, etc.)

### Brevo Status Meanings

**Status: "Sent" but not "Delivered"**
- Email was sent but may be in spam folder
- Check recipient's spam folder
- May need to improve email deliverability

**Status: "Bounced"**
- Recipient's email server rejected the email
- Check if email address is valid
- May need to verify sender domain

**Status: "Blocked"**
- Email was blocked (spam filter, etc.)
- Check sender reputation
- Verify sender email domain

**No emails showing in Brevo:**
- Emails are not reaching Brevo
- Check SMTP configuration in Supabase
- Verify SMTP credentials are correct

---

## Step 6: Verify Sender Email in Brevo

1. Go to **Brevo Dashboard** → **Settings** → **Senders**
2. Find your sender email address
3. Check status:
   - **✅ Verified** (green checkmark) - Good!
   - **⚠️ Pending** - Check your email and click verification link
   - **❌ Not verified** - Verify the email address

**If sender email is not verified:**
1. Check the email inbox for verification email from Brevo
2. Click the verification link
3. Wait a few minutes for status to update
4. Try sending test email again

---

## Step 7: Check Daily Email Limits

### Brevo Free Tier Limits

- **300 emails per day**
- If you exceed this, emails will stop sending
- Check: Brevo Dashboard → Statistics → Daily usage

### Check Current Usage

1. Go to **Brevo Dashboard** → **Statistics**
2. Check **"Emails sent today"**
3. If you've reached the limit:
   - Wait until tomorrow
   - Upgrade to a paid plan
   - Use a different email service

---

## Step 8: Verify Email Confirmation is Enabled

1. Go to **Supabase Dashboard** → **Settings** → **Auth**
2. Scroll to **"Email Auth"** section
3. Check **"Enable email confirmations"** is **ON**
4. If it's OFF, emails won't be sent (users can sign up without verification)

**Note**: If you disable email confirmation, users can sign up without verifying their email. This is less secure but may be useful for testing.

---

## Step 9: Test the Signup Flow

After fixing the issues above, test the complete flow:

1. Go to your website's signup page
2. Enter a **new email address** (not already registered)
3. Enter a password (at least 6 characters)
4. Click "Sign Up"
5. Check for success message
6. Check your email inbox (including spam folder)
7. Click the verification link
8. You should be redirected and logged in

---

## 🔧 Quick Fixes

### Fix 1: Re-configure SMTP

1. Go to Supabase → Settings → Auth → SMTP Settings
2. Disable "Enable Custom SMTP"
3. Save
4. Re-enable "Enable Custom SMTP"
5. Re-enter all SMTP credentials
6. Save
7. Send test email

### Fix 2: Reset Email Template

1. Go to Supabase → Settings → Auth → Email Templates
2. Click "Confirm signup"
3. Click "Reset to default" (if available)
4. Or re-paste the template from `supabase/email-templates/signup-verification.html`
5. Make sure `{{ .ConfirmationURL }}` is present
6. Save

### Fix 3: Verify Brevo Sender

1. Go to Brevo Dashboard → Settings → Senders
2. If sender is not verified, check email and click verification link
3. Wait 5-10 minutes
4. Try sending test email again

### Fix 4: Check Browser Console

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try signing up
4. Look for any error messages
5. Common errors:
   - `422` - SMTP not configured
   - `Email already registered` - User already exists
   - Network errors - Check internet connection

---

## 📋 Complete Checklist

Use this checklist to ensure everything is configured correctly:

### Supabase Configuration
- [ ] SMTP is enabled in Supabase
- [ ] SMTP host: `smtp-relay.brevo.com`
- [ ] SMTP port: `587` (or `465`)
- [ ] SMTP username: Your Brevo email
- [ ] SMTP password: Brevo SMTP password (not account password)
- [ ] Sender email: Verified email in Brevo
- [ ] Sender name: Your app name
- [ ] Test email sent successfully

### Email Template
- [ ] Template is saved in Supabase
- [ ] Template includes `{{ .ConfirmationURL }}`
- [ ] Template syntax is correct (spaces around dot)
- [ ] HTML is valid (no syntax errors)
- [ ] Subject line is set

### Brevo Configuration
- [ ] Brevo account is active
- [ ] Sender email is verified in Brevo
- [ ] Daily email limit not exceeded (300/day for free tier)
- [ ] Emails showing in Brevo statistics

### Testing
- [ ] Test email sent successfully from Supabase
- [ ] Test email received in inbox
- [ ] Signup flow tested with new email
- [ ] Verification email received
- [ ] Verification link works
- [ ] User can log in after verification

---

## 🆘 Still Not Working?

If emails are still not sending after following all steps:

1. **Check Supabase Status**: [https://status.supabase.com/](https://status.supabase.com/)
2. **Check Brevo Status**: [https://status.brevo.com/](https://status.brevo.com/)
3. **Contact Support**:
   - Supabase: [https://supabase.com/support](https://supabase.com/support)
   - Brevo: [https://help.brevo.com/](https://help.brevo.com/)

### Information to Provide Support

When contacting support, provide:
- Error messages from Supabase Auth logs
- Screenshot of SMTP settings (hide passwords)
- Brevo dashboard statistics
- Steps you've already tried
- Browser console errors (if any)

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Test email sent successfully from Supabase
- ✅ Test email received in inbox
- ✅ Signup creates account successfully
- ✅ Verification email received within 1-2 minutes
- ✅ Verification link redirects to your app
- ✅ User is automatically logged in after verification

---

## 📚 Related Documentation

- **SMTP Setup**: See `SUPABASE_EMAIL_SETUP.md`
- **Email Template Setup**: See `SUPABASE_SIGNUP_EMAIL_SETUP.md`
- **Supabase Auth Docs**: [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **Brevo SMTP Docs**: [https://developers.brevo.com/docs/send-emails-with-smtp-relay](https://developers.brevo.com/docs/send-emails-with-smtp-relay)

