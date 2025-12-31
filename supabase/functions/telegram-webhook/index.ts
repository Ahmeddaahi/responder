import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkProtection } from "../_shared/protection.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const update = await req.json();

        if (!update.message?.text) {
            return new Response(JSON.stringify({
                status: 'ok'
            }), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        const customerMessage = update.message.text;
        const customerId = update.message.from.id.toString();
        const customerName = update.message.from.first_name + (update.message.from.username ? ` (@${update.message.from.username})` : "");
        const chatId = update.message.chat.id;
        const updateId = update.update_id;

        console.log("Received message:", {
            customerMessage,
            customerId,
            customerName,
            updateId
        });

        // Extract token ID from URL path
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const tokenId = pathParts[pathParts.length - 1];

        // Find user by bot token
        const { data: agentData } = await supabase
            .from("agents")
            .select("user_id, bot_token, is_active")
            .eq("platform", "telegram")
            .like("bot_token", `${tokenId}:%`)
            .maybeSingle();

        if (!agentData) {
            console.error("No agent found for token ID:", tokenId);
            return new Response(JSON.stringify({
                status: 'ok',
                error: "Agent not found"
            }), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        const userId = agentData.user_id;
        const telegramToken = agentData.bot_token;

        if (!agentData.is_active) {
            console.error("Agent is not active");
            return new Response(JSON.stringify({
                status: 'ok',
                error: "Agent not active"
            }), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        // Check if this update has already been processed (idempotency)
        const { data: existingProcessed } = await supabase
            .from("processed_webhooks")
            .select("id")
            .eq("platform", "telegram")
            .eq("external_message_id", updateId.toString())
            .eq("user_id", userId)
            .maybeSingle();

        if (existingProcessed) {
            console.log("Update already processed, skipping:", updateId);
            return new Response(JSON.stringify({ status: 'ok', skipped: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Mark this update as processed BEFORE processing
        const { error: markProcessedError } = await supabase
            .from("processed_webhooks")
            .insert({
                platform: "telegram",
                external_message_id: updateId.toString(),
                user_id: userId,
            });

        if (markProcessedError) {
            if (markProcessedError.code === "23505") { // Unique violation
                console.log("Update already processed (race condition), skipping:", updateId);
                return new Response(JSON.stringify({ status: 'ok', skipped: true }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
            console.error("Error marking update as processed:", markProcessedError);
        }

        // ===== PROTECTION SYSTEM CHECK =====
        console.log('🛡️ Running protection checks for user:', customerId);
        const protectionResult = await checkProtection(
            supabase,
            userId,
            customerId,
            'telegram',
            customerMessage
        );

        if (!protectionResult.allowed) {
            console.log('🚫 Message blocked by protection system:', protectionResult.reason);

            if (protectionResult.message) {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: protectionResult.message
                    })
                });
            }

            return new Response(JSON.stringify({ status: 'ok' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log('✅ Protection checks passed, proceeding with AI processing');
        // ===== END PROTECTION SYSTEM CHECK =====

        // Check message limit
        const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select('messages_used, message_limit, knowledge_base_limit, products_limit, max_chars_per_item')
            .eq('user_id', userId)
            .single();

        if (subError) {
            console.error('Failed to fetch subscription:', subError);
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: '❌ Sorry, I encountered an error. Please try again later.'
                })
            });
            return new Response(JSON.stringify({ status: 'ok' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Enforce message limit
        if (subData.messages_used >= subData.message_limit) {
            console.log(`⚠️ User ${userId} reached message limit: ${subData.messages_used}/${subData.message_limit}`);

            // Trigger usage limit email notification (fire and forget)
            supabase.functions.invoke('send-usage-limit-email', {
                body: { userId: userId, limitType: 'messages' }
            }).catch(err => console.error('Error invoking limit email:', err));

            const limitMessage = `⚠️ You've reached your message limit (${subData.message_limit} messages/month). Please upgrade your plan to continue.`;
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: limitMessage
                })
            });
            return new Response(JSON.stringify({ status: 'ok' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Fetch knowledge base (limited by plan)
        const knowledgeLimit = subData.knowledge_base_limit || 5;
        const { data: knowledgeData } = await supabase
            .from('knowledge_base')
            .select('type, title, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(knowledgeLimit);

        // Fetch products (limited by plan)
        const productsLimit = subData.products_limit || 50;
        const { data: productsData } = await supabase
            .from('user_products')
            .select('name, price, details')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(productsLimit);

        // Fetch booking configuration (if any)
        const { data: bookingConfig } = await supabase
            .from('booking_configurations')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        // If booking configuration exists and this message looks like booking intent,
        // create a basic booking record so it appears in the dashboard.
        if (bookingConfig) {
            const msgLower = customerMessage.toLowerCase();
            const bookingKeywords = [
                'book', 'booking', 'reserve', 'reservation', 'room', 'table',
                'appointment', 'check in', 'check-in', 'check out', 'check-out',
                'ticket', 'seat',
                'qol', 'kirayso', 'kiraysto', 'ballan', 'reservation', 'book gareyn', 'book-gareyn',
            ];

            const hasBookingIntent = bookingKeywords.some((kw) => msgLower.includes(kw));

            if (hasBookingIntent) {
                try {
                    await supabase
                        .from('bookings')
                        .insert({
                            user_id: userId,
                            customer_id: customerId,
                            platform: 'telegram',
                            booking_type: bookingConfig.business_type || 'custom',
                            status: 'pending',
                            customer_name: customerName,
                        });
                    console.log('✅ Booking record created for Telegram message');
                } catch (err) {
                    console.error('❌ Failed to create booking record (telegram):', err);
                }
            }
        }

        // Use configured language if available, otherwise default to 'so' (Somali)
        const selectedLanguage = bookingConfig?.language || 'so';
        const forcedLanguage = selectedLanguage === 'en' ? 'english' : 'somali';

        console.log('🌍 Language configuration (Telegram):', {
            selectedInConfig: selectedLanguage,
            forcedLanguage: forcedLanguage
        });

        // Build context
        const languageHeader = forcedLanguage === 'somali'
            ? '=== YOU ARE A SOMALI LANGUAGE ASSISTANT ===\nYour response language has been STRICTLY set to Somali (Soomaali). You MUST respond ONLY in Somali. DO NOT use English. DO NOT include English translations. Use polite, clear, business-appropriate Somali. Regardless of the customer\'s input language, emojis, or slang, your output MUST be 100% Somali.\n=== END LANGUAGE REQUIREMENT ===\n\n'
            : '=== YOU ARE AN ENGLISH LANGUAGE ASSISTANT ===\nYour response language has been STRICTLY set to English. You MUST respond ONLY in English. DO NOT include Somali translations. Use professional, friendly business English. Regardless of the customer\'s input language, emojis, or slang, your output MUST be 100% English.\n=== END LANGUAGE REQUIREMENT ===\n\n';

        // Get current date for the prompt
        const now = new Date();
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

`;

        if (bookingConfig) {
            context += `=== BOOKING ASSISTANT MODE ===
This business uses an AI booking assistant configuration.

Business type: ${bookingConfig.business_type}

Your job is to:
- Detect when the customer wants to make a booking (hotel room, restaurant table, hospital appointment, or custom booking)
- Collect all REQUIRED information step-by-step in a friendly conversation
- Ask for ONE thing at a time (for example: first name, then date, then time, etc.)
- Repeat the full booking details at the end and ask the customer to confirm

REQUIRED BOOKING FIELDS:
${(bookingConfig.field_configs || []).map((f: any) => `- ${f.label} (${f.type}${f.required ? ', REQUIRED' : ''})`).join('\n')}

${bookingConfig.business_type === 'hotel' ? `Hotel options: ${bookingConfig.hotel_rooms_available || 'not specified'}` : ''}
${bookingConfig.business_type === 'restaurant' ? `Restaurant opening hours: ${bookingConfig.restaurant_opening_hours || 'not specified'}` : ''}
${bookingConfig.business_type === 'hospital' ? `Hospital departments: ${bookingConfig.hospital_departments || 'not specified'}` : ''}

Extra AI booking instructions from the business:
${bookingConfig.ai_instructions || "None"}

BOOKING FLOW RULES:
- When you detect booking intent, focus the conversation on collecting booking information.
- Ask for ONE required field at a time in the EXACT SEQUENCE listed above.
- Do NOT skip any required fields.
- Wait for the user to provide the value for the current field before moving to the next.
- Use a friendly, short message for each question.
- After collecting all required fields, repeat the full booking details and ask the user to confirm.
- Only after confirmation, treat the booking as confirmed in your answer.
- If the customer changes a detail, update that detail and repeat the new summary.
- When there is NO booking intent, behave as a normal Q&A assistant using the business information and products below.

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
  "number_of_guests": number | null,
  "room_type": string | null,
  "status": "pending" | "confirmed" | null,
  "custom_data": object | null // For any OTHER fields requested by the user but not in the schema above.
}

JSON RULES:
- Include ONLY fields explicitly stated by the customer.
- If a value is not provided yet, use null.
- Do NOT guess, infer, or autocomplete values.
- Dates MUST be in YYYY-MM-DD format only.
- Numbers MUST be actual numbers.
- IMPORTANT: Do NOT include any of the standard fields above (name, phone, dates, etc.) inside the "custom_data" object. Only use "custom_data" for fields that are NOT already listed in the schema.
- If the customer has confirmed the booking, set "status" to "confirmed". Otherwise, use "pending" if booking intent is active.
\n\n`;
        } else {
            context += `No booking configuration is set up yet. You can still answer questions about the business and products, but do NOT promise to create official bookings.\n\n`;
        }

        context += `=== BUSINESS INFORMATION & PRODUCTS ===
Answer questions based ONLY on the information provided below.\n\n`;

        // Add products section
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

        // Add knowledge base
        if (knowledgeData && knowledgeData.length > 0) {
            const maxCharsPerItem = subData.max_chars_per_item || 2000;
            knowledgeData.forEach((item: any) => {
                const content = item.content.length > maxCharsPerItem
                    ? item.content.substring(0, maxCharsPerItem) + '...'
                    : item.content;
                context += `[${item.type.toUpperCase()}] ${item.title}: ${content}\n\n`;
            });
        } else {
            context += 'No business information available yet. Provide helpful, professional responses.';
        }

        // Fetch conversation history
        const { data: previousMessages } = await supabase
            .from('message_logs')
            .select('message_text, ai_response, created_at')
            .eq('user_id', userId)
            .eq('platform', 'telegram')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(5);

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

        messages.push({
            role: 'system',
            content: context
        });

        // Add conversation history
        if (previousMessages && previousMessages.length > 0) {
            previousMessages.reverse().forEach((msg) => {
                messages.push({
                    role: 'user',
                    content: msg.message_text
                });
                messages.push({
                    role: 'assistant',
                    content: msg.ai_response
                });
            });
        }

        // Add current user message with language reminder
        const messageWithReminder = forcedLanguage === 'somali'
            ? `${customerMessage}\n\n[IMPORTANT: You MUST respond in Somali language only. Do NOT use English.]`
            : `${customerMessage}\n\n[IMPORTANT: You MUST respond in English language only. Do NOT use Somali.]`;

        messages.push({
            role: 'user',
            content: messageWithReminder
        });

        // Call OpenRouter API
        let aiReply = "Sorry, I encountered an error processing your message.";

        if (openRouterApiKey) {
            try {
                const model = "google/gemini-2.5-flash-lite";
                const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

                const aiResponse = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterApiKey}`,
                        "HTTP-Referer": supabaseUrl || "https://reply-ready-bot.com",
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

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    aiReply = aiData.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
                } else {
                    console.error("OpenRouter API error:", await aiResponse.text());
                }
            } catch (error) {
                console.error("Error calling OpenRouter API:", error);
            }
        }

        // Update message count
        await supabase
            .from('subscriptions')
            .update({ messages_used: subData.messages_used + 1 })
            .eq('user_id', userId);

        // Save message log
        await supabase
            .from('message_logs')
            .insert({
                user_id: userId,
                platform: 'telegram',
                customer_id: customerId,
                message_text: customerMessage,
                ai_response: aiReply
            });

        // Extract and save booking details if booking configuration exists
        if (bookingConfig) {
            try {
                // 1. Split AI response into chat message and JSON block
                const jsonSeparator = '<|BOOKING_JSON|>';
                const parts = aiReply.split(jsonSeparator);

                if (parts.length > 1) {
                    const chatMessage = parts[0].trim();
                    const jsonString = parts[1].trim();

                    // Update the reply we'll send to Telegram
                    aiReply = chatMessage || "Haye, waan ku caawinayaa.";

                    try {
                        const extractedFields = JSON.parse(jsonString);
                        console.log('✅ Parsed AI JSON (Telegram):', extractedFields);

                        // 2. Find existing booking or prepare to create new one
                        const { data: existingBooking } = await supabase
                            .from('bookings')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('customer_id', customerId)
                            .eq('platform', 'telegram')
                            .eq('booking_type', bookingConfig.business_type)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        const bookingData: any = {
                            user_id: userId,
                            customer_id: customerId,
                            platform: 'telegram',
                            booking_type: bookingConfig.business_type,
                            business_name: bookingConfig.business_name,
                            updated_at: new Date().toISOString(),
                        };

                        // Only include fields that are not null
                        const fieldsToSave = [
                            'customer_name', 'customer_phone', 'customer_email',
                            'check_in_date', 'check_out_date', 'number_of_guests',
                            'room_type', 'status', 'custom_data'
                        ];

                        // Backend Validation for Dates
                        const nowUtc3 = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" }));
                        const today = new Date(nowUtc3);
                        today.setHours(0, 0, 0, 0);

                        if (extractedFields.check_in_date) {
                            const checkIn = new Date(extractedFields.check_in_date);
                            if (!isNaN(checkIn.getTime())) {
                                if (checkIn < today) {
                                    console.log(`⚠️ AI extracted a past check-in date (Telegram): ${extractedFields.check_in_date}. Moving to today.`);
                                    extractedFields.check_in_date = today.toISOString().split('T')[0];
                                }

                                // Max 1 year range
                                const maxDate = new Date(today);
                                maxDate.setFullYear(maxDate.getFullYear() + 1);
                                if (checkIn > maxDate) {
                                    console.log(`⚠️ AI extracted a date beyond max booking range (Telegram): ${extractedFields.check_in_date}.`);
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
                                        console.log(`⚠️ Check-out date (${extractedFields.check_out_date}) is before or same as check-in (${extractedFields.check_in_date}) (Telegram).`);
                                        extractedFields.check_out_date = null;
                                    }
                                }
                            } else {
                                extractedFields.check_out_date = null;
                            }
                        }

                        let hasAnyData = false;
                        fieldsToSave.forEach(field => {
                            if (extractedFields[field] !== null && extractedFields[field] !== undefined) {
                                bookingData[field] = extractedFields[field];
                                hasAnyData = true;
                            }
                        });

                        // Use customerName from Telegram if name not in JSON
                        if (!bookingData.customer_name && customerName) {
                            bookingData.customer_name = customerName;
                        }

                        if (hasAnyData || existingBooking) {
                            if (existingBooking) {
                                await supabase
                                    .from('bookings')
                                    .update(bookingData)
                                    .eq('id', existingBooking.id);
                                console.log('✅ Updated booking record from AI JSON (Telegram)');
                            } else {
                                if (!bookingData.status) bookingData.status = 'pending';
                                await supabase
                                    .from('bookings')
                                    .insert(bookingData);
                                console.log('✅ Created booking record from AI JSON (Telegram)');
                            }
                        }
                    } catch (parseErr) {
                        console.error('❌ Failed to parse AI JSON block (Telegram):', parseErr);
                    }
                }
            } catch (err) {
                console.error('❌ Error processing AI booking JSON (Telegram):', err);
            }
        }

        // Send reply to Telegram
        if (!aiReply || aiReply.trim() === '') {
            console.error('⚠️ aiReply is empty, using fallback');
            aiReply = "Haye, waan ku caawinayaa.";
        }

        console.log('📤 Sending response to Telegram:', {
            chatId: chatId,
            textLength: aiReply.length
        });

        const tgResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: aiReply
            })
        });

        if (!tgResponse.ok) {
            const errorText = await tgResponse.text();
            console.error('❌ Telegram API error:', errorText);
        } else {
            console.log('✅ Message sent successfully to Telegram');
        }

        return new Response(JSON.stringify({
            status: 'ok'
        }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (error: any) {
        console.error("Error in telegram-webhook:", error);
        console.error("   Error message:", error.message);
        console.error("   Error stack:", error.stack);
        return new Response(JSON.stringify({
            error: error.message || "Internal server error"
        }), {
            status: 500,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });
    }
});
