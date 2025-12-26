# Deploy ai-chat function to Supabase (PowerShell)

Write-Host "🚀 Deploying ai-chat function to Supabase..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed." -ForegroundColor Red
    Write-Host "📦 Install it with: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "   or visit: https://supabase.com/docs/reference/cli/installing-the-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $null = supabase projects list 2>&1
} catch {
    Write-Host "🔐 Please login to Supabase:" -ForegroundColor Yellow
    supabase login
}

# Deploy the function
Write-Host "📤 Deploying ai-chat function..." -ForegroundColor Cyan
supabase functions deploy ai-chat --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
    Write-Host "⏳ Wait 1-2 minutes for the function to restart" -ForegroundColor Yellow
    Write-Host "🧪 Test by sending a message to your bot" -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}

