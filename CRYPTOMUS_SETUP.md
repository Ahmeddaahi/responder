# Cryptomus Payment Integration Setup Guide

This guide will help you set up Cryptomus cryptocurrency payments for your WhatsApp + Telegram AI Chatbot SaaS platform.

## Overview

Cryptomus integration allows users to pay for subscription plans using cryptocurrency (USDT). The system includes:
- Payment order creation via Supabase Edge Function
- Webhook handling for payment verification
- Automatic subscription activation upon successful payment

## Prerequisites

1. **Cryptomus Account**: Sign up at [https://cryptomus.com](https://cryptomus.com)
2. **Supabase Project**: Your existing Supabase project
3. **Vercel Deployment**: Your Next.js frontend deployed on Vercel

## Step 1: Configure Cryptomus Account

1. Log in to your Cryptomus dashboard
2. Navigate to **Settings** → **API**
3. Copy your:
   - **Merchant ID**
   - **API Key**
   - **Payment API Key** (if different)

## Step 2: Set Environment Variables in Supabase

Add the following environment variables to your Supabase project:

### Via Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions** → **Environment Variables**
2. Add these variables:

```
CRYPTO_MUS_MERCHANT_ID=your_merchant_id_here
CRYPTO_MUS_API_KEY=your_api_key_here
CRYPTO_MUS_WALLET=your_usdt_wallet_address (optional)
```

### Via Supabase CLI:
```bash
supabase secrets set CRYPTO_MUS_MERCHANT_ID=your_merchant_id_here
supabase secrets set CRYPTO_MUS_API_KEY=your_api_key_here
supabase secrets set CRYPTO_MUS_WALLET=your_usdt_wallet_address
```

## Step 3: Apply Database Migration

Run the migration to create the `payments` table:

```bash
# If using Supabase CLI locally
supabase db reset

# Or push migrations to remote
supabase db push
```

Alternatively, run the SQL directly in Supabase SQL Editor:
```sql
-- Copy contents from: supabase/migrations/20251201000000_create_payments_table.sql
```

## Step 4: Deploy Supabase Edge Functions

Deploy both Edge Functions to your Supabase project:

```bash
# Deploy create-cryptomus-order function
supabase functions deploy create-cryptomus-order

# Deploy cryptomus-webhook function
supabase functions deploy cryptomus-webhook
```

### Verify Deployment
Check that functions are deployed:
```bash
supabase functions list
```

You should see:
- `create-cryptomus-order`
- `cryptomus-webhook`

## Step 5: Configure Webhook in Cryptomus Dashboard

1. Go to your Cryptomus dashboard
2. Navigate to **Settings** → **Webhooks**
3. Add a new webhook with the following URL:

```
https://<your-supabase-project-id>.supabase.co/functions/v1/cryptomus-webhook
```

**Example:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/cryptomus-webhook
```

4. Select events to trigger:
   - ✅ Payment status changed
   - ✅ Payment completed
   - ✅ Payment failed

5. Save the webhook configuration

## Step 6: Update Success/Fail URLs (Optional)

The Edge Function uses dynamic URLs based on the request origin. However, you can hardcode your Vercel URLs if needed:

Edit `supabase/functions/create-cryptomus-order/index.ts`:

```typescript
// Find this section and update with your Vercel URL
url_success: `https://your-app.vercel.app/payment/success?order_id=${orderId}`,
url_return: `https://your-app.vercel.app/payment/failed?order_id=${orderId}`,
```

Redeploy after changes:
```bash
supabase functions deploy create-cryptomus-order
```

## Step 7: Test the Integration

### Test Payment Flow:

1. **Start a Payment:**
   - Go to your pricing page
   - Select a paid plan (Starter or Enterprise)
   - Click "Pay with Crypto (USDT)"
   - You should be redirected to Cryptomus payment page

2. **Complete Payment:**
   - On Cryptomus page, send USDT to the provided address
   - Wait for blockchain confirmation

3. **Verify Webhook:**
   - Check Supabase logs: `supabase functions logs cryptomus-webhook`
   - Verify payment status updated in `payments` table
   - Confirm subscription activated in `subscriptions` table

### Check Database:

```sql
-- View recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check subscription status
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
```

## Troubleshooting

### Issue: "Cryptomus credentials not configured"
**Solution:** Ensure environment variables are set correctly in Supabase. Redeploy functions after setting secrets.

### Issue: Webhook not receiving updates
**Solution:** 
1. Verify webhook URL in Cryptomus dashboard
2. Check that webhook is active
3. Review Supabase function logs for errors

### Issue: Payment successful but subscription not activated
**Solution:**
1. Check `cryptomus-webhook` function logs
2. Verify plan_id matches your configuration
3. Ensure user exists in `profiles` table

### Issue: Signature verification failed
**Solution:**
1. Verify `CRYPTO_MUS_API_KEY` is correct
2. Check that webhook payload is not modified
3. Review signature generation logic in `crypto/sign.ts`

## Viewing Logs

### Edge Function Logs:
```bash
# View create-cryptomus-order logs
supabase functions logs create-cryptomus-order

# View webhook logs
supabase functions logs cryptomus-webhook

# Follow logs in real-time
supabase functions logs cryptomus-webhook --follow
```

### Database Queries:
```sql
-- All payments
SELECT * FROM payments ORDER BY created_at DESC;

-- Pending payments
SELECT * FROM payments WHERE status = 'pending';

-- Successful payments
SELECT * FROM payments WHERE status = 'paid';

-- Failed payments
SELECT * FROM payments WHERE status = 'failed';
```

## Security Considerations

1. **Signature Verification:** All webhook requests are verified using HMAC-SHA256 signatures
2. **RLS Policies:** Row Level Security ensures users can only view their own payments
3. **Service Role:** Webhook uses service role key to update payments (bypassing RLS)
4. **Environment Variables:** Never commit API keys to version control

## Plan Pricing Configuration

Current plan pricing is configured in `create-cryptomus-order/index.ts`:

```typescript
const PLAN_PRICING: Record<string, { price: number; messageLimit: number }> = {
  'starter': { price: 5, messageLimit: 500 },
  'enterprise': { price: 25, messageLimit: 5000 },
};
```

To update pricing:
1. Edit the `PLAN_PRICING` object
2. Redeploy the function: `supabase functions deploy create-cryptomus-order`

## Support

For issues related to:
- **Cryptomus API:** Contact Cryptomus support
- **Supabase Functions:** Check Supabase documentation
- **Integration Issues:** Review function logs and database records

## Additional Resources

- [Cryptomus API Documentation](https://doc.cryptomus.com/)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
