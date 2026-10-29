import { expect, test } from 'vitest';
import {
	MAX_OUTPUT_CHARS,
	MIN_COLS,
	MIN_ROWS,
	appendOutput,
	clampGrid,
	createResizeDebouncer,
	gridFromBox,
	isAttachedToBottom
} from './terminal_buffer';

test('appendOutput keeps short output untouched', () => {
	const result = appendOutput('$ echo hi\n', 'hi\n');
	expect(result).toEqual({ text: '$ echo hi\nhi\n', dropped: false });
});

test('appendOutput trims to the newest 200 000 characters and says so', () => {
	const previous = 'a'.repeat(MAX_OUTPUT_CHARS);
	const result = appendOutput(previous, 'NEWEST');
	expect(result.dropped).toBe(true);
	expect(result.text.length).toBe(MAX_OUTPUT_CHARS);
	expect(result.text.endsWith('NEWEST')).toBe(true);
	expect(result.text.startsWith('a')).toBe(true);
});

test('appendOutput drops the oldest text first, not the newest', () => {
	const result = appendOutput('oldest-', `${'b'.repeat(MAX_OUTPUT_CHARS - 1)}newest`);
	expect(result.dropped).toBe(true);
	expect(result.text.length).toBe(MAX_OUTPUT_CHARS);
	expect(result.text.includes('oldest-')).toBe(false);
	expect(result.text.endsWith('newest')).toBe(true);
});

test('appendOutput never splits a surrogate pair at the trim boundary', () => {
	// The cut would land on the low half of the oldest emoji; drop the whole pair instead.
	const previous = `x\u{1F600}${'a'.repeat(MAX_OUTPUT_CHARS - 2)}`;
	const result = appendOutput(previous, 'c');
	expect(result.dropped).toBe(true);
	expect(result.text.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS);
	expect(result.text.startsWith('a')).toBe(true);
	expect(result.text.endsWith('c')).toBe(true);
	expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(result.text)).toBe(false);
});

test('isAttachedToBottom follows the newest line only near the bottom', () => {
	const box = { scrollHeight: 1000, clientHeight: 300 };
	expect(isAttachedToBottom({ ...box, scrollTop: 700 })).toBe(true);
	expect(isAttachedToBottom({ ...box, scrollTop: 699 })).toBe(true);
	expect(isAttachedToBottom({ ...box, scrollTop: 0 })).toBe(false);
	expect(isAttachedToBottom({ ...box, scrollTop: 600 })).toBe(false);
	expect(isAttachedToBottom({ scrollTop: Number.NaN, scrollHeight: 0, clientHeight: 0 })).toBe(
		true
	);
});

test('clampGrid never goes below 20x5 and floors fractions', () => {
	expect(clampGrid(0, 0)).toEqual({ cols: MIN_COLS, rows: MIN_ROWS });
	expect(clampGrid(80.7, 24.2)).toEqual({ cols: 80, rows: 24 });
	expect(clampGrid(Number.NaN, 12)).toEqual({ cols: MIN_COLS, rows: 12 });
	expect(clampGrid(120, -1)).toEqual({ cols: 120, rows: MIN_ROWS });
});

test('gridFromBox derives a grid from a measured box and clamps a tiny one', () => {
	expect(gridFromBox({ width: 640, height: 320 }, { width: 8, height: 16 })).toEqual({
		cols: 80,
		rows: 20
	});
	expect(gridFromBox({ width: 10, height: 10 }, { width: 8, height: 16 })).toEqual({
		cols: MIN_COLS,
		rows: MIN_ROWS
	});
	expect(gridFromBox({ width: 100, height: 100 }, { width: 0, height: 0 })).toEqual({
		cols: MIN_COLS,
		rows: MIN_ROWS
	});
});

test('resize debounce sends one clamped size for a burst of measurements', () => {
	const queued: Array<{ run: () => void }> = [];
	const sent: Array<[number, number]> = [];
	const debounce = createResizeDebouncer((cols, rows) => sent.push([cols, rows]), 150, {
		set(run) {
			const entry = {
				run: () => {
					const index = queued.indexOf(entry);
					if (index >= 0) queued.splice(index, 1);
					run();
				}
			};
			queued.push(entry);
			return entry;
		},
		clear(handle) {
			const index = queued.indexOf(handle as { run: () => void });
			if (index >= 0) queued.splice(index, 1);
		}
	});

	debounce.push(12, 2);
	debounce.push(90, 30);
	debounce.push(80, 24);
	expect(queued).toHaveLength(1);
	queued[0].run();
	expect(sent).toEqual([[80, 24]]);
	expect(queued).toHaveLength(0);

	debounce.push(0, 0);
	queued[0].run();
	expect(sent.at(-1)).toEqual([MIN_COLS, MIN_ROWS]);

	debounce.push(40, 10);
	debounce.cancel();
	expect(queued).toHaveLength(0);
	expect(sent).toHaveLength(2);
});
