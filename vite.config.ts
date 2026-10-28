import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// SvelteKit merges its own allowlist; root feature slices also need client dev access.
	server: { fs: { allow: ['slices', 'shared'] } },
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					// The typed-ESLint specs boot a full project service; 5s is not enough once
					// `slices/**` grew. 30s keeps the suite honest without hiding hangs.
					testTimeout: 30_000,
					include: ['src/**/*.{test,spec}.{js,ts}', 'slices/**/*.{test,spec}.{js,ts}'],
					exclude: ['**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
