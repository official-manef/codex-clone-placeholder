// Public, build-time branding only. Never put secrets or per-user state here.
export const appConfig = {
	name: 'Placeholder Workspace',
	shortName: 'Workspace',
	description: 'Workspace shell structure with placeholder copy.',
	locale: 'en',
	themeColor: '#171717',
	backgroundColor: '#101010',
	tagline: 'Workspace shell',
	landing: {
		badge: 'Placeholder build',
		title: 'Placeholder workspace shell',
		description: 'Structure only. Every string is a token.',
		action: 'Open workspace'
	}
} as const;
