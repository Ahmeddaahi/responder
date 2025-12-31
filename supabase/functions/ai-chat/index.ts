import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('📥 Received AI chat request');
        const requestData = await req.json();
        const { userId, message, platform, customerId } = requestData;

        console.log('📋 Request data:', {
            hasUserId: !!userId,
            hasMessage: !!message,
            messageLength: message?.length || 0,
            platform: platform || 'unknown',
            customerId: customerId || 'none'
        });

        if (!userId || !message) {
            console.error('❌ Missing required fields:', { userId: !!userId, message: !!message });
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('🔌 Supabase client initialized');

        // Check message limit BEFORE processing and fetch plan limits
        const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select('messages_used, message_limit, plan, knowledge_base_limit, products_limit, max_chars_per_item, expires_at')
            .eq('user_id', userId)
            .single();

        if (subError) {
            console.error('Failed to fetch subscription:', subError);
            throw new Error('Failed to check message limit');
        }

        // Check for subscription expiry
        if (subData.expires_at && new Date(subData.expires_at) < new Date()) {
            console.log(`⚠️ User ${userId} subscription expired on: ${subData.expires_at}`);
            return new Response(
                JSON.stringify({
                    error: 'Subscription expired',
                    limitExceeded: true,
                    plan: subData.plan,
                    response: `⚠️ Your subscription expired on ${new Date(subData.expires_at).toLocaleDateString()}. Please renew your plan to continue using the AI assistant.`
                }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Enforce message limit
        if (subData.messages_used >= subData.message_limit) {
            console.log(`⚠️ User ${userId} reached message limit: ${subData.messages_used}/${subData.message_limit}`);

            // Trigger usage limit email notification (fire and forget)
            supabase.functions.invoke('send-usage-limit-email', {
                body: { userId: userId, limitType: 'messages' }
            }).catch(err => console.error('Error invoking limit email:', err));

            return new Response(
                JSON.stringify({
                    error: 'Message limit exceeded',
                    limitExceeded: true,
                    messagesUsed: subData.messages_used,
                    messageLimit: subData.message_limit,
                    plan: subData.plan,
                    response: `⚠️ You've reached your message limit (${subData.message_limit} messages/month). Please upgrade your plan to continue using the AI assistant.`
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get user's knowledge base (limited by plan)
        const knowledgeLimit = subData.knowledge_base_limit || 5; // Default to 5 if not set
        const { data: knowledgeData, error: knowledgeError } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(knowledgeLimit);

        // Fetch products from user_products table (limited by plan)
        const productsLimit = subData.products_limit || 50; // Default to 50 if not set
        const { data: productsData } = await supabase
            .from('user_products')
            .select('name, price, details')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(productsLimit);

        // Fetch booking configuration to get the forced language setting and business details
        const { data: bookingConfig } = await supabase
            .from('booking_configurations')
            .select('language, business_name, business_type')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        if (knowledgeError) {
            console.error('Knowledge fetch error:', knowledgeError);
            throw new Error('Failed to fetch knowledge base');
        }

        // Detect the language of the user's message (legacy/fallback)
        const autoDetectedLanguage = detectLanguage(message);

        // Use configured language if available, otherwise fallback to detection
        const selectedLanguage = bookingConfig?.language || 'so';
        const forcedLanguage = selectedLanguage === 'en' ? 'english' : 'somali';

        console.log('🌍 Language configuration (AI Chat):', {
            autoDetected: autoDetectedLanguage,
            selectedInConfig: selectedLanguage,
            forcedLanguage: forcedLanguage
        });

        // Build context from knowledge base with focus on products and business details
        // Optimized to reduce token usage while maintaining context
        // Add language requirement at the very beginning
        const languageHeader = forcedLanguage === 'somali'
            ? '=== CRITICAL: YOU ARE A SOMALI LANGUAGE ASSISTANT ===\nYour response language has been STRICTLY configured to Somali (Soomaali). You MUST respond ONLY in Somali. DO NOT use English. DO NOT include English translations. DO NOT mix languages. Use polite, clear, business-appropriate Somali. Regardless of the customer\'s input language, emojis, or slang, your output MUST be 100% Somali. Every single word must be in Somali.\n=== END LANGUAGE REQUIREMENT ===\n\n'
            : '=== CRITICAL: YOU ARE AN ENGLISH LANGUAGE ASSISTANT ===\nYour response language has been STRICTLY configured to English. You MUST respond ONLY in English. DO NOT include Somali translations. DO NOT mix languages. Use professional, friendly business English. Regardless of the customer\'s input language, emojis, or slang, your output MUST be 100% English. Every single word must be in English.\n=== END LANGUAGE REQUIREMENT ===\n\n';

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

Your primary job is to answer customer questions about:
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
            const maxCharsPerItem = subData.max_chars_per_item || 2000; // Default to 2000 if not set
            const itemsToUse = knowledgeData; // Already limited by query above

            // Separate product-related and business-related information for better structure
            const productInfo: string[] = [];
            const businessInfo: string[] = [];

            itemsToUse.forEach((item: { type: string; title: string; content: string }) => {
                // Truncate content based on plan limit
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
                itemsToUse.forEach((item: { type: string; title: string; content: string }) => {
                    const content = item.content.length > maxCharsPerItem
                        ? item.content.substring(0, maxCharsPerItem) + '...'
                        : item.content;
                    context += `[${item.type.toUpperCase()}] ${item.title}: ${content}\n\n`;
                });
            }

            // Add a reminder section that all content above should be searched for product names
            context += '\n=== SEARCH REMINDER ===\n';
            context += 'IMPORTANT: The sections above contain ALL available knowledge base content. When a customer asks about a specific product name (e.g., "iPhone 17", "Samsung Galaxy"), you MUST search through ALL the content in the sections above to find that product name, even if it appears in different forms. Do not skip this search step.\n';

        } else {
            context += 'No business information available yet. Provide helpful, professional responses.';
        }

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
        const formattedServices = serviceInstructions.map(s => `     ${s}`).join('\\n');
        const businessName = bookingConfig?.business_name || 'our business';

        context += '0. **GREETING RESPONSE (ABSOLUTE HIGHEST PRIORITY)**: When a customer sends a greeting like "ASC", "asc", "asalamu alaykum", "aslamu calaykum", "salaamu alaykum", "al salaamu alaykum", or similar Islamic greetings:\n';
        context += '   - Respond with "WCS" or "Wacalaykum alsalaam" (NEVER respond with "ASC")\n';
        context += '   - Add "Walaal" (brother/sister) for warmth: "WSC Walaal" or "Wacalaykum alsalaam Walaal"\n';
        context += `   - After the greeting, welcome them to ${businessName}\n`;
        context += '   - **YOU MUST LIST THE AVAILABLE SERVICES** immediately after the welcome message.\n';

        context += `   - Exact expected structure for Somali:\n`;
        context += `     1. Greeting + Welcome\n`;
        context += `     2. "Waxaan kaa caawin karaa:"\n`;
        context += `     3. [List of services]\n`;
        context += `     4. "Fadlan ii sheeg sida aan kuu caawin karo maanta?"\n`;

        if (forcedLanguage === 'somali') {
            context += `   - REQUIRED RESPONSE TEMPLATE:\n`;
            context += `     "WSC Walaal! Kusoo dhawow ${businessName}. Waxaan kaa caawin karaa:\n\n${formattedServices}\n\nFadlan ii sheeg sida aan kuu caawin karo maanta?"\n`;
        } else {
            context += `   - REQUIRED RESPONSE TEMPLATE:\n`;
            context += `     "Wacalaykum alsalaam Walaal! Welcome to ${businessName}. I can help you with:\n\n${formattedServices}\n\nPlease tell me how I can assist you?"\n`;
        }
        context += '   - Use this EXACT format. Do not shorten it. Do not ask "how can I help" without listing the services first.\n';
        context += '   - This rule takes ABSOLUTE PRIORITY over all other rules\n';
        context += '1. **UNAVAILABLE PRODUCT RESPONSE (HIGH PRIORITY - OVERRIDES PRODUCT RULES)**: When a customer asks about a specific product that is NOT found in either the PRODUCTS LIST or knowledge base:\n';
        context += '   - Respond with a SHORT, POLITE apology ONLY\n';
        context += '   - Match the response language:\n';
        context += `     • ${forcedLanguage === 'somali' ? 'Respond: "Waan ka xunnahay, alaabtaas ma hayno."' : 'Respond: "Sorry, we don\'t have that product."'}\n`;
        context += '   - DO NOT list all available products\n';
        context += '   - DO NOT suggest alternatives\n';
        context += '   - DO NOT provide additional information\n';
        context += '   - Keep the response clean, respectful, and brief\n';
        context += '   - This rule OVERRIDES all other product-related instructions below\n';
        context += '1. PRODUCT SEARCH: When a customer asks about a specific product (e.g., "iPhone 17", "Samsung Galaxy", "laptop"), you MUST:\n';
        context += '   - FIRST check the "PRODUCTS LIST" section above (if it exists) - this is the PRIMARY source for product information\n';
        context += '   - Search for the product name in the PRODUCTS LIST, matching it even if it appears in different forms (e.g., "iPhone 17", "iphone 17", "iPhone17")\n';
        context += '   - If found in PRODUCTS LIST, provide the product name, price, and details from that section\n';
        context += '   - If not found in PRODUCTS LIST, then search through ALL the knowledge base content above for that product name\n';
        context += '   - Extract and present ALL available information about that product: name, description, features, specifications, and PRICE\n';
        context += '   - If the product is not found in either PRODUCTS LIST or knowledge base, apply rule 0 above (short polite apology)\n';
        context += '2. PRODUCT LISTINGS: When customers ask "what products do you have" or "what do you sell", FIRST list ALL products from the "PRODUCTS LIST" section above (if it exists), then list any additional products mentioned in the knowledge base content above, all with their prices.\n';
        context += '3. PRICING: When customers ask about prices, search the knowledge base content above for pricing information and present it clearly.\n';
        context += '4. BUSINESS DETAILS: When customers ask about business details (location, hours, contact, services), extract and present this information from the content above.\n';



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
        // Only fetch if we have a customerId to maintain conversation context
        let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        if (customerId) {
            // Fetch last 5 exchanges (10 messages total: 5 user + 5 assistant)
            // We need the most recent 5 exchanges, so fetch in descending order and take the last 5
            const { data: allMessages, error: historyError } = await supabase
                .from('message_logs')
                .select('message_text, ai_response, created_at')
                .eq('user_id', userId)
                .eq('platform', platform || 'unknown')
                .eq('customer_id', customerId)
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
            }
        }

        // Call OpenRouter API
        const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

        // Log API key status (without exposing the actual key)
        if (!openRouterApiKey) {
            console.error('❌ OPENROUTER_API_KEY is not configured in Edge Function secrets');
            console.error('Please add OPENROUTER_API_KEY to Supabase Dashboard → Edge Functions → Settings → Secrets');
            return new Response(
                JSON.stringify({
                    error: 'AI service is not configured. Please contact support.',
                    errorType: 'configuration_error',
                    status: 500
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Log API key info (first 10 chars and last 4 chars for verification)
        const apiKeyPreview = openRouterApiKey.length > 14
            ? `${openRouterApiKey.substring(0, 10)}...${openRouterApiKey.substring(openRouterApiKey.length - 4)}`
            : '***';
        console.log('✅ OpenRouter API key found:', {
            keyPreview: apiKeyPreview,
            keyLength: openRouterApiKey.length,
            keyStartsWith: openRouterApiKey.substring(0, 4)
        });

        // Prepare messages array for the API call
        // Include context as system message, then conversation history, then current message
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

        // Add a separate system message for language requirement FIRST (most important)
        if (forcedLanguage === 'somali') {
            messages.push({
                role: 'system',
                content: 'CRITICAL LANGUAGE REQUIREMENT: You are a SOMALI LANGUAGE ASSISTANT. Your response language has been STRICTLY configured to Somali (Soomaali). You MUST respond ONLY in Somali. DO NOT use English. DO NOT include English translations. DO NOT mix languages. Every word of your response must be in Somali. This is non-negotiable and applies to ALL responses regardless of customer input language.'
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
            // Only include the last 10 messages to avoid token limits
            // conversationHistory already has max 10 messages (5 exchanges)
            conversationHistory.forEach((msg) => {
                messages.push(msg);
            });
            console.log(`💬 Added ${conversationHistory.length} messages from conversation history`);
        }

        // Add current user message with language reminder
        const messageWithReminder = forcedLanguage === 'somali'
            ? `${message}\n\n[CRITICAL: Your response language is configured to Somali. You MUST respond ONLY in Somali (Soomaali). DO NOT use English. DO NOT include English translations. Every word must be in Somali.]`
            : `${message}\n\n[CRITICAL: Your response language is configured to English. You MUST respond ONLY in English. DO NOT use Somali. Every word must be in English.]`;

        messages.push({
            role: 'user',
            content: messageWithReminder
        });

        console.log('📝 Prepared messages:', {
            totalMessages: messages.length,
            contextLength: context.length,
            messageLength: message.length,
            knowledgeItems: knowledgeData?.length || 0,
            historyMessages: conversationHistory.length
        });

        // Helper function to call OpenRouter API with retry logic
        const callOpenRouterAPI = async (model: string, retryCount = 0): Promise<Response> => {
            const maxRetries = 2;
            const baseDelay = 1000; // 1 second base delay

            const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

            console.log(`🚀 Calling OpenRouter API:`, {
                model: model,
                attempt: retryCount + 1,
                apiUrl: apiUrl,
                messageCount: messages.length,
                apiKeySet: !!openRouterApiKey
            });

            try {
                const requestBody = {
                    model: model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2048,
                };

                const requestStartTime = Date.now();
                const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://reply-ready-bot.com';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterApiKey}`,
                        'HTTP-Referer': supabaseUrl,
                        'X-Title': 'Reply Ready Bot',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                const requestDuration = Date.now() - requestStartTime;

                console.log(`📡 OpenRouter API response:`, {
                    status: response.status,
                    statusText: response.statusText,
                    duration: `${requestDuration}ms`,
                    headers: Object.fromEntries(response.headers.entries())
                });

                // Handle 503 - service unavailable, retry with backoff
                if (response.status === 503 && retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retryCount);
                    console.log(`Service unavailable (503), retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return callOpenRouterAPI(model, retryCount + 1);
                }

                // If rate limited or quota exceeded, retry with backoff
                if (response.status === 429 && retryCount < maxRetries) {
                    // Clone the response so we can read it without consuming the original
                    const responseClone = response.clone();
                    const errorText = await responseClone.text();
                    let errorData: {
                        error?: {
                            message?: string;
                            code?: string;
                            type?: string;
                        };
                        message?: string;
                    } = {};
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { message: errorText };
                    }

                    // Extract retry delay from error response (if available)
                    // OpenRouter typically provides rate limit info in error message
                    let retryDelayMs = baseDelay * Math.pow(2, retryCount); // Default exponential backoff

                    // Check for retry-after header
                    const retryAfter = response.headers.get('retry-after');
                    if (retryAfter) {
                        const retryAfterSeconds = parseInt(retryAfter, 10);
                        if (!isNaN(retryAfterSeconds)) {
                            retryDelayMs = retryAfterSeconds * 1000;
                        }
                    }

                    console.log(`Rate limited (${response.status}), retrying after ${retryDelayMs}ms (${Math.ceil(retryDelayMs / 1000)}s) (attempt ${retryCount + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, retryDelayMs));

                    return callOpenRouterAPI(model, retryCount + 1);
                }

                return response;
            } catch (error) {
                if (retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retryCount);
                    console.log(`Request failed, retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return callOpenRouterAPI(model, retryCount + 1);
                }
                throw error;
            }
        };

        // Use google/gemini-2.5-flash-lite via OpenRouter
        console.log('🔄 Starting OpenRouter API call for user:', userId);
        const aiResponse = await callOpenRouterAPI('google/gemini-2.5-flash-lite');
        console.log('✅ OpenRouter API call completed, status:', aiResponse.status);

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            let errorData: {
                error?: {
                    message?: string;
                    code?: string;
                    type?: string;
                };
                message?: string;
            } = {};

            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }

            console.error('OpenRouter API error:', {
                status: aiResponse.status,
                statusText: aiResponse.statusText,
                error: errorData,
                rawError: errorText
            });

            // Handle different error scenarios
            if (aiResponse.status === 429) {
                const errorMessage = errorData.error?.message || errorData.message || 'Rate limit exceeded. Please try again later.';
                const isQuotaExhausted = errorMessage.includes('quota') ||
                    errorMessage.includes('Quota exceeded') ||
                    errorMessage.includes('insufficient');

                // Check for retry-after header
                const retryAfter = aiResponse.headers.get('retry-after');
                let retryDelaySeconds: number | null = null;
                if (retryAfter) {
                    retryDelaySeconds = parseInt(retryAfter, 10);
                }

                let userFriendlyMessage = '⚠️ The AI service is currently experiencing high demand. Please try again in a few moments.';
                if (isQuotaExhausted) {
                    if (retryDelaySeconds) {
                        const minutes = Math.floor(retryDelaySeconds / 60);
                        const seconds = retryDelaySeconds % 60;
                        const timeMessage = minutes > 0
                            ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
                            : `${seconds} second${seconds !== 1 ? 's' : ''}`;
                        userFriendlyMessage = `⚠️ The AI service quota has been exceeded. Please try again in ${timeMessage}.`;
                    } else {
                        userFriendlyMessage = '⚠️ The AI service quota has been exceeded. Please try again in a few minutes.';
                    }

                    console.error('OpenRouter API quota exhausted:', {
                        error: errorData.error,
                        retryAfter: retryAfter,
                        retryDelaySeconds: retryDelaySeconds,
                        message: errorMessage
                    });
                }

                return new Response(
                    JSON.stringify({
                        error: userFriendlyMessage,
                        errorType: isQuotaExhausted ? 'quota_exhausted' : 'rate_limit',
                        status: 429,
                        retryAfterSeconds: retryDelaySeconds,
                        quotaExhausted: isQuotaExhausted,
                        details: errorData
                    }),
                    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            if (aiResponse.status === 403) {
                const errorMessage = errorData.error?.message || errorData.message || 'Invalid API key or quota exceeded.';
                return new Response(
                    JSON.stringify({
                        error: errorMessage,
                        errorType: 'api_key_error',
                        status: 403,
                        details: errorData
                    }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            if (aiResponse.status === 503) {
                const errorMessage = errorData.error?.message || errorData.message || 'The AI service is temporarily overloaded.';
                return new Response(
                    JSON.stringify({
                        error: errorMessage,
                        errorType: 'service_unavailable',
                        status: 503,
                        details: errorData
                    }),
                    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            if (aiResponse.status === 400) {
                const errorMessage = errorData.error?.message || errorData.message || 'Invalid request to AI service.';
                return new Response(
                    JSON.stringify({
                        error: errorMessage,
                        errorType: 'bad_request',
                        status: 400,
                        details: errorData
                    }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Generic error for other status codes
            const errorMessage = errorData.error?.message || errorData.message || `AI service error (${aiResponse.status})`;
            return new Response(
                JSON.stringify({
                    error: errorMessage,
                    errorType: 'api_error',
                    status: aiResponse.status,
                    details: errorData
                }),
                { status: aiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const aiData = await aiResponse.json();
        console.log('📦 OpenRouter API response data:', {
            hasChoices: !!aiData.choices,
            choicesCount: aiData.choices?.length || 0,
            hasMessage: !!aiData.choices?.[0]?.message,
            hasContent: !!aiData.choices?.[0]?.message?.content,
            responseLength: aiData.choices?.[0]?.message?.content?.length || 0
        });

        const aiMessage = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
        console.log('💬 Generated AI message length:', aiMessage.length);

        // Log the message exchange
        const { error: logError } = await supabase
            .from('message_logs')
            .insert({
                user_id: userId,
                platform: platform || 'unknown',
                customer_id: customerId || null,
                message_text: message,
                ai_response: aiMessage,
            });

        if (logError) {
            console.error('Message log error:', logError);
        }

        // Update message count
        const { error: updateError } = await supabase.rpc('increment_message_count', {
            p_user_id: userId
        });

        if (updateError) {
            console.error('Message count update error:', updateError);
        }

        return new Response(
            JSON.stringify({ response: aiMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('❌ CRITICAL ERROR in ai-chat function:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        const errorMessage = error.message || 'Internal server error';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
