# Gemini API Debugging Guide

## Problem: "No Usage Data Available" in Google AI Studio

If your Gemini API key shows "No Usage Data Available", it means the API is not being called or the API key is not being used.

## Step-by-Step Debugging

### Step 1: Verify API Key is Set in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings** → **Secrets**
3. Check if `GOOGLE_GEMINI_API_KEY` exists
4. Verify the key value (should start with `AIza...`)
5. **Important**: After adding/updating secrets, wait 1-2 minutes for functions to restart

### Step 2: Check Supabase Edge Function Logs

1. Go to **Edge Functions** → **Logs**
2. Select the `ai-chat` function
3. Look for these log messages:

#### ✅ Good Signs (API Key Found):
```
✅ Gemini API key found: { keyPreview: 'AIza...***', keyLength: 39, keyStartsWith: 'AIza' }
🚀 Calling Gemini API: { model: 'gemini-1.5-flash-latest', attempt: 1, ... }
📡 Gemini API response: { status: 200, statusText: 'OK', duration: '1234ms' }
```

#### ❌ Bad Signs (API Key Missing):
```
❌ GOOGLE_GEMINI_API_KEY is not configured in Edge Function secrets
```

#### ⚠️ Error Signs (API Call Failed):
```
📡 Gemini API response: { status: 429, statusText: 'Too Many Requests', ... }
📡 Gemini API response: { status: 403, statusText: 'Forbidden', ... }
```

### Step 3: Test the API Key Directly

Test your API key using curl or Postman:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, how are you?"
      }]
    }]
  }'
```

**Expected Response (Success):**
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "I'm doing well, thank you for asking!"
      }]
    }
  }]
}
```

**Expected Response (Error):**
```json
{
  "error": {
    "code": 403,
    "message": "API key not valid..."
  }
}
```

### Step 4: Verify the Function is Being Called

1. Send a test message to your Telegram bot
2. Check the logs for:
   - `📥 Received AI chat request`
   - `📋 Request data: { hasUserId: true, hasMessage: true, ... }`
   - `🔌 Supabase client initialized`

If these logs don't appear, the function might not be getting called at all.

### Step 5: Check Webhook Configuration

1. Verify your Telegram webhook is properly configured
2. Check the webhook URL in your Telegram bot settings
3. Ensure the webhook is pointing to: `https://your-project.supabase.co/functions/v1/telegram-webhook/{tokenId}`

## Common Issues and Solutions

### Issue 1: API Key Not Set
**Symptom**: Logs show `❌ GOOGLE_GEMINI_API_KEY is not configured`

**Solution**:
1. Go to Supabase Dashboard → Edge Functions → Settings → Secrets
2. Add secret: `GOOGLE_GEMINI_API_KEY` = `your_api_key_here`
3. Wait 1-2 minutes for function to restart
4. Test again

### Issue 2: Wrong API Key Format
**Symptom**: API returns 403 Forbidden

**Solution**:
1. Verify the API key starts with `AIza`
2. Ensure there are no extra spaces or quotes
3. Copy the key directly from Google AI Studio
4. Update the secret in Supabase

### Issue 3: API Key Not Activated
**Symptom**: API returns 403 or "API key not valid"

**Solution**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Verify the API key is active
3. Check if there are any restrictions on the key
4. Create a new API key if needed

### Issue 4: Function Not Being Called
**Symptom**: No logs appear when sending messages

**Solution**:
1. Check webhook configuration
2. Verify the Telegram bot token is correct
3. Check if the agent is active in the database
4. Verify the webhook URL is correct

### Issue 5: Quota Exceeded
**Symptom**: API returns 429 with "quota exceeded"

**Solution**:
1. Wait for quota to reset (check error message for retry time)
2. Upgrade to paid plan for higher quotas
3. Reduce request frequency
4. Use the optimized code (already implemented)

## Testing Checklist

- [ ] API key is set in Supabase Edge Function secrets
- [ ] API key format is correct (starts with `AIza`)
- [ ] Function logs show "✅ Gemini API key found"
- [ ] Function logs show "🚀 Calling Gemini API"
- [ ] Function logs show "📡 Gemini API response: { status: 200 }"
- [ ] Direct API test works with curl/Postman
- [ ] Telegram webhook is configured correctly
- [ ] Agent is active in the database
- [ ] User has not exceeded message limit

## Next Steps

1. **Check the logs** after sending a test message
2. **Look for the log messages** listed above
3. **Share the logs** if you need help debugging
4. **Test the API key directly** using curl
5. **Verify the webhook** is properly configured

## Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)

