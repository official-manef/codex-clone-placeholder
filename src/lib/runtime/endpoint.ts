/**
 * What kind of network an execution endpoint lives on.
 *
 * Pure: no runes, no DOM. A device bridge runs on the user's own machine; whether the
 * browser may talk to it depends on where it is reachable from. `tailscale` is not
 * "private" in the IPv4 sense but the traffic is already inside an encrypted tailnet.
 */
export type EndpointKind = 'loopback' | 'lan' | 'tailscale' | 'public' | 'invalid';

export type EndpointClassification = {
	kind: EndpointKind;
	origin: string | null;
	reason: string | null;
};

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const MAX_ENDPOINT_LENGTH = 2048;

function invalid(reason: string): EndpointClassification {
	return { kind: 'invalid', origin: null, reason };
}

/** `URL.hostname` keeps the brackets around an IPv6 literal; everything else is lowercase. */
function bareHost(hostname: string): string {
	const host = hostname.toLowerCase();
	return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}

function ipv4Octets(host: string): number[] | null {
	const parts = host.split('.');
	if (parts.length !== 4) return null;
	const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN));
	return octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
		? octets
		: null;
}

/** Loopback, then LAN, then the CGNAT block Tailscale hands out, then public. */
function kindOfHost(hostname: string): EndpointKind {
	const host = bareHost(hostname);
	if (LOOPBACK_HOSTS.has(host)) return 'loopback';
	const octets = ipv4Octets(host);
	if (octets) {
		const [a, b] = octets;
		if (a === 100 && b >= 64 && b <= 127) return 'tailscale';
		if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return 'lan';
		if (a === 169 && b === 254) return 'lan';
	}
	if (host.endsWith('.ts.net')) return 'tailscale';
	if (host.endsWith('.local')) return 'lan';
	return 'public';
}

/**
 * Validate and classify an endpoint origin.
 *
 * Only a bare origin is accepted: no credentials, fragment, query or non-root path. Plain
 * `http:` is refused on a public host, because the pairing token travels in the
 * `Sec-WebSocket-Protocol` header of a cleartext connection.
 */
export function classifyEndpoint(input: string): EndpointClassification {
	const text = typeof input === 'string' ? input.trim() : '';
	if (!text) return invalid('Enter an endpoint such as http://127.0.0.1:8649.');
	if (text.length > MAX_ENDPOINT_LENGTH)
		return invalid(`An endpoint must be at most ${MAX_ENDPOINT_LENGTH} characters.`);

	let parsed: URL;
	try {
		parsed = new URL(text);
	} catch {
		return invalid('That is not a valid URL. Include the scheme, for example https://host:8649.');
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
		return invalid('Only http: and https: endpoints are accepted.');
	if (parsed.username || parsed.password) return invalid('An endpoint must not embed credentials.');
	if (parsed.hash) return invalid('An endpoint must not contain a fragment.');
	if (parsed.search) return invalid('An endpoint must not contain a query string.');
	if (parsed.pathname !== '/') return invalid('An endpoint must be an origin with no path.');

	const kind = kindOfHost(parsed.hostname);
	if (kind === 'invalid') return invalid('That endpoint is not addressable.');
	if (parsed.protocol === 'http:' && kind === 'public')
		return invalid(
			'A public endpoint needs https:. Plain http would expose the pairing token to anyone on the path.'
		);

	return { kind, origin: parsed.origin, reason: null };
}

const KIND_TAGS: Record<EndpointKind, string> = {
	loopback: 'loopback',
	lan: 'LAN',
	tailscale: 'Tailscale',
	public: 'public',
	invalid: 'invalid'
};

/** A settings row label: the origin plus a short network tag. */
export function displayEndpoint(origin: string): string {
	const kind = classifyEndpoint(origin).kind;
	return `${origin} · ${KIND_TAGS[kind]}`;
}
