# AI Business Chat Platform

A full-stack AI-powered business chat agent platform that works with WhatsApp and Telegram. Users can create their own AI chat agents powered by their business knowledge, with support for multiple subscription tiers.

## 🚀 Features

- **Multi-Platform Support**: WhatsApp Business API and Telegram Bot integration
- **AI-Powered Responses**: Uses Google Gemini 2.5 Flash Lite via OpenRouter for intelligent responses
- **Knowledge Base**: Upload PDFs, scrape websites, or add text information
- **Subscription Plans**: Free (50 msgs), Starter (500 msgs), Enterprise (5000 msgs)
- **Payment Integration**: Stripe for subscription management
- **Admin Dashboard**: User management, revenue tracking, and analytics
- **Message Limit Enforcement**: Automatic blocking when limits are reached
- **Webhook Auto-Registration**: Automatic setup for Telegram bots
- **OAuth Authentication**: Sign up and sign in with Google or Facebook accounts

## 🛠 Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router

**Backend:**
- Supabase (PostgreSQL + Edge Functions)
- Supabase Auth
- Supabase Storage

**AI & Integrations:**
- Google Gemini 2.5 Flash Lite (via OpenRouter API)
- Telegram Bot API
- WhatsApp Business Cloud API
- Manual Payment Verification System

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenRouter account (for API key)
- Telegram Bot Token (from @BotFather)
- WhatsApp Business API credentials (Meta Developer account)
- Local payment method (Mobile Money, Telebirr, Bank Account)

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase (Frontend - Add to .env file in root directory)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Note: The following are Edge Function secrets (add in Supabase Dashboard → Edge Functions → Settings → Secrets)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (already available in Edge Functions)
# OPENROUTER_API_KEY=your_openrouter_api_key
# META_APP_SECRET=your_meta_app_secret (optional)
# WHATSAPP_VERIFY_TOKEN=ai_business_chat_verify (optional)
```

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd reply-ready-bot-main

# Install dependencies
npm install

# Run database migrations
# (In Supabase Dashboard > SQL Editor, run all files from supabase/migrations/)

# Start development server
npm run dev
```

## 🗄 Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run all migration files in order:
   - `20251108070039_*.sql` - Core tables and RLS
   - `20251108070445_*.sql` - Message count function
   - `20251108080000_*.sql` - Storage bucket
   - `20251108090000_*.sql` - Admin actions table
   - `20251108100000_*.sql` - Payment requests table

## 🔐 Setting Up Google Authentication

1. **Create Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Select **Web application** as the application type
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - For local development: `http://localhost:5173/auth/v1/callback` (or your local port)
   - Copy the **Client ID** and **Client Secret**

2. **Configure in Supabase**:
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Providers**
   - Find **Google** in the list and enable it
   - Enter your **Client ID** and **Client Secret** from Google Cloud Console
   - **Important**: In the **Redirect URLs** section, add your production URL:
     - `https://responder-eight.vercel.app/dashboard` (or your Vercel URL)
     - For local development: `http://localhost:5173/dashboard` (or your local port)
   - Click **Save**

3. **Test**:
   - Users can now sign in/sign up using the "Sign in with Google" button on the auth page
   - The button will redirect to Google's OAuth consent screen
   - After authentication, users will be redirected to the dashboard page (`/dashboard`)

## 🔐 Setting Up Facebook Authentication

1. **Create Facebook App**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Click **My Apps** → **Create App**
   - Select **Consumer** as the app type
   - Fill in your app details and create the app
   - Navigate to **Settings** → **Basic** in the left sidebar
   - Note your **App ID** and **App Secret**

2. **Configure OAuth Settings**:
   - In your Facebook app dashboard, go to **Products** → **Facebook Login** → **Settings**
   - Add **Valid OAuth Redirect URIs**:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - For local development: `http://localhost:5173/auth/v1/callback` (or your local port)
   - Save changes

3. **Configure in Supabase**:
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Providers**
   - Find **Facebook** in the list and enable it
   - Enter your **App ID** and **App Secret** from Facebook
   - **Important**: In the **Redirect URLs** section, add your production URL:
     - `https://responder-eight.vercel.app/dashboard` (or your Vercel URL)
     - For local development: `http://localhost:5173/dashboard` (or your local port)
   - Click **Save**

4. **Test**:
   - Users can now sign in/sign up using the "Sign in with Facebook" button on the auth page
   - The button will redirect to Facebook's OAuth consent screen
   - After authentication, users will be redirected to the dashboard page (`/dashboard`)

## 🤖 Setting Up OpenRouter API

1. **Get API Key**:
   - Go to [OpenRouter](https://openrouter.ai/)
   - Sign up for an account
   - Navigate to API Keys section
   - Click "Create API Key"
   - Copy your API key

2. **Add to Environment**:
   - Add `OPENROUTER_API_KEY=your_key_here` to Supabase Edge Function secrets
   - In Supabase Dashboard → Edge Functions → Settings → Secrets

3. **Add Credits (Optional)**:
   - Add credits to your OpenRouter account to ensure uninterrupted access
   - OpenRouter uses a pay-as-you-go model

## 🤖 Setting Up Telegram Bot

1. **Create Bot**: Message @BotFather on Telegram
   - Send `/newbot`
   - Follow instructions to get your bot token

2. **Configure in App**:
   - Login to your app
   - Go to Dashboard → Select Telegram
   - Choose a plan
   - Go to Settings
   - Paste your bot token
   - Click "Save Telegram Settings"
   - Webhook will be automatically registered!

3. **Test**: Send a message to your bot

## 📱 Setting Up WhatsApp Business

1. **Create Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app → Select "Business"
   - Add WhatsApp product

2. **Get Credentials from Meta Dashboard**:
   - **Display Phone Number**: Your WhatsApp Business phone number (e.g., +15556430464)
   - **Access Token**: From WhatsApp → Configuration → Temporary/Permanent Token
   - **App ID**: Your Meta App ID

3. **Configure Webhook**:
   - In Meta Dashboard → WhatsApp → Configuration → Webhook
   - Webhook URL: `https://your-project.supabase.co/functions/v1/whatsapp-webhook`
   - Verify Token: `ai_business_chat_verify`
   - Subscribe to `messages` field

4. **Configure in App**:
   - Go to Settings in your app
   - Select WhatsApp platform
   - Enter **Display Phone Number** (not Phone Number ID - e.g., +15556430464)
   - Enter Meta App ID and Access Token
   - Save settings

## 💳 Manual Payment System Setup

1. **Configure Payment Methods**:
   - Edit `src/pages/Pricing.tsx` to update payment numbers/accounts
   - Update contact information for payment verification

2. **How It Works**:
   - Users select a paid plan
   - Payment instructions are displayed
   - Users pay via Mobile Money/Telebirr/Bank Transfer
   - Users contact admin with transaction details
   - Admin verifies payment in admin dashboard
   - User plan is automatically upgraded upon verification

3. **Admin Verification**:
   - Login with admin account
   - Navigate to `/admin`
   - View "Pending Payment Requests"
   - Click "Verify" to approve or "Reject" to decline
   - User's plan updates automatically on verification

## 🔐 Admin Access

To make a user an admin:

```sql
-- Run in Supabase SQL Editor
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

Then navigate to `/admin` to access the admin dashboard.

## 📊 Key Features Explained

### Message Limits
- Enforced at AI chat function level
- Users receive friendly messages when limit reached
- Progress bar and warnings shown in Settings

### Knowledge Base
- **PDFs**: Automatic text extraction using pdf.js
- **Websites**: Content scraping with cheerio
- **Text**: Direct input
- All stored in `knowledge_base` table

### Webhooks
- **Telegram**: Auto-registered via Bot API
- **WhatsApp**: Manual registration in Meta Console
- Both handle incoming messages and send AI responses

### Payment Flow
1. User selects paid plan
2. Payment instructions displayed
3. User completes payment via local payment method
4. User contacts admin with transaction details
5. Admin verifies payment in admin dashboard
6. Subscription automatically upgraded on verification

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist folder to Vercel
```

### Backend (Supabase)
Already deployed! Supabase Edge Functions are automatically deployed.

## 📝 Project Structure

```
├── src/
│   ├── pages/           # React pages
│   ├── components/      # UI components
│   ├── integrations/    # Supabase client
│   └── lib/            # Utilities
├── supabase/
│   ├── functions/      # Edge Functions
│   │   ├── ai-chat/
│   │   ├── telegram-webhook/
│   │   ├── whatsapp-webhook/
│   │   ├── pdf-upload/
│   │   └── scrape-website/
│   └── migrations/     # Database migrations
└── public/            # Static assets
```

## 🧪 Testing

1. **Authentication**: Sign up/login
2. **Platform Selection**: Choose WhatsApp or Telegram
3. **Plan Selection**: Select Free plan (instant) or paid plan (payment request)
4. **Knowledge Upload**: Upload PDF, add website, or text
5. **Bot Configuration**: Add bot credentials in Settings
6. **Send Messages**: Test from WhatsApp/Telegram
7. **Message Limits**: Send messages until limit reached
8. **Payment**: Request paid plan and verify in admin dashboard
9. **Admin**: Access admin dashboard to verify payments and manage users

## 🐛 Troubleshooting

**Webhook not working:**
- Check Supabase function logs
- Verify credentials are correct
- Ensure webhook URL is publicly accessible

**PDF upload fails:**
- Check file size (max 10MB)
- Ensure storage bucket is created
- Verify RLS policies

**Payment not showing:**
- Check payment_requests table exists
- Verify RLS policies allow user access
- Check browser console for errors

**AI not responding:**
- Verify OPENROUTER_API_KEY is set in Supabase secrets
- Check if message limit reached
- Review ai-chat function logs in Supabase
- Ensure API key is valid and has credits in OpenRouter account
- Verify the model name (google/gemini-2.5-flash-lite) is available on OpenRouter

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📧 Support

For issues and questions, please open a GitHub issue.
