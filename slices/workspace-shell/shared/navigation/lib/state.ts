/** Passive workspace state. No operation, credential or approval belongs here. */
export type NavigationTrail = { entries: string[]; index: number };
export function visitRoute(
	trail: NavigationTrail,
	route: string,
	allowed: readonly string[]
): NavigationTrail {
	if (!allowed.includes(route) || trail.entries[trail.index] === route) return trail;
	const entries = [...trail.entries.slice(0, trail.index + 1), route].slice(-80);
	return { entries, index: entries.length - 1 };
}
export function stepRoute(trail: NavigationTrail, direction: -1 | 1): NavigationTrail {
	const index = Math.max(0, Math.min(trail.entries.length - 1, trail.index + direction));
	return { ...trail, index };
}

/** Compact layouts show one region while retaining both component instances. */
export function visibleRegions(hasOutput: boolean, compact: boolean, focused: 'chat' | 'output') {
	return {
		chat: !hasOutput || !compact || focused === 'chat',
		output: hasOutput && (!compact || focused === 'output')
	};
}
