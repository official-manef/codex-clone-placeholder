/**
 * Provider connection registry — how to *reach* a provider, separate from any model catalog.
 * Copied from `models-rahmanef-com` (src/registry.js) with the slugs this template offers.
 *
 * Security: a built-in provider's key is pinned to the baseURL below. A caller-supplied endpoint
 * is honoured only for a custom slug, so provider A's key can never be sent to provider B.
 */
export type Protocol = 'openai' | 'anthropic';

export type ProviderEntry = {
	baseUrl: string;
	protocol: Protocol;
	/** Shown in the connect form so a user knows where to get the key. */
	docsUrl: string;
};

export const PROVIDERS: Readonly<Record<string, ProviderEntry>> = {
	openai: {
		baseUrl: 'https://api.openai.com/v1',
		protocol: 'openai',
		docsUrl: 'https://platform.openai.com/api-keys'
	},
	anthropic: {
		baseUrl: 'https://api.anthropic.com',
		protocol: 'anthropic',
		docsUrl: 'https://console.anthropic.com/settings/keys'
	},
	google: {
		baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
		protocol: 'openai',
		docsUrl: 'https://aistudio.google.com/apikey'
	},
	openrouter: {
		baseUrl: 'https://openrouter.ai/api/v1',
		protocol: 'openai',
		docsUrl: 'https://openrouter.ai/keys'
	},
	groq: {
		baseUrl: 'https://api.groq.com/openai/v1',
		protocol: 'openai',
		docsUrl: 'https://console.groq.com/keys'
	},
	deepseek: {
		baseUrl: 'https://api.deepseek.com',
		protocol: 'openai',
		docsUrl: 'https://platform.deepseek.com/api_keys'
	},
	xai: {
		baseUrl: 'https://api.x.ai/v1',
		protocol: 'openai',
		docsUrl: 'https://console.x.ai'
	},
	mistral: {
		baseUrl: 'https://api.mistral.ai/v1',
		protocol: 'openai',
		docsUrl: 'https://console.mistral.ai/api-keys'
	},
	cerebras: {
		baseUrl: 'https://api.cerebras.ai/v1',
		protocol: 'openai',
		docsUrl: 'https://cloud.cerebras.ai'
	},
	'ollama-cloud': {
		baseUrl: 'https://ollama.com/v1',
		protocol: 'openai',
		docsUrl: 'https://ollama.com/settings/keys'
	},
	// 9router: self-hosted OpenAI-compatible gateway. Pinned like every built-in provider so
	// an OpenAI key cannot be redirected here, and a 9router key cannot leave it.
	// Must stay in step with the 'nine-router' entry in `src/lib/server/ai/config.ts`, which
	// serves the same slug on the SvelteKit path. Two files, one name, on purpose: convex/
	// cannot import from src/lib because the Convex runtime bundles its own graph.
	'nine-router': {
		baseUrl: 'https://router.antinrml.com/v1',
		protocol: 'openai',
		docsUrl: 'https://9router.com'
	}
};

export function isBuiltin(slug: string): boolean {
	return Object.hasOwn(PROVIDERS, slug);
}

/** Public shape for a "connect a provider" picker. No secrets, no endpoints beyond docs. */
export function providerCatalog() {
	return Object.entries(PROVIDERS).map(([slug, entry]) => ({
		slug,
		protocol: entry.protocol,
		docsUrl: entry.docsUrl
	}));
}
