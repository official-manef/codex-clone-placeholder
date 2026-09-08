import { expect, test } from 'vitest';
import { pageMetadata, siteOrigin } from './metadata';
import { appConfig } from './app';

test('metadata uses explicit origins, route labels and one brand configuration', () => {
	expect(siteOrigin()).toBeUndefined();
	expect(siteOrigin('https://example.com/')).toBe('https://example.com');
	for (const unsafe of [
		'javascript:alert(1)',
		'https://user:secret@example.com',
		'https://example.com/path',
		'https://example.com/?x=1',
		'http://example.com'
	]) {
		expect(() => siteOrigin(unsafe)).toThrow();
	}
	expect(pageMetadata(undefined, '/').canonical).toBeUndefined();
	const meta = pageMetadata(
		{ title: 'Account', description: 'Your profile' },
		'/account',
		siteOrigin('https://example.com')
	);
	expect(meta).toMatchObject({
		title: `Account · ${appConfig.name}`,
		description: 'Your profile',
		canonical: 'https://example.com/account',
		image: 'https://example.com/brand/social-preview.png'
	});
});
