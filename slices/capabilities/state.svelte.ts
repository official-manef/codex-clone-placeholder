import type { CapabilityConnection } from './types';

/** Connection state for the capability catalog (T17/T18). One instance per screen. */
export function createCapabilitiesState() {
	let selectedId = $state('');
	const connections = $state<Record<string, CapabilityConnection>>({});
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
		getConnection(id: string): CapabilityConnection {
			// Optimistic marker: a connect in flight reads as pending (T18).
			return pendingId === id ? 'pending' : stored(id);
		},
		setConnection(id: string, next: CapabilityConnection): void {
			connections[id] = next;
		},
		get pendingId(): string | null {
			return pendingId;
		},
		/** T18: optimistic pending → resolved state; failure reverts to `failed`. No network in MVP. */
		toggleConnection(id: string, outcome: 'success' | 'failure'): void {
			if (pendingId === id) return;
			const previous = stored(id);
			pendingId = id;
			// Async hop so the pending marker is observable; a real adapter replaces this.
			queueMicrotask(() => {
				// A failed disconnect reverts to the previous connected state (T18 revert).
				connections[id] =
					outcome === 'failure'
						? previous === 'connected'
							? 'connected'
							: 'failed'
						: previous === 'connected'
							? 'not_connected'
							: 'connected';
				pendingId = null;
			});
		}
	};
}

export type CapabilitiesState = ReturnType<typeof createCapabilitiesState>;
