import { describe, expect, it } from 'vitest';
import { createSubmitGuard, deriveSubmit, validateFile } from '../submit';
import type { Attachment } from '../types';

function attachment(overrides: Partial<Attachment> = {}): Attachment {
	return {
		id: crypto.randomUUID(),
		name: 'file.png',
		mimeType: 'image/png',
		sizeBytes: 1024,
		status: 'ready',
		progress: null,
		previewUrl: null,
		reasonKey: null,
		...overrides
	};
}

describe('deriveSubmit', () => {
	it('disables an empty draft with no attachments (AC01)', () => {
		const state = deriveSubmit({
			draftText: '   ',
			attachments: [],
			authority: 'allowed',
			process: 'idle'
		});
		expect(state).toEqual({
			enabled: false,
			reasonKey: 'submit_disabled_reason_empty'
		});
	});

	it('enables text with allowed authority', () => {
		expect(
			deriveSubmit({
				draftText: 'hello',
				attachments: [],
				authority: 'allowed',
				process: 'idle'
			})
		).toEqual({ enabled: true, reasonKey: null });
	});

	it('keeps submit disabled while authority is unknown (AC16)', () => {
		expect(
			deriveSubmit({
				draftText: 'hello',
				attachments: [],
				authority: 'unknown',
				process: 'idle'
			})
		).toEqual({ enabled: false, reasonKey: 'submit_disabled_reason_invalid' });
	});

	it('blocks a draft with a validating attachment', () => {
		expect(
			deriveSubmit({
				draftText: 'hello',
				attachments: [attachment({ status: 'validating' })],
				authority: 'allowed',
				process: 'idle'
			})
		).toEqual({ enabled: false, reasonKey: 'submit_disabled_reason_attachment' });
	});

	it('blocks on a failed attachment and keeps ready ones in the array (AC03)', () => {
		const ready = attachment();
		const failed = attachment({ status: 'failed', reasonKey: 'attachment_failed_reason' });
		const list = [failed, ready];
		expect(
			deriveSubmit({
				draftText: 'hello',
				attachments: list,
				authority: 'allowed',
				process: 'idle'
			})
		).toEqual({ enabled: false, reasonKey: 'attachment_failed_reason' });
		expect(list).toContain(ready);
		expect(list).toHaveLength(2);
	});

	it('blocks on a failed attachment even with no draft text (AC03)', () => {
		expect(
			deriveSubmit({
				draftText: '',
				attachments: [
					attachment({ status: 'failed', reasonKey: 'attachment_failed_reason' }),
					attachment()
				],
				authority: 'allowed',
				process: 'idle'
			})
		).toEqual({ enabled: false, reasonKey: 'attachment_failed_reason' });
	});

	it('blocks while a validating chip is present after a ready one resolved (AC03/T6)', () => {
		expect(
			deriveSubmit({
				draftText: 'hello',
				attachments: [attachment(), attachment({ status: 'validating' })],
				authority: 'allowed',
				process: 'idle'
			})
		).toEqual({ enabled: false, reasonKey: 'submit_disabled_reason_attachment' });
	});

	it('blocks while a process is running or offline', () => {
		for (const process of ['running', 'offline'] as const) {
			expect(
				deriveSubmit({
					draftText: 'hello',
					attachments: [],
					authority: 'allowed',
					process
				})
			).toEqual({ enabled: false, reasonKey: 'submit_disabled_reason_running' });
		}
	});

	it('reports the first failing predicate: attachment before authority', () => {
		expect(
			deriveSubmit({
				draftText: 'hello',
				attachments: [attachment({ status: 'failed' })],
				authority: 'restricted',
				process: 'idle'
			}).reasonKey
		).toBe('attachment_failed_reason');
	});
});

describe('createSubmitGuard', () => {
	it('locks until end, so a second submit is ignored (AC04)', () => {
		const guard = createSubmitGuard();
		const first = guard.begin();
		expect(first).toBeTruthy();
		expect(guard.isLocked()).toBe(true);
		expect(guard.begin()).toBeNull();
		guard.end();
		expect(guard.isLocked()).toBe(false);
		const second = guard.begin();
		expect(second).toBeTruthy();
		expect(second).not.toBe(first);
	});

	it('begin() returns the retained id when the previous request never completed', () => {
		const guard = createSubmitGuard();
		const id = guard.begin();
		guard.abandon();
		expect(guard.begin()).toBe(id);
		expect(guard.currentId()).toBe(id);
	});

	it('issues unique ids', () => {
		const guard = createSubmitGuard();
		const a = guard.begin();
		guard.end();
		const b = guard.begin();
		expect(a).not.toBe(b);
	});

	it('retains the id across an offline interruption and re-sends it (AC05, race 4)', () => {
		const guard = createSubmitGuard();
		const id = guard.begin();
		expect(guard.currentId()).toBe(id);
		// Offline before acceptance: the request is unresolved but unlocked for retry.
		guard.abandon();
		expect(guard.isLocked()).toBe(false);
		expect(guard.currentId()).toBe(id);
		expect(guard.retry()).toBe(id);
		expect(guard.isLocked()).toBe(true);
		expect(guard.retry()).toBeNull();
	});

	it('does not duplicate on retry: a fresh begin after end mints a new id', () => {
		const guard = createSubmitGuard();
		const id = guard.begin();
		guard.end();
		expect(guard.currentId()).toBeNull();
		expect(guard.retry()).toBeNull();
		const next = guard.begin();
		expect(next).toBeTruthy();
		expect(next).not.toBe(id);
	});

	it('keeps AC04 intact: two synchronous begins give one id', () => {
		const guard = createSubmitGuard();
		guard.begin();
		expect(guard.begin()).toBeNull();
		expect(guard.retry()).toBeNull();
	});
});

describe('validateFile', () => {
	it('rejects a non-image', () => {
		expect(validateFile({ type: 'application/pdf', size: 1 })).toEqual({
			ok: false,
			reasonKey: 'attachment_failed_reason'
		});
	});

	it('accepts a small image', () => {
		expect(validateFile({ type: 'image/png', size: 1000 })).toEqual({ ok: true });
	});

	it('rejects an image over 10 MiB', () => {
		expect(validateFile({ type: 'image/png', size: 10 * 1024 * 1024 + 1 })).toEqual({
			ok: false,
			reasonKey: 'attachment_failed_reason'
		});
	});
});
