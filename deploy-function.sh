#!/bin/bash
# Deploy ai-chat function to Supabase

echo "🚀 Deploying ai-chat function to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📦 Install it with: npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/reference/cli/installing-the-cli"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please login to Supabase:"
    supabase login
fi

# Deploy the function
echo "📤 Deploying ai-chat function..."
supabase functions deploy ai-chat --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo "⏳ Wait 1-2 minutes for the function to restart"
    echo "🧪 Test by sending a message to your bot"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi

