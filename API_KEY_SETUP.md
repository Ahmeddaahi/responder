# ✅ OpenRouter API Key Setup

## 🎉 Setting Up OpenRouter API

**Status**: ✅ **Ready to Configure**  
**API Service**: OpenRouter  
**Model**: `google/gemini-2.5-flash-lite`

---

## 📊 Setup Steps

### ✅ Step 1: Create OpenRouter Account

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Verify your email if required

### ✅ Step 2: Create API Key

1. Navigate to **API Keys** section in your OpenRouter dashboard
2. Click **Create API Key**
3. Give it a name (e.g., "Reply Ready Bot")
4. Copy the API key

### ✅ Step 3: Add Credits (Recommended)

1. Go to **Credits** section in OpenRouter dashboard
2. Add credits to your account
3. OpenRouter uses pay-as-you-go pricing
4. Minimum recommended: $5-10 for testing

### ✅ Step 4: Add API Key to Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Edge Functions** → **Settings** → **Secrets**
3. Click **Add Secret** (or edit if it exists)
4. Set:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: Your OpenRouter API key
5. Click **Save**

### ✅ Step 5: Wait for Function Restart

⏳ **Wait 1-2 minutes** after adding the secret for the function to restart.

### ✅ Step 6: Verify in Logs

1. Go to **Edge Functions** → **Logs** → **ai-chat**
2. Send a test message to your bot
3. Look for: `✅ OpenRouter API key found: { keyPreview: 'sk-or...***', ... }`

---

## 🚀 Deploy Updated Function

The code has been updated to use OpenRouter API. Deploy it:

```bash
supabase functions deploy ai-chat --no-verify-jwt
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy telegram-webhook-business --no-verify-jwt
```

Or use the Supabase Dashboard to update the function code.

---

## 📋 Available Models

OpenRouter provides access to multiple models:
- ✅ `google/gemini-2.5-flash-lite` (currently used)
- ✅ `google/gemini-2.0-flash-exp`
- ✅ `google/gemini-2.0-flash`
- ✅ `google/gemini-2.5-flash`
- ✅ And many more...

Check [OpenRouter Models](https://openrouter.ai/models) for the full list.

---

## ⚠️ About Credits and Quotas

### Current Status:
- **Pricing**: Pay-as-you-go
- **Credits**: Add credits to your account
- **Rate Limits**: Based on your account tier

### Solutions:

1. **Add Credits**:
   - Go to OpenRouter dashboard
   - Navigate to Credits section
   - Add credits to your account
   - Recommended: $5-10 for testing, more for production

2. **Monitor Usage**:
   - Check usage in OpenRouter dashboard
   - Set up alerts for low credits
   - Monitor API usage in Supabase logs

3. **Optimize Usage**:
   - Reduce request frequency
   - Use smaller prompts
   - Implement caching

---

## ✅ Verification Checklist

- [ ] OpenRouter account created
- [ ] API key created
- [ ] Credits added to account
- [ ] API key set in Supabase secrets
- [ ] Function deployed with updated code
- [ ] Function logs show API key found
- [ ] Bot responds to messages

---

## 🧪 Test Your Setup

After setting the API key in Supabase:

1. **Wait 1-2 minutes** for function restart
2. **Send a test message** to your Telegram bot or WhatsApp
3. **Check logs** for:
   - `✅ OpenRouter API key found`
   - `🚀 Calling OpenRouter API`
   - `📡 OpenRouter API response`

---

## 📝 Important Notes

1. **API Key Security**: 
   - Never commit API keys to git
   - Only store in Supabase secrets
   - Don't share API keys publicly

2. **Credits Management**:
   - Monitor credit usage in OpenRouter dashboard
   - Set up alerts for low credits
   - Add credits regularly for production use

3. **Model Selection**:
   - Using `google/gemini-2.5-flash-lite` (available and tested)
   - Can switch to other models if needed
   - Check model availability on OpenRouter

4. **Rate Limits**:
   - OpenRouter has rate limits based on account tier
   - Free tier has lower limits
   - Paid accounts have higher limits

---

## 🔗 Useful Links

- **OpenRouter Dashboard**: https://openrouter.ai/
- **API Keys**: https://openrouter.ai/keys
- **Credits**: https://openrouter.ai/credits
- **Models**: https://openrouter.ai/models
- **Documentation**: https://openrouter.ai/docs
- **Supabase Dashboard**: Your Supabase project dashboard
- **Function Logs**: Supabase Dashboard → Edge Functions → Logs

---

## ✅ Summary

**Next steps:**
1. ✅ Create OpenRouter account
2. ✅ Create API key
3. ✅ Add credits to account
4. ✅ Add API key to Supabase secrets
5. ✅ Deploy updated function code
6. 🧪 Test your bot

The setup should be complete once:
- API key is set in Supabase
- Function is deployed
- Credits are added to OpenRouter account
- Bot sends messages (which will show up in usage)

---

## 🆘 Troubleshooting

### API Key Not Found
- Verify API key is set in Supabase secrets
- Check the key name is exactly `OPENROUTER_API_KEY`
- Wait 1-2 minutes for function restart

### No Response from AI
- Check OpenRouter account has credits
- Verify API key is valid
- Check function logs for errors
- Verify model name is correct

### Rate Limit Errors
- Check OpenRouter account tier
- Monitor usage in OpenRouter dashboard
- Consider upgrading account tier
- Implement retry logic (already included)

### Quota Exhausted
- Add more credits to OpenRouter account
- Check usage in OpenRouter dashboard
- Monitor API usage in Supabase logs
- Optimize request frequency
