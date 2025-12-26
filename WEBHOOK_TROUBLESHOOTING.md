# WhatsApp Webhook Troubleshooting Guide

If Meta webhook verification is failing and Supabase logs are empty, follow these steps:

## Step 1: Deploy the Updated Function

**IMPORTANT**: You must deploy the function for changes to take effect.

### Using Supabase CLI:
```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

### Or via Supabase Dashboard:
1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on `whatsapp-webhook`
3. Click **Edit** or **Deploy**
4. Copy the code from `supabase/functions/whatsapp-webhook/index.ts`
5. Paste and click **Deploy**

**Wait 1-2 minutes** for the function to deploy.

---

## Step 2: Test the Endpoint Manually

Before configuring in Meta, test if the endpoint is accessible:

### Test 1: Health Check
Open this URL in your browser (replace `your-project-id` with your actual Supabase project ID):

```
https://your-project-id.supabase.co/functions/v1/whatsapp-webhook
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "WhatsApp webhook endpoint is accessible",
  "verifyToken": "***xxxx",
  "timestamp": "2025-..."
}
```

**If this doesn't work:**
- Check if the function is deployed
- Verify your Supabase project URL is correct
- Check Supabase Dashboard → Edge Functions to see if `whatsapp-webhook` exists

### Test 2: Check Supabase Logs

After visiting the URL above:
1. Go to **Supabase Dashboard** → **Edge Functions** → **Logs** → **whatsapp-webhook**
2. You should see:
   - `🌐 Incoming request: { method: 'GET', ... }`
   - `💚 Health check request received`

**If logs are still empty:**
- The function might not be deployed
- Check the function exists in Edge Functions list
- Try redeploying

---

## Step 3: Set the Verify Token in Supabase

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. Add or edit the secret:
   - **Name**: `WHATSAPP_VERIFY_TOKEN`
   - **Value**: Choose a secure token (e.g., `my_secure_token_12345`)
3. **Save**

**Important**: Remember this token - you'll need it for Meta!

**Wait 1-2 minutes** for functions to restart.

---

## Step 4: Configure Meta Webhook

1. Go to **Meta for Developers** → Your App → **WhatsApp** → **Configuration**
2. Scroll to **Webhook** section
3. Click **Edit**
4. Enter:
   - **Callback URL**: `https://your-project-id.supabase.co/functions/v1/whatsapp-webhook`
     - Replace `your-project-id` with your actual Supabase project ID
     - Get it from: Supabase Dashboard → Settings → General → Reference ID
   - **Verify Token**: **EXACTLY** match what you set in Supabase secrets
     - If Supabase has: `my_secure_token_12345`
     - Meta must have: `my_secure_token_12345` (exact match, case-sensitive)
5. Click **Verify and Save**

---

## Step 5: Check Logs During Verification

While clicking "Verify and Save" in Meta:

1. Open **Supabase Dashboard** → **Edge Functions** → **Logs** → **whatsapp-webhook**
2. Click **Refresh** or keep it open
3. Click **Verify and Save** in Meta
4. **Immediately check the logs** - you should see:
   - `🌐 Incoming request: { method: 'GET', ... }`
   - `📥 GET request received - processing webhook verification`
   - `🔍 Webhook verification request received`
   - Either `✅ Webhook verified successfully` or `❌ Webhook verification failed`

---

## Common Issues and Solutions

### Issue 1: Logs Are Still Empty After Meta Verification

**Possible causes:**
1. **Wrong URL format** - Make sure it's exactly:
   ```
   https://your-project-id.supabase.co/functions/v1/whatsapp-webhook
   ```
   - No trailing slash
   - Use `https://` not `http://`
   - Replace `your-project-id` with actual project reference ID

2. **Function not deployed** - Check Supabase Dashboard → Edge Functions → does `whatsapp-webhook` exist?

3. **Function is private** - Check `supabase/config.toml` has:
   ```toml
   [functions.whatsapp-webhook]
   verify_jwt = false
   ```
   Then redeploy.

### Issue 2: Verification Fails with "Token Mismatch"

**Solution:**
1. Go to Supabase Dashboard → Edge Functions → Settings → Secrets
2. Check what `WHATSAPP_VERIFY_TOKEN` is set to
3. Copy it exactly (case-sensitive, no spaces)
4. Go to Meta → Webhook → Edit
5. Paste the exact same token in "Verify Token"
6. Click "Verify and Save" again

### Issue 3: "Mode is not 'subscribe'"

This usually means Meta isn't sending the verification request properly. Try:
1. Remove the webhook in Meta
2. Wait 30 seconds
3. Add it again with correct URL and token
4. Click "Verify and Save"

### Issue 4: Can't Access Health Check URL in Browser

**Check:**
1. Is the function deployed? (Supabase Dashboard → Edge Functions)
2. Is the URL correct? (should be `/functions/v1/whatsapp-webhook`)
3. Is your Supabase project active? (Check project status)

---

## Debug Checklist

Before contacting support, verify:

- [ ] Function is deployed (check Supabase Dashboard → Edge Functions)
- [ ] Health check URL works in browser (`/functions/v1/whatsapp-webhook`)
- [ ] Logs show health check request when visiting URL
- [ ] `WHATSAPP_VERIFY_TOKEN` is set in Supabase secrets
- [ ] Webhook URL in Meta is exactly: `https://your-project-id.supabase.co/functions/v1/whatsapp-webhook`
- [ ] Verify token in Meta matches Supabase secret exactly (case-sensitive)
- [ ] `supabase/config.toml` has `verify_jwt = false` for whatsapp-webhook
- [ ] Waited 1-2 minutes after deploying/changing secrets
- [ ] Checked logs immediately after clicking "Verify and Save" in Meta

---

## Getting Your Supabase Project ID

1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Look for **Reference ID** - this is your project ID
3. Your webhook URL will be: `https://[REFERENCE_ID].supabase.co/functions/v1/whatsapp-webhook`

---

## Still Not Working?

If logs are still empty after all steps:

1. **Check function deployment status:**
   ```bash
   supabase functions list
   ```
   Make sure `whatsapp-webhook` is listed and active.

2. **Check if function responds:**
   - Visit the health check URL in browser
   - If it doesn't respond, the function isn't deployed correctly
   - Redeploy: `supabase functions deploy whatsapp-webhook --no-verify-jwt`

3. **Check Meta App Settings:**
   - Is the app in Development mode? (Should be fine)
   - Is WhatsApp product added to the app?
   - Are you using the correct app?

4. **Try different browser/incognito:**
   - Sometimes browser caching can cause issues
   - Try the Meta webhook setup in incognito mode

