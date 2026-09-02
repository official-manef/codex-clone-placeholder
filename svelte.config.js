import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// New app code is always Svelte 5 Runes. Dependencies keep their own mode.
		runes: ({ filename }) => (filename?.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		alias: {
			$features: './slices'
		}
	}
};

export default config;
