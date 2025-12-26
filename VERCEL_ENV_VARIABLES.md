# Environment Variables for Vercel Deployment

This document outlines all environment variables needed when deploying the frontend to Vercel.

## Required Environment Variables for Vercel

Add these environment variables in your Vercel project settings (Settings → Environment Variables):

### 1. Supabase Configuration

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

**Where to find these:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "Project URL" for `VITE_SUPABASE_URL`
- Copy the "anon/public" key for `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Important Notes

### Supabase Edge Functions
The Supabase Edge Functions (ai-chat, telegram-webhook, whatsapp-webhook, stripe-checkout, stripe-webhook, pdf-upload, scrape-website) are **NOT deployed to Vercel**. They are deployed directly to Supabase.

**Environment variables for Supabase Edge Functions should be set in Supabase Dashboard:**
- Go to your Supabase project → Edge Functions → Settings
- Add the following secrets:

  ```
  SITE_URL=https://resbonder.online
  OPENROUTER_API_KEY=your_openrouter_api_key
  STRIPE_SECRET_KEY=your_stripe_secret_key
  STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret (optional but recommended)
  WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token (optional, defaults to 'ai_business_chat_verify')
  META_APP_SECRET=your_meta_app_secret (optional, for WhatsApp webhook signature verification)
  ```

  **Important:** Set `SITE_URL=https://resbonder.online` to ensure all email verification links and redirects use your production domain.

  Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase for Edge Functions - you don't need to set these manually.

### How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings**
3. Click on **Environment Variables**
4. Add each variable:
   - **Name**: The variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select which environments to apply to (Production, Preview, Development)
5. Click **Save**
6. **Important**: After adding environment variables, you need to redeploy your application for the changes to take effect.

### Environment Variables Summary

| Variable | Required | Where to Set | Purpose |
|----------|----------|--------------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Vercel | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Vercel | Supabase anon/public key |
| `SITE_URL` | ✅ Yes | Supabase | Production domain for email redirects (set to `https://resbonder.online`) |
| `OPENROUTER_API_KEY` | ✅ Yes | Supabase | For AI chat functionality (via OpenRouter) |
| `STRIPE_SECRET_KEY` | ✅ Yes | Supabase | For payment processing |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Recommended | Supabase | For Stripe webhook verification |
| `WHATSAPP_VERIFY_TOKEN` | ❌ Optional | Supabase | For WhatsApp webhook verification |
| `META_APP_SECRET` | ❌ Optional | Supabase | For WhatsApp webhook signature verification |

---

## Verification

After deployment, verify that your environment variables are working:

1. Check the browser console for any errors related to missing environment variables
2. Test authentication (sign up/login)
3. Test database connections
4. Verify that API calls to Supabase are working

---

## Security Best Practices

- ✅ Never commit `.env` files to version control
- ✅ Use different Supabase projects for development and production
- ✅ Rotate API keys regularly
- ✅ Use the `anon` key (not the `service_role` key) in your frontend
- ✅ The `service_role` key should only be used in Supabase Edge Functions (backend)

