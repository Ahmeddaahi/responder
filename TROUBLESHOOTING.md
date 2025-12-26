# Troubleshooting Guide

## Telegram Bot Not Responding - Rate Limit Error

### Error Message
```
AI chat error: { error: "Rate limit exceeded. Please try again later." }
```

### Common Causes

1. **Missing OpenRouter API Key** (Most Common)
   - The `OPENROUTER_API_KEY` environment variable is not configured in Supabase Edge Functions
   - This is the most likely cause for new deployments

2. **Invalid API Key**
   - The API key is incorrect or has been revoked
   - Check if the key is valid in OpenRouter dashboard

3. **OpenRouter Credits Exhausted**
   - Your OpenRouter account has run out of credits
   - Check your OpenRouter dashboard for credit balance

4. **API Key Not Set in Production**
   - The API key might be set locally but not in the Supabase production environment

### Solution Steps

#### Step 1: Get an OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to API Keys section
4. Click "Create API Key"
5. Copy the API key (it starts with `sk-or...`)

#### Step 2: Add Credits to OpenRouter Account

1. Go to OpenRouter dashboard
2. Navigate to Credits section
3. Add credits to your account (recommended: $5-10 for testing)
4. OpenRouter uses pay-as-you-go pricing

#### Step 3: Add API Key to Supabase Edge Functions

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings** → **Secrets**
3. Click **Add Secret**
4. Set the name to: `OPENROUTER_API_KEY`
5. Paste your API key as the value
6. Click **Save**

#### Step 3: Verify Configuration

1. After adding the secret, the Edge Function will automatically restart
2. Wait a few minutes for the changes to propagate
3. Test your Telegram bot by sending a message

#### Step 4: Check Logs

1. Go to **Edge Functions** → **Logs**
2. Look for the `ai-chat` function logs
3. Check for any error messages related to the API key

### Error Types and Solutions

#### Error: "Rate limit exceeded. Please try again later."
- **Cause**: Gemini API rate limit or missing/invalid API key
- **Solution**: 
  - Verify API key is set correctly
  - Check Google Cloud Console for quota limits
  - Wait a few minutes and try again

#### Error: "Invalid API key or quota exceeded."
- **Cause**: API key is invalid or credits are exhausted
- **Solution**:
  - Verify the API key in OpenRouter dashboard
  - Check your OpenRouter account credits and billing status
  - Add credits to your account if needed
  - Generate a new API key if needed

#### Error: "AI service is not configured. Please contact support."
- **Cause**: `OPENROUTER_API_KEY` environment variable is missing
- **Solution**: Add the API key to Supabase Edge Function secrets (see Step 3 above)

### Testing the Fix

1. Send a test message to your Telegram bot
2. The bot should respond with an AI-generated message
3. If it still fails, check the Supabase logs for detailed error messages

### Additional Notes

- The API key must be set in the **Supabase Edge Functions** secrets, not in your local `.env` file
- Edge Functions use environment variables from the Supabase dashboard, not from your project's `.env` file
- After adding/changing secrets, wait 1-2 minutes for the functions to restart
- OpenRouter uses pay-as-you-go pricing - monitor your credit balance in OpenRouter dashboard

### Getting Help

If you continue to experience issues:

1. Check the Supabase Edge Function logs for detailed error messages
2. Verify your API key is active in OpenRouter dashboard
3. Check your OpenRouter account credits and billing status
4. Ensure you're using the correct Supabase project (production vs development)

### Recent Improvements

The error handling has been improved to:
- Log detailed error messages from the OpenRouter API
- Provide more specific error messages to users
- Distinguish between different error types (rate limit, API key, configuration)
- Help diagnose configuration issues faster

---

## OpenRouter API - "No Response" Issue

### Problem
Your bot is not responding, which suggests the API is not being called or credits are exhausted.

### Possible Causes

1. **API Key Not Set in Supabase**
   - The `OPENROUTER_API_KEY` secret is missing or incorrectly named
   - The secret was added but the function hasn't restarted

2. **Function Not Being Called**
   - The webhook is not configured correctly
   - Messages are not reaching the `ai-chat` function
   - An error occurs before the API call

3. **API Key Not Valid**
   - The API key is incorrect or invalid
   - The API key has restrictions that prevent usage
   - The API key was revoked or deleted

4. **Credits Exhausted**
   - Your OpenRouter account has run out of credits
   - Check your OpenRouter dashboard for credit balance

### Debugging Steps

#### Step 1: Verify API Key in Supabase

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. Look for `OPENROUTER_API_KEY`
3. Verify it starts with `sk-or`
4. Check there are no extra spaces or quotes
5. **Important**: After adding/updating, wait 1-2 minutes for functions to restart

#### Step 2: Check Function Logs

1. Go to **Edge Functions** → **Logs** → **ai-chat**
2. Send a test message to your bot
3. Look for these log messages:

**✅ If API key is found:**
```
✅ OpenRouter API key found: { keyPreview: 'sk-or...***', keyLength: 51 }
🚀 Calling OpenRouter API: { model: 'google/gemini-2.5-flash-lite', ... }
📡 OpenRouter API response: { status: 200, ... }
```

**❌ If API key is missing:**
```
❌ OPENROUTER_API_KEY is not configured in Edge Function secrets
```

#### Step 3: Test API Key Directly

Use curl to test your API key:

```bash
curl "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-2.5-flash-lite",
    "messages": [{
      "role": "user",
      "content": "Hello"
    }]
  }'
```

If this works, your API key is valid. If it doesn't, the key might be invalid or credits exhausted.

#### Step 4: Verify Function is Called

Check logs for:
- `📥 Received AI chat request` - Function was called
- `📋 Request data: { hasUserId: true, hasMessage: true }` - Request has data
- `🔌 Supabase client initialized` - Function is processing

If these don't appear, the function might not be getting called.

### Solutions

1. **If API key is missing:**
   - Add `OPENROUTER_API_KEY` to Supabase Edge Function secrets
   - Wait 1-2 minutes for function to restart
   - Test again

2. **If API key is invalid:**
   - Generate a new API key in OpenRouter dashboard
   - Update the secret in Supabase
   - Wait for function to restart

3. **If credits are exhausted:**
   - Add credits to your OpenRouter account
   - Check credit balance in OpenRouter dashboard
   - Monitor usage in OpenRouter dashboard

3. **If function is not being called:**
   - Check webhook configuration
   - Verify Telegram bot token
   - Check if agent is active in database

4. **If function fails before API call:**
   - Check for errors in logs
   - Verify user has not exceeded message limit
   - Check database connections

### Testing Checklist

- [ ] API key exists in Supabase Edge Function secrets
- [ ] API key starts with `AIza`
- [ ] Function logs show "✅ Gemini API key found"
- [ ] Function logs show "🚀 Calling Gemini API"
- [ ] Direct API test (curl) works
- [ ] Function is being called (logs show request received)
- [ ] No errors before API call

See `GEMINI_API_DEBUG.md` for detailed debugging guide.

---

## Gemini API Quota Exhausted Error

### Error Message
```
You exceeded your current quota, please check your plan and billing details.
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_*
```

### Cause

The Google Gemini API free tier has limited quotas:
- **Requests per minute**: Very limited (often 2-15 requests/minute)
- **Tokens per minute**: Limited input/output tokens
- **Daily limits**: Overall usage caps

When these quotas are exceeded, you'll get a 429 error with `RESOURCE_EXHAUSTED` status.

### Solutions

#### Option 1: Wait for Quota Reset (Recommended for Testing)

1. **Check the retry delay** in the error message (e.g., "Please retry in 27s")
2. **Wait for the quota to reset** (usually resets per minute or hour)
3. **Reduce your request rate** to stay within limits

#### Option 2: Upgrade to Paid Plan

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Billing** → **APIs & Services** → **Quotas**
3. Enable billing for your project
4. This increases your quotas significantly

#### Option 3: Optimize API Usage

The code has been optimized to:
- **Reduce token usage**: Shorter prompts, limited context (5 items max, 500 chars each)
- **Lower max output tokens**: Reduced from 1024 to 512
- **Use more efficient model**: Switched to `gemini-1.5-flash-latest` (better quotas)
- **Implement retry logic**: Automatic retries with exponential backoff

#### Option 4: Use Multiple API Keys (Production)

For production use, consider:
1. Creating multiple Google Cloud projects
2. Using different API keys for different users/regions
3. Implementing API key rotation

### Recent Fixes

The AI chat function now includes:
- ✅ **Automatic retry logic** with exponential backoff (up to 2 retries)
- ✅ **Retry delay parsing** from Gemini API error responses
- ✅ **Model optimization**: Using `gemini-1.5-flash-latest` (more stable, better quotas)
- ✅ **Token usage optimization**: Reduced prompt size and output tokens
- ✅ **Better error messages**: Distinguishes between quota exhaustion and rate limits
- ✅ **Context limiting**: Limits knowledge base items to 5 to save tokens

### Monitoring Quota Usage

1. **Google Cloud Console**:
   - Go to [API & Services](https://console.cloud.google.com/apis/dashboard)
   - Select "Generative Language API"
   - View quotas and usage

2. **Google AI Studio**:
   - Visit [https://ai.dev/usage](https://ai.dev/usage)
   - Check your rate limit usage
   - Monitor token consumption

### Best Practices

1. **Cache responses** when possible (same questions = same answers)
2. **Batch requests** if processing multiple messages
3. **Implement rate limiting** on your side to stay within quotas
4. **Monitor usage** regularly to avoid surprises
5. **Use paid tier** for production applications

### Temporary Workaround

If you're hitting quota limits frequently:
1. Implement a **queue system** for messages
2. **Throttle requests** to stay within limits
3. **Show users a message** when the service is temporarily unavailable
4. **Consider alternative models** or API providers for fallback

---

## Telegram Bot - "Agent not found: Multiple rows" Error

### Error Message
```
Agent not found: {
  code: "PGRST116",
  details: "The result contains 2 rows",
  hint: null,
  message: "Cannot coerce the result to a single JSON object"
}
```

### Cause

This error occurs when the Telegram webhook function finds multiple agents matching the bot token ID. This can happen if:

1. **Duplicate Agents in Database**: Multiple agent records exist for the same or similar bot tokens
2. **Multiple Users with Similar Token IDs**: Though unlikely, multiple users might have bot tokens that share a common prefix
3. **Database Constraint Not Applied**: The unique constraint on `(user_id, platform)` might not be properly enforced

### Solution Steps

#### Step 1: Check for Duplicate Agents

Run this SQL query in your Supabase SQL Editor to find duplicate agents:

```sql
-- Find duplicate Telegram agents
SELECT 
  user_id, 
  platform, 
  bot_token, 
  is_active, 
  webhook_url,
  COUNT(*) as count
FROM public.agents
WHERE platform = 'telegram'
GROUP BY user_id, platform, bot_token, is_active, webhook_url
HAVING COUNT(*) > 1;
```

#### Step 2: Clean Up Duplicate Agents

If duplicates are found, you can remove them by keeping only the most recent one:

```sql
-- Remove duplicate Telegram agents (keeps the most recent one)
DELETE FROM public.agents
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, platform 
             ORDER BY created_at DESC
           ) as rn
    FROM public.agents
    WHERE platform = 'telegram'
  ) t
  WHERE rn > 1
);
```

#### Step 3: Verify Unique Constraint

Ensure the unique constraint exists:

```sql
-- Check if the constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'agents'
  AND constraint_type = 'UNIQUE';

-- If it doesn't exist, add it:
ALTER TABLE public.agents 
ADD CONSTRAINT agents_user_id_platform_key 
UNIQUE (user_id, platform);
```

#### Step 4: Re-register Your Webhook

After cleaning up duplicates:

1. Go to your app's Settings page
2. Re-save your Telegram bot token
3. This will update the webhook URL and agent record

#### Step 5: Check Webhook URL

Verify that your webhook URL is correct:

1. In your app Settings, check the displayed webhook URL
2. The URL should be: `https://your-project.supabase.co/functions/v1/telegram-webhook/{tokenId}`
3. Make sure the `tokenId` matches the first part of your bot token (before the colon)

### Prevention

To prevent this issue in the future:

1. **Use the App Settings**: Always configure bots through the app's Settings page, which uses `upsert` to prevent duplicates
2. **Run Migrations**: Ensure all database migrations are applied, especially `20251109000000_fix_agents_unique_constraint.sql`
3. **Monitor Logs**: Check Supabase logs regularly for warnings about multiple agents

### Recent Fixes

The webhook function has been updated to:
- Handle multiple matching agents gracefully
- Filter to exact token ID matches
- Log detailed information about matched agents
- Use the first exact match when multiple agents are found
- Provide better error messages for debugging

### Testing

After applying the fix:

1. Send a test message to your Telegram bot
2. Check the Supabase Edge Function logs for the `telegram-webhook` function
3. You should see a log message: "Found agent for user: {userId}"
4. The bot should respond normally
