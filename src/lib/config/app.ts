// Public, build-time branding only. Never put secrets or per-user state here.
export const appConfig = {
	name: 'Workspace Template',
	shortName: 'Workspace',
	description: 'Configurable Svelte workspace shell with a consumer-owned chat surface.',
	locale: 'en',
	themeColor: '#171717',
	backgroundColor: '#101010',
	tagline: 'Workspace shell',
	// The workspace is the product; there is no marketing landing page.
	landing: {
		badge: 'Svelte + Bun',
		title: 'Workspace shell',
		description: 'Rail, chat surface, tabbed output region and lazy feature screens.',
		action: 'Open workspace'
	}
} as const;
