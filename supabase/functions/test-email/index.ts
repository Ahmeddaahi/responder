import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailBody {
  to: string;
  subject?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message }: TestEmailBody = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Email address (to) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Option 1: Test using Supabase Auth's resend function (tests SMTP configuration)
    // This will use the SMTP settings configured in Supabase Dashboard
    try {
      // Create a temporary user to test email sending
      // Note: This is just for testing - we'll clean up after
      const testPassword = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: to,
        password: testPassword,
        email_confirm: false, // Don't auto-confirm so we can test email sending
      });

      if (signUpError) {
        // If user already exists, try to resend verification email
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          // Get user by email
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users?.users.find(u => u.email === to);

          if (existingUser) {
            // Resend verification email
            const { error: resendError } = await supabase.auth.admin.generateLink({
              type: 'signup',
              email: to,
            });

            if (resendError) {
              throw new Error(`Failed to send test email via Supabase Auth: ${resendError.message}`);
            }

            // Clean up: delete the test user we might have created
            if (signUpData?.user) {
              await supabase.auth.admin.deleteUser(signUpData.user.id);
            }

            return new Response(
              JSON.stringify({
                message: 'Test email sent successfully via Supabase SMTP',
                method: 'Supabase Auth (resend verification)',
                recipient: to,
                note: 'Check your inbox (including spam folder) for the verification email'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        throw signUpError;
      }

      // If we created a new user, the verification email should have been sent
      // Clean up the test user
      if (signUpData?.user) {
        // Don't delete immediately - wait a moment for email to be sent
        setTimeout(async () => {
          await supabase.auth.admin.deleteUser(signUpData.user.id);
        }, 5000);
      }

      return new Response(
        JSON.stringify({
          message: 'Test email sent successfully via Supabase SMTP',
          method: 'Supabase Auth (signup verification)',
          recipient: to,
          note: 'Check your inbox (including spam folder) for the verification email. Test user will be deleted automatically.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (supabaseError: any) {
      // If Supabase SMTP test fails, try Resend API as fallback
      console.log('Supabase SMTP test failed, trying Resend API as fallback:', supabaseError.message);

      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({
            error: 'Supabase SMTP test failed and Resend API key not configured',
            details: supabaseError.message,
            suggestion: 'Configure Supabase SMTP in Dashboard → Settings → Auth → SMTP Settings, or add RESEND_API_KEY secret'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
      const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Reply Ready Bot';

      const emailBody = {
        from: `${senderName} <${senderEmail}>`,
        to: [to],
        subject: subject || 'Test Email from Supabase (Resend)',
        html: message || `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .success { background: #10b981; color: white; padding: 10px; border-radius: 5px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success">✅ Integration Test Successful!</div>
                <h2>Resend Test Email</h2>
                <p>This is a test email sent from your Supabase Edge Function via Resend API.</p>
                <p>If you received this email, your Resend configuration is working correctly!</p>
                <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
              </div>
            </body>
          </html>
        `,
        text: message || `Test Email\n\nThis is a test email sent from your Supabase Edge Function via Resend API.\n\nSent at: ${new Date().toISOString()}`,
      };

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        let errorMessage = `Resend API error: ${resendResponse.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += ` - ${errorJson.message || errorText}`;
        } catch {
          errorMessage += ` - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      return new Response(
        JSON.stringify({
          message: 'Test email sent successfully via Resend API',
          method: 'Resend API (fallback)',
          recipient: to,
          note: 'Check your inbox (including spam folder) for the test email'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in test-email function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

