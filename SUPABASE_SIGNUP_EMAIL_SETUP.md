# Supabase Signup/Verification Email Customization Guide

This guide will help you customize the signup/verification email template in Supabase to match the modern design of your password reset email.

## 📋 Prerequisites

- Access to your Supabase project dashboard
- Brevo SMTP already configured (as per `SUPABASE_EMAIL_SETUP.md`)
- Email templates file: `supabase/email-templates/signup-verification.html`

## 🎨 Step-by-Step Instructions

### Step 1: Access Email Templates in Supabase

1. Go to your **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Auth** → **Email Templates**
4. You'll see a list of email templates

### Step 2: Edit the "Confirm signup" Template

1. In the Email Templates section, find and click on **"Confirm signup"**
2. This is the template used when users sign up and need to verify their email

### Step 3: Customize the Subject Line

1. In the **Subject** field, you can customize the email subject
2. Recommended subject: `Verify your email address - Reply Ready Bot`
3. You can use variables like `{{ .SiteURL }}` if needed

### Step 4: Copy the HTML Template

1. Open the file `supabase/email-templates/signup-verification.html` in your code editor
2. Select all the content (Ctrl+A / Cmd+A)
3. Copy it (Ctrl+C / Cmd+C)
4. Go back to Supabase dashboard
5. In the **Body (HTML)** field, paste the template (Ctrl+V / Cmd+V)

### Step 5: Copy the Plain Text Version (Optional but Recommended)

1. Open the file `supabase/email-templates/signup-verification.txt` in your code editor
2. Select all the content and copy it
3. In Supabase dashboard, find the **Body (Plain text)** field
4. Paste the plain text version

**Note**: The plain text version is used by email clients that don't support HTML, ensuring all users can read your emails.

### Step 6: Verify Template Variables

Make sure these variables are present in your template:
- `{{ .ConfirmationURL }}` - The verification link (required)
- `{{ .SiteURL }}` - Your site URL (optional, for fallback)
- `{{ .Token }}` - OTP code (optional, if using OTP mode)

The provided template includes `{{ .ConfirmationURL }}` which is the primary verification link.

### Step 7: Save Your Changes

1. Click the **"Save"** button at the bottom of the page
2. Supabase will validate the template
3. If there are any errors, fix them and save again

### Step 8: Test the Email Template

1. Go to your website's signup page
2. Enter a test email address (use your own email for testing)
3. Submit the signup form
4. Check your email inbox (including spam folder)
5. You should receive the customized verification email
6. Click the "Verify Email Address" button
7. You should be redirected back to your app and logged in

## 🎨 Template Features

The customized template includes:

- **Modern Design**: Gradient header matching your password reset email
- **Prominent Button**: Large, clickable "Verify Email Address" button
- **Fallback Link**: Plain text link if button doesn't work
- **Mobile Responsive**: Looks great on all devices
- **Security Note**: Clear information about link expiration
- **Professional Footer**: Support information and branding

## 🔧 Customization Options

You can further customize the template by:

1. **Changing Colors**: 
   - Header gradient: `#667eea` to `#764ba2` (lines 75-76 in HTML)
   - Button colors: Same gradient (line 100)
   - Adjust these hex codes to match your brand

2. **Changing Text**:
   - Greeting message (line 181)
   - Main message (line 183)
   - Footer signature (line 203)

3. **Adding Logo** (if desired):
   - Add an `<img>` tag in the header section
   - Use a hosted image URL (not local files)

## 📝 Template Variables Reference

Supabase provides these template variables:

- `{{ .ConfirmationURL }}` - The verification link users click
- `{{ .SiteURL }}` - Your application's site URL
- `{{ .Token }}` - 6-digit OTP code (if using OTP authentication)
- `{{ .Email }}` - User's email address
- `{{ .Data }}` - Additional user metadata

## 🐛 Troubleshooting

### Email not received?

1. **Check Spam Folder**: Brevo emails sometimes go to spam initially
2. **Check Brevo Dashboard**: Go to Brevo → Statistics → Emails
3. **Verify SMTP Settings**: Ensure Brevo SMTP is properly configured
4. **Check Supabase Logs**: Go to Supabase Dashboard → Logs → Auth Logs

### Template not working?

1. **Check for Syntax Errors**: Make sure all `{{ }}` variables are correct
2. **Verify Variables**: Ensure `{{ .ConfirmationURL }}` is present
3. **Test in Preview**: Supabase shows a preview of your template
4. **Check HTML**: Ensure HTML is valid (no unclosed tags)

### Button not clickable?

1. **Check Link**: Ensure `{{ .ConfirmationURL }}` is in the `href` attribute
2. **Test in Different Clients**: Try Gmail, Outlook, Apple Mail
3. **Check Fallback Link**: Users can always use the plain text link below

### Redirect not working?

1. **Check Redirect URL**: Verify `emailRedirectTo` in `src/pages/Auth.tsx` (line 224)
2. **Current Setting**: `https://responder-eight.vercel.app/auth`
3. **Update if Needed**: Change to your production URL

## ✅ Checklist

- [ ] Opened Supabase Dashboard → Settings → Auth → Email Templates
- [ ] Found and opened "Confirm signup" template
- [ ] Customized subject line
- [ ] Copied HTML template from `signup-verification.html`
- [ ] Pasted HTML into "Body (HTML)" field
- [ ] Copied plain text from `signup-verification.txt`
- [ ] Pasted plain text into "Body (Plain text)" field
- [ ] Verified `{{ .ConfirmationURL }}` is present
- [ ] Saved changes
- [ ] Tested signup flow
- [ ] Received verification email
- [ ] Clicked verification button
- [ ] Successfully verified and logged in

## 📚 Additional Resources

- **Supabase Email Templates Docs**: [https://supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- **Brevo SMTP Setup**: See `SUPABASE_EMAIL_SETUP.md`
- **Password Reset Email**: Already customized in `supabase/functions/password-reset/index.ts`

## 🎉 Success!

Once configured, your signup flow will work like this:

1. User signs up → Supabase sends customized verification email via Brevo
2. User receives beautiful email with "Verify Email Address" button
3. User clicks button → Email verified
4. User is automatically logged in → Redirected to your app

Your signup/verification email now matches the modern design of your password reset email!

