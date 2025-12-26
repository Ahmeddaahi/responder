import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendAdminPaymentNotificationBody {
  userEmail: string;
  userName: string | null;
  requestedPlan: string;
  currentPlan: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  paymentPhone?: string;
  paymentName?: string;
  receiptUrl?: string;
  timestamp: string;
}

// Plan name mapping
const planNames: Record<string, string> = {
  free: 'Free Plan',
  starter: 'Starter Plan',
  enterprise: 'Enterprise Plan',
};

// Payment method display names
const paymentMethodNames: Record<string, string> = {
  ebirr: 'eBirr',
  zaad: 'Zaad',
  edahab: 'eDahab',
  crypto: 'Cryptocurrency',
};

// Admin email - hardcoded as specified
const ADMIN_EMAIL = 'ahmedexka@gmail.com';

// Send admin payment notification email via Resend
async function sendAdminPaymentNotification(data: SendAdminPaymentNotificationBody): Promise<void> {
  console.log('📧 sendAdminPaymentNotification called for admin:', ADMIN_EMAIL);

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in environment');
    throw new Error('RESEND_API_KEY not configured');
  }
  console.log('✅ RESEND_API_KEY found');

  const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
  const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Reply Ready Bot';
  const siteUrl = Deno.env.get('SITE_URL') || 'https://resbonder.online';

  const planName = planNames[data.requestedPlan] || data.requestedPlan;
  const currentPlanName = planNames[data.currentPlan] || data.currentPlan;
  const paymentMethodName = paymentMethodNames[data.paymentMethod] || data.paymentMethod;
  const adminDashboardUrl = `${siteUrl}/admin`;
  const paymentVerificationUrl = `${siteUrl}/payment-verification`;

  // Format timestamp
  const timestamp = new Date(data.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  console.log('📋 Email configuration:', {
    senderEmail: senderEmail,
    senderName: senderName,
    recipient: ADMIN_EMAIL,
    userEmail: data.userEmail,
    plan: planName,
  });

  const emailBody = {
    from: `${senderName} <${senderEmail}>`,
    to: [ADMIN_EMAIL],
    subject: `New Payment Request - ${planName} - ${data.userEmail}`,
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
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
            .alert-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px 20px;
              margin-bottom: 30px;
              border-radius: 6px;
            }
            .alert-text {
              color: #92400e;
              font-size: 16px;
              font-weight: 600;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e5e7eb;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
              font-size: 14px;
            }
            .info-value {
              color: #1a1a1a;
              font-size: 14px;
              text-align: right;
              font-weight: 500;
            }
            .plan-badge {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
            }
            .amount-badge {
              display: inline-block;
              background-color: #10b981;
              color: #ffffff;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 16px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .action-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
              margin: 0 10px;
            }
            .action-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }
            .receipt-link {
              color: #667eea;
              text-decoration: none;
              font-weight: 500;
              word-break: break-all;
            }
            .receipt-link:hover {
              text-decoration: underline;
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
            @media only screen and (max-width: 600px) {
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .action-button { 
                padding: 14px 30px;
                font-size: 14px;
                display: block;
                margin: 10px 0;
              }
              .info-row {
                flex-direction: column;
              }
              .info-value {
                text-align: left;
                margin-top: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="header-title">New Payment Request 🎯</div>
            </div>
            <div class="content">
              <div class="alert-box">
                <div class="alert-text">A new payment request requires your verification</div>
              </div>
section">
                <div class="section-title">User Information</div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${data.userEmail}</span>
                </div>
                ${data.userName ? `
                <div class="info-row">
                  <span class="info-label">Full Name:</span>
                  <span class="info-value">${data.userName}</span>
                </div>
                ` : ''}
              </div>

              <div class="section">
                <div class="section-title">Payment Details</div>
                <div class="info-row">
                  <span class="info-label">Requested Plan:</span>
                  <span class="info-value"><span class="plan-badge">${planName}</span></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Current Plan:</span>
                  <span class="info-value">${currentPlanName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Amount:</span>
                  <span class="info-value"><span class="amount-badge">$${data.amount.toFixed(2)}</span></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${paymentMethodName}</span>
                </div>
                ${data.transactionReference ? `
                <div class="info-row">
                  <span class="info-label">Transaction Reference:</span>
                  <span class="info-value">${data.transactionReference}</span>
                </div>
                ` : ''}
                ${data.paymentPhone ? `
                <div class="info-row">
                  <span class="info-label">Payment Phone:</span>
                  <span class="info-value">${data.paymentPhone}</span>
                </div>
                ` : ''}
                ${data.paymentName ? `
                <div class="info-row">
                  <span class="info-label">Payment Name:</span>
                  <span class="info-value">${data.paymentName}</span>
                </div>
                ` : ''}
                ${data.receiptUrl ? `
                <div class="info-row">
                  <span class="info-label">Receipt:</span>
                  <span class="info-value"><a href="${data.receiptUrl}" class="receipt-link" target="_blank">View Receipt</a></span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Submitted:</span>
                  <span class="info-value">${timestamp}</span>
                </div>
              </div>

              <div class="button-container">
                <a href="${paymentVerificationUrl}" class="action-button">Review Payment</a>
                <a href="${adminDashboardUrl}" class="action-button">Admin Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <div class="footer-text">
                This is an automated notification from the payment system.
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `New Payment Request 🎯\n\nA new payment request requires your verification\n\nUser Information:\nEmail: ${data.userEmail}${data.userName ? `\nFull Name: ${data.userName}` : ''}\n\nPayment Details:\nRequested Plan: ${planName}\nCurrent Plan: ${currentPlanName}\nAmount: $${data.amount.toFixed(2)}\nPayment Method: ${paymentMethodName}${data.transactionReference ? `\nTransaction Reference: ${data.transactionReference}` : ''}${data.paymentPhone ? `\nPayment Phone: ${data.paymentPhone}` : ''}${data.paymentName ? `\nPayment Name: ${data.paymentName}` : ''}${data.receiptUrl ? `\nReceipt: ${data.receiptUrl}` : ''}\nSubmitted: ${timestamp}\n\nReview Payment: ${paymentVerificationUrl}\nAdmin Dashboard: ${adminDashboardUrl}\n\nThis is an automated notification from the payment system.`,
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
  console.log('📧 send-admin-payment-notification function called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    const data: SendAdminPaymentNotificationBody = await req.json();
    console.log('Request data:', data);

    if (!data.userEmail) {
      console.error('❌ userEmail is required');
      return new Response(
        JSON.stringify({ error: 'userEmail is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.requestedPlan) {
      console.error('❌ requestedPlan is required');
      return new Response(
        JSON.stringify({ error: 'requestedPlan is required' }),
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
      await sendAdminPaymentNotification(data);
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
      JSON.stringify({ message: 'Admin payment notification email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in send-admin-payment-notification function:', error);
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

