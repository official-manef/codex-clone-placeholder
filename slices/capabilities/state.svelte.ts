import type { Capability, CapabilityConnection } from './types';

// ponytail: fixed stub latency so the pending marker is observable; replace with the
// adapter's promise when a real connection backend lands.
const PENDING_MS = 80;

/** Connection + search state for the capability catalog (T17/T18). One instance per screen. */
export function createCapabilitiesState() {
	let selectedId = $state('');
	let query = $state('');
	const connections = $state<Record<string, CapabilityConnection>>({});
	const errors = $state<Record<string, boolean>>({});
	let pendingId = $state<string | null>(null);

	function stored(id: string): CapabilityConnection {
		return connections[id] ?? 'not_connected';
	}

	return {
		/** T17: selected capability slug ('' = nothing selected). */
		get selectedId(): string {
			return selectedId;
		},
		select(id: string): void {
			selectedId = id;
		},
		/** T16: search text, kept distinct from the empty/no-match result. */
		get query(): string {
			return query;
		},
		setQuery(next: string): void {
			query = next;
		},
		setConnection(id: string, next: CapabilityConnection): void {
			connections[id] = next;
		},
		getConnection(id: string): CapabilityConnection {
			// Optimistic marker: a connect in flight reads as pending (T18).
			return pendingId === id ? 'pending' : stored(id);
		},
		/** Per-id marker set by a failed connect; cleared by the next attempt. */
		getError(id: string): boolean {
			return errors[id] === true;
		},
		get pendingId(): string | null {
			return pendingId;
		},
		/** T18: optimistic pending → connected/failed; failure reverts to the previous state. */
		connect(id: string, outcome: 'success' | 'failure'): Promise<void> {
			if (pendingId === id) return Promise.resolve();
			const previous = stored(id);
			delete errors[id];
			pendingId = id;
			return new Promise((resolve) => {
				setTimeout(() => {
					if (outcome === 'failure') {
						// Never leave a half-connected state: revert, then flag the failure.
						connections[id] = previous;
						errors[id] = true;
					} else {
						connections[id] = previous === 'connected' ? 'not_connected' : 'connected';
					}
					if (pendingId === id) pendingId = null;
					resolve();
				}, PENDING_MS);
			});
		},
		filter(list: readonly Capability[]): {
			matches: Capability[];
			empty: boolean;
			noMatch: boolean;
		} {
			const q = query.trim().toLowerCase();
			const matches = q
				? list.filter(
						(cap) => cap.id.toLowerCase().includes(q) || cap.nameKey.toLowerCase().includes(q)
					)
				: [...list];
			return {
				matches,
				empty: list.length === 0,
				noMatch: list.length > 0 && matches.length === 0
			};
		}
	};
}

export type CapabilitiesState = ReturnType<typeof createCapabilitiesState>;
