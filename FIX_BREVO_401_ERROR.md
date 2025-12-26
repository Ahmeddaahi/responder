# Fix Brevo 401 Unauthorized Error

## 🔴 Error You're Seeing

```
Brevo API error: 401 {"message":"We have detected...","code":"unauthorized"}
```

This means the Brevo API key is either:
1. ❌ Not set in Edge Function secrets
2. ❌ Invalid or expired
3. ❌ IP restrictions enabled in Brevo
4. ❌ API key doesn't have email permissions

---

## ✅ Solution Steps

### Step 1: Check Brevo API Key in Supabase

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. Look for `BREVO_API_KEY`
3. **Is it there?**
   - ✅ **Yes** → Go to Step 2
   - ❌ **No** → Add it (see below)

**To add it:**
1. Go to **Brevo Dashboard** → **Settings** → **SMTP & API** → **API Keys**
2. Copy your API key (or generate a new one)
3. Go back to **Supabase** → **Edge Functions** → **Settings** → **Secrets**
4. Click **"Add Secret"**
5. Name: `BREVO_API_KEY`
6. Value: Your Brevo API key
7. Click **"Save"**
8. **Wait 1-2 minutes** for functions to restart

---

### Step 2: Check IP Restrictions in Brevo

The error mentions "authorised_ips" - this means IP restrictions might be enabled.

1. Go to **Brevo Dashboard** → **Settings** → **Security** → **Authorized IPs**
2. **Check if IP restrictions are enabled:**
   - ✅ **If enabled**: You need to add Supabase's IP addresses
   - ❌ **If disabled**: This is not the issue

**To fix IP restrictions:**

**Option A: Disable IP Restrictions (Easier)**
1. Go to **Brevo Dashboard** → **Settings** → **Security** → **Authorized IPs**
2. **Disable** IP restrictions (if enabled)
3. Save changes

**Option B: Add Supabase IPs (More Secure)**
- Supabase Edge Functions use dynamic IPs
- You'll need to allow all IPs or disable restrictions
- For testing, it's easier to disable restrictions

---

### Step 3: Verify API Key Permissions

1. Go to **Brevo Dashboard** → **Settings** → **SMTP & API** → **API Keys**
2. Find your API key
3. Check its **permissions**:
   - ✅ Must have **"Send emails"** permission
   - ✅ Must have **"Account information"** permission (optional but recommended)

**To regenerate API key:**
1. Delete the old API key
2. Click **"Generate API Key"**
3. Select **"Full Access"** or at minimum:
   - ✅ Send emails
   - ✅ Account information
4. Copy the new key
5. Update it in **Supabase** → **Edge Functions** → **Secrets** → `BREVO_API_KEY`

---

### Step 4: Test Again

After fixing the above:

1. **Wait 1-2 minutes** for Edge Functions to restart
2. Run the test again:
   ```javascript
   fetch('https://ilcxoakgntprququdgok.supabase.co/functions/v1/test-email', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       to: 'ahmedzcy539@gmail.com'
     })
   })
   .then(res => res.json())
   .then(data => console.log('Result:', data))
   .catch(err => console.error('Error:', err));
   ```

---

## 🎯 Most Likely Fix

**90% of the time, it's one of these:**

1. **BREVO_API_KEY not set in Supabase** → Add it to Edge Function secrets
2. **IP restrictions enabled** → Disable them in Brevo Dashboard
3. **Invalid API key** → Regenerate and update

---

## 🔍 Alternative: Test Supabase SMTP Directly

Since the function tried Supabase SMTP first and it failed, let's test that directly:

1. Go to **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**
2. Click **"Send Test Email"**
3. Enter: `ahmedzcy539@gmail.com`
4. Click **"Send"**
5. Check your email

**If this works:**
- ✅ Supabase SMTP is configured correctly
- ✅ The issue is only with Brevo API (for fallback)
- ✅ Your signup emails should work!

**If this fails:**
- ❌ Supabase SMTP is not configured correctly
- ❌ Fix SMTP settings first (see `SUPABASE_EMAIL_SETUP.md`)

---

## 📋 Quick Checklist

- [ ] `BREVO_API_KEY` exists in Supabase Edge Function secrets
- [ ] API key is valid (not expired)
- [ ] IP restrictions disabled in Brevo (or Supabase IPs added)
- [ ] API key has "Send emails" permission
- [ ] Waited 1-2 minutes after updating secrets
- [ ] Tested Supabase SMTP directly in Dashboard

---

## 🆘 Still Not Working?

1. **Check Supabase Function Logs:**
   - Go to **Supabase Dashboard** → **Edge Functions** → **test-email** → **Logs**
   - Look for detailed error messages

2. **Check Brevo Dashboard:**
   - Go to **Statistics** → **Activity**
   - See if API calls are being made
   - Check for error messages

3. **Verify API Key:**
   - Test the API key directly using curl:
   ```bash
   curl -X POST 'https://api.brevo.com/v3/smtp/email' \
     -H 'api-key: YOUR_BREVO_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "sender": {"name": "Test", "email": "your-verified-email@domain.com"},
       "to": [{"email": "ahmedzcy539@gmail.com"}],
       "subject": "Test",
       "htmlContent": "<p>Test</p>"
     }'
   ```

---

## ✅ Priority Fix

**For now, focus on Supabase SMTP** (not Brevo):

1. Test Supabase SMTP directly in Dashboard
2. If that works, your signup emails will work
3. Brevo is only a fallback - not required if Supabase SMTP works

The main goal is to get **signup verification emails working**, which uses Supabase SMTP, not Brevo API.

---

**Start with testing Supabase SMTP in the Dashboard - that's what actually sends signup emails!** 🎯

