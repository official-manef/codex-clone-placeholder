import { describe, expect, it } from 'vitest';
import { hasAttachment, reduceAttachments } from '../attachment';

const draft = { id: 'a1', name: 'file.png', mimeType: 'image/png', sizeBytes: 1024 };

describe('reduceAttachments', () => {
	it('adds a chip as validating with no preview yet (T6)', () => {
		const list = reduceAttachments([], { type: 'add', attachment: draft });
		expect(list).toHaveLength(1);
		expect(list[0]).toMatchObject({ status: 'validating', progress: null, previewUrl: null });
	});

	it('resolves to ready with a preview URL', () => {
		const list = reduceAttachments(reduceAttachments([], { type: 'add', attachment: draft }), {
			type: 'resolve',
			id: 'a1',
			result: { ok: true, previewUrl: 'blob:one' }
		});
		expect(list[0]).toMatchObject({ status: 'ready', previewUrl: 'blob:one', reasonKey: null });
	});

	it('resolves to failed with the reason key (AC03)', () => {
		const list = reduceAttachments(reduceAttachments([], { type: 'add', attachment: draft }), {
			type: 'resolve',
			id: 'a1',
			result: { ok: false, reasonKey: 'attachment_failed_reason' }
		});
		expect(list[0]).toMatchObject({
			status: 'failed',
			previewUrl: null,
			reasonKey: 'attachment_failed_reason'
		});
	});

	it('drops a late resolve for a removed id, so nothing is resurrected (race 5)', () => {
		const added = reduceAttachments([], { type: 'add', attachment: draft });
		const removed = reduceAttachments(added, { type: 'remove', id: 'a1' });
		expect(removed).toHaveLength(0);
		const late = reduceAttachments(removed, {
			type: 'resolve',
			id: 'a1',
			result: { ok: true, previewUrl: 'blob:late' }
		});
		expect(late).toHaveLength(0);
		expect(hasAttachment(late, 'a1')).toBe(false);
	});

	it('keeps a ready chip beside a failed one (AC03)', () => {
		let list = reduceAttachments([], { type: 'add', attachment: draft });
		list = reduceAttachments(list, {
			type: 'add',
			attachment: { ...draft, id: 'a2', name: 'bad.pdf', mimeType: 'application/pdf' }
		});
		list = reduceAttachments(list, {
			type: 'resolve',
			id: 'a1',
			result: { ok: true, previewUrl: 'blob:one' }
		});
		list = reduceAttachments(list, {
			type: 'resolve',
			id: 'a2',
			result: { ok: false, reasonKey: 'attachment_failed_reason' }
		});
		expect(list.map((a) => a.status)).toEqual(['ready', 'failed']);
		expect(list[0].previewUrl).toBe('blob:one');
	});

	it('clears every chip', () => {
		const list = reduceAttachments(reduceAttachments([], { type: 'add', attachment: draft }), {
			type: 'clear'
		});
		expect(list).toHaveLength(0);
	});
});
