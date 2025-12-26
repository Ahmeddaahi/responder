import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateCryptomusSignature } from "../_shared/crypto/sign.ts";

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
        const MERCHANT_ID = Deno.env.get("CRYPTO_MUS_MERCHANT_ID");
        const API_KEY = Deno.env.get("CRYPTO_MUS_API_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        if (!MERCHANT_ID || !API_KEY) {
            throw new Error("Cryptomus credentials not configured");
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
        const { plan_id } = await req.json();

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

        // Prepare Cryptomus payment payload
        const paymentPayload = {
            amount: planDetails.price.toFixed(2),
            currency: "USDT",
            order_id: orderId,
            url_callback: `https://${supabaseProjectId}.supabase.co/functions/v1/cryptomus-webhook`,
            url_success: `${req.headers.get('origin') || 'https://your-app.vercel.app'}/payment/success?order_id=${orderId}`,
            url_return: `${req.headers.get('origin') || 'https://your-app.vercel.app'}/payment/failed?order_id=${orderId}`,
        };

        // Generate signature
        const signature = await generateCryptomusSignature(paymentPayload, API_KEY);

        // Call Cryptomus API
        const cryptomusResponse = await fetch('https://api.cryptomus.com/v1/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'merchant': MERCHANT_ID,
                'sign': signature,
            },
            body: JSON.stringify(paymentPayload),
        });

        const cryptomusData = await cryptomusResponse.json();

        if (!cryptomusResponse.ok || cryptomusData.state !== 0) {
            console.error('Cryptomus API error:', cryptomusData);
            throw new Error(cryptomusData.message || 'Failed to create payment order');
        }

        // Store payment in database
        const { error: dbError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                plan_id: plan_id,
                order_id: orderId,
                amount: planDetails.price,
                currency: 'USDT',
                status: 'pending',
                payment_url: cryptomusData.result?.url || null,
            });

        if (dbError) {
            console.error('Database error:', dbError);
            throw new Error('Failed to save payment record');
        }

        // Return payment URL
        return new Response(
            JSON.stringify({
                success: true,
                payment_url: cryptomusData.result?.url,
                order_id: orderId,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in create-cryptomus-order:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
