
export function detectLanguage(text: string): 'somali' | 'english' {
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
        'hadal', 'soomaali', 'soomaaliya'
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
