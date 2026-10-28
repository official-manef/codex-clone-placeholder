/**
 * AES-256-GCM at rest for BYOK keys. Copied from models-rahmanef-com (web/convex/crypto.ts).
 *
 * Master key: env `MODELS_ENC_KEY` = base64 of 32 random bytes.
 *   openssl rand -base64 32
 * Set it on the Convex deployment. Losing it means every stored key must be re-entered.
 *
 * Web Crypto is available in the Convex runtime, so this runs in actions only (mutations are
 * deterministic and must not use getRandomValues).
 */
const enc = new TextEncoder();
const dec = new TextDecoder();

async function masterKey(): Promise<CryptoKey> {
	const b64 = process.env.MODELS_ENC_KEY;
	if (!b64) throw new Error('MODELS_ENC_KEY not set (base64 of 32 bytes)');
	const raw = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
	if (raw.byteLength !== 32) throw new Error('MODELS_ENC_KEY must decode to 32 bytes');
	return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Returns base64( iv[12] || ciphertext ). */
export async function encryptSecret(plain: string): Promise<string> {
	const key = await masterKey();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain))
	);
	const out = new Uint8Array(iv.length + ciphertext.length);
	out.set(iv);
	out.set(ciphertext, iv.length);
	return btoa(String.fromCharCode(...out));
}

export async function decryptSecret(blob: string): Promise<string> {
	const key = await masterKey();
	const raw = Uint8Array.from(atob(blob), (char) => char.charCodeAt(0));
	const plain = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: raw.slice(0, 12) },
		key,
		raw.slice(12)
	);
	return dec.decode(plain);
}
