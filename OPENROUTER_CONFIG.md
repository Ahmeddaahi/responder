# OpenRouter API Configuration

## Your API Key and Model Configuration

### OpenRouter API Key
```
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
```

### Model ID
```
google/gemini-2.5-flash-lite
```

## Setup Instructions

### Step 1: Add API Key to Supabase Edge Functions

1. Go to your **Supabase Dashboard**
2. Navigate to **Edge Functions** → **Settings** → **Secrets**
3. Click **Add Secret** (or edit if it exists)
4. Set:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: `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`
5. Click **Save**
6. Wait 1-2 minutes for functions to restart

### Step 2: Verify Configuration

1. Go to **Edge Functions** → **Logs** → **ai-chat**
2. Send a test message to your bot
3. Look for: `✅ OpenRouter API key found: { keyPreview: 'sk-or...***', ... }`
4. Look for: `🚀 Calling OpenRouter API: { model: 'google/gemini-2.5-flash-lite', ... }`

### Step 3: Test the Integration

1. Send a test message to your Telegram bot or WhatsApp
2. Verify the bot responds with AI-generated content
3. Check the logs to ensure the API is being called successfully

## Frontend Environment Variables

Create a `.env` file in the root directory with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

**Note**: The `OPENROUTER_API_KEY` is NOT set in the `.env` file - it must be set in Supabase Edge Function secrets as shown above.

## Model Configuration

The model is already configured in the code:
- **Model ID**: `google/gemini-2.5-flash-lite`
- **API Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Request Format**: OpenAI-style (messages array)

## Files Using This Configuration

- `supabase/functions/ai-chat/index.ts`
- `supabase/functions/whatsapp-webhook/index.ts`
- `supabase/functions/telegram-webhook-business/index.ts`

All functions are already configured to use:
- Model: `google/gemini-2.5-flash-lite`
- Environment Variable: `OPENROUTER_API_KEY`

## Security Notes

- ⚠️ **Never commit the API key to version control**
- ⚠️ **Keep the API key secure**
- ⚠️ **Only set it in Supabase Edge Function secrets**
- ⚠️ **Monitor your OpenRouter account credits**

## Troubleshooting

If the bot is not responding:

1. **Check API Key**: Verify `OPENROUTER_API_KEY` is set in Supabase secrets
2. **Check Credits**: Ensure your OpenRouter account has credits
3. **Check Logs**: Review Edge Function logs for errors
4. **Wait for Restart**: Wait 1-2 minutes after adding the secret for functions to restart

## Next Steps

1. ✅ Add `OPENROUTER_API_KEY` to Supabase Edge Function secrets
2. ✅ Add credits to your OpenRouter account (if not already done)
3. ✅ Deploy the updated functions (if not already deployed)
4. ✅ Test the integration with a sample request

---

**Status**: ✅ Configuration ready
**API Key**: `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`
**Model**: `google/gemini-2.5-flash-lite`

