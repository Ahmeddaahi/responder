# Deployment Guide - Edge Functions

## 📦 Deploying Updated Functions

After making changes to Edge Functions, you need to deploy them to Supabase for the changes to take effect.

## 🚀 Method 1: Using Supabase CLI (Recommended)

### Prerequisites
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase Dashboard → Settings → General)

### Deploy Specific Function

Deploy only the `ai-chat` function:
```bash
supabase functions deploy ai-chat
```

### Deploy All Functions

Deploy all Edge Functions:
```bash
supabase functions deploy
```

### Deploy with Secrets

Secrets are managed separately in the Supabase Dashboard. After deploying, make sure your secrets are set:
- Go to **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
- Verify `OPENROUTER_API_KEY` is set

---

## 🖥️ Method 2: Using Supabase Dashboard (Manual)

### Step 1: Prepare the Function

1. Open `supabase/functions/ai-chat/index.ts`
2. Copy the entire file content

### Step 2: Deploy via Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Find `ai-chat` function (or create it if it doesn't exist)
3. Click on the function
4. Click **Edit** or **Deploy**
5. Paste the updated code
6. Click **Deploy** or **Save**

### Step 3: Verify Deployment

1. Wait 1-2 minutes for the function to deploy
2. Check the function logs to verify it's running
3. Test by sending a message to your bot

---

## 🔍 Method 3: Using Supabase CLI (Quick Deploy)

If you have Supabase CLI installed and linked:

```bash
# Navigate to your project directory
cd /path/to/reply-ready-bot-main

# Deploy the ai-chat function
supabase functions deploy ai-chat --no-verify-jwt

# Or deploy all functions
supabase functions deploy
```

---

## ✅ Verification Steps

After deploying, verify the deployment:

### 1. Check Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **Logs**
2. Select `ai-chat` function
3. Send a test message to your bot
4. Look for the new log messages:
   - `📥 Received AI chat request`
   - `✅ Gemini API key found`
   - `🚀 Calling Gemini API`
   - `📡 Gemini API response`

### 2. Test the Function

1. Send a message to your Telegram bot
2. Check if you get a response
3. Verify the logs show the new logging messages

### 3. Verify API Key

1. Check logs for: `✅ OpenRouter API key found: { keyPreview: 'sk-or...***', ... }`
2. If you see `❌ OPENROUTER_API_KEY is not configured`, add the secret in Dashboard

---

## 🐛 Troubleshooting

### Function Not Deploying

1. **Check CLI is installed:**
   ```bash
   supabase --version
   ```

2. **Check you're logged in:**
   ```bash
   supabase projects list
   ```

3. **Check project is linked:**
   ```bash
   supabase status
   ```

### Function Deployed but Not Working

1. **Check function logs** for errors
2. **Verify secrets are set** in Dashboard
3. **Wait 1-2 minutes** after deployment for function to restart
4. **Check function URL** is correct in webhook configuration

### Changes Not Reflected

1. **Wait 1-2 minutes** after deployment
2. **Clear browser cache** if testing frontend
3. **Check function logs** to see if new code is running
4. **Redeploy** if necessary

---

## 📝 Quick Reference

### Deploy Single Function
```bash
supabase functions deploy ai-chat
```

### Deploy All Functions
```bash
supabase functions deploy
```

### Check Function Status
```bash
supabase functions list
```

### View Function Logs
```bash
supabase functions logs ai-chat
```

### Set Function Secret
```bash
supabase secrets set OPENROUTER_API_KEY=your_key_here
```

---

## 🎯 What to Deploy Now

Since we updated the `ai-chat` function with new logging, you need to deploy:

1. **`ai-chat` function** - Contains the new logging and error handling
2. **`telegram-webhook` function** - Updated error handling (optional, but recommended)
3. **`whatsapp-webhook` function** - Updated error handling (optional, but recommended)

### Minimum Deployment

At minimum, deploy the `ai-chat` function:
```bash
supabase functions deploy ai-chat
```

### Recommended Deployment

Deploy all three functions for complete error handling:
```bash
supabase functions deploy ai-chat telegram-webhook whatsapp-webhook
```

---

## ⚡ After Deployment

1. **Wait 1-2 minutes** for functions to restart
2. **Test your bot** by sending a message
3. **Check logs** to verify new logging is working
4. **Verify API key** is being used (check logs)

---

## 📚 Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Deploying Edge Functions](https://supabase.com/docs/guides/functions/deploy)

