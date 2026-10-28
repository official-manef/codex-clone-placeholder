/**
 * Device-backed tool switches.
 *
 * Terminal and remote browser view need a paired device; both start off, on every surface.
 * A switch here says the user wants the tool, not that a device exists: the tool still
 * appears only when a device of that kind is paired.
 */
export type DeviceTool = 'terminal' | 'browser';

export const DEVICE_TOOLS_STORAGE_KEY = 'workspace-template:device-tools-v1';

const TOOLS: readonly DeviceTool[] = ['terminal', 'browser'];

function isDeviceTool(value: unknown): value is DeviceTool {
	return typeof value === 'string' && (TOOLS as readonly string[]).includes(value);
}

export function createDeviceTools() {
	let enabled = $state<DeviceTool[]>([]);
	let started = false;

	function read(): DeviceTool[] {
		if (typeof window === 'undefined') return [];
		try {
			const raw = window.localStorage.getItem(DEVICE_TOOLS_STORAGE_KEY);
			if (!raw || raw.length > 1024) return [];
			const parsed: unknown = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed.filter(isDeviceTool) : [];
		} catch {
			// Blocked or corrupt storage: off is the safe default.
			return [];
		}
	}

	function write(next: DeviceTool[]): void {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(DEVICE_TOOLS_STORAGE_KEY, JSON.stringify(next));
		} catch {
			// Persistence is optional; the live switch still works.
		}
	}

	return {
		/** Starts on the SSR-safe "everything off" value; the host calls this on mount. */
		start(): void {
			if (started) return;
			started = true;
			enabled = read();
		},
		isEnabled(tool: DeviceTool): boolean {
			return enabled.includes(tool);
		},
		setEnabled(tool: DeviceTool, value: boolean): void {
			if (enabled.includes(tool) === value) return;
			enabled = value ? [...enabled, tool] : enabled.filter((entry) => entry !== tool);
			write(enabled);
		}
	};
}

export const deviceTools = createDeviceTools();
