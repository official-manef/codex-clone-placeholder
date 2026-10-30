/**
 * Pure parts of the terminal panel: output trimming, scroll attachment, resize grid.
 *
 * No runes, no DOM. The component owns the socket, the elements and the timers' lifetime;
 * everything that decides a number or a boolean lives here so it can be tested.
 */
export const MAX_OUTPUT_CHARS = 200_000;
export const MIN_COLS = 20;
export const MIN_ROWS = 5;
export const RESIZE_DELAY_MS = 150;
/** Distance from the bottom that still counts as "following the output". */
export const SCROLL_THRESHOLD_PX = 24;

export type AppendResult = { text: string; dropped: boolean };

/**
 * Append a frame and keep at most `MAX_OUTPUT_CHARS`, dropping the oldest text.
 *
 * A cap that lands in the middle of a surrogate pair moves one code unit forward, so the
 * newest text never starts with half a character.
 */
export function appendOutput(previous: string, chunk: string): AppendResult {
	const combined = previous + chunk;
	if (combined.length <= MAX_OUTPUT_CHARS) return { text: combined, dropped: false };
	let start = combined.length - MAX_OUTPUT_CHARS;
	const code = combined.charCodeAt(start);
	if (code >= 0xdc00 && code <= 0xdfff) start += 1;
	return { text: combined.slice(start), dropped: true };
}

/** True when the view is at (or within a small threshold of) the newest output. */
export function isAttachedToBottom(box: {
	scrollTop: number;
	scrollHeight: number;
	clientHeight: number;
}): boolean {
	const { scrollTop, scrollHeight, clientHeight } = box;
	if (![scrollTop, scrollHeight, clientHeight].every(Number.isFinite)) return true;
	return scrollHeight - (scrollTop + clientHeight) <= SCROLL_THRESHOLD_PX;
}

/** A terminal needs at least 20x5 to be usable; fractional and nonsense values collapse. */
export function clampGrid(cols: number, rows: number): { cols: number; rows: number } {
	const floor = (value: number, min: number) =>
		Number.isFinite(value) ? Math.max(min, Math.floor(value)) : min;
	return { cols: floor(cols, MIN_COLS), rows: floor(rows, MIN_ROWS) };
}

/** Columns and rows that fit a box, given the size of one monospace cell. */
export function gridFromBox(
	size: { width: number; height: number },
	cell: { width: number; height: number }
): { cols: number; rows: number } {
	const cols = cell.width > 0 ? size.width / cell.width : Number.NaN;
	const rows = cell.height > 0 ? size.height / cell.height : Number.NaN;
	return clampGrid(cols, rows);
}

export type ResizeTimers = {
	set(run: () => void, delay: number): unknown;
	clear(handle: unknown): void;
};

const browserTimers: ResizeTimers = {
	set: (run, delay) => setTimeout(run, delay),
	clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

/**
 * Coalesce rapid resize measurements into one `run(cols, rows)` after `delay`.
 *
 * The clamp is applied at send time, not at push time, so a burst of tiny measurements
 * still reports the final size once.
 */
export function createResizeDebouncer(
	run: (cols: number, rows: number) => void,
	delay = RESIZE_DELAY_MS,
	timers: ResizeTimers = browserTimers
) {
	let pending: unknown = null;
	return {
		push(cols: number, rows: number): void {
			if (pending !== null) timers.clear(pending);
			pending = timers.set(() => {
				pending = null;
				const next = clampGrid(cols, rows);
				run(next.cols, next.rows);
			}, delay);
		},
		cancel(): void {
			if (pending !== null) timers.clear(pending);
			pending = null;
		}
	};
}
