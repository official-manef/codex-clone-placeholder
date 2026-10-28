import { defineConfig } from '@playwright/test';
import config, { devServerCommand } from './playwright.config';

export default defineConfig({
	...config,
	webServer: { ...config.webServer, command: devServerCommand },
	projects: config.projects?.filter((project) => project.name === 'desktop'),
	grep: /fresh clone boots|a local send produces|settings destinations open|rail navigation reaches/
});
