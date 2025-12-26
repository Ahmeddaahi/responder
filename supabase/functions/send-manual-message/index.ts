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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get Auth user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('❌ No Authorization header found');
            return new Response(JSON.stringify({ error: 'No Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('❌ Auth error or no user:', authError);
            return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { customerId, message, platform } = await req.json();

        if (platform !== 'whatsapp') {
            return new Response(JSON.stringify({ error: 'Only WhatsApp is supported for manual replies' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 1. Check Plan & Limits
        const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select('messages_used, message_limit, plan')
            .eq('user_id', user.id)
            .single();

        if (subError || !subData) {
            return new Response(JSON.stringify({ error: 'Subscription not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (subData.plan === 'free') {
            return new Response(JSON.stringify({ error: 'Manual reply is a Pro feature. Please upgrade.' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (subData.messages_used >= subData.message_limit) {
            return new Response(JSON.stringify({ error: 'Message limit reached. Please upgrade.' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Get WhatsApp Agent Config
        const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('meta_token, phone_number_id')
            .eq('user_id', user.id)
            .eq('platform', 'whatsapp')
            .eq('is_active', true)
            .maybeSingle();

        if (agentError || !agentData) {
            return new Response(JSON.stringify({ error: 'WhatsApp agent not found or inactive' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 3. Send via WhatsApp API
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${agentData.phone_number_id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${agentData.meta_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: customerId,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: message,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('WhatsApp API error:', errorData);
            return new Response(JSON.stringify({ error: 'Failed to send WhatsApp message', details: errorData }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 4. Log the message
        console.log('Logging manual message to DB...', {
            user_id: user.id,
            customer_id: customerId,
            message_text: "",
            ai_response: message,
            platform: 'whatsapp'
        });

        const { data: logData, error: logError } = await supabase
            .from('message_logs')
            .insert({
                user_id: user.id,
                customer_id: customerId,
                message_text: "",
                ai_response: message,
                platform: 'whatsapp'
            })
            .select();

        if (logError) {
            console.error('❌ Error logging message:', logError);
            // We don't return error here because the message WAS sent to the customer
        } else {
            console.log('✅ Message logged successfully:', logData);
        }

        // 5. Update Conversation Mode to 'human'
        console.log('Switching conversation to human mode...', { customer_id: customerId, platform });
        const { error: modeError } = await supabase
            .from('conversation_control')
            .upsert({
                user_id: user.id,
                customer_id: customerId,
                platform: platform,
                mode: 'human',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,customer_id,platform'
            });

        if (modeError) {
            console.error('❌ Error updating conversation mode:', modeError);
        } else {
            console.log('✅ Conversation switched to human mode');
        }

        // 6. Increment message count
        console.log('Incrementing message count for user:', user.id);
        const { error: incrementError } = await supabase.rpc('increment_message_count', {
            p_user_id: user.id
        });

        if (incrementError) {
            console.error('⚠️ Error incrementing message count:', incrementError);
        } else {
            console.log('✅ Message count incremented');
        }

        return new Response(JSON.stringify({ success: true, messageId: logData?.[0]?.id, mode: 'human' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('❌ Error in send-manual-message:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
