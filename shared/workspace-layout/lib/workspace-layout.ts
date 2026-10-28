export type WorkspaceLayout<Tool extends string = string> = {
	output: Tool | null;
	lastOutput: Tool | null;
	/** Preferred fraction occupied by the right output, independent of viewport. */
	outputRatio: number;
	/** Passive panel preferences. Responsive rendering never rewrites these. */
	navWidth: number;
	inspectorWidth: number;
};

type Bounds = { min: number; max: number };

/** A consumer supplies its own passive draft scope and storage implementation. */
export type LayoutDraftAdapter = {
	read: (key: string, fallback: unknown) => unknown;
	save: (key: string, value: unknown) => boolean;
};

const DRAFT_KEY = 'workspace-layout';
export const DEFAULT_OUTPUT_RATIO = 0.65;
export const OUTPUT_RATIO_BOUNDS: Readonly<Bounds> = { min: 0.3, max: 0.75 };
export const MIN_CHAT_WIDTH = 340;
export const MIN_OUTPUT_WIDTH = 420;
export const SPLIT_HANDLE_WIDTH = 8;
export const NAV_HANDLE_WIDTH = SPLIT_HANDLE_WIDTH;
export const DEFAULT_NAV_WIDTH = 230;
export const NAV_WIDTH_BOUNDS: Readonly<Bounds> = { min: 180, max: 320 };
export const DEFAULT_INSPECTOR_WIDTH = 350;
export const INSPECTOR_WIDTH_BOUNDS: Readonly<Bounds> = { min: 260, max: 520 };

function finite(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function bounds(value: Bounds = OUTPUT_RATIO_BOUNDS): Bounds {
	const min = finite(value.min, OUTPUT_RATIO_BOUNDS.min);
	const max = finite(value.max, OUTPUT_RATIO_BOUNDS.max);
	return min > 0 && min <= max && max < 1 ? { min, max } : OUTPUT_RATIO_BOUNDS;
}

export function clampOutputRatio(value: unknown, limits: Bounds = OUTPUT_RATIO_BOUNDS): number {
	const { min, max } = bounds(limits);
	return Math.min(max, Math.max(min, finite(value, DEFAULT_OUTPUT_RATIO)));
}

function clampPixels(value: unknown, fallback: number, limits: Bounds): number {
	return Math.min(limits.max, Math.max(limits.min, finite(value, fallback)));
}

export function clampNavigationWidth(value: unknown): number {
	return clampPixels(value, DEFAULT_NAV_WIDTH, NAV_WIDTH_BOUNDS);
}

export function clampInspectorWidth(value: unknown): number {
	return clampPixels(value, DEFAULT_INSPECTOR_WIDTH, INSPECTOR_WIDTH_BOUNDS);
}

/**
 * One captured drag, owned by its originating pointer. The caller must run the
 * returned cleanup when its handle is removed or its component is destroyed.
 */
export function beginPanelResize(
	event: PointerEvent,
	onDelta: (deltaX: number) => void
): () => void {
	const noop = () => {};
	if (event.button !== 0 || event.isPrimary === false || !Number.isFinite(event.clientX))
		return noop;
	const target = event.currentTarget as HTMLElement | null;
	if (!target) return noop;
	const pointerId = event.pointerId;
	const start = event.clientX;
	event.preventDefault();
	target.focus();
	try {
		target.setPointerCapture(pointerId);
	} catch {
		// A route change can detach a handle between pointerdown and capture.
		return noop;
	}
	let active = true;
	const stop = (reason?: Event) => {
		if (reason && 'pointerId' in reason && reason.pointerId !== pointerId) return;
		if (!active) return;
		active = false;
		target.removeEventListener('pointermove', moving);
		target.removeEventListener('pointerup', stop);
		target.removeEventListener('pointercancel', stop);
		target.removeEventListener('lostpointercapture', stop);
		try {
			if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
		} catch {
			// Detached handles have already lost browser capture; listeners are gone.
		}
	};
	const moving = (next: PointerEvent) => {
		if (!active || next.pointerId !== pointerId || !Number.isFinite(next.clientX)) return;
		try {
			onDelta(next.clientX - start);
		} catch (error) {
			stop();
			throw error;
		}
	};
	target.addEventListener('pointermove', moving);
	target.addEventListener('pointerup', stop);
	target.addEventListener('pointercancel', stop);
	target.addEventListener('lostpointercapture', stop);
	return () => stop();
}

function availablePixelBounds(
	limits: Bounds,
	availableWidth: unknown,
	reserve: number
): Bounds | null {
	const available = finite(availableWidth, Infinity);
	const max = Math.min(limits.max, available - reserve - SPLIT_HANDLE_WIDTH);
	return max >= limits.min ? { min: limits.min, max } : null;
}

/** Width covers navigation plus chat; subtract any reserved output before calling. */
export function navigationWidthBounds(availableWidth?: unknown): Bounds | null {
	return availablePixelBounds(NAV_WIDTH_BOUNDS, availableWidth, MIN_CHAT_WIDTH);
}

/** Inspector is anchored at chat's right edge. Pass only the chat content width. */
export function inspectorWidthBounds(availableWidth?: unknown): Bounds | null {
	return availablePixelBounds(INSPECTOR_WIDTH_BOUNDS, availableWidth, 0);
}

function dragPixels(
	current: unknown,
	delta: unknown,
	fallback: number,
	limits: Bounds,
	available: Bounds | null,
	direction: number
): number {
	const preferred = clampPixels(current, fallback, limits);
	if (!available || typeof delta !== 'number' || !Number.isFinite(delta)) return preferred;
	return clampPixels(preferred + delta * direction, fallback, available);
}

function keyboardPixels(
	key: string,
	current: unknown,
	fallback: number,
	available: Bounds | null,
	direction: number,
	shift: boolean
): number | null {
	if (!available) return null;
	const preferred = clampPixels(current, fallback, available);
	if (key === 'Home') return available.min;
	if (key === 'End') return available.max;
	if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null;
	return clampPixels(
		preferred + (key === 'ArrowRight' ? 1 : -1) * direction * (shift ? 40 : 10),
		fallback,
		available
	);
}

export function dragNavigationWidth(
	current: unknown,
	deltaX: unknown,
	availableWidth?: unknown
): number {
	return dragPixels(
		current,
		deltaX,
		DEFAULT_NAV_WIDTH,
		NAV_WIDTH_BOUNDS,
		navigationWidthBounds(availableWidth),
		1
	);
}

export function keyboardNavigationWidth(
	key: string,
	current: unknown,
	availableWidth?: unknown,
	shiftKey = false
): number | null {
	return keyboardPixels(
		key,
		current,
		DEFAULT_NAV_WIDTH,
		navigationWidthBounds(availableWidth),
		1,
		shiftKey
	);
}

export function dragInspectorWidth(
	current: unknown,
	deltaX: unknown,
	availableWidth?: unknown
): number {
	return dragPixels(
		current,
		deltaX,
		DEFAULT_INSPECTOR_WIDTH,
		INSPECTOR_WIDTH_BOUNDS,
		inspectorWidthBounds(availableWidth),
		-1
	);
}

export function keyboardInspectorWidth(
	key: string,
	current: unknown,
	availableWidth?: unknown,
	shiftKey = false
): number | null {
	return keyboardPixels(
		key,
		current,
		DEFAULT_INSPECTOR_WIDTH,
		inspectorWidthBounds(availableWidth),
		-1,
		shiftKey
	);
}

function toolId<Tool extends string>(value: unknown, tools: readonly Tool[]): Tool | null {
	return typeof value === 'string' && value !== 'chat' && tools.includes(value as Tool)
		? (value as Tool)
		: null;
}

export function normalizeWorkspaceLayout<Tool extends string>(
	value: unknown,
	tools: readonly Tool[]
): WorkspaceLayout<Tool> {
	const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	const output = toolId(source.output, tools);
	return {
		output,
		lastOutput: toolId(source.lastOutput, tools) ?? output,
		outputRatio: clampOutputRatio(source.outputRatio),
		navWidth: clampNavigationWidth(source.navWidth),
		inspectorWidth: clampInspectorWidth(source.inspectorWidth)
	};
}

/** Bind layout persistence to a consumer's draft adapter without restoring actions. */
export function createWorkspaceLayoutPersistence(adapter: LayoutDraftAdapter, key = DRAFT_KEY) {
	return {
		load<Tool extends string>(tools: readonly Tool[]): WorkspaceLayout<Tool> {
			try {
				return normalizeWorkspaceLayout(adapter.read(key, null), tools);
			} catch {
				return normalizeWorkspaceLayout(null, tools);
			}
		},
		save<Tool extends string>(value: WorkspaceLayout<Tool>, tools: readonly Tool[]): boolean {
			try {
				return adapter.save(key, normalizeWorkspaceLayout(value, tools));
			} catch {
				return false;
			}
		}
	};
}

/** A supplied route wins over persisted layout, including explicit #chat. */
export function routeWorkspaceLayout<Tool extends string>(
	hash: string,
	current: WorkspaceLayout<Tool>,
	tools: readonly Tool[]
): WorkspaceLayout<Tool> {
	const layout = normalizeWorkspaceLayout(current, tools);
	if (hash === '' || hash === '#') return layout;
	const requested = hash.startsWith('#') ? hash.slice(1) : '';
	if (requested === 'chat') return { ...layout, output: null };
	const output = toolId(requested, tools);
	return { ...layout, output, lastOutput: output ?? layout.lastOutput };
}

export function selectWorkspaceOutput<Tool extends string>(
	requested: Tool | 'chat' | null,
	current: WorkspaceLayout<Tool>,
	tools: readonly Tool[]
): WorkspaceLayout<Tool> {
	return routeWorkspaceLayout(requested === null ? '#chat' : `#${requested}`, current, tools);
}

export function initialLayout<Tool extends string>(
	hash: string,
	stored: unknown,
	tools: readonly Tool[]
): WorkspaceLayout<Tool> {
	return routeWorkspaceLayout(hash, normalizeWorkspaceLayout(stored, tools), tools);
}

export const chooseOutput = selectWorkspaceOutput;

export function workspaceHash(output: string | null): string {
	return output ? `#${output}` : '#chat';
}

export type WorkspaceSplit = {
	mode: 'split' | 'stacked' | 'chat';
	outputRatio: number;
	minRatio: number;
	maxRatio: number;
	chatWidth: number;
	outputWidth: number;
	usableWidth: number;
};

/** Width is the centre+right area after the persistent navigation rail. */
export function workspaceSplit(width: unknown, preferredRatio: unknown): WorkspaceSplit {
	const area = Math.max(0, finite(width, 0));
	const preferred = clampOutputRatio(preferredRatio);
	const usable = Math.max(0, area - SPLIT_HANDLE_WIDTH);
	const min = Math.max(OUTPUT_RATIO_BOUNDS.min, MIN_OUTPUT_WIDTH / Math.max(1, usable));
	const max = Math.min(OUTPUT_RATIO_BOUNDS.max, 1 - MIN_CHAT_WIDTH / Math.max(1, usable));
	if (area < MIN_CHAT_WIDTH + MIN_OUTPUT_WIDTH + SPLIT_HANDLE_WIDTH || min > max) {
		return {
			mode: 'stacked',
			outputRatio: preferred,
			minRatio: OUTPUT_RATIO_BOUNDS.min,
			maxRatio: OUTPUT_RATIO_BOUNDS.max,
			chatWidth: area,
			outputWidth: area,
			usableWidth: area
		};
	}
	const ratio = clampOutputRatio(preferred, { min, max });
	return {
		mode: 'split',
		outputRatio: ratio,
		minRatio: min,
		maxRatio: max,
		chatWidth: usable * (1 - ratio),
		outputWidth: usable * ratio,
		usableWidth: usable
	};
}

/**
 * Root-shell convenience: width covers chat navigation + chat + output (not the
 * outer app rail). chatWidth includes the embedded session navigation; all ratio
 * and resize values refer only to the two actual content panes.
 */
export function splitMetrics(
	width: unknown,
	preferredRatio: unknown,
	navWidth = DEFAULT_NAV_WIDTH,
	outputOpen = true
) {
	const total = Math.max(0, finite(width, 0));
	const navigation = Math.min(total, Math.max(0, finite(navWidth, DEFAULT_NAV_WIDTH)));
	if (!outputOpen) {
		return {
			mode: 'chat' as const,
			outputRatio: clampOutputRatio(preferredRatio),
			minRatio: OUTPUT_RATIO_BOUNDS.min,
			maxRatio: OUTPUT_RATIO_BOUNDS.max,
			chatWidth: total,
			outputWidth: 0,
			usableWidth: Math.max(0, total - navigation),
			navigationWidth: navigation,
			contentWidth: Math.max(0, total - navigation)
		};
	}
	const metrics = workspaceSplit(total - navigation, preferredRatio);
	return {
		...metrics,
		chatWidth: metrics.mode === 'split' ? metrics.chatWidth + navigation : total,
		outputWidth: metrics.mode === 'split' ? metrics.outputWidth : total,
		navigationWidth: navigation,
		contentWidth: Math.max(0, total - navigation)
	};
}

/** Dragging the vertical separator right shrinks the panel on its right. */
export function dragWorkspaceSplit(
	preferredRatio: number,
	deltaX: unknown,
	areaWidth: unknown
): number {
	const split = workspaceSplit(areaWidth, preferredRatio);
	if (split.mode !== 'split' || typeof deltaX !== 'number' || !Number.isFinite(deltaX))
		return clampOutputRatio(preferredRatio);
	return clampOutputRatio(split.outputRatio - deltaX / split.usableWidth, {
		min: split.minRatio,
		max: split.maxRatio
	});
}

/**
 * Keyboard semantics match the separator position: Left grows the right output;
 * Right grows chat. The shell slider's value is the chat share, so Home moves
 * it to its minimum (maximum output share) and End to its maximum. Prevent
 * the native key action only when this function returns a number.
 */
export function keyboardWorkspaceSplit(
	key: string,
	preferredRatio: number,
	areaWidth: unknown,
	shiftKey = false
): number | null {
	const split = workspaceSplit(areaWidth, preferredRatio);
	if (split.mode !== 'split') return null;
	const limits = { min: split.minRatio, max: split.maxRatio };
	if (key === 'Home') return limits.max;
	if (key === 'End') return limits.min;
	if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null;
	const increment = shiftKey ? 0.1 : 0.02;
	return clampOutputRatio(
		split.outputRatio + (key === 'ArrowLeft' ? increment : -increment),
		limits
	);
}
