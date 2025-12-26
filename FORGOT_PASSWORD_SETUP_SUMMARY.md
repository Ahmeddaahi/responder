# Forgot Password System - Setup Summary

## ✅ What Has Been Created

### 1. Database Migration
- **File**: `supabase/migrations/20251212000000_create_password_reset_codes.sql`
- **Table**: `password_reset_codes` - Stores 6-digit codes with expiration (10 minutes)

### 2. Edge Function
- **File**: `supabase/functions/password-reset/index.ts`
- **Actions**:
  - `?action=request-code` - Generates and sends verification code
  - `?action=verify-code` - Verifies the code
  - `?action=reset-password` - Resets the password

### 3. Frontend Pages
- **ForgotPassword.tsx** - User enters email
- **VerifyCode.tsx** - User enters 6-digit code
- **ResetPassword.tsx** - User sets new password

### 4. Routing
- Added routes in `App.tsx`:
  - `/forgot-password`
  - `/verify-code`
  - `/reset-password`

### 5. Auth Page Update
- Added "Forgot Password?" link on login page

---

## 🚀 Quick Setup Steps

### Step 1: Set Up Brevo
Follow the detailed guide in `BREVO_SETUP.md`:
1. Create Brevo account
2. Get API key
3. Verify sender email
4. Add secrets to Supabase Edge Functions

### Step 2: Deploy Edge Function
```bash
supabase functions deploy password-reset
```

### Step 3: Run Database Migration
Execute `supabase/migrations/20251212000000_create_password_reset_codes.sql` in Supabase SQL Editor

### Step 4: Test
1. Go to `/auth`
2. Click "Forgot Password?"
3. Enter email
4. Check email for code
5. Enter code
6. Set new password

---

## 🔐 Security Features

- ✅ 6-digit numeric codes (not guessable)
- ✅ 10-minute expiration
- ✅ Codes deleted after use
- ✅ Codes deleted after successful password reset
- ✅ Doesn't reveal if email exists (security best practice)
- ✅ Password hashing via Supabase Auth
- ✅ Input validation on frontend and backend

---

## 📧 Email Configuration

The system uses Brevo SMTP to send emails. Required environment variables in Supabase Edge Functions:

- `BREVO_API_KEY` (required)
- `BREVO_SENDER_EMAIL` (optional, defaults to `noreply@example.com`)
- `BREVO_SENDER_NAME` (optional, defaults to `Reply Ready Bot`)

---

## 🔄 Flow Diagram

```
User clicks "Forgot Password?"
    ↓
Enter email → /forgot-password
    ↓
Edge Function generates 6-digit code
    ↓
Code saved to database (expires in 10 min)
    ↓
Email sent via Brevo
    ↓
User enters code → /verify-code
    ↓
Code verified
    ↓
User sets new password → /reset-password
    ↓
Password updated, code deleted
    ↓
Redirect to login page
```

---

## 📝 Files Modified/Created

### Created:
- `supabase/migrations/20251212000000_create_password_reset_codes.sql`
- `supabase/functions/password-reset/index.ts`
- `src/pages/ForgotPassword.tsx`
- `src/pages/VerifyCode.tsx`
- `src/pages/ResetPassword.tsx`
- `BREVO_SETUP.md`
- `FORGOT_PASSWORD_SETUP_SUMMARY.md`

### Modified:
- `src/App.tsx` - Added routes
- `src/pages/Auth.tsx` - Added "Forgot Password?" link

---

## 🧪 Testing Checklist

- [ ] User can access forgot password page
- [ ] Email is sent when requesting reset
- [ ] 6-digit code is received in email
- [ ] Code verification works
- [ ] Invalid codes are rejected
- [ ] Expired codes are rejected
- [ ] Password reset works
- [ ] Old codes are deleted after reset
- [ ] User can log in with new password

---

## 🆘 Troubleshooting

### Emails not sending?
- Check Brevo sender is verified
- Check API key is correct
- Check Edge Function logs
- Verify Brevo account limits (300/day on free tier)

### Code not working?
- Check code hasn't expired (10 minutes)
- Check code hasn't been used already
- Verify email matches exactly

### Edge Function errors?
- Check all secrets are set in Supabase
- Verify Edge Function is deployed
- Check Edge Function logs for errors

---

## 📚 Documentation

- **Brevo Setup**: See `BREVO_SETUP.md` for detailed Brevo configuration
- **Supabase Edge Functions**: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **Brevo API Docs**: [https://developers.brevo.com/](https://developers.brevo.com/)

---

## ✨ Next Steps

1. **Follow `BREVO_SETUP.md`** to configure Brevo
2. **Deploy the Edge Function** to Supabase
3. **Run the database migration**
4. **Test the complete flow**
5. **Customize email template** (optional) - Edit the HTML in `password-reset/index.ts`

---

## 🎉 You're Done!

Your forgot password system is ready to use. Users can now reset their passwords securely using email verification codes.

