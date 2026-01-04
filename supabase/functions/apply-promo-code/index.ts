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
        const { promoId, customerId, bookingId, discountAmount } = await req.json();

        if (!promoId || !customerId || discountAmount === undefined) {
            return new Response(JSON.stringify({ error: 'PromoID, CustomerID, and DiscountAmount are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Record the usage
        const { data, error } = await supabase
            .from('promo_code_usage')
            .insert([
                {
                    promo_id: promoId,
                    user_id: customerId,
                    booking_id: bookingId || null,
                    discount_amount: Number(discountAmount),
                    applied_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            success: true,
            usage: data,
            message: 'Promo code usage recorded successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Apply error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
