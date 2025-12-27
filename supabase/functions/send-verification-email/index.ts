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

// Send welcoming/verification email via Resend
async function sendWelcomeEmail(email: string, actionUrl: string, isVerified: boolean): Promise<void> {
  console.log('📧 sendWelcomeEmail called for:', email, 'isVerified:', isVerified);

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in environment');
    throw new Error('RESEND_API_KEY not configured');
  }

  const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
  const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Resbonder';
  const logoUrl = 'https://resbonder.online/favicon.webp';

  const subject = isVerified
    ? 'Welcome to Resbonder! 🚀'
    : 'Verify your email - Resbonder';

  const title = isVerified ? 'Welcome to Resbonder' : 'Verify your email';
  const message = isVerified
    ? "We're absolutely thrilled to have you on board! Your account has been successfully set up and is ready for action. You can now start building your AI-powered WhatsApp business agent."
    : "Thank you for choosing Resbonder. We're excited to help you automate your business communications on WhatsApp. Before we get started, please confirm your email address to secure your account.";

  const buttonText = isVerified ? 'Go to Dashboard' : 'Confirm Email Address';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #ffffff;
            padding-bottom: 40px;
          }
          .content-card {
            max-width: 560px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .logo-wrapper {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            display: inline-block;
          }
          .header-title {
            font-size: 32px;
            font-weight: 700;
            color: #111827;
            text-align: center;
            margin-bottom: 24px;
            letter-spacing: -0.025em;
          }
          .main-text {
            font-size: 16px;
            color: #4b5563;
            text-align: center;
            margin-bottom: 32px;
            line-height: 1.7;
          }
          .button-wrapper {
            text-align: center;
            margin-bottom: 32px;
          }
          .action-button {
            background-color: #000000;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            font-weight: 600;
            border-radius: 10px;
            display: inline-block;
            font-size: 16px;
            transition: opacity 0.2s;
          }
          .divider {
            height: 1px;
            background-color: #f3f4f6;
            margin: 40px 0;
          }
          .footer-section {
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
          }
          .footer-text {
            margin-bottom: 8px;
          }
          .brand-name {
            color: #111827;
            font-weight: 600;
            font-size: 16px;
          }
          .link-fallback {
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
            margin-top: 24px;
            word-break: break-all;
          }
          .link-fallback a {
            color: #6b7280;
            text-decoration: underline;
          }
          @media only screen and (max-width: 600px) {
            .header-title { font-size: 28px; }
            .content-card { padding: 40px 16px; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="content-card">
            <div class="logo-wrapper">
              <img src="${logoUrl}" alt="Resbonder" class="logo">
            </div>
            
            <h1 class="header-title">${title}</h1>
            
            <p class="main-text">
              ${message}
            </p>
            
            <div class="button-wrapper">
              <a href="${actionUrl}" class="action-button">${buttonText}</a>
            </div>

            <div class="link-fallback">
              Trouble clicking? Copy and paste this URL into your browser:<br>
              <a href="${actionUrl}">${actionUrl}</a>
            </div>

            <div class="divider"></div>
            
            <div class="footer-section">
              <p class="footer-text">This email was sent to confirm your identity with Resbonder.</p>
              <p class="brand-name">Resbonder Team</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const emailBody = {
    from: `${senderName} <${senderEmail}>`,
    to: [email],
    subject: subject,
    html: emailHtml,
    text: `${title}\n\nHello!\n\n${message}\n\n${buttonText}: ${actionUrl}`,
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Resend API error:', errorText);
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
    let linkType: 'signup' | 'magiclink' | 'invite' = 'signup';
    const isVerified = !!user.email_confirmed_at;

    if (isVerified) {
      console.log('⚠️ User email already verified, sending welcome email with magic link');
      linkType = 'magiclink';
    } else {
      console.log('🔑 User needs email verification, generating signup confirmation link');
    }

    console.log('🔑 Generating link (type:', linkType, ')...');

    // Redirect to pricing page after verification so new users can choose their plan
    const siteUrl = Deno.env.get('SITE_URL') || 'https://resbonder.online';

    // For verified users, if no redirectTo is provided, default to dashboard
    const defaultRedirect = isVerified ? `${siteUrl}/dashboard` : `${siteUrl}/pricing`;
    const finalRedirectUrl = redirectTo || defaultRedirect;

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

    // Send email via Resend
    console.log('📤 Sending email via Resend...');
    try {
      await sendWelcomeEmail(
        email.toLowerCase(),
        tokenData.properties.action_link,
        isVerified
      );
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

