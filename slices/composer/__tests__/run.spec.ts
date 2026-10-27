import { describe, expect, it } from 'vitest';
import * as barrel from '../index';
import { cancelRun, canCancel, initialRunState, reduceRun } from '../run';

describe('composer barrel', () => {
	it('exports the slice surface the host needs', () => {
		for (const name of [
			'Composer',
			'createDraftStore',
			'draftStore',
			'deriveSubmit',
			'createSubmitGuard',
			'validateFile',
			'reduceAttachments',
			'hasAttachment',
			'reduceRun',
			'cancelRun',
			'canCancel',
			'initialRunState'
		]) {
			expect(barrel).toHaveProperty(name);
		}
	});
});

describe('reduceRun', () => {
	it('enters running on submit and keeps the accepted text', () => {
		const state = reduceRun(initialRunState, { type: 'submit', text: 'hello' });
		expect(state).toEqual({ process: 'running', draftText: 'hello', partialText: 'hello' });
		expect(canCancel(state)).toBe(true);
	});

	it('keeps text when the connection drops (AC05)', () => {
		const state = reduceRun(reduceRun(initialRunState, { type: 'submit', text: 'hello' }), {
			type: 'offline'
		});
		expect(state.process).toBe('offline');
		expect(state.draftText).toBe('hello');
		expect(canCancel(state)).toBe(false);
	});

	it('returns to running on retry without dropping text (AC05)', () => {
		const state = reduceRun(
			reduceRun(reduceRun(initialRunState, { type: 'submit', text: 'hello' }), {
				type: 'offline'
			}),
			{ type: 'retry' }
		);
		expect(state.process).toBe('running');
		expect(state.draftText).toBe('hello');
	});

	it('marks a cancelled run without losing partial output (AC06)', () => {
		const state = reduceRun(reduceRun(initialRunState, { type: 'submit', text: 'half' }), {
			type: 'cancel'
		});
		expect(state).toEqual({ process: 'cancelled', draftText: 'half', partialText: 'half' });
	});
});

describe('cancelRun', () => {
	it('keeps the draft text: only an accepted submit clears it (AC06)', () => {
		const before = {
			run: reduceRun(initialRunState, { type: 'submit', text: 'streamed so far' }),
			draftText: 'typed but unsent'
		};
		const after = cancelRun(before);
		expect(after.draftText).toBe('typed but unsent');
		expect(after.run.partialText).toBe('streamed so far');
		expect(after.run.process).toBe('cancelled');
	});

	it('is a no-op when nothing is running', () => {
		const before = {
			run: { process: 'cancelled' as const, draftText: 'kept', partialText: 'kept' },
			draftText: 'd'
		};
		expect(cancelRun(before)).toBe(before);
	});
});
