import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendVerificationEmailBody {
  email: string;
  redirectTo?: string;
}

// Send verification email via Resend
async function sendVerificationEmail(email: string, confirmationUrl: string): Promise<void> {
  console.log('📧 sendVerificationEmail called for:', email);

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in environment');
    throw new Error('RESEND_API_KEY not configured');
  }
  console.log('✅ RESEND_API_KEY found');

  const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
  const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Reply Ready Bot';

  console.log('📋 Email configuration:', {
    senderEmail: senderEmail,
    senderName: senderName,
    recipient: email,
  });

  const emailBody = {
    from: `${senderName} <${senderEmail}>`,
    to: [email],
    subject: 'Verify your email address - Reply Ready Bot',
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
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .verify-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }
            .link-fallback {
              font-size: 14px;
              color: #666666;
              margin-top: 20px;
              word-break: break-all;
            }
            .link-fallback a {
              color: #667eea;
              text-decoration: none;
            }
            .info-box {
              background-color: #f0f9ff;
              border-left: 4px solid #667eea;
              padding: 15px 20px;
              margin: 30px 0;
              border-radius: 6px;
            }
            .info {
              color: #1e40af;
              font-size: 14px;
              font-weight: 500;
              line-height: 1.6;
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
              .verify-button { 
                padding: 14px 30px;
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="header-title">Welcome!</div>
            </div>
            <div class="content">
              <div class="greeting">Hello!</div>
              <div class="message">
                Thank you for signing up! We're excited to have you on board. To complete your registration and activate your account, please verify your email address by clicking the button below.
              </div>
              <div class="button-container">
                <a href="${confirmationUrl}" class="verify-button">Verify</a>
              </div>
              <div class="link-fallback">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmationUrl}">${confirmationUrl}</a>
              </div>
              <div class="info-box">
                <div class="info">
                  🔒 This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
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
    text: `Welcome!\n\nHello!\n\nThank you for signing up! We're excited to have you on board. To complete your registration and activate your account, please verify your email address by clicking the link below.\n\nVerify: ${confirmationUrl}\n\nThis verification link will expire in 24 hours. If you didn't create an account, please ignore this email.\n\nNeed help? Contact our support team if you have any questions.\n\nBest regards,\n${senderName} Team`,
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
    console.error('❌ Resend API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Failed to send email: ${response.status} ${errorText}`);
  }

  const responseData = await response.json().catch(() => ({}));
  console.log('✅ Resend API success:', responseData);
}

serve(async (req) => {
  console.log('📧 send-verification-email function called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');

    console.log('📥 Parsing request body...');
    const { email, redirectTo }: SendVerificationEmailBody = await req.json();
    console.log('Request data:', { email, redirectTo });

    if (!email) {
      console.error('❌ Email is required');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Looking up user by email:', email.toLowerCase());
    // Get user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      throw userError;
    }

    console.log(`📊 Found ${users.users.length} total users`);
    const user = users.users.find(u => u.email === email.toLowerCase());

    if (!user) {
      console.error('❌ User not found for email:', email.toLowerCase());
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User found:', { id: user.id, email: user.email, confirmed: !!user.email_confirmed_at });

    // Generate appropriate link based on confirmation status
    let linkType: 'signup' | 'magiclink' = 'signup';
    if (user.email_confirmed_at) {
      console.log('⚠️ User email already verified (email confirmation disabled), sending welcome email with magic link');
      linkType = 'magiclink'; // Use magic link for already confirmed users
    } else {
      console.log('🔑 User needs email verification, generating signup confirmation link');
    }

    console.log('🔑 Generating link (type:', linkType, ')...');
    // Generate confirmation token and URL
    // Redirect to pricing page after verification so new users can choose their plan
    const siteUrl = Deno.env.get('SITE_URL') || 'https://resbonder.online';
    // Use redirectTo from request if provided, otherwise default to pricing page
    const finalRedirectUrl = redirectTo || `${siteUrl}/pricing`;

    console.log('🔗 Using redirect URL:', finalRedirectUrl);

    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: linkType,
      email: email.toLowerCase(),
      options: {
        redirectTo: finalRedirectUrl,
      },
    });

    if (tokenError || !tokenData) {
      console.error('❌ Failed to generate confirmation link:', tokenError);
      throw tokenError || new Error('Failed to generate confirmation link');
    }

    console.log('✅ Confirmation link generated');
    console.log('🔗 Confirmation URL:', tokenData.properties.action_link.substring(0, 50) + '...');

    // Check Resend configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      throw new Error('RESEND_API_KEY not configured');
    }
    console.log('✅ Resend API key found');

    // Send email via Resend
    console.log('📤 Sending email via Resend...');
    try {
      await sendVerificationEmail(email.toLowerCase(), tokenData.properties.action_link);
      console.log('✅ Email sent successfully via Resend');
    } catch (emailError: any) {
      console.error('❌ Email sending error:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        stack: emailError.stack,
      });
      // Still return success to user (don't reveal email issues)
      return new Response(
        JSON.stringify({
          message: 'Verification email sent successfully',
          warning: 'Email may not have been delivered. Please check logs.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Function completed successfully');
    return new Response(
      JSON.stringify({ message: 'Verification email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in send-verification-email function:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

