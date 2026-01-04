import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { code, customerId, merchantId, amount, planType, productId } = await req.json();

        if (!code || !merchantId) {
            return new Response(JSON.stringify({ error: 'Code and Merchant ID are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch the promo code
        // We look for the code globally since management is now Admin-only or restricted.
        // If a merchantId is provided, we can still use it for logging or specific merchant restrictions if we add them later.
        const { data: promo, error: promoError } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .maybeSingle();

        if (promoError) throw promoError;
        if (!promo) {
            return new Response(JSON.stringify({ valid: false, message: 'Invalid promo code' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Check if enabled
        if (!promo.is_enabled) {
            return new Response(JSON.stringify({ valid: false, message: 'This promo code is disabled' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const now = new Date();

        // 3. Check dates
        if (new Date(promo.start_date) > now) {
            return new Response(JSON.stringify({ valid: false, message: 'This promo code is not active yet' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (promo.end_date && new Date(promo.end_date) < now) {
            return new Response(JSON.stringify({ valid: false, message: 'This promo code has expired' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 4. Check total usage limit
        if (promo.max_uses !== null) {
            const { count: totalUses } = await supabase
                .from('promo_code_usage')
                .select('*', { count: 'exact', head: true })
                .eq('promo_id', promo.id);

            if (totalUses !== null && totalUses >= promo.max_uses) {
                return new Response(JSON.stringify({ valid: false, message: 'This promo code has reached its usage limit' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // 5. Check per-user usage limit (requires customerId)
        if (customerId && promo.max_uses_per_user !== null) {
            const { count: userUses } = await supabase
                .from('promo_code_usage')
                .select('*', { count: 'exact', head: true })
                .eq('promo_id', promo.id)
                .eq('user_id', customerId);

            if (userUses !== null && userUses >= promo.max_uses_per_user) {
                return new Response(JSON.stringify({ valid: false, message: 'You have already used this promo code' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // 6. Check first-time user restriction
        if (promo.is_first_time_only && customerId) {
            // For SAAS plans, check if the user has any payment history or non-free subscription
            // For merchant customers, check if they have any previous usage in THIS merchant's codes
            const { count: totalPreviousUsages } = await supabase
                .from('promo_code_usage')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', customerId);

            if (totalPreviousUsages !== null && totalPreviousUsages > 0) {
                return new Response(JSON.stringify({ valid: false, message: 'This code is for first-time users only' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // 7. Check minimum order amount
        if (amount && Number(amount) < Number(promo.min_order_amount)) {
            return new Response(JSON.stringify({
                valid: false,
                message: `Minimum order amount for this code is $${promo.min_order_amount}`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 8. Check plan restrictions (SAAS Level)
        if (planType && promo.restricted_plans && promo.restricted_plans.length > 0) {
            if (!promo.restricted_plans.includes(planType)) {
                return new Response(JSON.stringify({ valid: false, message: 'This code is not valid for the selected plan' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // 9. Check product restrictions (Merchant Level)
        if (productId && promo.restricted_products && promo.restricted_products.length > 0) {
            if (!promo.restricted_products.includes(productId)) {
                return new Response(JSON.stringify({ valid: false, message: 'This code is not valid for the selected product' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (amount) {
            if (promo.type === 'percentage') {
                discountAmount = (Number(amount) * Number(promo.value)) / 100;
            } else {
                discountAmount = Number(promo.value);
            }
            // Discount cannot exceed amount
            discountAmount = Math.min(discountAmount, Number(amount));
        }

        return new Response(JSON.stringify({
            valid: true,
            promoId: promo.id,
            type: promo.type,
            value: promo.value,
            discountAmount,
            finalAmount: amount ? Math.max(0, Number(amount) - discountAmount) : null,
            message: 'Promo code applied successfully!'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Validation error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
