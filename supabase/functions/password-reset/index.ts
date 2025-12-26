import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestCodeBody {
  email: string;
}

interface VerifyCodeBody {
  email: string;
  code: string;
}

interface ResetPasswordBody {
  email: string;
  code: string;
  newPassword: string;
}

// Generate a 6-digit numeric code
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email via Resend
async function sendResetCodeEmail(email: string, code: string): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in environment');
    throw new Error('RESEND_API_KEY not configured');
  }

  const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
  const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Reply Ready Bot';

  const emailBody = {
    from: `${senderName} <${senderEmail}>`,
    to: [email],
    subject: 'Password Reset Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333333; 
              background-color: #f5f5f5;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header-title {
              color: #ffffff;
              font-size: 24px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #4a4a4a;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .code-container {
              background: linear-gradient(135deg, #f6f8fb 0%, #e9ecf1 100%);
              border: 2px dashed #667eea;
              border-radius: 12px;
              padding: 30px 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code-label {
              font-size: 14px;
              color: #666666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .code {
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 8px;
              color: #667eea;
              font-family: 'Courier New', monospace;
              background-color: #ffffff;
              padding: 15px 25px;
              border-radius: 8px;
              display: inline-block;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
            }
            .expiry-info {
              font-size: 14px;
              color: #666666;
              margin-top: 20px;
              text-align: center;
            }
            .warning-box {
              background-color: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 15px 20px;
              margin: 30px 0;
              border-radius: 6px;
            }
            .warning {
              color: #dc2626;
              font-size: 14px;
              font-weight: 500;
            }
            .footer {
              background-color: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer-text {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 10px;
            }
            .footer-signature {
              font-size: 16px;
              color: #1a1a1a;
              font-weight: 600;
              margin-top: 15px;
            }
            @media only screen and (max-width: 600px) {
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .code { font-size: 28px; letter-spacing: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="header-title">Password Reset</div>
            </div>
            <div class="content">
              <div class="greeting">Hello!</div>
              <div class="message">
                We received a request to reset your password. Use the verification code below to complete the process:
              </div>
              <div class="code-container">
                <div class="code-label">Your Verification Code</div>
                <div class="code">${code}</div>
              </div>
              <div class="expiry-info">
                ⏱️ This code will expire in <strong>10 minutes</strong>
              </div>
              <div class="warning-box">
                <div class="warning">
                  ⚠️ If you didn't request this password reset, please ignore this email. Your account remains secure.
                </div>
              </div>
            </div>
            <div class="footer">
              <div class="footer-text">
                Need help? Contact our support team if you have any questions.
              </div>
              <div class="footer-signature">
                Best regards,<br>
                ${senderName} Team
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset Request\n\nHello!\n\nWe received a request to reset your password. Use the verification code below to complete the process:\n\nYour Verification Code: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this password reset, please ignore this email. Your account remains secure.\n\nBest regards,\n${senderName} Team`,
  };

  console.log('🌐 Calling Resend API...');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailBody),
  });

  console.log('📡 Resend API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Resend API error:', errorText);
    throw new Error(`Failed to send email: ${response.status} ${errorText}`);
  }

  const responseData = await response.json().catch(() => ({}));
  console.log('✅ Resend API success:', responseData);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'request-code') {
      // Step 1: Request reset code
      const { email }: RequestCodeBody = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user exists
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) {
        throw userError;
      }

      const userExists = users.users.some(u => u.email === email.toLowerCase());
      if (!userExists) {
        // Don't reveal if email exists or not for security
        return new Response(
          JSON.stringify({ message: 'If the email exists, a verification code has been sent.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 6-digit code
      const code = generateResetCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiration

      // Delete any existing codes for this email
      await supabase
        .from('password_reset_codes')
        .delete()
        .eq('email', email.toLowerCase());

      // Save new code
      const { error: insertError } = await supabase
        .from('password_reset_codes')
        .insert({
          email: email.toLowerCase(),
          code,
          expires_at: expiresAt.toISOString(),
          used: false,
        });

      if (insertError) {
        throw insertError;
      }

      // Send email
      try {
        await sendResetCodeEmail(email.toLowerCase(), code);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Still return success to user (don't reveal email issues)
      }

      return new Response(
        JSON.stringify({ message: 'If the email exists, a verification code has been sent.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify-code') {
      // Step 2: Verify code
      const { email, code }: VerifyCodeBody = await req.json();

      if (!email || !code) {
        return new Response(
          JSON.stringify({ error: 'Email and code are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check code
      const { data: resetCode, error: codeError } = await supabase
        .from('password_reset_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (codeError || !resetCode) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired verification code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Code verified successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reset-password') {
      // Step 3: Reset password
      const { email, code, newPassword }: ResetPasswordBody = await req.json();

      if (!email || !code || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'Email, code, and new password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify code again
      const { data: resetCode, error: codeError } = await supabase
        .from('password_reset_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (codeError || !resetCode) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired verification code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user by email
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) {
        throw userError;
      }

      const user = users.users.find(u => u.email === email.toLowerCase());
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        throw updateError;
      }

      // Mark code as used
      await supabase
        .from('password_reset_codes')
        .update({ used: true })
        .eq('id', resetCode.id);

      // Delete all codes for this email
      await supabase
        .from('password_reset_codes')
        .delete()
        .eq('email', email.toLowerCase());

      return new Response(
        JSON.stringify({ message: 'Password reset successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use ?action=request-code, ?action=verify-code, or ?action=reset-password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in password-reset function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

