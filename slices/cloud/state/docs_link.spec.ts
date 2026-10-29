import { describe, expect, it } from 'vitest';
import { safeDocsLink } from './docs_link';

describe('safeDocsLink', () => {
	it('accepts a plain HTTPS page', () => {
		expect(safeDocsLink('https://platform.openai.com/api-keys')).toBe(
			'https://platform.openai.com/api-keys'
		);
	});

	it('rejects plain HTTP', () => {
		expect(safeDocsLink('http://platform.openai.com/api-keys')).toBeNull();
	});

	it('rejects a javascript: URL', () => {
		expect(safeDocsLink('javascript:alert(1)')).toBeNull();
	});

	it('rejects a data: URL', () => {
		expect(safeDocsLink('data:text/html,<script>alert(1)</script>')).toBeNull();
	});

	it('rejects embedded credentials', () => {
		expect(safeDocsLink('https://user:pass@example.com/keys')).toBeNull();
		expect(safeDocsLink('https://user@example.com/keys')).toBeNull();
	});

	it('rejects a fragment and anything that is not a URL', () => {
		expect(safeDocsLink('https://example.com/keys#top')).toBeNull();
		expect(safeDocsLink('not a url')).toBeNull();
		expect(safeDocsLink('')).toBeNull();
		expect(safeDocsLink(undefined)).toBeNull();
		expect(safeDocsLink(42)).toBeNull();
	});
});
