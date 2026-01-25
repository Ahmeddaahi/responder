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
        const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

        // Use OpenRouter if available, fallback to Lovable
        const useOpenRouter = !!openRouterApiKey;

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
        const messageId = update.message.message_id;

        console.log("Received message:", {
            customerMessage,
            customerId,
            customerName,
            updateId,
            messageId
        });

        // Try to extract bot token from webhook URL to match business
        // The webhook URL format might be: /functions/v1/telegram-webhook-business/{tokenId}
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const tokenIdFromPath = pathParts[pathParts.length - 1];

        let business: any = null;
        let businessId: string | null = null;

        // Try to find business by matching telegram token
        if (tokenIdFromPath && tokenIdFromPath !== 'telegram-webhook-business') {
            const { data: tokenData } = await supabase
                .from("telegram_tokens")
                .select("business_id, token")
                .like("token", `${tokenIdFromPath}:%`)
                .maybeSingle();

            if (tokenData) {
                const { data: businessData } = await supabase
                    .from("businesses")
                    .select("*")
                    .eq("id", tokenData.business_id)
                    .maybeSingle();

                if (businessData) {
                    business = businessData;
                    businessId = businessData.id;
                }
            }
        }

        // Fallback: get first business if no token match found
        if (!business) {
            const { data: businesses, error: businessError } = await supabase
                .from("businesses")
                .select("*")
                .limit(1);

            if (businessError) {
                console.error("Error fetching businesses:", businessError);
                return new Response(JSON.stringify({
                    status: 'ok',
                    error: "Database error"
                }), {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json"
                    }
                });
            }

            if (!businesses || businesses.length === 0) {
                console.error("No business found. Please create a business in the businesses table.");
                return new Response(JSON.stringify({
                    status: 'ok',
                    error: "No business configured"
                }), {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json"
                    }
                });
            }

            business = businesses[0];
            businessId = business.id;
        }

        // Ensure we have a business before proceeding
        if (!business || !businessId) {
            console.error("No business found. Please create a business in the businesses table.");
            return new Response(JSON.stringify({
                status: 'ok',
                error: "No business configured"
            }), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        // TypeScript type narrowing - business is guaranteed to be non-null after this point
        const businessData = business;

        // Check if this update has already been processed (idempotency)
        // Use update_id as the unique identifier for Telegram updates
        const { data: existingProcessed } = await supabase
            .from("processed_webhooks")
            .select("id")
            .eq("platform", "telegram")
            .eq("external_message_id", updateId.toString())
            .eq("user_id", businessId)
            .maybeSingle();

        if (existingProcessed) {
            console.log("Update already processed, skipping:", updateId);
            return new Response(JSON.stringify({ status: 'ok', skipped: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Mark this update as processed BEFORE processing (to prevent duplicate processing)
        const { error: markProcessedError } = await supabase
            .from("processed_webhooks")
            .insert({
                platform: "telegram",
                external_message_id: updateId.toString(),
                user_id: businessId, // Using business_id as user_id for this schema
            });

        if (markProcessedError) {
            // If insert fails due to duplicate, skip processing (race condition)
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
            businessId,
            customerId,
            'telegram',
            customerMessage
        );

        if (!protectionResult.allowed) {
            console.log('🚫 Message blocked by protection system:', protectionResult.reason);

            // Send the protection response to the user
            if (protectionResult.message) {
                const { data: tokenData } = await supabase.from("telegram_tokens").select("token").eq("business_id", businessId).maybeSingle();
                const telegramToken = tokenData?.token;

                if (telegramToken) {
                    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: protectionResult.message
                        })
                    });
                }
            }

            // Return success to Telegram (message was processed, just not by AI)
            return new Response(JSON.stringify({ status: 'ok' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log('✅ Protection checks passed, proceeding with AI processing');
        // ===== END PROTECTION SYSTEM CHECK =====

        // Check if AI is enabled for this business
        if (businessData.ai_enabled === false) {
            console.log("AI is disabled for this business");
            // Fetch telegram token to send the off-message
            const { data: tokenData } = await supabase.from("telegram_tokens").select("token").eq("business_id", businessData.id).maybeSingle();

            const telegramToken = tokenData?.token;
            const offMessage = "Bot-ka AI-ga waa dansan yahay hadda. Fadlan la xidhiidh maamulka si loo shido.";

            // Save the message to database with the off-message
            await supabase.from("messages").insert({
                business_id: businessData.id,
                customer_name: customerName,
                customer_telegram_id: customerId,
                customer_message: customerMessage,
                ai_reply: offMessage
            });

            // Send off-message back to Telegram
            if (telegramToken) {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: offMessage
                    })
                });
            }

            return new Response(JSON.stringify({
                status: 'ok'
            }), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        // Fetch telegram token from secure telegram_tokens table
        const { data: tokenData } = await supabase.from("telegram_tokens").select("token").eq("business_id", businessData.id).maybeSingle();

        const telegramToken = tokenData?.token;

        // Fetch previous conversation history for this customer (last 10 messages for context)
        const { data: previousMessages } = await supabase.from("messages").select("customer_message, ai_reply, created_at").eq("business_id", businessData.id).eq("customer_telegram_id", customerId).order("created_at", {
            ascending: true
        }) // Already in chronological order
            .limit(10);

        // Format conversation history for system prompt
        const conversationHistory = previousMessages && previousMessages.length > 0 ? previousMessages.map((msg) => `Macmiil: ${msg.customer_message}\nJawaab: ${msg.ai_reply}`).join("\n\n") : "";

        // Fetch products for this business
        const { data: products } = await supabase.from("products").select("name, category, price, stock, description").eq("business_id", businessData.id);

        const productList = products && products.length > 0 ? products.map((p) => {
            const availability = p.stock > 0 ? `Waa la helayaa` : "Ma jirto hadda";
            return `- ${p.name}${p.category ? ` (${p.category})` : ""} - ${p.price} ETB - ${availability}${p.description ? ` | ${p.description}` : ""}`;
        }).join("\n") : "Alaabo lama hayo hadda";

        // Create detailed product info with stock for AI to check quantities
        const productStockInfo = products && products.length > 0 ? products.map((p) => `${p.name}: ${p.stock} unug`).join(", ") : "";

        // Use configured language from business record
        const selectedLanguage = businessData.language || 'so';
        const forcedLanguage = selectedLanguage === 'en' ? 'english' : 'somali';

        console.log('🌍 Language configuration (Telegram Business):', {
            selectedInConfig: selectedLanguage,
            forcedLanguage: forcedLanguage
        });

        // Get current date and relative dates for the prompt
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Africa/Addis_Ababa'
        });

        const todayDate = formatter.format(now);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = formatter.format(tomorrow);
        const dayAfterTomorrow = new Date(now);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const dayAfterTomorrowDate = formatter.format(dayAfterTomorrow);

        // Generate AI response
        const systemPrompt = forcedLanguage === 'somali'
            ? `Waxaad tahay kaaliye ganacsi oo Soomaali ah oo faa'iido leh.
=== YOU ARE A SOMALI LANGUAGE ASSISTANT ===
Your response language has been STRICTLY set to Somali (Soomaali). You MUST respond ONLY in Somali. DO NOT use English. DO NOT include English translations. Use polite, clear, natural, and business-appropriate Somali. Use "Walaal" to address customers politely. Regardless of the customer's input language, emojis, or slang, your output MUST be 100% Somali.
=== END LANGUAGE REQUIREMENT ===

RELEVANT DATES:
- Today: ${todayDate}
- Tomorrow: ${tomorrowDate}
- Day After Tomorrow: ${dayAfterTomorrowDate}
- Timezone: Africa/Addis_Ababa (UTC+3)

Date handling rules:
- If the user says "today", use ${todayDate}.
- If the user says "tomorrow", use ${tomorrowDate}.
- If the user says "day after tomorrow", use ${dayAfterTomorrowDate}.
- If the user says "next week", add 7 days to ${todayDate}.
- If the user mentions a day or month without a year, ALWAYS assume the current year (${now.getFullYear()}).
- NEVER select a past date.
- If the calculated date is in the past, move it to the next valid future date.
- Do NOT guess if unclear. Ask for clarification if needed (e.g., "Do you mean this coming Friday?").

SALAAN (GREETINGS):

- Marka macmiilku salaamo "asc", "ASC", "asalamu alaykum", "aslamu calaykum", "salaamu alaykum", "al salaamu alaykum" ama salaan kale oo Islaamka ah → ka jawaab "WSC" (wacalaykum alsalaam), HA KU JAWAABIN "ASC"

- Isticmaal "WSC Walaal" ama "Wacalykum aslaam Walaal" - weligaa ha isticmaalin "ASC" marka aad salaanayso

- Ka dib salaamta, soo dhawee macmiilka oo waydii sida aad u caawin karto

- WELIGAA HA CELIN SALAAMTA - kaliya salaam marka macmiilku salaamo ama marka ay tahay sheekada ugu horeysa (ma jiro taariikhda sheekada)

- Haddii ay jirto taariikhda sheekada oo macmiilku aysan salaamin → HA SALAAMIN, kaliya jawaab su'aasha



FAAHFAHIN (RESPONSE STYLE):

- WELIGAA ka jawaab si gaaban oo fudud (2-3 oo erayo keliya)

- Isticmaal erayo fudud oo fahamsan (ka fogow erayo adag)

- Noqo nasii, edeb leh, oo si toos ah u jawaab

- Ka fogow faahfaahin dheeraad ah - si dhakhso ah u jawaab su'aasha

- Wixii jawaab aad bixiso ha fahmayso qof waliba

=== SOMALI LANGUAGE TIPS (CRITICAL) ===
- Marka aad macmiilka weydiinayso magaca, MAR WALBA isticmaal: "Fadlan magacaaga oo dhamaystiran noo sheeg?"
- Isticmaal "Walaal" (brother/sister) si aad u noqoto mid edeb leh oo naxariis leh.



MUHIIM - QAANUUNKA UGU MUHIIMSAN (HIGHEST PRIORITY - Waxaan ka hor imaanaa dhammaan qawaaniinta kale):

Haddii macmiilku weydiiyo alaab aan lagu helin PRODUCTS LIST ama stock-ka uu yahay 0:
- Ku jawaab si GAABAN oo edeb leh: "Waan ka xunnahay, alaabtaas ma hayno."
- HA SHEEGIN dhammaan alaabta kale ee la hayo
- HA SIIN talo kale
- HA SHEEGIN macluumaad dheeraad ah
- Waxaan ka hor imaanaa dhammaan qawaaniinta hoose

MUHIIM - Marka macmiilku wax ku weydiiyo alaabta (products):

1. Hubi liiska alaabta hoose si taxaddar leh

2. Haddii alaabta la helo oo stock-ka uu ka badan yahay 0 → ku jawaab si dabiici ah oo sheeg qiimaha iyo wixii faahfaahin ah

3. Haddii alaabta la helin ama stock-ka uu yahay 0 → isticmaal qaanuunka ugu muhiimsan kore (gaaban oo edeb leh: "Waan ka xunnahay, alaabtaas ma hayno.")

4. WELIGAA HA SHEEGIN tirada alaabta ee stock-ka jirta - waydii macmiilka tirada uu doonayo

5. Haddii macmiilku sheego tirada uu doonayo:

   - Hubi macluumaadka stock-ka hoose (Stock Info)

   - Haddii tirada uu doonayo ay ka yar tahay ama ay la mid tahay stock-ka → ku sheeg in la heli karo

   - Haddii tirada uu doonayo ay ka badan tahay stock-ka → ku sheeg "Waan ka xumahay, tirada aad sheegtay ma hayno, laakiin waxaan haynaa [NUMBER] oo keliya"



XASUUS (MEMORY):

- Waxaad leedahay xasuus ka mid ah sheekadii hore ee macmiilkan

- Isticmaal macluumaadka taariikhda sheekada si aad ugu jawaabtid si shaqsi ah oo xirfad leh

- Haddii macmiilku ku weydiiyo wax aad hore ugu sheegtay, ka jawaab iyadoo lagu salaynayo taariikhda sheekada

- Xusuuso macluumaadka kasta oo macmiilku bixiyay (magac, cinwaan, xidhiidh, dalabyo hore, iwm)



Haddii su'aaltu aysan la xiriirin ganacsiga ama alaabtiisa, si edeb leh ugu sheeg:

"Waan ka xumahay, arrintaas nama khusayso."`
            : `You are a helpful business assistant chatbot.
=== YOU ARE AN ENGLISH LANGUAGE ASSISTANT ===
Your response language has been STRICTLY set to English. You MUST respond ONLY in English. DO NOT include Somali translations. Use professional, friendly business English. Regardless of the customer's input language, emojis, or slang, your output MUST be 100% English.
=== END LANGUAGE REQUIREMENT ===

GREETINGS:

- When a customer greets you with "ASC", "asc", "hello", "hi", or similar greetings → respond with "Wacalaykum alsalaam Walaal" or "Hello! Welcome".
- After the greeting, welcome them and ask how you can help.
- NEVER return the greeting unless it's the start of the conversation.

RESPONSE STYLE:

- Keep responses SHORT and SIMPLE (2-3 sentences max).
- Use easy-to-understand words.
- Be polite, professional, and direct.

CRITICAL RULE (HIGHEST PRIORITY):

If a customer asks for a product NOT in the PRODUCTS LIST or if stock is 0:
- Respond SHORTLY and politely: "Sorry, we don't have that product at the moment."
- DO NOT list other products.
- DO NOT give alternatives.
- DO NOT provide extra information.

IMPORTANT - When asked about products:

1. Check the products list carefully.
2. If product is available (stock > 0) → respond naturally with price and details.
3. If not found or stock is 0 → use CRITICAL RULE above.
4. NEVER mention the exact stock quantity - ask the customer how many they need.
5. If customer specifies quantity:
   - Check stock info below.
   - If available → confirm availability.
   - If not enough → specify how many are left.

MEMORY:

- You remember previous conversation details.
- Use history to provide personalized and professional service.
- Remember customer info (name, address, contact, previous orders).

If the question is not related to the business or products, politely state:
"I'm sorry, I can only help with business-related inquiries."`;

        const finalSystemPrompt = `${systemPrompt}

Ku jawaab si quman, dabiici ah, oo aan robot ahayn. Haddii macluumaad dheeraad ah loo baahan yahay, waydii su'aalo gaaban oo fudud si macmiilku u fahmo.



Macluumaadka Ganacsiga:

Magaca: ${businessData.name}

Sharaxaad: ${businessData.description || "N/A"}

Adeegyada: ${businessData.services || "N/A"}

Goobta: ${businessData.location || "N/A"}

Saacadaha Shaqada: ${businessData.working_hours || "N/A"}

Xidhiidh: ${businessData.contact || "N/A"}



Liiska Alaabta (Products):

${productList}



Stock Info (WELIGAA HA SHEEGIN MACMIILKA - Kaliya isticmaal si aad u hubiso tirada):

${productStockInfo}



${conversationHistory ? `Taariikhda Sheekada ee Hore (Conversation History):

${conversationHistory}



XUSUUUS: Waa sheekada socota, maaha sheekada ugu horeysa. HA SALAAMIN kaliya jawaab su'aasha.



` : `XUSUUUS: Waa sheekada ugu horeysa (new conversation). Haddii macmiilku salaamo, ka jawaab salaam.`}Su'aasha Macmiilka Cusub: ${customerMessage}



Jawaabta ${forcedLanguage === 'somali' ? 'Soomaaliga' : 'Ingiriisiga'} (ka jawaab si dabiici ah, iyadoo lagu salaynayo taariikhda sheekada haddii ay jirto):`;

        let aiReply = "Waan ka xumahay, ma jawaabi karo hadda.";

        if (useOpenRouter) {
            console.log("Calling OpenRouter API...");

            // Helper function to call OpenRouter API with retry logic and quota handling
            const callOpenRouterAPI = async (retryCount = 0): Promise<string> => {
                const maxRetries = 2;
                const baseDelay = 1000;

                // Use google/gemini-2.5-flash-lite via OpenRouter
                const model = "google/gemini-2.5-flash-lite";
                const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

                try {
                    const supabaseUrlForHeaders = supabaseUrl || "https://reply-ready-bot.com";
                    const aiResponse = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${openRouterApiKey}`,
                            "HTTP-Referer": supabaseUrlForHeaders,
                            "X-Title": "Reply Ready Bot",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [{
                                role: "user",
                                content: finalSystemPrompt
                            }],
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
                            const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
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
                            console.error("OpenRouter API model not found (404). The model might not be available.");
                            console.error("Error details:", errorData);
                            throw new Error(`OpenRouter API model not found. Please check if the model "${model}" is available.`);
                        }

                        // Handle 503 after retries exhausted
                        if (aiResponse.status === 503) {
                            console.error("OpenRouter API service overloaded (503) after retries. The service is temporarily unavailable.");
                            console.error("Error details:", errorData);
                            throw new Error(`OpenRouter API service is overloaded. Please try again later.`);
                        }

                        console.error("OpenRouter API error:", aiResponse.status, errorText);
                        throw new Error(`OpenRouter API error: ${aiResponse.status}`);
                    }

                    const aiData = await aiResponse.json();

                    // Log response structure for debugging (without exposing sensitive data)
                    const choice = aiData.choices?.[0];

                    console.log("OpenRouter API response structure:", {
                        hasChoices: !!aiData.choices,
                        choicesLength: aiData.choices?.length || 0,
                        hasMessage: !!choice?.message,
                        hasContent: !!choice?.message?.content,
                    });

                    // Handle response structure
                    let responseText: string | null = null;

                    if (choice?.message?.content) {
                        responseText = choice.message.content;
                    }

                    if (!responseText) {
                        console.error("OpenRouter API response missing text. Full response:", JSON.stringify(aiData).substring(0, 1000));
                        return "Waan ka xumahay, ma jawaabi karo hadda. (No response from AI)";
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
                    console.error("OpenRouter API call failed after retries:", error);
                    throw error;
                }
            };

            try {
                aiReply = await callOpenRouterAPI();
            } catch (error) {
                console.error("Failed to get AI reply from OpenRouter:", error);
                aiReply = "Waan ka xumahay, ma jawaabi karo hadda. (AI service error)";
            }

        } else if (lovableApiKey) {
            console.log("Calling Lovable AI...");

            // Build messages array with conversation history
            const messages = [
                {
                    role: "system",
                    content: systemPrompt
                }
            ];

            // Add previous conversation to messages array (already in chronological order)
            if (previousMessages && previousMessages.length > 0) {
                previousMessages.forEach((msg) => {
                    messages.push({
                        role: "user",
                        content: msg.customer_message
                    }, {
                        role: "assistant",
                        content: msg.ai_reply
                    });
                });
            }

            // Add current message
            messages.push({
                role: "user",
                content: customerMessage
            });

            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${lovableApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "google/gemini-2.5-flash",
                    messages: messages
                })
            });

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text();
                console.error("Lovable AI API error:", aiResponse.status, errorText);
                throw new Error(`Lovable AI API error: ${aiResponse.status}`);
            }

            const aiData = await aiResponse.json();
            aiReply = aiData.choices[0]?.message?.content || "Waan ka xumahay, ma jawaabi karo hadda.";

        } else {
            console.error("No AI API key configured!");
            aiReply = "Waan ka xumahay, ma jawaabi karo hadda. (No AI configured)";
        }

        console.log("AI reply:", aiReply);

        // Save message to database
        const { error: insertError } = await supabase.from("messages").insert({
            business_id: businessData.id,
            customer_name: customerName,
            customer_telegram_id: customerId,
            customer_message: customerMessage,
            ai_reply: aiReply
        });

        if (insertError) {
            console.error("Error saving message:", insertError);
        }

        // Send reply back to Telegram
        if (telegramToken) {
            const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: aiReply
                })
            });

            if (!telegramResponse.ok) {
                console.error("Telegram API error:", await telegramResponse.text());
            }
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

