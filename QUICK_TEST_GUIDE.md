# Quick Test Guide - Ready to Use! 🚀

I've created ready-to-use test scripts with your credentials. Choose the method that's easiest for you:

---

## 🎯 Method 1: HTML File (Easiest!)

1. **Open the file**: `test-email-now.html` in your browser
2. **Click the button**: "Send Test Email"
3. **Wait for result**: You'll see success/error message
4. **Check your email**: Look in inbox and spam folder

**That's it!** No coding required.

---

## 🎯 Method 2: Browser Console (Quick!)

1. **Open your website** in browser (any page)
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Copy and paste** the entire contents of `test-email-browser.js`
5. **Press Enter**
6. **Check the console** for results
7. **Check your email** at ahmedzcy539@gmail.com

---

## 🎯 Method 3: Terminal/Command Line

### For Windows (PowerShell):
1. Open PowerShell
2. Navigate to your project folder
3. Run: `.\test-email-powershell.ps1`

### For Mac/Linux (Bash):
1. Open Terminal
2. Navigate to your project folder
3. Run: `bash test-email-curl.sh`
   OR
   ```bash
   curl -X POST "https://ilcxoakgntprququdgok.supabase.co/functions/v1/test-email" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI" \
     -H "Content-Type: application/json" \
     -d '{"to": "ahmedzcy539@gmail.com", "subject": "Test Email", "message": "Test message"}'
   ```

---

## 📋 What to Expect

### ✅ Success Response:
```json
{
  "message": "Test email sent successfully via Supabase SMTP",
  "method": "Supabase Auth (signup verification)",
  "recipient": "ahmedzcy539@gmail.com",
  "note": "Check your inbox (including spam folder) for the verification email"
}
```

### ❌ Error Response:
```json
{
  "error": "Error message here",
  "details": "Additional details"
}
```

---

## 🔍 After Running the Test

1. **Check your email**: ahmedzcy539@gmail.com
   - Check inbox
   - Check spam/junk folder
   - Wait 1-2 minutes if not received immediately

2. **Check the response**:
   - If success → SMTP is working! ✅
   - If error → Check the error message for details

3. **Common Issues**:
   - **"Function not found"** → Deploy the function first (see below)
   - **"Unauthorized"** → Check if anon key is correct
   - **"Email not received"** → Check spam folder, wait 1-2 minutes

---

## 🚀 Before Testing: Deploy the Function

Make sure the `test-email` function is deployed:

### Option A: Supabase CLI
```bash
supabase functions deploy test-email
```

### Option B: Supabase Dashboard
1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"** (or find `test-email` if it exists)
3. Name: `test-email`
4. Copy contents from `supabase/functions/test-email/index.ts`
5. Paste and click **"Deploy"**

---

## 🎯 Quick Test (Copy-Paste Ready)

**Browser Console (F12 → Console tab):**
```javascript
fetch('https://ilcxoakgntprququdgok.supabase.co/functions/v1/test-email', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'ahmedzcy539@gmail.com',
    subject: 'Test Email from Supabase SMTP',
    message: 'This is a test email!'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Result:', data);
  alert('Check your email! ' + (data.message || data.error));
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Error: ' + err.message);
});
```

---

## ✅ Success Checklist

- [ ] Function deployed (`test-email`)
- [ ] Test script executed
- [ ] Success response received
- [ ] Email received in inbox (or spam)
- [ ] SMTP configuration verified

---

## 🆘 Troubleshooting

**If you get "Function not found":**
- Deploy the function first (see above)

**If you get "Unauthorized":**
- Check that the anon key is correct
- Make sure you're using the right project

**If email not received:**
- Check spam folder
- Wait 1-2 minutes
- Check Supabase function logs
- Verify SMTP settings in Dashboard

---

**Ready to test?** Open `test-email-now.html` in your browser and click the button! 🚀

