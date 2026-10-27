import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GENERIC_LABELS, PLACEHOLDER_KEYS, t, tp } from './index';
import { PLACEHOLDER_FAMILIES } from './keys';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const resolverDir = path.join(repoRoot, 'slices', 'placeholders');
const TOKEN = /\{[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?\}/g;

function svelteFiles(dir: string): string[] {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}
	return entries.flatMap((entry) => {
		if (entry.name === 'node_modules') return [];
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return svelteFiles(full);
		return entry.name.endsWith('.svelte') ? [full] : [];
	});
}

/** A token is a hand-inlined placeholder when it is declared, or a numbered family member. */
function isPlaceholderToken(token: string): boolean {
	const key = token.slice(1, -1);
	return (
		PLACEHOLDER_KEYS.includes(key) ||
		PLACEHOLDER_FAMILIES.some(({ root }) => new RegExp(`^${root}_\\d+$`).test(key))
	);
}

describe('placeholder dictionary', () => {
	it('wraps every declared key in braces', () => {
		for (const key of PLACEHOLDER_KEYS) {
			const value = t(key);
			expect(value.startsWith('{')).toBe(true);
			expect(value.endsWith('}')).toBe(true);
			expect(value).toContain(key);
		}
	});

	it('resolves unknown keys without throwing', () => {
		expect(t('definitely_not_a_key')).toBe('{definitely_not_a_key}');
	});

	it('zero-pads generated family keys', () => {
		expect(tp('capability', 3)).toBe('{capability_03}');
	});

	it('keeps padding two digits and grows beyond it', () => {
		expect(tp('recent_object', 24)).toBe('{recent_object_24}');
		expect(tp('recent_object', 120)).toBe('{recent_object_120}');
	});

	it('declares no duplicate keys', () => {
		expect(new Set(PLACEHOLDER_KEYS).size).toBe(PLACEHOLDER_KEYS.length);
	});

	it('declares every family root together with its generated keys', () => {
		for (const { root, count } of PLACEHOLDER_FAMILIES) {
			for (let n = 1; n <= count; n++) {
				expect(PLACEHOLDER_KEYS).toContain(tp(root, n).slice(1, -1));
			}
		}
		// Roots are discoverable from the flat key list, so a missing family cannot hide.
		const derivedRoots = new Set(
			PLACEHOLDER_KEYS.filter((key) => /_\d+$/.test(key)).map((key) => key.replace(/_\d+$/, ''))
		);
		for (const { root } of PLACEHOLDER_FAMILIES) expect(derivedRoots).toContain(root);
	});

	it('keeps the generic accessibility labels literal', () => {
		expect(GENERIC_LABELS).toEqual(['Close', 'Remove', 'Add']);
	});

	it('never hand-inlines a placeholder token outside the resolver', () => {
		const offenders: string[] = [];
		for (const file of [
			...svelteFiles(path.join(repoRoot, 'slices')),
			...svelteFiles(path.join(repoRoot, 'src'))
		]) {
			if (file.startsWith(`${resolverDir}${path.sep}`)) continue;
			const source = readFileSync(file, 'utf8');
			for (const token of source.match(TOKEN) ?? []) {
				if (isPlaceholderToken(token)) {
					offenders.push(`${path.relative(repoRoot, file)}: ${token}`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});
});
