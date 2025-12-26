/**
 * Bitnob Webhook Signature Verification
 * Using HMAC-SHA512
 */

export async function verifyBitnobSignature(
    payload: string,
    receivedSignature: string,
    secretKey: string
): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const payloadData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["verify", "sign"]
    );

    const signatureBytes = new Uint8Array(
        receivedSignature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        payloadData
    );

    return isValid;
}
