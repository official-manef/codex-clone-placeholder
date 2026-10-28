import type { WorkspaceMenuItem } from '../../menu/index.js';

/** Hide missing capabilities; merely constructing a menu must never invoke an action. */
export function availableBrowserActions(
	items: readonly WorkspaceMenuItem[],
	depth = 0
): WorkspaceMenuItem[] {
	if (depth > 5) return [];
	const seen = new Set<string>();
	return items.flatMap((item) => {
		if (!item || typeof item.id !== 'string' || !item.id || seen.has(item.id) || !item.label)
			return [];
		seen.add(item.id);
		if (item.children?.length) {
			const children = availableBrowserActions(item.children, depth + 1);
			return children.length ? [{ ...item, children }] : [];
		}
		return typeof item.onSelect === 'function' ? [item] : [];
	});
}
