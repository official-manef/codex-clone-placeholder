import { COPY } from './copy';
import { PLACEHOLDER_FAMILIES, PLACEHOLDER_KEYS } from './keys';
import { copyFor } from './resolve';

const DECLARED = new Set(PLACEHOLDER_KEYS);
const FAMILY_ROOTS = new Set(PLACEHOLDER_FAMILIES.map(({ root }) => root));
const warned = new Set<string>();

function warnOnce(subject: string, message: string): void {
	if (!import.meta.env.DEV || warned.has(subject)) return;
	warned.add(subject);
	console.warn(message);
}

/** Numbered key of a declared family, e.g. `capability_20` (beyond the declared count is legal). */
function inFamily(key: string): boolean {
	const cut = key.lastIndexOf('_');
	if (cut < 0) return false;
	const suffix = key.slice(cut + 1);
	return /^\d+$/.test(suffix) && FAMILY_ROOTS.has(key.slice(0, cut));
}

/** Human-readable copy for a key; unknown keys still resolve, but warn once per key in dev. */
export function t(key: string): string {
	if (!DECLARED.has(key) && !inFamily(key)) {
		warnOnce(`t:${key}`, `Unknown placeholder key "${key}".`);
	}
	return copyFor(key, COPY);
}

/** Copy for `${root}_${nn}`; unknown family roots warn once per root in dev. */
export function tp(root: string, n: number): string {
	if (!FAMILY_ROOTS.has(root)) {
		warnOnce(`tp:${root}`, `Unknown placeholder family "${root}".`);
	}
	return copyFor(`${root}_${String(Math.max(1, Math.trunc(n))).padStart(2, '0')}`, COPY);
}

export { COPY };
export { PLACEHOLDER_KEYS };
export { PLACEHOLDER_FAMILIES, GENERIC_LABELS } from './keys';
