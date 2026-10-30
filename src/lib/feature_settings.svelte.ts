import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { detectSurface, type Surface } from '#lib/config/surface.js';
import {
	ALWAYS_ENABLED,
	FEATURE_ACCESS,
	defaultEnabled,
	isHiddenBySurface,
	resolveEnabled
} from '#lib/feature_access.js';

export const STORAGE_KEY = 'workspace-template:tools-v1';
export const MAX_STORED_BYTES = 8 * 1024;

type StoredShape = { version: 1; enabled: string[] };

function readStored(): unknown {
	if (!browser) return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw || raw.length > MAX_STORED_BYTES) return null;
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object') return null;
		const shape = parsed as { version?: unknown; enabled?: unknown };
		return shape.version === 1 ? shape.enabled : null;
	} catch {
		// Blocked, quota-exceeded or corrupt storage: defaults are always usable.
		return null;
	}
}

function writeStored(enabled: readonly string[]): void {
	if (!browser) return;
	try {
		const payload: StoredShape = { version: 1, enabled: [...enabled] };
		const text = JSON.stringify(payload);
		if (text.length > MAX_STORED_BYTES) return;
		window.localStorage.setItem(STORAGE_KEY, text);
	} catch {
		// Persistence is optional; a blocked store must not break the workspace.
	}
}

/**
 * Per-feature tool visibility for this browser.
 *
 * Starts on the surface-neutral defaults so SSR and the first client render agree; the
 * host calls `start()` on mount, which resolves the real surface and the stored selection
 * once. No `window` access happens while the module is imported.
 */
export function createFeatureSettings() {
	let surface = $state<Surface>('cloud');
	let enabled = $state<string[]>(defaultEnabled('cloud'));
	let started = false;

	function commit(next: string[]): void {
		enabled = next;
		writeStored(next);
	}

	return {
		get surface(): Surface {
			return surface;
		},
		get enabled(): readonly string[] {
			return enabled;
		},
		start(): void {
			if (started) return;
			started = true;
			surface = detectSurface({
				url: browser ? window.location.href : null,
				override: import.meta.env.PUBLIC_SURFACE ?? env.PUBLIC_SURFACE ?? null
			});
			commit(resolveEnabled(readStored(), surface));
		},
		isEnabled(id: string): boolean {
			return enabled.includes(id);
		},
		setEnabled(id: string, value: boolean): void {
			if (!Object.hasOwn(FEATURE_ACCESS, id)) return;
			if (!value && ALWAYS_ENABLED.includes(id)) return;
			if (enabled.includes(id) === value) return;
			commit(value ? [...enabled, id].sort() : enabled.filter((entry) => entry !== id));
		},
		reset(): void {
			commit(defaultEnabled(surface));
		},
		hidden(): readonly string[] {
			return Object.keys(FEATURE_ACCESS).filter(
				(id) => isHiddenBySurface(id, surface) && !enabled.includes(id)
			);
		}
	};
}

export const featureSettings = createFeatureSettings();
