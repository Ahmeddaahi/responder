# Cryptomus Integration - Quick Reference

## 🚀 Quick Start Commands

### Deploy Everything
```bash
# 1. Apply database migration
supabase db push

# 2. Set environment variables (do this in Supabase Dashboard)
# CRYPTO_MUS_MERCHANT_ID
# CRYPTO_MUS_API_KEY

# 3. Deploy Edge Functions
supabase functions deploy create-cryptomus-order
supabase functions deploy cryptomus-webhook

# 4. Configure webhook in Cryptomus dashboard
# URL: https://<project-id>.supabase.co/functions/v1/cryptomus-webhook
```

## 📋 Environment Variables Required

Add these in **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Environment Variables**:

```
CRYPTO_MUS_MERCHANT_ID=your_merchant_id
CRYPTO_MUS_API_KEY=your_api_key
CRYPTO_MUS_WALLET=your_wallet (optional)
```

## 🔍 Testing Commands

```bash
# View function logs
supabase functions logs create-cryptomus-order
supabase functions logs cryptomus-webhook --follow

# Check database
supabase db diff
```

## 📊 Database Queries

```sql
-- View all payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check pending payments
SELECT * FROM payments WHERE status = 'pending';

-- Verify subscription updates
SELECT s.*, p.* 
FROM subscriptions s 
JOIN payments p ON s.user_id = p.user_id 
WHERE p.status = 'paid';
```

## 🎯 User Flow

1. User selects paid plan on pricing page
2. Clicks "Pay with Crypto (USDT)" button
3. Redirected to Cryptomus payment page
4. Completes USDT payment
5. Webhook updates payment status
6. Subscription automatically activated
7. User redirected to success page

## 🔗 Important URLs

- **Create Order Function:** `https://<project-id>.supabase.co/functions/v1/create-cryptomus-order`
- **Webhook Handler:** `https://<project-id>.supabase.co/functions/v1/cryptomus-webhook`
- **Success Page:** `https://<your-app>.vercel.app/payment/success?order_id=<uuid>`
- **Failure Page:** `https://<your-app>.vercel.app/payment/failed?order_id=<uuid>`

## 💰 Plan Pricing

| Plan       | Price | Messages |
|------------|-------|----------|
| Starter    | $5    | 500      |
| Enterprise | $25   | 5000     |

Update in: `supabase/functions/create-cryptomus-order/index.ts`

## 🛠️ Troubleshooting

**Issue:** "Cryptomus credentials not configured"  
**Fix:** Set environment variables in Supabase Dashboard

**Issue:** Webhook not receiving updates  
**Fix:** Verify webhook URL in Cryptomus dashboard

**Issue:** Payment successful but subscription not activated  
**Fix:** Check `cryptomus-webhook` logs for errors

## 📚 Documentation

- Full Setup Guide: `CRYPTOMUS_SETUP.md`
- Implementation Details: See walkthrough artifact
- Cryptomus API Docs: https://doc.cryptomus.com/

## ✅ Verification Checklist

- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Edge functions deployed
- [ ] Webhook URL set in Cryptomus
- [ ] Test payment completed successfully
- [ ] Subscription activated automatically
