/** Pure key → copy formatting. Validation and warning live in `index.ts`. */

/**
 * Fallback for keys the table does not cover: `workspace_name` → `Workspace name`,
 * `constraint_notice.recovery` → `Constraint notice: recovery`. Never emits braces.
 */
function humanize(key: string): string {
	const text = key.replace(/_/g, ' ').replace(/\./g, ': ').replace(/\s+/g, ' ').trim();
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Resolves a declared key to its human-readable copy; never returns braces. */
export function copyFor(key: string, table: Readonly<Record<string, string>>): string {
	return Object.hasOwn(table, key) ? table[key] : humanize(key);
}
