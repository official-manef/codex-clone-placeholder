import { defineConfig, devices } from '@playwright/test';

const port = 4197;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	webServer: {
		command: `bun run build && bun run preview -- --host 127.0.0.1 --port ${port}`,
		url: baseURL,
		reuseExistingServer: false
	},
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		launchOptions: process.env.PLAYWRIGHT_CHROME_PATH
			? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
			: undefined
	},
	projects: [
		{ name: 'narrow-mobile', use: { ...devices['iPhone SE'], browserName: 'chromium' } },
		{ name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }
	]
});
