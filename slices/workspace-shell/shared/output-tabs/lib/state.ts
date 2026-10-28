/** IDs are supplied by the consumer and checked against its available views. */
export type OutputId = string;
export type OutputRoute = OutputId | 'chat';

/** A host maps its own chat panel identifiers to registered settings views. */
export type ChatPanelRoute = { id: string; panel: string; aliases?: readonly string[] };
export function outputForChatPanel(
	panel: string,
	routes: readonly ChatPanelRoute[]
): OutputId | null {
	if (!panel) return null;
	return (
		routes.find((route) => route.panel === panel || route.aliases?.includes(panel))?.id ?? null
	);
}
export function chatPanelForOutput(
	id: OutputRoute | null,
	routes: readonly ChatPanelRoute[]
): string {
	return routes.find((route) => route.id === id)?.panel ?? '';
}
export function normalizeOutputTabs(value: unknown, allowed: readonly string[]): OutputId[] {
	return Array.isArray(value)
		? [
				...new Set(
					value.filter(
						(id): id is OutputId => typeof id === 'string' && id !== 'chat' && allowed.includes(id)
					)
				)
			].slice(0, allowed.length)
		: [];
}
export type OutputTabState = { tabs: OutputId[]; kept: OutputId[] };

/** Migrate old automatically accumulated tabs to one reusable working tab. */
export function restoreOutputTabs(
	value: unknown,
	active: OutputId | null,
	allowed: readonly string[],
	launcherId: string | null = null
): OutputTabState {
	const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	if (source.version !== 2) {
		return { tabs: active && allowed.includes(active) ? [active] : [], kept: [] };
	}
	const tabs = normalizeOutputTabs(source.tabs, allowed);
	const kept = normalizeOutputTabs(source.kept, allowed).filter(
		(id) => tabs.includes(id) && id !== launcherId
	);
	const working = tabs.filter((id) => !kept.includes(id));
	const selected = active && working.includes(active) ? active : working.at(-1);
	const restored = { tabs: tabs.filter((id) => kept.includes(id) || id === selected), kept };
	return navigateOutputTab(restored, active, active, allowed, launcherId);
}

/** Menu navigation replaces the working tab; explicitly kept tabs remain open. */
export function navigateOutputTab(
	state: OutputTabState,
	target: OutputId | null,
	active: OutputId | null,
	allowed: readonly string[],
	launcherId: string | null = null
): OutputTabState {
	const tabs = normalizeOutputTabs(state.tabs, allowed);
	const kept = normalizeOutputTabs(state.kept, allowed).filter(
		(id) => tabs.includes(id) && id !== launcherId
	);
	if (!target || !allowed.includes(target)) return { tabs, kept };
	if (tabs.includes(target)) return { tabs, kept };
	const reusable =
		active && tabs.includes(active) && !kept.includes(active)
			? active
			: tabs.find((id) => !kept.includes(id));
	return {
		tabs: reusable ? tabs.map((id) => (id === reusable ? target : id)) : [...tabs, target],
		kept
	};
}

/** Explicit Keep never starts a job or creates another instance of a view. */
export function keepOutputTab(
	state: OutputTabState,
	id: OutputId | null,
	allowed: readonly string[],
	launcherId: string | null = null
): OutputTabState {
	const tabs = normalizeOutputTabs(state.tabs, allowed);
	const kept = normalizeOutputTabs(state.kept, allowed).filter(
		(item) => tabs.includes(item) && item !== launcherId
	);
	return {
		tabs,
		kept: id && id !== launcherId && tabs.includes(id) && !kept.includes(id) ? [...kept, id] : kept
	};
}

/** Explicit Plus keeps existing content tabs before opening one reusable launcher. */
export function newOutputTab(
	state: OutputTabState,
	active: OutputId | null,
	allowed: readonly string[],
	launcherId: string | null = null
): OutputTabState {
	if (!launcherId || !allowed.includes(launcherId)) return state;
	let preserved = state;
	for (const id of normalizeOutputTabs(state.tabs, allowed)) {
		preserved = keepOutputTab(preserved, id, allowed, launcherId);
	}
	return navigateOutputTab(preserved, launcherId, active, allowed, launcherId);
}

export function closeOutputTab(
	tabs: unknown,
	active: OutputId | null,
	id: OutputId,
	allowed: readonly string[]
) {
	const current = normalizeOutputTabs(tabs, allowed);
	const index = current.indexOf(id);
	const remaining = current.filter((item) => item !== id);
	return {
		tabs: remaining,
		output: active === id ? (remaining[index] ?? remaining[index - 1] ?? null) : active
	};
}

/** Forget closed views so hiding and restoring the panel cannot resurrect them. */
export function lastOutputAfterClose(
	lastOutput: OutputId | null,
	remaining: OutputId[],
	visibleOutput: OutputId | null
): OutputId | null {
	if (visibleOutput && remaining.includes(visibleOutput)) return visibleOutput;
	return lastOutput && remaining.includes(lastOutput) ? lastOutput : null;
}
