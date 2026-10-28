/** Select configured views in order without exposing missing or duplicate IDs. */
export function selectLauncherViews<T extends { id: string }>(
	views: readonly T[],
	ids: readonly string[]
): T[] {
	const byId = new Map(views.map((view) => [view.id, view]));
	return [...new Set(ids)].flatMap((id) => {
		const view = byId.get(id);
		return view ? [view] : [];
	});
}

/** Most recently visited unique available views, newest first. */
export function selectRecentViews<T extends { id: string }>(
	views: readonly T[],
	history: readonly string[],
	excludedIds: readonly string[] = [],
	limit = 8
): T[] {
	const excluded = new Set(excludedIds);
	const available = views.filter((view) => !excluded.has(view.id));
	const max = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
	return selectLauncherViews(available, [...history].reverse()).slice(0, max);
}
