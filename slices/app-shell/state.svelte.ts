import { getContext } from 'svelte';
import type { AreaId, Connectivity, OverlayId, ShellState, SidebarMode } from './types';

/** Context key for the per-mount shell store. Never a module singleton. */
export const SHELL_CONTEXT = Symbol('app-shell');

export type ShellContext = ReturnType<typeof createShellState>;

export function createShellState(activeArea: AreaId = 'workspace') {
	const state = $state<ShellState>({
		activeArea,
		sidebar: 'expanded',
		overlay: null,
		connectivity: 'online'
	});
	let overlayTrigger = $state<HTMLElement | null>(null);

	return {
		get activeArea(): AreaId {
			return state.activeArea;
		},
		/** T1: destination change also closes any transient layer. */
		setActiveArea(next: AreaId): void {
			state.activeArea = next;
			state.overlay = null;
			overlayTrigger = null;
		},
		get sidebar(): SidebarMode {
			return state.sidebar;
		},
		setSidebar(next: SidebarMode): void {
			state.sidebar = next;
		},
		get overlay(): OverlayId | null {
			return state.overlay;
		},
		get overlayTrigger(): HTMLElement | null {
			return overlayTrigger;
		},
		/** T12: one overlay at a time; remembers the triggering element for focus return. */
		openOverlay(id: OverlayId): void {
			// Opening on top of an open overlay keeps the original trigger; the active element
			// is then inside the old dialog and would be detached by the swap.
			if (state.overlay === null) {
				overlayTrigger =
					typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
			}
			state.overlay = id;
		},
		/** T13: clear the layer, then return focus once the dialog has left the DOM. */
		closeOverlay(): void {
			const trigger = overlayTrigger;
			state.overlay = null;
			overlayTrigger = null;
			if (!trigger) return;
			const restore = () => {
				// A trigger unmounted with its area must not be focused or throw.
				if (trigger.isConnected) trigger.focus();
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restore);
			else queueMicrotask(restore);
		},
		get connectivity(): Connectivity {
			return state.connectivity;
		},
		setConnectivity(next: Connectivity): void {
			state.connectivity = next;
		}
	};
}

export function getShellState(): ShellContext {
	return getContext<ShellContext>(SHELL_CONTEXT);
}

/** Derived, never stored: narrow viewports always present the sidebar as a drawer. */
export function sidebarModeFor(viewportWidth: number, requested: SidebarMode): SidebarMode {
	return viewportWidth < 650 ? 'drawer_open' : requested;
}
