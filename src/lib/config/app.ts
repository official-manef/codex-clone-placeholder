// Public, build-time branding only. Never put secrets or per-user state here.
export const appConfig = {
	name: 'Svelte Convex Starter',
	shortName: 'Svelte Convex',
	description:
		'A Svelte 5, SvelteKit, Bun and Convex starter with typed feature slices and a responsive application shell.',
	locale: 'en',
	themeColor: '#171717',
	backgroundColor: '#fafafa',
	tagline: 'Runes starter',
	landing: {
		badge: 'Svelte 5 Runes starter',
		title: 'Full-stack Svelte, already structured for AI-assisted work.',
		description:
			'Bun + SvelteKit + shadcn-svelte + optional Convex, with root vertical slices and one dynamic page registry.',
		action: 'Open starter'
	}
} as const;
