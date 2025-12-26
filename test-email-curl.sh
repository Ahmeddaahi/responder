#!/bin/bash
# Test Email Script - Run this in your terminal

SUPABASE_URL="https://ilcxoakgntprququdgok.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI"
TEST_EMAIL="ahmedzcy539@gmail.com"

echo "🚀 Sending test email to: $TEST_EMAIL"
echo "⏳ Please wait..."

curl -X POST "${SUPABASE_URL}/functions/v1/test-email" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"${TEST_EMAIL}\",
    \"subject\": \"Test Email from Supabase SMTP\",
    \"message\": \"This is a test email to verify your SMTP configuration is working correctly!\"
  }"

echo ""
echo "✅ Done! Check your email inbox (and spam folder) at $TEST_EMAIL"

