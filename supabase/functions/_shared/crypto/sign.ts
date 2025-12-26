/**
 * Cryptomus Signature Generator
 * According to Cryptomus API docs: sign = md5(base64_encode(json_body) + api_key)
 */

// Simple MD5 implementation for Deno
async function md5(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Import md5 from deno std library
    const { createHash } = await import("https://deno.land/std@0.160.0/hash/mod.ts");
    const hash = createHash("md5");
    hash.update(data);
    return hash.toString();
}

/**
 * Generate MD5 signature for Cryptomus API
 * @param payload - JSON object to sign
 * @param apiKey - Cryptomus API key
 * @returns Hex-encoded MD5 signature
 */
export async function generateCryptomusSignature(
    payload: Record<string, any>,
    apiKey: string
): Promise<string> {
    // Convert payload to JSON string
    const jsonString = JSON.stringify(payload);

    // Encode to base64
    const base64Payload = btoa(jsonString);

    // Concatenate base64 payload with API key
    const dataToHash = base64Payload + apiKey;

    // Generate MD5 hash
    const signature = await md5(dataToHash);

    return signature;
}

/**
 * Verify Cryptomus webhook signature
 * @param payload - Webhook payload  
 * @param receivedSignature - Signature from webhook header
 * @param apiKey - Cryptomus API key
 * @returns True if signature is valid
 */
export async function verifyCryptomusSignature(
    payload: Record<string, any>,
    receivedSignature: string,
    apiKey: string
): Promise<boolean> {
    const expectedSignature = await generateCryptomusSignature(payload, apiKey);
    return expectedSignature === receivedSignature;
}
