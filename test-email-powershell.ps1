# Test Email Script for PowerShell - Run this in PowerShell

$SUPABASE_URL = "https://ilcxoakgntprququdgok.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI"
$TEST_EMAIL = "ahmedzcy539@gmail.com"

Write-Host "🚀 Sending test email to: $TEST_EMAIL" -ForegroundColor Cyan
Write-Host "⏳ Please wait..." -ForegroundColor Yellow

$body = @{
    to = $TEST_EMAIL
    subject = "Test Email from Supabase SMTP"
    message = "This is a test email to verify your SMTP configuration is working correctly!"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $ANON_KEY"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "${SUPABASE_URL}/functions/v1/test-email" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor Green
    Write-Host "Method: $($response.method)" -ForegroundColor Cyan
    Write-Host "Recipient: $($response.recipient)" -ForegroundColor Cyan
    Write-Host "Note: $($response.note)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📧 Check your email inbox (and spam folder) at $TEST_EMAIL" -ForegroundColor Magenta
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

