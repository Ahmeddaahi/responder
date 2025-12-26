# Vercel Production Environment Variables

## 🚀 Required Environment Variables for Production

Add these environment variables in your **Vercel project settings**:

### Step 1: Go to Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **responder-eight** (or your project name)
3. Click **Settings** → **Environment Variables**

---

## ✅ Required Variables (Must Have)

### 1. Supabase URL

**Variable Name:**
```
VITE_SUPABASE_URL
```

**Value:**
```
https://ilcxoakgntprququdgok.supabase.co
```

**Where to find:**
- Supabase Dashboard → Settings → API → Project URL

---

### 2. Supabase Anon Key (Publishable Key)

**Variable Name:**
```
VITE_SUPABASE_PUBLISHABLE_KEY
```

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI
```

**Where to find:**
- Supabase Dashboard → Settings → API → anon/public key

---

## 📋 How to Add in Vercel

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **For each variable:**
   - Click **"Add New"**
   - **Key**: Enter the variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: Enter the value
   - **Environment**: Select **Production** (and optionally Preview/Development)
   - Click **"Save"**

3. **After adding all variables:**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger a new deployment

---

## ⚠️ Important Notes

### Environment Selection

When adding variables, you can select:
- **Production** - Used in production deployments
- **Preview** - Used in preview deployments (pull requests)
- **Development** - Used in local development (if using Vercel CLI)

**Recommendation:** Select **Production** at minimum. You can also select **Preview** if you want to test in preview deployments.

### After Adding Variables

**You MUST redeploy for changes to take effect:**
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic deployment

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use different Supabase projects** for development and production (if applicable)
3. ✅ **Use the `anon` key** (not `service_role` key) in frontend
4. ✅ **Rotate keys regularly** for security
5. ✅ **Don't share your keys** publicly

---

## ✅ Quick Checklist

- [ ] `VITE_SUPABASE_URL` added to Vercel
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` added to Vercel
- [ ] Both variables set for **Production** environment
- [ ] Redeployed application after adding variables
- [ ] Tested the application to verify it works

---

## 🧪 Verify It's Working

After deployment, test:

1. **Open your production site**: `https://responder-eight.vercel.app`
2. **Open browser console** (F12)
3. **Check for errors** - Should be no errors about missing environment variables
4. **Test signup/login** - Should work correctly
5. **Test database connections** - Should work

---

## 📝 Complete Variable List

### Required Variables (Must Have)

```
VITE_SUPABASE_URL=https://ilcxoakgntprququdgok.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI
```

### Optional Variables (Only if using Cloudflare R2 for payment proofs)

If you're using Cloudflare R2 to store payment proof screenshots, add these:

```
VITE_CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
VITE_CLOUDFLARE_ACCESS_KEY_ID=your_r2_access_key_id
VITE_CLOUDFLARE_SECRET_ACCESS_KEY=your_r2_secret_access_key
VITE_CLOUDFLARE_BUCKET_NAME=payment-proofs
VITE_CLOUDFLARE_PUBLIC_URL=https://your-custom-domain.com
```

**Note:** These are only needed if you're using the payment proof upload feature. If not using it, you can skip these.

---

## 🆘 Troubleshooting

### Variables Not Working?

1. **Check variable names:**
   - Must start with `VITE_` for Vite projects
   - Must match exactly (case-sensitive)

2. **Check environment selection:**
   - Make sure variables are set for **Production**

3. **Redeploy:**
   - Variables only apply to new deployments
   - Redeploy after adding variables

4. **Check browser console:**
   - Look for errors about undefined variables
   - Check Network tab for failed API calls

---

## 🎯 Summary

### Minimum Required (2 variables):
1. `VITE_SUPABASE_URL` ✅
2. `VITE_SUPABASE_PUBLISHABLE_KEY` ✅

### Optional (if using Cloudflare R2):
3. `VITE_CLOUDFLARE_ACCOUNT_ID` (optional)
4. `VITE_CLOUDFLARE_ACCESS_KEY_ID` (optional)
5. `VITE_CLOUDFLARE_SECRET_ACCESS_KEY` (optional)
6. `VITE_CLOUDFLARE_BUCKET_NAME` (optional)
7. `VITE_CLOUDFLARE_PUBLIC_URL` (optional)

**Everything else** (Edge Functions, API keys, etc.) is configured in Supabase Dashboard, not Vercel.

---

## 📚 Additional Resources

- **Vercel Environment Variables Docs**: [https://vercel.com/docs/concepts/projects/environment-variables](https://vercel.com/docs/concepts/projects/environment-variables)
- **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)

---

**Ready to deploy?** Add these 2 variables and redeploy! 🚀

