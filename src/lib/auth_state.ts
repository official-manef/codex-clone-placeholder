/**
 * Honest sign-in copy.
 *
 * `PUBLIC_CONVEX_URL` can be set while `AUTH_ENABLED` is not, and then `/auth/login` is a 404.
 * Every screen that asks for a signed-in owner reads the same facts through this module, so
 * "sign in" is only offered when that route exists and a missing configuration is named.
 */

export type AuthFacts = { configured: boolean; signedIn: boolean; isLoading: boolean };

export type AuthCopy = {
	tone: 'ready' | 'signin' | 'unavailable';
	title: string;
	detail: string;
	action: string | null;
};

const ENABLE_HINT =
	'Set AUTH_ENABLED, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_SESSION_SECRET and PUBLIC_SITE_URL on the server.';

export function authCopy(facts: AuthFacts): AuthCopy {
	if (!facts.configured) {
		return {
			tone: 'unavailable',
			title: 'Sign-in is not configured on this deployment',
			detail: `${ENABLE_HINT} Provider keys need a signed-in owner, so nothing can be stored until then.`,
			action: null
		};
	}
	if (facts.isLoading) {
		return { tone: 'ready', title: 'Checking your session…', detail: '', action: null };
	}
	if (!facts.signedIn) {
		return {
			tone: 'signin',
			title: 'Sign in to connect a provider key',
			detail: '',
			action: '/auth/login'
		};
	}
	return { tone: 'ready', title: '', detail: '', action: null };
}

export function isSignInError(message: unknown): boolean {
	try {
		const text =
			typeof message === 'string'
				? message
				: message instanceof Error && typeof message.message === 'string'
					? message.message
					: null;
		if (text === null) return false;
		const lower = text.toLowerCase();
		// `Called by client` is what the Convex client reports for an unauthenticated
		// owner-scoped call, so it belongs in this set.
		return (
			lower.includes('please sign in') ||
			lower.includes('not_authenticated') ||
			lower.includes('called by client')
		);
	} catch {
		// A hostile value (throwing getter, revoked proxy) is not a sign-in error.
		return false;
	}
}
