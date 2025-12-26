import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UsageLimitPayload {
    userId: string;
    limitType: 'messages' | 'knowledge' | 'products';
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
        const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Reply Ready Bot';
        const siteUrl = Deno.env.get('SITE_URL') || 'https://responder.online';

        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { userId, limitType } = await req.json() as UsageLimitPayload;

        console.log(`🔔 Sending usage limit email to user ${userId} for limit: ${limitType}`);

        // 1. Get user email and current usage status
        const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(userId);
        if (authError || !userAuth.user) throw new Error('User not found');

        const userEmail = userAuth.user.email;
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!userEmail) throw new Error('User has no email');

        // 2. Double check if we should send (spam prevention)
        // Only send if limit_email_sent_at is null or older than 25 days (approx monthly)
        if (subscription?.limit_email_sent_at) {
            const lastSent = new Date(subscription.limit_email_sent_at);
            const now = new Date();
            const diffDays = (now.getTime() - lastSent.getTime()) / (1000 * 3600 * 24);

            if (diffDays < 25) {
                console.log('⏭️ Usage limit email already sent recently, skipping.');
                return new Response(JSON.stringify({ message: 'Email already sent recently' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // 3. Prepare Email Content
        const limitLabel = limitType === 'messages' ? 'Monthly AI Messages' :
            limitType === 'products' ? 'Product Items' : 'Knowledge Base Items';

        const currentUsage = limitType === 'messages' ? subscription?.messages_used :
            limitType === 'products' ? subscription?.products_limit : subscription?.knowledge_base_limit;

        const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1a202c; margin-bottom: 24px;">Usage Limit Reached 🚀</h2>
        <p style="color: #4a5568; line-height: 1.6;">Hello,</p>
        <p style="color: #4a5568; line-height: 1.6;">We wanted to let you know that you have reached your <strong>${limitLabel}</strong> limit on your current ${subscription?.plan || 'free'} plan.</p>
        
        <div style="background-color: #f7fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; color: #718096; font-size: 14px;">Current Plan: <span style="color: #2d3748; font-weight: bold; text-transform: capitalize;">${subscription?.plan || 'Free'}</span></p>
          <p style="margin: 8px 0 0 0; color: #718096; font-size: 14px;">Limit Reached: <span style="color: #e53e3e; font-weight: bold;">${currentUsage} / ${currentUsage}</span></p>
        </div>

        <p style="color: #4a5568; line-height: 1.6;">To continue using the AI assistant without interruption, please consider upgrading to a higher plan.</p>
        
        <div style="margin-top: 32px; text-align: center;">
          <a href="${siteUrl}/pricing" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Upgrade My Plan</a>
        </div>
        
        <hr style="margin: 40px 0 24px 0; border: 0; border-top: 1px solid #edf2f7;" />
        <p style="color: #a0aec0; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Reply Ready Bot. All rights reserved.</p>
      </div>
    `;

        // 4. Send Email via Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${senderName} <${senderEmail}>`,
                to: [userEmail],
                subject: `[Action Required] You've reached your ${limitLabel} limit`,
                html: emailHtml,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Resend error: ${error}`);
        }

        // 5. Update limit_email_sent_at
        await supabase
            .from('subscriptions')
            .update({ limit_email_sent_at: new Date().toISOString() })
            .eq('user_id', userId);

        console.log(`✅ Usage limit email sent successfully to ${userEmail}`);

        return new Response(JSON.stringify({ message: 'Success' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('❌ Error in send-usage-limit-email:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
