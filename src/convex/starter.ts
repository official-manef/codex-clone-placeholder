import { queryGeneric } from 'convex/server';

export const status = queryGeneric({
	args: {},
	handler: async () => ({
		ok: true as const,
		stack: 'Svelte 5 Runes + Bun + Convex',
		generatedAt: Date.now()
	})
});
