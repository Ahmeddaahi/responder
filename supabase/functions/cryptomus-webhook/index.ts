import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyCryptomusSignature } from "../_shared/crypto/sign.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sign',
};

// Plan configuration
const PLAN_CONFIG: Record<string, { messageLimit: number }> = {
    'starter': { messageLimit: 500 },
    'enterprise': { messageLimit: 5000 },
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const API_KEY = Deno.env.get("CRYPTO_MUS_API_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        if (!API_KEY) {
            throw new Error("Cryptomus API key not configured");
        }

        // Parse webhook payload
        const payload = await req.json();

        // Get signature from header
        const receivedSignature = req.headers.get('sign');

        if (!receivedSignature) {
            console.error('Missing signature in webhook');
            return new Response(
                JSON.stringify({ error: 'Missing signature' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify signature
        const isValid = await verifyCryptomusSignature(payload, receivedSignature, API_KEY);

        if (!isValid) {
            console.error('Invalid webhook signature');
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Extract payment data
        const { order_id, status, txid } = payload;

        if (!order_id) {
            console.error('Missing order_id in webhook payload');
            return new Response(
                JSON.stringify({ error: 'Missing order_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Webhook received for order ${order_id}, status: ${status}`);

        // Get payment record
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', order_id)
            .single();

        if (fetchError || !payment) {
            console.error('Payment not found:', order_id);
            return new Response(
                JSON.stringify({ error: 'Payment not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Map Cryptomus status to our status
        let paymentStatus = 'pending';
        if (status === 'paid' || status === 'paid_over') {
            paymentStatus = 'paid';
        } else if (status === 'cancel' || status === 'system_fail' || status === 'fail') {
            paymentStatus = 'failed';
        } else if (status === 'wrong_amount' || status === 'wrong_amount_waiting') {
            paymentStatus = 'failed';
        }

        // Update payment record
        const updateData: any = {
            status: paymentStatus,
            txid: txid || payment.txid,
        };

        if (paymentStatus === 'paid') {
            updateData.paid_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('payments')
            .update(updateData)
            .eq('order_id', order_id);

        if (updateError) {
            console.error('Failed to update payment:', updateError);
            throw new Error('Failed to update payment');
        }

        // If payment is successful, update user subscription or managed setup
        if (paymentStatus === 'paid') {
            if (payment.plan_id === 'managed_setup') {
                // Update the managed_setups table
                const { error: setupError } = await supabase
                    .from('managed_setups')
                    .update({
                        payment_status: 'verified',
                    })
                    .eq('user_id', payment.user_id)
                    .eq('payment_method', 'crypto')
                    .eq('payment_status', 'pending');

                if (setupError) {
                    console.error('Failed to update managed setup:', setupError);
                } else {
                    console.log(`Managed setup updated for user ${payment.user_id}`);
                }
            } else {
                const planConfig = PLAN_CONFIG[payment.plan_id];

                if (planConfig) {
                    // Update subscription
                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .upsert({
                            user_id: payment.user_id,
                            plan: payment.plan_id,
                            message_limit: planConfig.messageLimit,
                            messages_used: 0,
                            is_active: true,
                            started_at: new Date().toISOString(),
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        }, {
                            onConflict: 'user_id'
                        });

                    if (subError) {
                        console.error('Failed to update subscription:', subError);
                        // Don't throw error - payment was successful, we can retry subscription update
                    } else {
                        console.log(`Subscription updated for user ${payment.user_id}, plan: ${payment.plan_id}`);
                    }
                }
            }
        }

        // Return success response
        return new Response(
            JSON.stringify({ success: true, status: paymentStatus }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in cryptomus-webhook:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
