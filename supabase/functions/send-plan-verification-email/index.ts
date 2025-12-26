import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendPlanVerificationEmailBody {
  email: string;
  plan: string;
}

// Plan name mapping
const planNames: Record<string, string> = {
  free: 'Free Plan',
  starter: 'Starter Plan',
  enterprise: 'Enterprise Plan',
};

// Plan message limits
const planLimits: Record<string, number> = {
  free: 50,
  starter: 500,
  enterprise: 5000,
};

// Send plan verification email via Resend
async function sendPlanVerificationEmail(email: string, plan: string): Promise<void> {
  console.log('📧 sendPlanVerificationEmail called for:', email, 'plan:', plan);

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in environment');
    throw new Error('RESEND_API_KEY not configured');
  }
  console.log('✅ RESEND_API_KEY found');

  const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
  const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Reply Ready Bot';
  const siteUrl = Deno.env.get('SITE_URL') || 'https://resbonder.online';

  const planName = planNames[plan] || plan;
  const messageLimit = planLimits[plan] || 0;
  const dashboardUrl = `${siteUrl}/dashboard`;

  console.log('📋 Email configuration:', {
    senderEmail: senderEmail,
    senderName: senderName,
    recipient: email,
    plan: planName,
    messageLimit,
  });

  const emailBody = {
    from: `${senderName} <${senderEmail}>`,
    to: [email],
    subject: `Your plan has been verified - ${planName}`,
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
            .plan-box {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #667eea;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            }
            .plan-name {
              font-size: 24px;
              font-weight: 700;
              color: #667eea;
              margin-bottom: 10px;
            }
            .plan-details {
              font-size: 16px;
              color: #4a4a4a;
              margin-top: 10px;
            }
            .plan-limit {
              font-size: 20px;
              font-weight: 600;
              color: #1a1a1a;
              margin-top: 5px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .dashboard-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            .dashboard-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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
              .dashboard-button { 
                padding: 14px 30px;
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="header-title">Plan Verified! 🎉</div>
            </div>
            <div class="content">
              <div class="greeting">Hello!</div>
              <div class="message">
                Great news! Your payment has been verified and your plan has been successfully activated. You can now start using all the features available in your plan.
              </div>
              
              <div class="plan-box">
                <div class="plan-name">${planName}</div>
                <div class="plan-details">Your plan includes:</div>
                <div class="plan-limit">${messageLimit.toLocaleString()} messages per month</div>
              </div>

              <div class="button-container">
                <a href="${dashboardUrl}" class="dashboard-button">Go to Dashboard</a>
              </div>

              <div class="info-box">
                <div class="info">
                  ✅ Your plan is now active and ready to use. Start by configuring your AI agent and uploading your business knowledge base to get started.
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
    text: `Plan Verified! 🎉\n\nHello!\n\nGreat news! Your payment has been verified and your plan has been successfully activated. You can now start using all the features available in your plan.\n\n${planName}\nYour plan includes: ${messageLimit.toLocaleString()} messages per month\n\nGo to Dashboard: ${dashboardUrl}\n\n✅ Your plan is now active and ready to use. Start by configuring your AI agent and uploading your business knowledge base to get started.\n\nNeed help? Contact our support team if you have any questions.\n\nBest regards,\n${senderName} Team`,
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
  console.log('📧 send-plan-verification-email function called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    const { email, plan }: SendPlanVerificationEmailBody = await req.json();
    console.log('Request data:', { email, plan });

    if (!email) {
      console.error('❌ Email is required');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!plan) {
      console.error('❌ Plan is required');
      return new Response(
        JSON.stringify({ error: 'Plan is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      await sendPlanVerificationEmail(email.toLowerCase(), plan);
      console.log('✅ Email sent successfully via Resend');
    } catch (emailError: any) {
      console.error('❌ Email sending error:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        stack: emailError.stack,
      });
      throw emailError;
    }

    console.log('✅ Function completed successfully');
    return new Response(
      JSON.stringify({ message: 'Plan verification email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in send-plan-verification-email function:', error);
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

