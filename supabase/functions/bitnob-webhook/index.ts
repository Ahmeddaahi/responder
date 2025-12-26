import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyBitnobSignature } from "../_shared/crypto/bitnob.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bitnob-signature',
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
        const BITNOB_API_KEY = Deno.env.get("BITNOB_API_KEY"); // Using API Key as secret if no specific webhook secret
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        if (!BITNOB_API_KEY) {
            throw new Error("Bitnob API key not configured");
        }

        // Get signature from header
        const receivedSignature = req.headers.get('x-bitnob-signature');

        if (!receivedSignature) {
            console.error('Missing x-bitnob-signature in webhook');
            return new Response(
                JSON.stringify({ error: 'Missing signature' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Retrieve raw body for signature verification
        const rawBody = await req.text();

        // Verify signature
        const isValid = await verifyBitnobSignature(rawBody, receivedSignature, BITNOB_API_KEY);

        if (!isValid) {
            console.error('Invalid Bitnob webhook signature');
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Now parse the payload
        const payload = JSON.parse(rawBody);
        console.log('Bitnob webhook received:', JSON.stringify(payload));

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Extract event and data
        const event = payload.event;
        const data = payload.data;

        // Check for checkout completion event
        if (event === 'checkout.received.paid') {
            const order_id = data.reference;

            if (!order_id) {
                console.error('Missing reference in checkout.received.paid event');
                return new Response(JSON.stringify({ error: 'Missing reference' }), { status: 400 });
            }

            // Get payment record
            const { data: payment, error: fetchError } = await supabase
                .from('payments')
                .select('*')
                .eq('order_id', order_id)
                .single();

            if (fetchError || !payment) {
                console.error('Payment not found for reference:', order_id);
                return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404 });
            }

            // Update payment record to paid
            const { error: updateError } = await supabase
                .from('payments')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    txid: data.id || null
                })
                .eq('order_id', order_id);

            if (updateError) {
                console.error('Failed to update payment status:', updateError);
                throw updateError;
            }

            // Update user subscription
            const planConfig = PLAN_CONFIG[payment.plan_id];
            if (planConfig) {
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: payment.user_id,
                        plan: payment.plan_id,
                        message_limit: planConfig.messageLimit,
                        messages_used: 0,
                        is_active: true,
                        started_at: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id'
                    });

                if (subError) {
                    console.error('Failed to update subscription:', subError);
                } else {
                    console.log(`Subscription updated for user ${payment.user_id}, plan: ${payment.plan_id}`);
                }
            }

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        // Handle underpaid or other events if needed
        console.log(`Unhandled Bitnob event: ${event}`);

        return new Response(JSON.stringify({ success: true, message: 'Event received but not processed' }), { status: 200 });

    } catch (error: any) {
        console.error('Error in bitnob-webhook:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
