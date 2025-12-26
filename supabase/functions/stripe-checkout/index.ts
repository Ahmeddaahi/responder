import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, plan, email } = await req.json();

    if (!userId || !plan || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, plan, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Define plan prices
    const planPrices: Record<string, { amount: number; name: string; messageLimit: number }> = {
      starter: { amount: 500, name: 'Starter Plan', messageLimit: 500 },
      enterprise: { amount: 2500, name: 'Enterprise Plan', messageLimit: 5000 },
    };

    if (!planPrices[plan]) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedPlan = planPrices[plan];

    // Get the base URL from the environment or request
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const successUrl = `${baseUrl.replace('functions/v1/stripe-checkout', '')}pricing?success=true&plan=${plan}`;
    const cancelUrl = `${baseUrl.replace('functions/v1/stripe-checkout', '')}pricing?canceled=true`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: `${selectedPlan.messageLimit} messages per month`,
            },
            unit_amount: selectedPlan.amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        plan: plan,
        messageLimit: selectedPlan.messageLimit.toString(),
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in stripe-checkout function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

