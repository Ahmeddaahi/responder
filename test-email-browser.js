// Copy and paste this code into your browser console (F12)
// Then press Enter to run it

const SUPABASE_URL = 'https://ilcxoakgntprququdgok.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsY3hvYWtnbnRwcnF1cXVkZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODAwNzgsImV4cCI6MjA3ODE1NjA3OH0.ZDGa3aUm2lkRldKri532L1g_3eFlNl97UNHA5Zxv4fI';
const TEST_EMAIL = 'ahmedzcy539@gmail.com';

console.log('🚀 Sending test email to:', TEST_EMAIL);
console.log('⏳ Please wait...');

fetch(`${SUPABASE_URL}/functions/v1/test-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: TEST_EMAIL,
    subject: 'Test Email from Supabase SMTP',
    message: 'This is a test email to verify your SMTP configuration is working correctly!'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Response received:', data);
  if (data.message) {
    console.log('✅ SUCCESS:', data.message);
    console.log('📧 Method:', data.method);
    console.log('📬 Recipient:', data.recipient);
    console.log('💡 Note:', data.note);
    alert('✅ Test email sent! Check your inbox (and spam folder) at ' + TEST_EMAIL);
  } else if (data.error) {
    console.error('❌ ERROR:', data.error);
    console.error('Details:', data.details);
    alert('❌ Error: ' + data.error);
  }
})
.catch(err => {
  console.error('❌ Network Error:', err);
  alert('❌ Failed to send test email. Check console for details.');
});

