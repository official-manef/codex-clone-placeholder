import type { Attachment } from './types';

export type AttachmentDraft = {
	id: string;
	name: string;
	mimeType: string;
	sizeBytes: number;
};

export type ResolveResult =
	{ ok: true; previewUrl: string | null } | { ok: false; reasonKey: string };

export type AttachmentAction =
	| { type: 'add'; attachment: AttachmentDraft }
	| { type: 'resolve'; id: string; result: ResolveResult }
	| { type: 'remove'; id: string }
	| { type: 'clear' };

/**
 * Pure attachment transitions (T6, T7, race 5). A `resolve` for an id that is no
 * longer in the list is a no-op — removal during `validating` cancelled that
 * validation, so a late resolve must not resurrect the chip.
 */
export function reduceAttachments(
	list: readonly Attachment[],
	action: AttachmentAction
): Attachment[] {
	switch (action.type) {
		case 'add':
			return [
				...list,
				{
					...action.attachment,
					status: 'validating',
					progress: null,
					previewUrl: null,
					reasonKey: null
				}
			];
		case 'resolve':
			return list.map((item) => {
				if (item.id !== action.id) return item;
				return action.result.ok
					? {
							...item,
							status: 'ready',
							progress: null,
							previewUrl: action.result.previewUrl,
							reasonKey: null
						}
					: {
							...item,
							status: 'failed',
							progress: null,
							previewUrl: null,
							reasonKey: action.result.reasonKey
						};
			});
		case 'remove':
			return list.filter((item) => item.id !== action.id);
		case 'clear':
			return [];
	}
}

/** Still-live check the component uses before creating an object URL for a resolve. */
export function hasAttachment(list: readonly Attachment[], id: string): boolean {
	return list.some((item) => item.id === id);
}
