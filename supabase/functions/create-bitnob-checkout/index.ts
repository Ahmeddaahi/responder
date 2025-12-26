import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan pricing configuration
const PLAN_PRICING: Record<string, { price: number; messageLimit: number }> = {
    'starter': { price: 5, messageLimit: 500 },
    'enterprise': { price: 25, messageLimit: 5000 },
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const BITNOB_API_KEY = Deno.env.get("BITNOB_API_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        if (!BITNOB_API_KEY) {
            throw new Error("Bitnob API key not configured");
        }

        // Get user from authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Authorization required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Verify user
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid authorization' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        const { plan_id, customer_email } = await req.json();

        if (!plan_id) {
            return new Response(
                JSON.stringify({ error: 'plan_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get plan details
        const planDetails = PLAN_PRICING[plan_id];
        if (!planDetails) {
            return new Response(
                JSON.stringify({ error: 'Invalid plan_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate unique order ID
        const orderId = crypto.randomUUID();

        // Get Supabase project ID for callback URL
        const supabaseProjectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

        // Prepare Bitnob checkout payload
        // Note: amount is in cents (1 USD = 100 cents)
        const paymentPayload = {
            amount: planDetails.price * 100,
            currency: "USD",
            reference: orderId,
            description: `Payment for ${plan_id} plan`,
            customerEmail: customer_email || user.email,
            notificationEmail: user.email,
            callbackUrl: `https://${supabaseProjectId}.supabase.co/functions/v1/bitnob-webhook`,
            successUrl: `${req.headers.get('origin') || 'https://resbonder.online'}/payment/success?order_id=${orderId}`,
            cancelUrl: `${req.headers.get('origin') || 'https://resbonder.online'}/payment/failed?order_id=${orderId}`,
        };

        console.log('Creating Bitnob checkout with payload:', JSON.stringify(paymentPayload));

        // Call Bitnob API
        const bitnobResponse = await fetch('https://api.bitnob.co/api/v1/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BITNOB_API_KEY}`,
            },
            body: JSON.stringify(paymentPayload),
        });

        const bitnobData = await bitnobResponse.json();

        if (!bitnobResponse.ok || !bitnobData.status) {
            console.error('Bitnob API error:', bitnobData);
            throw new Error(bitnobData.message || 'Failed to create Bitnob checkout');
        }

        const checkoutUrl = bitnobData.data?.checkoutUrl;

        if (!checkoutUrl) {
            console.error('No checkout URL in Bitnob response:', bitnobData);
            throw new Error('No checkout URL received from Bitnob');
        }

        // Store payment in database
        const { error: dbError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                plan_id: plan_id,
                order_id: orderId,
                amount: planDetails.price,
                currency: 'USD',
                status: 'pending',
                payment_url: checkoutUrl,
            });

        if (dbError) {
            console.error('Database error:', dbError);
            throw new Error('Failed to save payment record');
        }

        // Return checkout URL
        return new Response(
            JSON.stringify({
                success: true,
                payment_url: checkoutUrl,
                order_id: orderId,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in create-bitnob-checkout:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
