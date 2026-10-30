/**
 * Server-side endpoint validation for a paired device.
 *
 * Convex runs in its own runtime, so this cannot import `src/lib/runtime/endpoint.ts`. The
 * rules are the same subset that matters here: an http/https origin, no credentials, no
 * fragment, no query, no path beyond `/`. The browser-side classifier adds the network
 * kind; the server only needs to refuse storing something that is not an origin.
 */
const MAX_ENDPOINT_LENGTH = 2048;

/** Returns the normalised origin, or null when the input is not an acceptable origin. */
export function normalizeEndpoint(input: unknown): string | null {
	if (typeof input !== 'string') return null;
	const text = input.trim();
	if (!text || text.length > MAX_ENDPOINT_LENGTH) return null;
	let parsed: URL;
	try {
		parsed = new URL(text);
	} catch {
		return null;
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
	if (parsed.username || parsed.password) return null;
	if (parsed.search || parsed.hash) return null;
	if (parsed.pathname !== '/') return null;
	return parsed.origin;
}
