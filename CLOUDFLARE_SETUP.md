# Cloudflare R2 Setup Guide for Payment Screenshots

This guide will help you set up Cloudflare R2 to store payment receipt screenshots.

## Prerequisites

- A Cloudflare account (sign up at https://dash.cloudflare.com/)
- Access to your Cloudflare dashboard

## Step 1: Create an R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to **R2** in the left sidebar
3. Click **Create bucket**
4. Enter bucket name: `payment-proofs` (or your preferred name)
5. Click **Create bucket**

## Step 2: Configure Bucket as Public

1. Click on your newly created bucket
2. Go to **Settings** tab
3. Scroll to **Public Access** section
4. Enable **Public Access** toggle
5. (Optional) Configure CORS if needed:
   - Go to **Settings** → **CORS Policy**
   - Add your domain to allowed origins
   - Or use `*` for development (not recommended for production)

## Step 3: Create R2 API Token

1. In Cloudflare dashboard, go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure the token:
   - **Token name**: `payment-proofs-upload` (or your preferred name)
   - **Permissions**: 
     - **Object Read & Write** (for uploading and reading files)
   - **TTL**: Leave empty for no expiration, or set expiration date
4. Click **Create API Token**
5. **IMPORTANT**: Copy the following values immediately (you won't be able to see them again):
   - **Access Key ID**
   - **Secret Access Key**

## Step 4: Get Your Account ID

1. In Cloudflare dashboard, go to any page
2. Look at the URL or sidebar - your Account ID is visible
3. Or go to **R2** → any bucket → the Account ID is in the URL or settings

## Step 5: Configure Custom Domain (Optional but Recommended)

For better performance and custom URLs:

1. In your R2 bucket, go to **Settings** → **Custom Domain**
2. Click **Connect Domain**
3. Enter your domain (e.g., `cdn.yourdomain.com`)
4. Follow the DNS configuration instructions
5. Wait for DNS propagation (usually a few minutes)

**Note**: If you don't use a custom domain, R2 will provide a public URL in the format:
`https://pub-{account-id}.r2.dev/{file-path}`

## Step 6: Add Environment Variables

1. Copy `.env.example` to `.env` (if you haven't already)
2. Add the following variables:

```env
# Cloudflare R2 Configuration
VITE_CLOUDFLARE_ACCOUNT_ID=17944b7b9f613af49c1f6cc32739d449
VITE_CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
VITE_CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
VITE_CLOUDFLARE_BUCKET_NAME=payment-proofs
VITE_CLOUDFLARE_PUBLIC_URL=https://pub-5269b2eb39fd43888368abfec90e22b1.r2.dev
# If using default R2 public URL, leave VITE_CLOUDFLARE_PUBLIC_URL empty
```

3. Replace the placeholder values with your actual credentials

## Step 7: Verify Configuration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try uploading a payment screenshot through the payment modal
3. Check that the image displays correctly in the admin panel

## Troubleshooting

### Images Not Uploading

- **Check credentials**: Verify all environment variables are set correctly
- **Check bucket name**: Ensure `VITE_CLOUDFLARE_BUCKET_NAME` matches your bucket name exactly
- **Check permissions**: Ensure your API token has "Object Read & Write" permissions
- **Check console**: Look for error messages in browser console

### Images Not Displaying

- **Check public access**: Ensure bucket has public access enabled
- **Check CORS**: If using custom domain, ensure CORS is configured
- **Check URL format**: Verify the public URL format is correct
- **Check browser console**: Look for CORS or 403 errors

### CORS Errors

If you see CORS errors in the browser console:

1. Go to your R2 bucket → **Settings** → **CORS Policy**
2. Add your domain to allowed origins:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
3. For development, you can temporarily use `*` (not recommended for production)

### 403 Forbidden Errors

- Ensure bucket public access is enabled
- Check that your API token has correct permissions
- Verify the bucket name is correct

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use environment-specific tokens** (different tokens for dev/prod)
3. **Set token expiration** for production tokens
4. **Use custom domain** instead of default R2 URLs for better control
5. **Enable CORS** only for your specific domains
6. **Regularly rotate** API tokens

## Cost Considerations

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015 per GB/month
- **Class A Operations** (writes): $4.50 per million
- **Class B Operations** (reads): $0.36 per million
- **Egress**: Free (unlike AWS S3)

For payment screenshots (typically small files, low volume), costs should be minimal.

## Migration from Supabase

The system supports both Supabase and Cloudflare URLs:
- **New uploads** will use Cloudflare (if configured)
- **Existing Supabase URLs** will continue to work
- The system automatically detects URL type and handles accordingly

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure bucket is public and CORS is configured
4. Check Cloudflare dashboard for any service issues

