/**
 * Provider key-page links come from the server registry (`src/convex/providers.ts`), so treat
 * them as untrusted input before they become an `href`. Only a plain HTTPS page qualifies:
 * HTTPS only, no embedded credentials, no fragment. Anything else renders as text.
 */
export function safeDocsLink(value: unknown): string | null {
	if (typeof value !== 'string' || !value.trim()) return null;
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	if (url.protocol !== 'https:') return null;
	if (url.username || url.password) return null;
	if (url.hash) return null;
	return url.href;
}
