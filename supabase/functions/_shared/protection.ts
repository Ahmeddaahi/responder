import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectLanguage } from "./utils.ts";

// Abusive words list (English + Somali)
const ABUSIVE_WORDS = [
    // English
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap', 'idiot', 'stupid', 'dumb',
    'moron', 'retard', 'loser', 'jerk', 'dick', 'pussy', 'cock', 'whore', 'slut', 'fag',
    // Somali
    'doqon', 'nacas', 'waalan', 'wasakh', 'nijaas', 'sharmuuto', 'dhillo', 'ceeb',
];

export interface ProtectionResult {
    allowed: boolean;
    reason?: 'rate_limit' | 'abuse' | 'off_topic' | 'blocked';
    message?: string;
    shouldCallAI: boolean;
}

export interface RateLimitConfig {
    maxMessagesPerMinute: number;
    maxMessagesPer10Minutes: number;
    warningThreshold: number;
    autoBlockThreshold: number;
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    maxMessagesPerMinute: 5,
    maxMessagesPer10Minutes: 50,
    warningThreshold: 3,
    autoBlockThreshold: 50,
};

/**
 * Check if user is blocked
 */
export async function isUserBlocked(
    supabase: SupabaseClient,
    userIdentifier: string,
    platform: string
): Promise<boolean> {
    console.log('🔍 Checking if user is blocked:', { userIdentifier, platform });

    const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('user_identifier', userIdentifier)
        .eq('platform', platform)
        .maybeSingle();

    if (error) {
        console.error('❌ Error checking blocked status:', error);
        return false;
    }

    const isBlocked = !!data;
    console.log(isBlocked ? '🚫 User IS BLOCKED' : '✅ User is NOT blocked', { data });

    return isBlocked;
}

/**
 * Block a user
 */
export async function blockUser(
    supabase: SupabaseClient,
    userIdentifier: string,
    platform: string,
    reason: string
): Promise<void> {
    const { error } = await supabase
        .from('blocked_users')
        .insert({
            user_identifier: userIdentifier,
            platform: platform,
            reason: reason,
        });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error blocking user:', error);
    }
}

/**
 * Check rate limit and update stats
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    userIdentifier: string,
    platform: string,
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): Promise<ProtectionResult> {
    const now = new Date();

    // Get or create user stats
    const { data: stats, error: fetchError } = await supabase
        .from('user_protection_stats')
        .select('*')
        .eq('user_identifier', userIdentifier)
        .eq('platform', platform)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching protection stats:', fetchError);
        return { allowed: true, shouldCallAI: true };
    }

    let currentStats = stats;

    // Create new stats if doesn't exist
    if (!currentStats) {
        const { data: newStats, error: insertError } = await supabase
            .from('user_protection_stats')
            .insert({
                user_identifier: userIdentifier,
                platform: platform,
                message_count_1min: 1,
                window_start_1min: now.toISOString(),
                message_count_10min: 1,
                window_start_10min: now.toISOString(),
                warning_count: 0,
                last_message_at: now.toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating protection stats:', insertError);
            return { allowed: true, shouldCallAI: true };
        }

        return { allowed: true, shouldCallAI: true };
    }

    // Check if blocked temporarily
    if (currentStats.blocked_until) {
        const blockedUntil = new Date(currentStats.blocked_until);
        if (now < blockedUntil) {
            const language = detectLanguage(''); // Default to English
            return {
                allowed: false,
                reason: 'blocked',
                message: language === 'somali'
                    ? 'Waxaad xiran tahay xilliga xadgudubka. Fadlan isku day mar dambe.'
                    : 'You are temporarily blocked due to abuse.',
                shouldCallAI: false,
            };
        }
    }

    // Calculate time windows
    const windowStart1min = new Date(currentStats.window_start_1min);
    const windowStart10min = new Date(currentStats.window_start_10min);
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    let messageCount1min = currentStats.message_count_1min;
    let messageCount10min = currentStats.message_count_10min;
    let newWindowStart1min = currentStats.window_start_1min;
    let newWindowStart10min = currentStats.window_start_10min;

    // Reset 1-minute window if expired
    if (windowStart1min < oneMinuteAgo) {
        messageCount1min = 1;
        newWindowStart1min = now.toISOString();
    } else {
        messageCount1min += 1;
    }

    // Reset 10-minute window if expired
    if (windowStart10min < tenMinutesAgo) {
        messageCount10min = 1;
        newWindowStart10min = now.toISOString();
    } else {
        messageCount10min += 1;
    }

    // Check if rate limit exceeded
    const language = detectLanguage(''); // Default to English

    // Check 1-minute limit
    if (messageCount1min > config.maxMessagesPerMinute) {
        // Increment warning count
        const newWarningCount = currentStats.warning_count + 1;

        // Auto-block if warning threshold exceeded
        if (newWarningCount >= config.warningThreshold) {
            await blockUser(supabase, userIdentifier, platform, 'Exceeded warning threshold');

            return {
                allowed: false,
                reason: 'blocked',
                message: language === 'somali'
                    ? 'Waxaad xiran tahay xilliga xadgudubka.'
                    : 'You are temporarily blocked due to abuse.',
                shouldCallAI: false,
            };
        }

        // Update stats with warning
        await supabase
            .from('user_protection_stats')
            .update({
                message_count_1min: messageCount1min,
                window_start_1min: newWindowStart1min,
                message_count_10min: messageCount10min,
                window_start_10min: newWindowStart10min,
                warning_count: newWarningCount,
                last_message_at: now.toISOString(),
            })
            .eq('user_identifier', userIdentifier)
            .eq('platform', platform);

        return {
            allowed: false,
            reason: 'rate_limit',
            message: language === 'somali'
                ? 'Fadlan jooji dirista fariimaha badan. Si tartiib u dir fariimaha.'
                : 'Please slow down. You\'re sending too many messages.',
            shouldCallAI: false,
        };
    }

    // Check 10-minute limit (auto-block threshold)
    if (messageCount10min > config.autoBlockThreshold) {
        await blockUser(supabase, userIdentifier, platform, 'Exceeded 10-minute message limit');

        return {
            allowed: false,
            reason: 'blocked',
            message: language === 'somali'
                ? 'Waxaad xiran tahay xilliga xadgudubka.'
                : 'You are temporarily blocked due to abuse.',
            shouldCallAI: false,
        };
    }

    // Update stats
    await supabase
        .from('user_protection_stats')
        .update({
            message_count_1min: messageCount1min,
            window_start_1min: newWindowStart1min,
            message_count_10min: messageCount10min,
            window_start_10min: newWindowStart10min,
            last_message_at: now.toISOString(),
        })
        .eq('user_identifier', userIdentifier)
        .eq('platform', platform);

    return { allowed: true, shouldCallAI: true };
}

/**
 * Check if message contains abusive content
 */
export function isAbusive(message: string): boolean {
    const messageLower = message.toLowerCase();

    for (const word of ABUSIVE_WORDS) {
        // Check for whole word matches (with word boundaries)
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(messageLower)) {
            return true;
        }
    }

    return false;
}

/**
 * Get abusive content response
 */
export function getAbusiveResponse(message: string): string {
    const language = detectLanguage(message);

    if (language === 'somali') {
        return 'Fadlan ku hadal si edeb leh. Adeeggan wuxuu u adeegaa ganacsiga.';
    } else {
        return 'Please keep your messages respectful. This service is for business assistance only.';
    }
}

/**
 * Check if message is business-related
 *
 * Booking-aware:
 * - Recognises booking / reservation intent keywords
 * - Treats follow-up messages (dates, times, phone numbers, etc.)
 *   as business-relevant when part of an active booking-style conversation
 */
export async function isBusinessRelevant(
    supabase: SupabaseClient,
    userId: string,
    message: string,
    platform?: string,
    customerId?: string
): Promise<boolean> {
    // Get products and knowledge base
    const { data: products } = await supabase
        .from('user_products')
        .select('name, category')
        .eq('user_id', userId)
        .limit(100);

    const { data: knowledge } = await supabase
        .from('knowledge_base')
        .select('title, content')
        .eq('user_id', userId)
        .limit(10);

    const messageLower = message.toLowerCase();

    // Business-related keywords
    const businessKeywords = [
        'price', 'cost', 'buy', 'purchase', 'order', 'product', 'service',
        'available', 'stock', 'delivery', 'shipping', 'payment', 'location',
        'hours', 'open', 'contact', 'phone', 'email', 'address',
        // Somali
        'qiimo', 'lacag', 'iibso', 'dalbo', 'alaab', 'adeeg', 'haysaa',
        'jira', 'geyn', 'bixin', 'meel', 'saacad', 'fur', 'xidh', 'taleefan',
        // Booking / reservation (English)
        'book', 'booking', 'reserve', 'reservation', 'room', 'table',
        'appointment', 'check in', 'check-in', 'check out', 'check-out',
        'ticket', 'seat',
        // Booking / reservation (Somali & common mix)
        'qol', 'kirayso', 'kiraysto', 'qol kirayso', 'qol kiraysto',
        'book gareyn', 'book-gareyn', 'ballan', 'ballan qaadis', 'reservation',
        'buug', 'kursi', 'miis',
    ];

    // Check for business keywords
    for (const keyword of businessKeywords) {
        if (messageLower.includes(keyword)) {
            return true;
        }
    }

    // Check if message mentions any product
    if (products && products.length > 0) {
        for (const product of products) {
            if (messageLower.includes(product.name.toLowerCase())) {
                return true;
            }
            if (product.category && messageLower.includes(product.category.toLowerCase())) {
                return true;
            }
        }
    }

    // Check if message relates to knowledge base content
    if (knowledge && knowledge.length > 0) {
        for (const item of knowledge) {
            const titleLower = item.title.toLowerCase();
            const contentLower = item.content.toLowerCase();

            // Check if message contains words from title or content
            const words = messageLower.split(/\s+/);
            for (const word of words) {
                if (word.length > 3) { // Only check meaningful words
                    if (titleLower.includes(word) || contentLower.includes(word)) {
                        return true;
                    }
                }
            }
        }
    }

    // Check for greetings (always business-relevant)
    const greetings = ['hello', 'hi', 'hey', 'asc', 'asalamu', 'salam', 'salaam', 'maalintaa', 'subax'];
    for (const greeting of greetings) {
        if (messageLower.includes(greeting)) {
            return true;
        }
    }

    // If no match found, optionally check recent conversation for booking context
    if (platform && customerId) {
        try {
            const recent = await getRecentMemory(supabase, userId, platform, customerId);
            const recentText = recent
                .map((m) => m.content.toLowerCase())
                .join(' ');

            const bookingContextKeywords = [
                'book', 'booking', 'reserve', 'reservation', 'room', 'table',
                'appointment', 'check in', 'check-in', 'check out', 'check-out',
                'ticket', 'seat', 'guests', 'people', 'many', 'count', 'number',
                'qol', 'kirayso', 'kiraysto', 'ballan', 'reservation', 'book gareyn',
                'imisa', 'qof', 'immisa', 'waqti', 'goorma', 'taariikh',
            ];

            for (const keyword of bookingContextKeywords) {
                if (recentText.includes(keyword)) {
                    // We are in a booking-style conversation; treat this follow-up
                    // message (dates, times, phone, etc.) as business-relevant
                    return true;
                }
            }
        } catch (err) {
            console.error('Error checking recent conversation for booking context:', err);
        }
    }

    // If no match found, it's likely off-topic
    return false;
}

/**
 * Get off-topic response
 */
export function getOffTopicResponse(message: string): string {
    const language = detectLanguage(message);

    if (language === 'somali') {
        return 'Waan ka xunnahay, su\'aashan ganacsiga kuma saabsan.';
    } else {
        return 'Sorry, this question is not related to this business.';
    }
}

/**
 * Get recent conversation memory (last 5 messages)
 */
export async function getRecentMemory(
    supabase: SupabaseClient,
    userId: string,
    platform: string,
    customerId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const { data: messages, error } = await supabase
        .from('message_logs')
        .select('message_text, ai_response, created_at')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error || !messages || messages.length === 0) {
        return [];
    }

    // Reverse to get chronological order
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    messages.reverse().forEach((msg) => {
        conversationHistory.push({
            role: 'user',
            content: msg.message_text,
        });
        conversationHistory.push({
            role: 'assistant',
            content: msg.ai_response,
        });
    });

    return conversationHistory;
}

/**
 * Check if message is spam (very short, nonsense, repeated characters)
 */
export function isSpam(message: string): boolean {
    const trimmed = message.trim();
    const isNumeric = /^\d+$/.test(trimmed);

    // Too short (less than 2 characters), but allow single digits (for guest counts, etc.)
    if (trimmed.length < 2 && !isNumeric) {
        return true;
    }

    // Repeated characters (e.g., "aaaaaaa", "111111")
    const repeatedPattern = /(.)\1{6,}/;
    if (repeatedPattern.test(message)) {
        return true;
    }

    // All numbers or special characters, but allow short numeric responses (guest counts, etc.)
    const onlyNumbersOrSpecial = /^[0-9\s\W]+$/;
    if (onlyNumbersOrSpecial.test(message) && trimmed.length < 5 && !isNumeric) {
        return true;
    }

    return false;
}

/**
 * Main protection check - combines all checks
 */
export async function checkProtection(
    supabase: SupabaseClient,
    userId: string,
    userIdentifier: string,
    platform: string,
    message: string
): Promise<ProtectionResult> {
    // 1. Check if user is blocked
    const blocked = await isUserBlocked(supabase, userIdentifier, platform);
    if (blocked) {
        // Return no message - AI will remain completely silent for blocked users
        return {
            allowed: false,
            reason: 'blocked',
            message: undefined, // No message sent to blocked users
            shouldCallAI: false,
        };
    }

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(supabase, userIdentifier, platform);
    if (!rateLimitResult.allowed) {
        return rateLimitResult;
    }

    // 3. Check for spam
    if (isSpam(message)) {
        const language = detectLanguage(message);
        return {
            allowed: false,
            reason: 'abuse',
            message: language === 'somali'
                ? 'Fadlan ku hadal si edeb leh. Adeeggan wuxuu u adeegaa ganacsiga.'
                : 'Please keep your messages respectful. This service is for business assistance only.',
            shouldCallAI: false,
        };
    }

    // 4. Check for abusive content
    if (isAbusive(message)) {
        return {
            allowed: false,
            reason: 'abuse',
            message: getAbusiveResponse(message),
            shouldCallAI: false,
        };
    }

    // 5. Check if business-relevant
    const businessRelevant = await isBusinessRelevant(supabase, userId, message, platform, userIdentifier);
    if (!businessRelevant) {
        return {
            allowed: false,
            reason: 'off_topic',
            message: getOffTopicResponse(message),
            shouldCallAI: false,
        };
    }

    // All checks passed
    return {
        allowed: true,
        shouldCallAI: true,
    };
}
