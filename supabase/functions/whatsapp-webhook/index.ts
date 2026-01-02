import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.170.0/node/crypto.ts";
import { checkProtection } from "../_shared/protection.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

interface WhatsAppMessage {
    from: string;
    id: string;
    timestamp: string;
    text?: {
        body: string;
    };
    type: string;
}

interface WhatsAppWebhookEntry {
    id: string;
    changes: Array<{
        value: {
            messaging_product: string;
            metadata: {
                display_phone_number: string;
                phone_number_id: string;
            };
            contacts?: Array<{
                profile: {
                    name: string;
                };
                wa_id: string;
            }>;
            messages?: WhatsAppMessage[];
        };
        field: string;
    }>;
}

interface WhatsAppWebhook {
    object: string;
    entry: WhatsAppWebhookEntry[];
}

async function sendWhatsAppMessage(
    phoneNumberId: string,
    accessToken: string,
    recipientPhone: string,
    messageText: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: recipientPhone,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: messageText,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('WhatsApp API error:', errorData);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return false;
    }
}

function verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    try {
        const expectedSignature = createHmac('sha256', appSecret)
            .update(payload)
            .digest('hex');

        return signature === `sha256=${expectedSignature}`;
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
}

// Function to detect if a message is in Somali or English
function detectLanguage(text: string): 'somali' | 'english' {
    const somaliWords = [
        'waxa', 'waa', 'ay', 'iyo', 'aan', 'ku', 'ka', 'uu', 'so', 'ma', 'la', 'leh',
        'ah', 'ee', 'oo', 'aanu', 'waxay', 'waxuu', 'waxaan', 'waxaad', 'waxaad',
        'mahadsanid', 'fadlan', 'ma', 'haye', 'maya', 'waa', 'maaha', 'sida', 'sidan',
        'inta', 'marka', 'intaas', 'xagga', 'xaga', 'agaasime', 'agaasimaha',
        'waqtiga', 'waqti', 'qof', 'dadka', 'qoyska', 'magaca', 'jirka', 'waddanka',
        'dalka', 'magaalada', 'guriga', 'suuq', 'suuqa', 'dukaan', 'dukaanka',
        'baabuur', 'bas', 'daawada', 'cunto', 'biyo', 'caano', 'shaah', 'qaxwo',
        'macaan', 'qadhaadh', 'cusub', 'cusba', 'gabow', 'weyn', 'yar', 'fiican',
        'xun', 'wacan', 'wanaagsan', 'badan', 'yar', 'inta', 'intaas', 'inta',
        'sida', 'sidan', 'marka', 'haddii', 'haddaan', 'haddii', 'haddaan',
        'maxaa', 'maxay', 'maxuu', 'muxuu', 'muxay', 'waxaa', 'waxay', 'waxuu',
        'sidee', 'waxuu', 'waxay', 'waxaan', 'waxaad', 'waxaynu', 'waxayna',
        'waxaad', 'waxaad', 'waxaan', 'waxaad', 'waxaan', 'waxaad', 'waxaan',
        // Add more common Somali words, especially question words and verbs
        'maad', 'haysaan', 'haysaa', 'haysa', 'haysatid', 'haysan', 'hayso',
        'maxay', 'maxaa', 'muxuu', 'sidee', 'xaggee', 'goorma', 'immisa',
        'hadal', 'soomaali', 'soomaaliya', 'somali', 'imisaad', 'na', 'kan', 'kana'
    ];

    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);

    // Check for explicit language requests first
    if (textLower.includes('somali ku hadal') || textLower.includes('somali ku hadal') ||
        textLower.includes('soomaali ku hadal') || textLower.includes('soomaali ku hadal') ||
        textLower.includes('english') && (textLower.includes('speak') || textLower.includes('talk'))) {
        // If user explicitly requests a language, respect that but still detect the message language
        // Continue with detection below
    }

    // Count Somali words
    let somaliWordCount = 0;
    for (const word of words) {
        // Remove punctuation for comparison
        const cleanWord = word.replace(/[.,!?;:()"']/g, '');
        if (somaliWords.includes(cleanWord)) {
            somaliWordCount++;
        }
    }

    // Check for common Somali patterns
    // Somali often uses double letters and specific letter combinations
    const somaliPatterns = [
        /(aa|ee|ii|oo|uu){2,}/, // Double vowels (common in Somali)
        /(dh|kh|sh|ch|x|q|w|y)[aeiou]/gi, // Common Somali consonant clusters
        /\b(waxa|waa|ay|iyo|aan|ku|ka|uu|maad|haysaan|haysaa|haysa)\b/gi, // Common Somali words
        /\b(maad|haysaan|haysaa|haysa|maxay|maxaa|sidee)\b/gi, // Question words
    ];

    let patternMatches = 0;
    for (const pattern of somaliPatterns) {
        if (pattern.test(text)) {
            patternMatches++;
        }
    }

    // If we find multiple Somali words or patterns, it's likely Somali
    // Lower threshold to 10% to catch messages like "a12 maad haysaan"
    const somaliLikelihood = (somaliWordCount / Math.max(words.length, 1)) * 100 + (patternMatches * 10);

    // If at least 1 Somali word found OR pattern matches, classify as Somali (more sensitive)
    // This catches short messages like "a12 maad haysaan" where "maad" and "haysaan" are Somali
    if (somaliWordCount > 0 || patternMatches > 0) {
        return 'somali';
    }

    // Otherwise default to English
    return somaliLikelihood > 10 ? 'somali' : 'english';
}

serve(async (req) => {
    // Log all incoming requests for debugging
    console.log('🌐 Incoming request:', {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries())
    });

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        console.log('✅ CORS preflight request handled');
        return new Response(null, { headers: corsHeaders });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle GET request for webhook verification
    if (req.method === 'GET') {
        console.log('📥 GET request received - processing webhook verification');
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        console.log('🔍 Webhook verification request received');
        console.log('  - Mode:', mode);
        console.log('  - Token received:', token ? '***' + token.slice(-4) : 'null');
        console.log('  - Challenge:', challenge);

        // Verify the token (you can set a custom verify token)
        const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'responder_verify';
        console.log('  - Expected token:', verifyToken ? '***' + verifyToken.slice(-4) : 'null');
        console.log('  - Token match:', token === verifyToken ? '✅ YES' : '❌ NO');
        console.log('  - Mode match:', mode === 'subscribe' ? '✅ YES' : '❌ NO');

        // Health check endpoint - responds to any GET request for testing
        if (!mode && !token && !challenge) {
            console.log('💚 Health check request received');
            return new Response(JSON.stringify({
                status: 'ok',
                message: 'WhatsApp webhook endpoint is accessible',
                verifyToken: verifyToken ? '***' + verifyToken.slice(-4) : 'not set (using default)',
                timestamp: new Date().toISOString()
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                },
            });
        }

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ Webhook verified successfully');
            console.log('✅ Returning challenge:', challenge);
            return new Response(challenge, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    ...corsHeaders
                },
            });
        } else {
            console.error('❌ Webhook verification failed');
            console.error('  - Mode:', mode, '(expected: subscribe)');
            console.error('  - Token match:', token === verifyToken ? 'YES' : 'NO');
            console.error('  - Expected token:', verifyToken);
            console.error('  - Received token:', token);

            if (mode !== 'subscribe') {
                console.error('  - Error: Mode is not "subscribe"');
            }
            if (token !== verifyToken) {
                console.error('  - Error: Verify token mismatch');
                console.error('  - Make sure WHATSAPP_VERIFY_TOKEN in Supabase secrets matches the token in Meta');
            }

            return new Response(JSON.stringify({
                error: 'Forbidden',
                message: 'Webhook verification failed',
                details: {
                    mode: mode || 'missing',
                    modeExpected: 'subscribe',
                    tokenMatch: token === verifyToken,
                    expectedTokenLast4: verifyToken ? verifyToken.slice(-4) : 'not set',
                    receivedTokenLast4: token ? token.slice(-4) : 'missing'
                }
            }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }

    // Handle POST request for incoming messages
    try {
        const payload = await req.text();
        const webhookData: WhatsAppWebhook = JSON.parse(payload);

        console.log('📱 Received WhatsApp webhook:', JSON.stringify(webhookData));
        console.log('🔍 Webhook object type:', webhookData.object);

        // Verify webhook signature if app secret is available
        const signature = req.headers.get('x-hub-signature-256');
        const appSecret = Deno.env.get('META_APP_SECRET');

        if (appSecret && signature) {
            const isValid = verifyWebhookSignature(payload, signature, appSecret);
            if (!isValid) {
                console.error('Invalid webhook signature');
                return new Response('Forbidden', { status: 403 });
            }
        }

        // Process webhook data
        if (webhookData.object !== 'whatsapp_business_account') {
            console.log('⚠️ Webhook object is not whatsapp_business_account, ignoring:', webhookData.object);
            return new Response(JSON.stringify({ status: 'ignored' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log('📦 Processing webhook entries:', webhookData.entry.length);

        let messagesProcessed = 0;
        for (const entry of webhookData.entry) {
            console.log('📥 Processing entry:', entry.id);
            for (const change of entry.changes) {
                const value = change.value;
                const messages = value.messages;

                console.log('📨 Messages in change:', messages?.length || 0);

                if (!messages || messages.length === 0) {
                    console.log('⚠️ No messages in this change, skipping');
                    continue;
                }

                for (const message of messages) {
                    // Only process text messages
                    if (message.type !== 'text' || !message.text) {
                        console.log(`⚠️ Skipping non-text message: type=${message.type}, hasText=${!!message.text}`);
                        continue;
                    }

                    const phoneNumberId = value.metadata.phone_number_id;
                    const displayPhoneNumber = value.metadata.display_phone_number;
                    const userMessage = message.text.body;
                    const customerPhone = message.from;

                    console.log('🔍 Processing WhatsApp message:');
                    console.log('  - Phone Number ID:', phoneNumberId);
                    console.log('  - Display Phone Number:', displayPhoneNumber);
                    console.log('  - Customer Phone:', customerPhone);
                    console.log('  - Message:', userMessage.substring(0, 100));

                    // First, log all WhatsApp agents for debugging
                    const { data: allWhatsAppAgents } = await supabase
                        .from('agents')
                        .select('user_id, phone_number_id, phone_number, is_active, platform')
                        .eq('platform', 'whatsapp');

                    console.log('📋 All WhatsApp agents in database:', JSON.stringify(allWhatsAppAgents || []));

                    // Find the agent by phone_number_id (more reliable than display number)
                    let { data: agentData, error: agentError } = await supabase
                        .from('agents')
                        .select('user_id, meta_token, is_active, phone_number_id, phone_number')
                        .eq('platform', 'whatsapp')
                        .eq('phone_number_id', phoneNumberId)
                        .maybeSingle();

                    if (agentError) {
                        console.error('❌ Database error looking for agent:', JSON.stringify(agentError));
                        console.error('   Error details:', agentError.message, agentError.code);
                        continue;
                    }

                    if (!agentData) {
                        console.error('❌ Agent not found for Phone Number ID:', phoneNumberId);
                        console.error('   Available Phone Number IDs:', allWhatsAppAgents?.map(a => a.phone_number_id).filter(Boolean) || []);
                        console.error('   Available Phone Numbers:', allWhatsAppAgents?.map(a => a.phone_number).filter(Boolean) || []);

                        // Try fallback: match by display phone number
                        console.log('🔄 Trying fallback: matching by display phone number:', displayPhoneNumber);
                        const { data: fallbackAgent } = await supabase
                            .from('agents')
                            .select('user_id, meta_token, is_active, phone_number_id, phone_number')
                            .eq('platform', 'whatsapp')
                            .eq('phone_number', displayPhoneNumber)
                            .maybeSingle();

                        if (fallbackAgent) {
                            console.log('✅ Found agent by phone number (fallback):', fallbackAgent.phone_number_id);
                            console.warn('⚠️ WARNING: Phone Number ID mismatch!');
                            console.warn('   Webhook Phone Number ID:', phoneNumberId);
                            console.warn('   Agent Phone Number ID:', fallbackAgent.phone_number_id);
                            console.warn('   Auto-updating agent with correct Phone Number ID...');

                            // Update the agent with the correct phone_number_id
                            const { error: updateError } = await supabase
                                .from('agents')
                                .update({ phone_number_id: phoneNumberId })
                                .eq('user_id', fallbackAgent.user_id)
                                .eq('platform', 'whatsapp');

                            if (updateError) {
                                console.error('❌ Failed to update phone_number_id:', updateError);
                                // Still try to use the agent even if update fails
                                agentData = { ...fallbackAgent, phone_number_id: phoneNumberId };
                            } else {
                                console.log('✅ Updated agent with correct phone_number_id');
                                // Use the updated agent for processing
                                agentData = { ...fallbackAgent, phone_number_id: phoneNumberId };
                            }
                        } else {
                            console.error('   Please verify the Phone Number ID in your Settings matches:', phoneNumberId);
                            console.error('   Or verify the Display Phone Number matches:', displayPhoneNumber);
                            continue;
                        }
                    }

                    console.log('✅ Agent found:', {
                        user_id: agentData.user_id,
                        phone_number_id: agentData.phone_number_id,
                        phone_number: agentData.phone_number,
                        is_active: agentData.is_active
                    });

                    if (!agentData.is_active) {
                        console.error('❌ Agent found but is_active = false for Phone Number ID:', phoneNumberId);
                        console.error('   Please activate the agent in Settings');
                        continue;
                    }

                    if (!agentData.meta_token) {
                        console.error('❌ Agent found but meta_token is missing for Phone Number ID:', phoneNumberId);
                        console.error('   Please add the Meta Access Token in Settings');
                        continue;
                    }

                    console.log('✅ Agent is active and ready to process message');

                    const userId = agentData.user_id;
                    const accessToken = agentData.meta_token;
                    const messageId = message.id;

                    console.log('🚀 Starting AI processing for user:', userId);

                    // Check if this message has already been processed (idempotency)
                    // Use message.id as the unique identifier for WhatsApp messages
                    const { data: existingProcessed } = await supabase
                        .from('processed_webhooks')
                        .select('id')
                        .eq('platform', 'whatsapp')
                        .eq('external_message_id', messageId)
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (existingProcessed) {
                        console.log('Message already processed, skipping:', messageId);
                        continue;
                    }

                    // ===== CONVERSATION MODE CHECK =====
                    console.log('🤖 Checking conversation mode for:', customerPhone);
                    const { data: convControl } = await supabase
                        .from('conversation_control')
                        .select('mode')
                        .eq('user_id', userId)
                        .eq('customer_id', customerPhone)
                        .eq('platform', 'whatsapp')
                        .maybeSingle();

                    // Check subscription plan to enforce human mode restrictions
                    const { data: earlySubData } = await supabase
                        .from('subscriptions')
                        .select('plan')
                        .eq('user_id', userId)
                        .maybeSingle();

                    const isFreePlan = earlySubData?.plan === 'free';

                    if (convControl?.mode === 'human') {
                        if (isFreePlan) {
                            console.log('🚫 Free plan detected. Human mode not allowed. Overriding to bot.');
                            // Optionally update the mode back to bot in the DB
                            await supabase
                                .from('conversation_control')
                                .update({ mode: 'bot' })
                                .eq('user_id', userId)
                                .eq('customer_id', customerPhone)
                                .eq('platform', 'whatsapp');
                        } else {
                            console.log('👤 Conversation is in HUMAN mode. Skipping AI.');

                            // Log the incoming message so it appears in history
                            const { error: logError } = await supabase
                                .from('message_logs')
                                .insert({
                                    user_id: userId,
                                    platform: 'whatsapp',
                                    customer_id: customerPhone,
                                    message_text: userMessage,
                                    ai_response: "" // No AI response in human mode
                                });

                            if (logError) console.error('⚠️ Error logging human-mode message:', logError);

                            messagesProcessed++;
                            continue; // SKIP AI PROCESSING
                        }
                    }
                    // ===== END CONVERSATION MODE CHECK =====

                    // Mark this message as processed BEFORE calling AI (to prevent duplicate processing)
                    const { error: markProcessedError } = await supabase
                        .from('processed_webhooks')
                        .insert({
                            platform: 'whatsapp',
                            external_message_id: messageId,
                            user_id: userId,
                        });

                    if (markProcessedError) {
                        // If insert fails due to duplicate, skip processing (race condition)
                        if (markProcessedError.code === '23505') { // Unique violation
                            console.log('Message already processed (race condition), skipping:', messageId);
                            continue;
                        }
                        console.error('Error marking message as processed:', markProcessedError);
                    }

                    // ===== PROTECTION SYSTEM CHECK =====
                    console.log('🛡️ Running protection checks for user:', customerPhone);
                    const protectionResult = await checkProtection(
                        supabase,
                        userId,
                        customerPhone,
                        'whatsapp',
                        userMessage
                    );

                    if (!protectionResult.allowed) {
                        console.log('🚫 Message blocked by protection system:', protectionResult.reason);

                        // Send the protection response to the user
                        if (protectionResult.message) {
                            await sendWhatsAppMessage(
                                phoneNumberId,
                                accessToken,
                                customerPhone,
                                protectionResult.message
                            );
                        }

                        // Skip AI processing
                        continue;
                    }

                    console.log('✅ Protection checks passed, proceeding with AI processing');
                    // ===== END PROTECTION SYSTEM CHECK =====

                    // Check message limit BEFORE processing and fetch plan limits
                    const { data: subData, error: subError } = await supabase
                        .from('subscriptions')
                        .select('messages_used, message_limit, plan, knowledge_base_limit, products_limit, max_chars_per_item, bookings_used, bookings_limit, expires_at')
                        .eq('user_id', userId)
                        .single();

                    if (subError) {
                        console.error('Failed to fetch subscription:', subError);
                        await sendWhatsAppMessage(
                            phoneNumberId,
                            accessToken,
                            customerPhone,
                            '❌ Sorry, I encountered an error. Please try again later.'
                        );
                        continue;
                    }

                    // Check for subscription expiry
                    if (subData.expires_at && new Date(subData.expires_at) < new Date()) {
                        console.log(`⚠️ User ${userId} subscription expired on: ${subData.expires_at}`);
                        await sendWhatsAppMessage(
                            phoneNumberId,
                            accessToken,
                            customerPhone,
                            `⚠️ Your subscription expired on ${new Date(subData.expires_at).toLocaleDateString()}. Please renew your plan to continue using the AI assistant.`
                        );
                        continue;
                    }

                    // Enforce message limit
                    if (subData.messages_used >= subData.message_limit) {
                        console.log(`⚠️ User ${userId} reached message limit: ${subData.messages_used}/${subData.message_limit}`);
                        const limitMessage = `⚠️ You've reached your message limit (${subData.message_limit} messages/month). Please upgrade your plan to continue.`;

                        // Trigger usage limit email notification (fire and forget)
                        supabase.functions.invoke('send-usage-limit-email', {
                            body: { userId: userId, limitType: 'messages' }
                        }).catch(err => console.error('Error invoking limit email:', err));

                        await sendWhatsAppMessage(
                            phoneNumberId,
                            accessToken,
                            customerPhone,
                            limitMessage
                        );
                        continue;
                    }


                    // Fetch knowledge base for context (limited by plan)
                    const knowledgeLimit = subData.knowledge_base_limit || 5;
                    const { data: knowledgeData } = await supabase
                        .from('knowledge_base')
                        .select('type, title, content')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(knowledgeLimit);

                    // Fetch products from user_products table (limited by plan)
                    const productsLimit = subData.products_limit || 50;
                    const { data: productsData } = await supabase
                        .from('user_products')
                        .select('name, price, details')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(productsLimit);

                    // Fetch booking configuration (if any) - include id for updates
                    const { data: bookingConfig } = await supabase
                        .from('booking_configurations')
                        .select('id, business_type, business_name, language, is_active, field_configs, hotel_rooms_available, restaurant_opening_hours, hospital_departments, medical_config, ai_instructions, currency')
                        .eq('user_id', userId)
                        .eq('is_active', true)
                        .maybeSingle();

                    // Detect the language of the user's message (legacy/fallback)
                    const autoDetectedLanguage = detectLanguage(userMessage);

                    // Use configured language if available, otherwise fallback to detection
                    const selectedLanguage = bookingConfig?.language || 'so';
                    const forcedLanguage = selectedLanguage === 'en' ? 'english' : 'somali';

                    console.log('🌍 Language configuration:', {
                        autoDetected: autoDetectedLanguage,
                        selectedInConfig: selectedLanguage,
                        forcedLanguage: forcedLanguage,
                        bookingConfigLanguage: bookingConfig?.language || 'not set'
                    });

                    // Fetch available doctor slots if medical business
                    const now = new Date();
                    let availableDoctorSlots: any[] = [];
                    if (bookingConfig?.business_type === 'hospital') {
                        const { data: slots } = await supabase
                            .from('doctor_slots')
                            .select('doctor_id, slot_date, slot_time')
                            .eq('user_id', userId)
                            .eq('status', 'available')
                            .gte('slot_date', now.toISOString().split('T')[0])
                            .lte('slot_date', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                            .order('slot_date', { ascending: true })
                            .order('slot_time', { ascending: true });

                        availableDoctorSlots = slots || [];
                        console.log(`🏥 Found ${availableDoctorSlots.length} available slots for the next 7 days`);
                    }

                    // ===== EMERGENCY DETECTION =====
                    if (bookingConfig?.business_type === 'hospital' && bookingConfig.medical_config) {
                        const medConfig = bookingConfig.medical_config as any;
                        const keywords = medConfig.emergency_keywords || [];
                        const userMsgLower = userMessage.toLowerCase();

                        const hasEmergency = keywords.some((kw: string) => userMsgLower.includes(kw.toLowerCase()));

                        if (hasEmergency) {
                            console.log('🚨 EMERGENCY DETECTED in user message:', userMessage);
                            let emergencyMsg = medConfig.emergency_message || "This is an emergency. Please contact our emergency line.";

                            // Replace placeholder with actual phone if available
                            if (medConfig.emergency_phone) {
                                emergencyMsg = emergencyMsg.replace('{{emergency_phone}}', medConfig.emergency_phone);
                            }

                            await sendWhatsAppMessage(
                                phoneNumberId,
                                accessToken,
                                customerPhone,
                                emergencyMsg
                            );

                            // Log the emergency interaction
                            await supabase.from('message_logs').insert({
                                user_id: userId,
                                platform: 'whatsapp',
                                customer_id: customerPhone,
                                message_text: userMessage,
                                ai_response: "[EMERGENCY AUTO-RESPONSE]"
                            });

                            continue; // Stop processing this message
                        }
                    }
                    // ===== END EMERGENCY DETECTION =====

                    // Build context from knowledge base with focus on products, bookings and business details
                    // Add language requirement at the very beginning
                    const languageHeader = forcedLanguage === 'somali'
                        ? '=== CRITICAL: YOU ARE A SOMALI LANGUAGE ASSISTANT ===\nYour response language has been STRICTLY configured to Somali (Soomaali). You MUST respond ONLY in Somali. DO NOT use English. DO NOT include English translations. DO NOT mix languages. Use polite, clear, business-appropriate Somali. Regardless of the customer\'s input language, emojis, or slang, your output MUST be 100% Somali. Every single word must be in Somali.\n=== END LANGUAGE REQUIREMENT ===\n\n'
                        : '=== CRITICAL: YOU ARE AN ENGLISH LANGUAGE ASSISTANT ===\nYour response language has been STRICTLY configured to English. You MUST respond ONLY in English. DO NOT include Somali translations. DO NOT mix languages. Use professional, friendly business English. Regardless of the customer\'s input language, emojis, or slang, your output MUST be 100% English. Every single word must be in English.\n=== END LANGUAGE REQUIREMENT ===\n\n';

                    // Get current date for the prompt
                    const options: Intl.DateTimeFormatOptions = {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'Africa/Addis_Ababa'
                    };
                    const todayDate = now.toLocaleDateString('en-GB', options);

                    let context = languageHeader + `You are a helpful business assistant chatbot.

Current date: ${todayDate}
Timezone: Africa/Addis_Ababa (UTC+3)

Date handling rules:
- If the user says "today", use today’s date (${todayDate}).
- If the user says "tomorrow", add 1 day to today’s date.
- If the user says "next week", add 7 days.
- If the user mentions a day or month without a year, ALWAYS assume the current year (${now.getFullYear()}).
- NEVER select a past date.
- If the calculated date is in the past, move it to the next valid future date.
- Do NOT guess if unclear. Ask for clarification if needed (e.g., "Do you mean this coming Friday?").

If the customer wants to MAKE A BOOKING (hotel room, restaurant table, hospital/clinic appointment, or other service), you must follow the booking configuration below.
If the customer is only asking QUESTIONS, you answer using the business & product information.

=== BOOKING ASSISTANT MODE ===
`;

                    if (bookingConfig) {
                        context += `Booking configuration is ENABLED for this business: ${bookingConfig.business_name || bookingConfig.business_type}.
Business type: ${bookingConfig.business_type}

REQUIRED BOOKING FIELDS:
${(bookingConfig.field_configs || []).map((f: any) => `- ${f.label} (${f.type}${f.required ? ', REQUIRED' : ''})`).join('\n')}

${bookingConfig.business_type === 'hotel' ? (() => {
                                try {
                                    const rooms = typeof bookingConfig.hotel_rooms_available === 'string'
                                        ? JSON.parse(bookingConfig.hotel_rooms_available)
                                        : bookingConfig.hotel_rooms_available;
                                    if (Array.isArray(rooms) && rooms.length > 0) {
                                        return `AVAILABLE ROOM TYPES AND INVENTORY:
${rooms.map((r: any) => {
                                            const name = r.name || 'Unknown';
                                            const count = typeof r.count === 'number' ? r.count : 0;
                                            const available = r.available !== false;
                                            const price = typeof r.price === 'number' && r.price > 0 ? r.price : null;
                                            const currency = bookingConfig.currency || 'ETB';
                                            const status = available && count > 0 ? `✅ ${count} available` : available ? '✅ Available (0 rooms)' : '❌ Not available';
                                            const priceInfo = price ? ` - ${price.toLocaleString()} ${currency}` : '';
                                            return `- ${name}: ${status}${priceInfo}`;
                                        }).join('\n')}

CRITICAL: When a booking is confirmed for a specific room type, you MUST decrease the room count by 1. Only offer rooms that are available (available = true) and have count > 0. Always mention the room price when discussing room options with customers.`;
                                    } else {
                                        return `Hotel options: ${bookingConfig.hotel_rooms_available || 'not specified'}`;
                                    }
                                } catch {
                                    return `Hotel options: ${bookingConfig.hotel_rooms_available || 'not specified'}`;
                                }
                            })() : ''}
${bookingConfig.business_type === 'restaurant' ? `Restaurant opening hours: ${bookingConfig.restaurant_opening_hours || 'not specified'}` : ''}
${bookingConfig.business_type === 'hospital' ? (() => {
                                const medConfig = bookingConfig.medical_config as any;
                                if (!medConfig) return `Hospital departments: ${bookingConfig.hospital_departments || 'not specified'}`;

                                let medPrompt = `MEDICAL FACILITY DETAILS:
- Name: ${bookingConfig.business_name}
- Branch: ${medConfig.branch || 'Main'}
- Address: ${medConfig.address || 'Not specified'}
- Map: ${medConfig.google_map_link || 'Ask staff'}
- Contact: ${medConfig.contact_phone || 'Ask staff'}
- Emergency Line: ${medConfig.emergency_phone || 'Call nearest ER'}

AVAILABLE DOCTORS & SERVICES:
${(medConfig.doctors || []).map((d: any) => `- ${d.name} (${d.department}) | Consultation: ${d.type} | Languages: ${d.languages} | Duration: ${d.duration} mins | Status: ${d.status}`).join('\n')}

BOOKING RULES:
- Same-day bookings: ${medConfig.booking_rules?.same_day_allowed ? 'ALLOWED' : 'NOT ALLOWED'}
- One booking per patient per day: ${medConfig.booking_rules?.one_per_day ? 'YES' : 'NO'}
- Max booking in advance: ${medConfig.booking_rules?.max_advance_days || 7} days
- Auto-assign doctor: ${medConfig.booking_rules?.auto_assign_doctor ? 'YES (assign first available if patient gas no preference)' : 'NO (patient must choose)'}

LEGAL DISCLAIMER:
${medConfig.legal_notice || 'This bot does not provide medical diagnosis.'}

${availableDoctorSlots.length > 0
                                        ? `AVAILABLE REAL-TIME SLOTS (Only suggest these exact times):
${availableDoctorSlots.map(s => `- ${s.slot_date} at ${s.slot_time.substring(0, 5)} (Doctor: ${medConfig.doctors?.find((d: any) => d.id === s.doctor_id)?.name || s.doctor_id})`).join('\n')}`
                                        : "Currently, no slots are available in the system. Mention we are fully booked or check back later."}
`;
                                return medPrompt;
                            })() : ''}

Extra AI booking instructions from the business:
${bookingConfig.ai_instructions || "None"}

BOOKING FLOW RULES:
- Detect booking intent from natural language (for example: "I want to book", "reserve", "appointment", etc.).
- When booking intent is detected, ask for ONE required field at a time in the EXACT SEQUENCE listed above.
- Do NOT skip any required fields.
- Wait for the user to provide the value for the current field before moving to the next.
- Use a friendly, short message for each question.
- If a business name is specified, refer to it in your responses.
- After collecting all required fields, repeat the full booking details and ask the user to confirm.
- Only after confirmation, treat the booking as confirmed in your answer.
- If the customer changes a detail, update that detail and repeat the new summary.

=== AI OUTPUT CONTRACT (CRITICAL) ===
Every response you send MUST consist of two parts:
1. A normal, friendly chat message for the customer.
2. A hidden JSON block for the backend, preceded by the tag <|BOOKING_JSON|>.

The JSON block MUST follow this schema exactly:
{
  "customer_name": string | null,
  "customer_phone": string | null,
  "customer_email": string | null,
  "check_in_date": string | null,
  "check_out_date": string | null,
  "appointment_date": string | null,
  "appointment_time": string | null,
  "number_of_guests": number | null,
  "room_type": string | null,
  "doctor_name": string | null,
  "doctor_id": string | null,
  "status": "pending" | "confirmed" | null,
  "custom_data": object | null 
}

JSON RULES:
- Include ONLY fields explicitly stated by the customer in current or previous messages.
- If a value is not provided yet, use null.
- Do NOT guess, infer, or autocomplete values.
- Dates MUST be in YYYY-MM-DD format only.
- Numbers MUST be actual numbers (e.g., 2), not strings (e.g., "two").
- IMPORTANT: Do NOT include any of the standard fields above (name, phone, dates, guests, room_type) inside the "custom_data" object. Only use "custom_data" for fields that are NOT already listed in the schema.
- If the customer has confirmed the booking, set "status" to "confirmed". Otherwise, use "pending" if booking intent is active.

EXAMPLE RESPONSE:
"Haye Ahmed Hassan, waan kuu dhameeyay qabsashada qolka VIP-da ee July 25-27. Ma jiraa wax kale?"
<|BOOKING_JSON|>{"customer_name": "Ahmed Hassan", "customer_phone": null, "customer_email": null, "check_in_date": "2025-07-25", "check_out_date": "2025-07-27", "number_of_guests": null, "room_type": "VIP", "status": "confirmed", "custom_data": null}
\n\n`;
                    } else {
                        context += `Booking configuration is NOT set up. Do not promise official bookings. You can still answer questions about availability and services.\n\n`;
                    }

                    context += `Your other primary job is to answer customer questions about:
1. PRODUCT DETAILS: Product names, descriptions, features, specifications, what products are available
2. PRODUCT PRICES: Product costs, pricing information, pricing tiers, discounts, special offers
3. BUSINESS DETAILS: Business name, description, location, operating hours, contact information, services offered

Answer questions based ONLY on the information provided below. Extract and present product and business information clearly when available.\n\n`;

                    // Add products section if products exist
                    if (productsData && productsData.length > 0) {
                        context += '=== PRODUCTS LIST ===\n';
                        context += 'The following products are available:\n\n';
                        productsData.forEach((product: any) => {
                            context += `Product: ${product.name}\n`;
                            if (product.price !== null) {
                                context += `Price: ${product.price} ETB\n`;
                            }
                            if (product.details) {
                                context += `Details: ${product.details}\n`;
                            }
                            context += '\n';
                        });
                        context += '\n';
                    }

                    if (knowledgeData && knowledgeData.length > 0) {
                        // Use plan-based limits for knowledge base items
                        const maxCharsPerItem = subData.max_chars_per_item || 2000;

                        // Separate product-related and business-related information for better structure
                        const productInfo: string[] = [];
                        const businessInfo: string[] = [];

                        knowledgeData.forEach((item: any) => {
                            const content = item.content.length > maxCharsPerItem
                                ? item.content.substring(0, maxCharsPerItem) + '...'
                                : item.content;

                            // Check if content mentions products, prices, or product-related terms
                            const contentLower = content.toLowerCase();
                            const hasProductInfo = contentLower.includes('product') ||
                                contentLower.includes('price') ||
                                contentLower.includes('cost') ||
                                contentLower.includes('$') ||
                                contentLower.includes('etb') ||
                                /\d+\s*(dollar|birr|etb|usd)/i.test(content);

                            // Check if content mentions business details
                            const hasBusinessInfo = contentLower.includes('business') ||
                                contentLower.includes('location') ||
                                contentLower.includes('address') ||
                                contentLower.includes('hours') ||
                                contentLower.includes('contact') ||
                                contentLower.includes('phone') ||
                                contentLower.includes('email') ||
                                contentLower.includes('service');

                            const itemText = `[${item.type.toUpperCase()}] ${item.title}: ${content}`;

                            if (hasProductInfo) {
                                productInfo.push(itemText);
                            }
                            if (hasBusinessInfo || !hasProductInfo) {
                                businessInfo.push(itemText);
                            }
                        });

                        // Structure context with clear sections
                        if (productInfo.length > 0) {
                            context += '=== PRODUCT INFORMATION ===\n';
                            context += 'Extract product details and prices from the following:\n';
                            productInfo.forEach(info => {
                                context += `${info}\n\n`;
                            });
                        }

                        if (businessInfo.length > 0) {
                            context += '=== BUSINESS INFORMATION ===\n';
                            context += 'Extract business details from the following:\n';
                            businessInfo.forEach(info => {
                                context += `${info}\n\n`;
                            });
                        }

                        // If no clear categorization, include all - this ensures product names are always searchable
                        if (productInfo.length === 0 && businessInfo.length === 0) {
                            knowledgeData.forEach((item: any) => {
                                const content = item.content.length > maxCharsPerItem
                                    ? item.content.substring(0, maxCharsPerItem) + '...'
                                    : item.content;
                                context += `[${item.type.toUpperCase()}] ${item.title}: ${content}\n\n`;
                            });
                        }

                        // Add a reminder section that all content above should be searched for product names
                        context += '\n=== SEARCH REMINDER ===\n';
                        context += 'IMPORTANT: The sections above contain ALL available knowledge base content. When a customer asks about a specific product name (e.g., "iPhone 17", "Samsung Galaxy"), you MUST search through ALL the content in the sections above to find that product name, even if it appears in different forms. Do not skip this search step.';
                    } else {
                        context += 'No business information available yet. Provide helpful, professional responses.';
                    }

                    context += '\n\nCRITICAL INSTRUCTIONS - READ CAREFULLY:\n';

                    // Build service list instructions based on what's actually enabled
                    const serviceInstructions: string[] = [];
                    const businessType = bookingConfig?.business_type || 'custom';

                    if (bookingConfig && bookingConfig.is_active) {
                        if (businessType === 'hotel') {
                            serviceInstructions.push(forcedLanguage === 'somali' ? '🏨 Qabsashada qol iyo hubinta boosaska' : '🏨 Booking rooms and checking availability');
                            serviceInstructions.push(forcedLanguage === 'somali' ? '📅 Hubinta taariikhaha la heli karo' : '📅 Checking available dates');
                        } else if (businessType === 'restaurant') {
                            serviceInstructions.push(forcedLanguage === 'somali' ? '🍽️ Qabsashada miis' : '🍽️ Booking a table');
                        } else if (businessType === 'hospital') {
                            serviceInstructions.push(forcedLanguage === 'somali' ? '👨‍⚕️ Qabsashada takhtar' : '👨‍⚕️ Booking a doctor appointment');
                        } else {
                            serviceInstructions.push(forcedLanguage === 'somali' ? '📅 Qabsashada ama ballanka qaadista' : '📅 Booking or scheduling an appointment');
                        }
                    }
                    if (productsData && productsData.length > 0 || knowledgeData && knowledgeData.length > 0) {
                        serviceInstructions.push(forcedLanguage === 'somali' ? '❓ Jawaab su\'aalaha ganacsiga' : '❓ Answering questions about our business');
                    }
                    if (productsData && productsData.length > 0) {
                        serviceInstructions.push(forcedLanguage === 'somali' ? '💰 Qiimaha iyo helitaanka alaabta' : '💰 Providing pricing and availability details');
                    }
                    if (bookingConfig && bookingConfig.is_active) {
                        serviceInstructions.push(forcedLanguage === 'somali' ? '🔁 Cusbooneysiinta ama joojinta ballanka' : '🔁 Updating or cancelling an existing booking');
                    }

                    // Format services for the prompt
                    const formattedServices = serviceInstructions.map(s => `     ${s}`).join('\n');

                    context += '0. **GREETING RESPONSE (ABSOLUTE HIGHEST PRIORITY)**: When a customer sends a greeting like "ASC", "asc", "asalamu alaykum", "aslamu calaykum", "salaamu alaykum", "al salaamu alaykum", or similar Islamic greetings:\n';
                    context += '   - Respond with "WCS" or "Wacalaykum alsalaam" (NEVER respond with "ASC")\n';
                    context += '   - Add "Walaal" (brother/sister) for warmth: "WSC Walaal" or "Wacalaykum alsalaam Walaal"\n';
                    context += `   - After the greeting, welcome them to ${bookingConfig?.business_name || 'the business'}\n`;
                    context += '   - **YOU MUST LIST THE AVAILABLE SERVICES** immediately after the welcome message.\n';

                    context += `   - Exact expected structure for Somali:\n`;
                    context += `     1. Greeting + Welcome\n`;
                    context += `     2. "Waxaan kaa caawin karaa:"\n`;
                    context += `     3. [List of services]\n`;
                    context += `     4. "Fadlan ii sheeg sida aan kuu caawin karo maanta?"\n`;

                    if (forcedLanguage === 'somali') {
                        context += `   - REQUIRED RESPONSE TEMPLATE:\n`;
                        context += `     "WSC Walaal! Kusoo dhawow ${bookingConfig?.business_name || 'Royal Hotel'}. Waxaan kaa caawin karaa:\n\n${formattedServices}\n\nFadlan ii sheeg sida aan kuu caawin karo maanta?"\n`;
                    } else {
                        context += `   - REQUIRED RESPONSE TEMPLATE:\n`;
                        context += `     "Wacalaykum alsalaam Walaal! Welcome to ${bookingConfig?.business_name || 'Royal Hotel'}. I can help you with:\n\n${formattedServices}\n\nPlease tell me how I can assist you?"\n`;
                    }
                    context += '   - Use this EXACT format. Do not shorten it. Do not ask "how can I help" without listing the services first.\n';
                    context += '   - This rule takes ABSOLUTE PRIORITY over all other rules\n';

                    context += '5. **LISTING AVAILABLE SERVICES (IMPORTANT)**: When customers ask "what can you do?", "what services do you offer?", "maxaad iigu caawin kartaa?" (Somali), "what can you help me with?", "what do you offer?", or similar questions about your capabilities:\n';
                    if (serviceInstructions.length > 0) {
                        context += `   - You MUST list the following services in a friendly, easy-to-read format:\n`;
                        serviceInstructions.forEach(service => {
                            context += `     ${service}\n`;
                        });
                        context += `   - Use the exact format shown above with emojis\n`;
                        context += `   - After listing services, ask how you can help them\n`;
                        if (forcedLanguage === 'somali') {
                            context += `   - Example response format:\n`;
                            context += `     "Waxaan kuu caawin karaa:\n\n`;
                            serviceInstructions.forEach(service => {
                                context += `     ${service}\n`;
                            });
                            context += `\n\nFadlan ii sheeg sidee aan kuu caawin karaa maanta?"\n`;
                        } else {
                            context += `   - Example response format:\n`;
                            context += `     "I can help you with:\n\n`;
                            serviceInstructions.forEach(service => {
                                context += `     ${service}\n`;
                            });
                            context += `\n\nPlease tell me how I can assist you today."\n`;
                        }
                    } else {
                        context += `   - Since no specific services are configured, respond that you can help with general business information\n`;
                        if (forcedLanguage === 'somali') {
                            context += `   - Example: "Waxaan kuu caawin karaa macluumaadka ganacsiga. Fadlan ii sheeg sidee aan kuu caawin karaa."\n`;
                        } else {
                            context += `   - Example: "I can help you with information about our business. Please tell me how I can assist you."\n`;
                        }
                    }

                    context += '6. IMPORTANT: You MUST search the knowledge base content above before saying information is not available. Do not default to contact information - first check if the product exists in the knowledge base.\n';
                    context += '7. Only provide information that exists in the knowledge base content above. If information is truly not available, then politely say so.';

                    // Add enhanced Somali language instructions if language is Somali
                    if (forcedLanguage === 'somali') {
                        context += '\n\n=== TILMAAMO SOOMAALI AH - HORAY U AKHRI ===\n';
                        context += 'Waxaad tahay kaaliye ganacsi oo Soomaali ah oo faa\'iido leh. Isticmaal Soomaali dabiici ah, fudud, oo fahamsan.\n\n';

                        context += '**QAABKA JAWAABTA (RESPONSE STYLE)**:\n';
                        context += '- WELIGAA ka jawaab si gaaban oo fudud (2-3 oo erayo keliya)\n';
                        context += '- Isticmaal erayo fudud oo fahamsan (ka fogow erayo adag oo aan la fahmin)\n';
                        context += '- Noqo nasii, edeb leh, oo si toos ah u jawaab\n';
                        context += '- Ka fogow faahfaahin dheeraad ah - si dhakhso ah u jawaab su\'aasha\n';
                        context += '- Wixii jawaab aad bixiso ha fahmayso qof waliba\n\n';

                        context += '**EREYO IYO HADALKA DABIICIGA AH (NATURAL PHRASES)**:\n';
                        context += 'Isticmaal ereyada Soomaaliga dabiiciga ah:\n';
                        context += '- "Haa" (yes), "Maya" (no), "Waa run" (that\'s right), "Maaha" (it\'s not)\n';
                        context += '- "Fadlan" (please), "Mahadsanid" (thank you), "Waan ka xunnahay" (sorry)\n';
                        context += '- "Waxaan haynaa" (we have), "Ma hayno" (we don\'t have), "Waxaan ku caawin karaa" (I can help you)\n';
                        context += '- "Sidee kuu caawinaa?" (how can I help you?), "Wax kale?" (anything else?)\n';
                        context += '- "Qiimahiisu waa" (its price is), "Waa original" (it\'s original), "Waa la heli karaa" (it\'s available)\n';
                        context += '- "Waan ka xunnahay" (I\'m sorry), "Waan ka xumahay" (I\'m sorry - stronger), "Waan ka raalli ahay" (I agree)\n';
                        context += '- "Haye" (okay/sure), "Waa hagaag" (it\'s fine), "Waa la heli karaa" (it can be found)\n';
                        context += '- "Fadlan" (please), "Mahadsanid" (thank you), "Waan ku mahadcelinayaa" (I thank you)\n\n';

                        context += '**TUSAALO JAWAABO (EXAMPLE RESPONSES)**:\n';
                        context += 'Marka macmiilku weydiiyo alaab:\n';
                        context += '- "Haa, waxaan haynaa iPhone 16 Pro. Qiimahiisu waa 120000 ETB. Waa original."\n';
                        context += '- "Waan ka xunnahay, alaabtaas ma hayno."\n';
                        context += '- "Waxaan haynaa:\n';
                        context += '  - iPhone 16 Pro: 120000 ETB\n';
                        context += '  - Samsung Galaxy S24: 95000 ETB"\n\n';

                        context += 'Marka macmiilku weydiiyo qiimaha:\n';
                        context += '- "Qiimahiisu waa 120000 ETB."\n';
                        context += '- "Waxaan kuu sheegi karaa qiimaha alaab kasta."\n\n';

                        context += 'Marka macmiilku weydiiyo macluumaadka ganacsiga:\n';
                        context += '- "Waxaan kuu sheegi karaa macluumaadka ganacsiga."\n';
                        context += '- "Ganacsigu waa furan maalinta kasta 8:00 AM ilaa 8:00 PM."\n\n';

                        context += '**XUSUUS (MEMORY)**:\n';
                        context += '- Waxaad leedahay xasuus ka mid ah sheekadii hore ee macmiilkan\n';
                        context += '- Isticmaal macluumaadka taariikhda sheekada si aad ugu jawaabtid si shaqsi ah oo xirfad leh\n';
                        context += '- Haddii macmiilku ku weydiiyo wax aad hore ugu sheegtay, ka jawaab iyadoo lagu salaynayo taariikhda sheekada\n';
                        context += '- Xusuuso macluumaadka kasta oo macmiilku bixiyay (magac, cinwaan, xidhiidh, dalabyo hore, iwm)\n\n';

                        context += '**EDEB IYO NASIIN (POLITENESS)**:\n';
                        context += '- Isticmaal "Walaal" marka aad macmiilka ugu hadasho (warmth and respect)\n';
                        context += '- Isticmaal "Fadlan" marka aad codsato wax\n';
                        context += '- Isticmaal "Mahadsanid" marka macmiilku fahmo ama jawaabto\n';
                        context += '- Si edeb leh ugu jawaab dhammaan su\'aalaha\n\n';
                    }

                    // Add additional language instruction reminder at the end
                    const languageReminder = forcedLanguage === 'somali'
                        ? '\n\n=== FINAL REMINDER: YOU MUST RESPOND IN SOMALI ===\nYou are a Somali language assistant. You MUST respond ONLY in Somali (Soomaali). DO NOT use English. DO NOT include English translations. DO NOT mix languages. This is mandatory regardless of user input. Every single response must be 100% in Somali language. Use the natural Somali phrases and examples provided above to make your responses sound authentic and culturally appropriate.\n=== END REMINDER ===\n'
                        : '\n\n=== FINAL REMINDER: YOU MUST RESPOND IN ENGLISH ===\nYou are an English language assistant. You MUST respond ONLY in English. DO NOT use Somali. DO NOT include Somali translations. DO NOT mix languages. This is mandatory regardless of user input. Every single response must be 100% in English language.\n=== END REMINDER ===\n';

                    context += languageReminder;

                    // Fetch previous conversation history (last 10 messages = 5 exchanges)
                    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
                    let isFirstMessage = false;

                    // Fetch last 5 exchanges (10 messages total: 5 user + 5 assistant)
                    const { data: allMessages, error: historyError } = await supabase
                        .from('message_logs')
                        .select('message_text, ai_response, created_at')
                        .eq('user_id', userId)
                        .eq('platform', 'whatsapp')
                        .eq('customer_id', customerPhone)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (historyError) {
                        console.error('Error fetching conversation history:', historyError);
                    } else if (allMessages && allMessages.length > 0) {
                        // Reverse to get chronological order (oldest first) for conversation flow
                        const previousMessages = allMessages.reverse();

                        // Convert message logs to conversation format
                        previousMessages.forEach((msg) => {
                            conversationHistory.push({
                                role: 'user',
                                content: msg.message_text
                            });
                            conversationHistory.push({
                                role: 'assistant',
                                content: msg.ai_response
                            });
                        });
                        console.log(`📜 Retrieved ${previousMessages.length} previous exchanges (${conversationHistory.length} messages) from conversation history`);
                    } else {
                        // No previous messages - this is the first message
                        isFirstMessage = true;
                        console.log('👋 First message detected from customer:', customerPhone);
                    }


                    // Prepare messages array for the API call
                    // Include context as system message, then conversation history, then current message
                    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

                    // Add a separate system message for language requirement FIRST (most important)
                    if (forcedLanguage === 'somali') {
                        messages.push({
                            role: 'system',
                            content: 'CRITICAL LANGUAGE REQUIREMENT: You are a SOMALI LANGUAGE ASSISTANT. Your response language has been STRICTLY configured to Somali (Soomaali). You MUST respond ONLY in Somali. DO NOT use English. DO NOT include English translations. DO NOT mix languages. DO NOT say "I can only respond in English" or any English phrases. Every word of your response must be in Somali. This is non-negotiable and applies to ALL responses regardless of customer input language. Example: If customer asks "maad haysa iphone 16 pro", respond ONLY in Somali: "Haa, waxaan haynaa iPhone 16 Pro. Qiimahiisu waa 120000 ETB. Waa original."'
                        });
                    } else {
                        messages.push({
                            role: 'system',
                            content: 'CRITICAL LANGUAGE REQUIREMENT: You are an ENGLISH LANGUAGE ASSISTANT. Your response language has been STRICTLY configured to English. You MUST respond ONLY in English. DO NOT use Somali. DO NOT include Somali translations. DO NOT mix languages. Every word of your response must be in English. This is non-negotiable and applies to ALL responses regardless of customer input language.'
                        });
                    }

                    // Add system message with context and language instruction
                    messages.push({
                        role: 'system',
                        content: context
                    });

                    // Add conversation history (last 10 messages)
                    if (conversationHistory.length > 0) {
                        conversationHistory.forEach((msg) => {
                            messages.push(msg);
                        });
                        console.log(`💬 Added ${conversationHistory.length} messages from conversation history`);
                    }

                    // Add current user message with language reminder
                    const userMessageWithReminder = forcedLanguage === 'somali'
                        ? `${userMessage}\n\n[CRITICAL: Your response language is configured to Somali. You MUST respond ONLY in Somali (Soomaali). DO NOT use English. DO NOT include English translations. Every word must be in Somali.]`
                        : `${userMessage}\n\n[CRITICAL: Your response language is configured to English. You MUST respond ONLY in English. DO NOT use Somali. Every word must be in English.]`;

                    messages.push({
                        role: 'user',
                        content: userMessageWithReminder
                    });

                    console.log('📝 Prepared messages:', {
                        totalMessages: messages.length,
                        contextLength: context.length,
                        messageLength: userMessage.length,
                        knowledgeItems: knowledgeData?.length || 0,
                        historyMessages: conversationHistory.length
                    });

                    // Get OpenRouter API key
                    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

                    if (!openRouterApiKey) {
                        console.error('❌ OPENROUTER_API_KEY is not configured');
                        await sendWhatsAppMessage(
                            phoneNumberId,
                            accessToken,
                            customerPhone,
                            '❌ The AI service is not properly configured. Please contact support.'
                        );
                        continue;
                    }

                    // Call OpenRouter API
                    let aiMessageText = "Sorry, I encountered an error processing your message.";
                    let hasJson = false;

                    const callOpenRouterAPI = async (retryCount = 0): Promise<string> => {
                        const maxRetries = 2;
                        const baseDelay = 1000;
                        const model = "google/gemini-2.5-flash-lite";
                        const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

                        try {
                            const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://reply-ready-bot.com';
                            const aiResponse = await fetch(apiUrl, {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${openRouterApiKey}`,
                                    "HTTP-Referer": supabaseUrl,
                                    "X-Title": "Reply Ready Bot",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    model: model,
                                    messages: messages,
                                    temperature: 0.7,
                                    max_tokens: 2048,
                                })
                            });

                            if (!aiResponse.ok) {
                                const errorText = await aiResponse.text();
                                let errorData: any = {};
                                try {
                                    errorData = JSON.parse(errorText);
                                } catch {
                                    errorData = { message: errorText };
                                }

                                console.error("OpenRouter API error response:", {
                                    status: aiResponse.status,
                                    statusText: aiResponse.statusText,
                                    error: errorData
                                });

                                // Handle 503 - service unavailable, retry with backoff
                                if (aiResponse.status === 503 && retryCount < maxRetries) {
                                    const delay = baseDelay * Math.pow(2, retryCount);
                                    console.log(`Service unavailable (503), retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                    return callOpenRouterAPI(retryCount + 1);
                                }

                                // Handle quota exhaustion with retry
                                if (aiResponse.status === 429 && retryCount < maxRetries) {
                                    let retryDelayMs = baseDelay * Math.pow(2, retryCount);

                                    // Check for retry-after header
                                    const retryAfter = aiResponse.headers.get('retry-after');
                                    if (retryAfter) {
                                        const retryAfterSeconds = parseInt(retryAfter, 10);
                                        if (!isNaN(retryAfterSeconds)) {
                                            retryDelayMs = retryAfterSeconds * 1000;
                                        }
                                    }

                                    console.log(`OpenRouter API rate limited, retrying after ${retryDelayMs}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                                    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                                    return callOpenRouterAPI(retryCount + 1);
                                }

                                if (aiResponse.status === 404) {
                                    throw new Error(`OpenRouter API model not found. Please check if the model "${model}" is available.`);
                                }

                                if (aiResponse.status === 503) {
                                    throw new Error(`OpenRouter API service is overloaded. Please try again later.`);
                                }

                                throw new Error(`OpenRouter API error: ${aiResponse.status}`);
                            }

                            const aiData = await aiResponse.json();
                            const choice = aiData.choices?.[0];

                            let responseText: string | null = null;

                            if (choice?.message?.content) {
                                responseText = choice.message.content;
                            }

                            if (!responseText) {
                                console.error("OpenRouter API response missing text");
                                return "Sorry, I couldn't generate a response. Please try again.";
                            }

                            return responseText;
                        } catch (error) {
                            console.error("OpenRouter API call error:", error);
                            if (retryCount < maxRetries) {
                                const delay = baseDelay * Math.pow(2, retryCount);
                                console.log(`Request failed, retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                return callOpenRouterAPI(retryCount + 1);
                            }
                            throw error;
                        }
                    };

                    try {
                        console.log('🤖 Calling OpenRouter API...');
                        aiMessageText = await callOpenRouterAPI();
                        console.log('✅ AI response received:', aiMessageText.substring(0, 100) + '...');

                        // Update message count
                        const { error: updateError } = await supabase
                            .from('subscriptions')
                            .update({ messages_used: subData.messages_used + 1 })
                            .eq('user_id', userId);

                        if (updateError) {
                            console.error('⚠️ Error updating message count:', updateError);
                        } else {
                            console.log('✅ Message count updated:', subData.messages_used + 1, '/', subData.message_limit);
                        }

                        // Save message log
                        const { error: logError } = await supabase
                            .from('message_logs')
                            .insert({
                                user_id: userId,
                                platform: 'whatsapp',
                                customer_id: customerPhone,
                                message_text: userMessage,
                                ai_response: aiMessageText
                            });

                        if (logError) {
                            console.error('⚠️ Error saving message log:', logError);
                        } else {
                            console.log('✅ Message log saved');
                        }

                        // Extract and save booking details if booking configuration exists
                        if (bookingConfig) {
                            try {
                                // 1. Split AI response into chat message and JSON block
                                const jsonSeparator = '<|BOOKING_JSON|>';
                                const parts = aiMessageText.split(jsonSeparator);

                                // Reset aiMessageText to just the chat portion if JSON exists
                                if (parts.length > 1) {
                                    hasJson = true;
                                    const chatMessage = parts[0].trim();
                                    const jsonString = parts[1].trim();

                                    // Update the message we'll send to WhatsApp
                                    aiMessageText = chatMessage || (forcedLanguage === 'somali' ? 'Haye, waan ku caawinayaa.' : 'Sure, I am helping you with that.');

                                    try {
                                        const extractedFields = JSON.parse(jsonString);
                                        console.log('✅ Parsed AI JSON:', extractedFields);

                                        // Determine effective doctor ID if possible
                                        let effectiveDoctorId = extractedFields.doctor_id;
                                        if (!effectiveDoctorId && extractedFields.doctor_name && bookingConfig.business_type === 'hospital') {
                                            const medConfig = bookingConfig.medical_config as any;
                                            const doctor = medConfig?.doctors?.find((d: any) => d.name.toLowerCase().includes(extractedFields.doctor_name.toLowerCase()));
                                            if (doctor) effectiveDoctorId = doctor.id;
                                        }

                                        // 2. Check for existing booking (active conversation)
                                        const { data: existingBooking } = await supabase
                                            .from('bookings')
                                            .select('*')
                                            .eq('user_id', userId)
                                            .eq('customer_id', customerPhone)
                                            .eq('platform', 'whatsapp')
                                            .eq('booking_type', bookingConfig.business_type)
                                            .order('created_at', { ascending: false })
                                            .limit(1)
                                            .maybeSingle();

                                        // 3. Prepare data for saving (only non-null fields)
                                        const bookingData: any = {
                                            user_id: userId,
                                            customer_id: customerPhone,
                                            platform: 'whatsapp',
                                            booking_type: bookingConfig.business_type,
                                            business_name: bookingConfig.business_name,
                                            updated_at: new Date().toISOString(),
                                        };

                                        // Backend Validation for Dates
                                        const nowUtc3 = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" }));
                                        const today = new Date(nowUtc3);
                                        today.setHours(0, 0, 0, 0);

                                        if (extractedFields.check_in_date) {
                                            const checkIn = new Date(extractedFields.check_in_date);
                                            if (!isNaN(checkIn.getTime())) {
                                                if (checkIn < today) {
                                                    console.log(`⚠️ AI extracted a past check-in date: ${extractedFields.check_in_date}. Moving to today.`);
                                                    extractedFields.check_in_date = today.toISOString().split('T')[0];
                                                }

                                                // Max 1 year range
                                                const maxDate = new Date(today);
                                                maxDate.setFullYear(maxDate.getFullYear() + 1);
                                                if (checkIn > maxDate) {
                                                    console.log(`⚠️ AI extracted a date beyond max booking range: ${extractedFields.check_in_date}.`);
                                                    extractedFields.check_in_date = null;
                                                }
                                            } else {
                                                extractedFields.check_in_date = null;
                                            }
                                        }

                                        if (extractedFields.check_out_date) {
                                            const checkOut = new Date(extractedFields.check_out_date);
                                            if (!isNaN(checkOut.getTime())) {
                                                if (checkOut < today) {
                                                    extractedFields.check_out_date = null;
                                                }

                                                if (extractedFields.check_in_date) {
                                                    const checkIn = new Date(extractedFields.check_in_date);
                                                    if (!isNaN(checkIn.getTime()) && checkOut <= checkIn) {
                                                        console.log(`⚠️ Check-out date (${extractedFields.check_out_date}) is before or same as check-in (${extractedFields.check_in_date}).`);
                                                        extractedFields.check_out_date = null;
                                                    }
                                                }
                                            } else {
                                                extractedFields.check_out_date = null;
                                            }
                                        }

                                        // Use customer phone from WA if not captured by AI
                                        bookingData.customer_phone = extractedFields.customer_phone || customerPhone;

                                        // Only include fields that are not null to avoid overwriting existing data
                                        const fieldsToSave = [
                                            'customer_name', 'customer_email', 'check_in_date',
                                            'check_out_date', 'appointment_date', 'appointment_time',
                                            'number_of_guests', 'room_type', 'status', 'custom_data'
                                        ];

                                        let hasAnyData = false;
                                        fieldsToSave.forEach(field => {
                                            if (extractedFields[field] !== null && extractedFields[field] !== undefined) {
                                                bookingData[field] = extractedFields[field];
                                                hasAnyData = true;
                                            }
                                        });

                                        // Special handling for medical fields that aren't in first-class columns
                                        if (extractedFields.doctor_name) {
                                            bookingData.custom_data = {
                                                ...(bookingData.custom_data || {}),
                                                doctor_name: extractedFields.doctor_name
                                            };
                                            hasAnyData = true;
                                        }

                                        // 4. Save if we have data or an existing booking
                                        if (hasAnyData || existingBooking) {
                                            const wasConfirmed = extractedFields.status === 'confirmed';
                                            const wasPreviouslyPending = existingBooking && existingBooking.status !== 'confirmed';
                                            const isNewlyConfirmed = wasConfirmed && (!existingBooking || wasPreviouslyPending);

                                            if (isNewlyConfirmed && subData.bookings_used >= subData.bookings_limit) {
                                                console.log(`⚠️ User ${userId} reached booking limit: ${subData.bookings_used}/${subData.bookings_limit}`);
                                                const bookingLimitMessage = forcedLanguage === 'somali'
                                                    ? `⚠️ Waxaad gaartay xadka ballan-qaadista ee qorshahaaga (${subData.bookings_limit} ballan bishii). Fadlan cusboonaysii qorshahaaga si aad u sii wado.`
                                                    : `⚠️ You've reached your booking limit (${subData.bookings_limit} bookings/month). Please upgrade your plan to continue accepting automated bookings.`;

                                                aiMessageText = bookingLimitMessage;
                                                // Prevent saving/updating to 'confirmed' status
                                                bookingData.status = 'pending';
                                            }

                                            if (existingBooking) {
                                                // Update existing booking
                                                await supabase
                                                    .from('bookings')
                                                    .update(bookingData)
                                                    .eq('id', existingBooking.id);
                                                console.log('✅ Updated booking record from AI JSON');

                                                // Update slot if medical and confirmed
                                                if (bookingData.status === 'confirmed' && bookingConfig.business_type === 'hospital' && extractedFields.appointment_date && extractedFields.appointment_time && effectiveDoctorId) {
                                                    console.log('🔗 Linking existing booking to doctor slot...');
                                                    await supabase
                                                        .from('doctor_slots')
                                                        .update({ status: 'booked', booking_id: existingBooking.id })
                                                        .eq('doctor_id', effectiveDoctorId)
                                                        .eq('slot_date', extractedFields.appointment_date)
                                                        .ilike('slot_time', `%${extractedFields.appointment_time}%`);
                                                }

                                                // Only send email if booking was just confirmed (not on every update)
                                                if (isNewlyConfirmed) {
                                                    console.log('📧 Booking newly confirmed, sending email notification');
                                                    supabase.functions.invoke('send-booking-reminder-email', {
                                                        body: { bookingId: existingBooking.id, actionType: 'created' }
                                                    }).catch(err => console.error('⚠️ Error sending booking confirmation email:', err));
                                                }
                                            } else {
                                                // Create new booking (only if we have meaningful data or explicit intent)
                                                // Ensure status defaults to pending if not in JSON
                                                if (!bookingData.status) bookingData.status = 'pending';

                                                const { data: newBooking, error: insertError } = await supabase
                                                    .from('bookings')
                                                    .insert(bookingData)
                                                    .select('id')
                                                    .single();

                                                if (!insertError && newBooking) {
                                                    console.log('✅ Created booking record from AI JSON');

                                                    // Update slot if medical and confirmed
                                                    if (bookingData.status === 'confirmed' && bookingConfig.business_type === 'hospital' && extractedFields.appointment_date && extractedFields.appointment_time && effectiveDoctorId) {
                                                        console.log('🔗 Linking booking to doctor slot...');
                                                        await supabase
                                                            .from('doctor_slots')
                                                            .update({ status: 'booked', booking_id: newBooking.id })
                                                            .eq('doctor_id', effectiveDoctorId)
                                                            .eq('slot_date', extractedFields.appointment_date)
                                                            .ilike('slot_time', `%${extractedFields.appointment_time}%`);
                                                    }

                                                    // Only send email if the new booking is already confirmed
                                                    if (wasConfirmed) {
                                                        console.log('📧 New booking is confirmed, sending email notification');
                                                        supabase.functions.invoke('send-booking-reminder-email', {
                                                            body: { bookingId: newBooking.id, actionType: 'created' }
                                                        }).catch(err => console.error('⚠️ Error sending new booking email:', err));
                                                    }
                                                } else if (insertError) {
                                                    console.error('❌ Error creating booking:', insertError);
                                                }
                                            }

                                            // 5. Decrease room count if booking is confirmed and room_type is specified
                                            if (isNewlyConfirmed && bookingConfig.business_type === 'hotel' && extractedFields.room_type) {
                                                try {
                                                    const roomTypeName = extractedFields.room_type;
                                                    const rooms = typeof bookingConfig.hotel_rooms_available === 'string'
                                                        ? JSON.parse(bookingConfig.hotel_rooms_available)
                                                        : bookingConfig.hotel_rooms_available;

                                                    if (Array.isArray(rooms)) {
                                                        const roomIndex = rooms.findIndex((r: any) =>
                                                            (r.name || '').toLowerCase() === roomTypeName.toLowerCase()
                                                        );

                                                        if (roomIndex !== -1 && rooms[roomIndex].count > 0) {
                                                            rooms[roomIndex].count = Math.max(0, rooms[roomIndex].count - 1);

                                                            // Update booking configuration with decreased room count
                                                            const { error: updateRoomsError } = await supabase
                                                                .from('booking_configurations')
                                                                .update({ hotel_rooms_available: rooms })
                                                                .eq('id', bookingConfig.id);

                                                            if (updateRoomsError) {
                                                                console.error('❌ Error updating room count:', updateRoomsError);
                                                            } else {
                                                                console.log(`✅ Decreased room count for "${roomTypeName}": ${rooms[roomIndex].count + 1} → ${rooms[roomIndex].count}`);
                                                            }
                                                        }
                                                    }
                                                } catch (roomError) {
                                                    console.error('❌ Error processing room count decrease:', roomError);
                                                }
                                            }

                                            // 6. Increment booking count if newly confirmed
                                            if (isNewlyConfirmed && subData.bookings_used < subData.bookings_limit) {
                                                const { error: countError } = await supabase
                                                    .from('subscriptions')
                                                    .update({ bookings_used: subData.bookings_used + 1 })
                                                    .eq('user_id', userId);

                                                if (countError) console.error('⚠️ Error updating booking count:', countError);
                                                else console.log('✅ Booking count updated:', subData.bookings_used + 1);
                                            }
                                        }
                                    } catch (parseErr) {
                                        console.error('❌ Failed to parse AI JSON block:', parseErr);
                                        console.error('   Raw JSON string:', jsonString);
                                    }
                                }
                            } catch (err) {
                                console.error('❌ Error processing AI booking JSON:', err);
                            }
                        }
                    } catch (error: any) {
                        console.error('❌ Error calling OpenRouter API:', error);
                        console.error('   Error message:', error.message);
                        console.error('   Error stack:', error.stack);
                        aiMessageText = error.message?.includes('quota') || error.message?.includes('overloaded') || error.message?.includes('rate limit')
                            ? '⚠️ The AI service is currently experiencing high demand. Please try again in a few moments.'
                            : '❌ Sorry, I encountered an error processing your message. Please try again later.';
                    }

                    // Send the AI response back to WhatsApp
                    if (!aiMessageText || aiMessageText.trim() === '') {
                        console.error('⚠️ aiMessageText is empty, using fallback');
                        aiMessageText = (forcedLanguage === 'somali' ? 'Haye, waan ku caawinayaa.' : 'Sure, I am helping you with that.');
                    }

                    console.log('📤 Sending response to WhatsApp:', {
                        to: customerPhone,
                        textLength: aiMessageText.length,
                        hasJson: hasJson
                    });

                    const sent = await sendWhatsAppMessage(
                        phoneNumberId,
                        accessToken,
                        customerPhone,
                        aiMessageText
                    );

                    if (!sent) {
                        console.error('❌ Failed to send message to WhatsApp');
                    } else {
                        console.log('✅ Message sent successfully to WhatsApp');
                        messagesProcessed++;
                    }
                } // end message loop
            } // end change loop
        } // end entry loop

        console.log(`📊 Total messages processed in this webhook: ${messagesProcessed}`);
        console.log('✅ Webhook processing completed successfully');

        return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('❌ CRITICAL ERROR in whatsapp-webhook function:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

