import type { Attachment, Authority, ComposerProcess, SubmitState } from './types';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * First failing predicate wins; its key is the visible reason.
 * Order matters (AC01, AC03, AC16): empty → validating → failed → authority → run.
 * `offline` is a run that has not been accepted yet, so it shares the running reason.
 */
export function deriveSubmit(input: {
	draftText: string;
	attachments: readonly Attachment[];
	authority: Authority;
	process: ComposerProcess;
}): SubmitState {
	const { draftText, attachments, authority, process } = input;
	const hasText = draftText.trim().length > 0;
	const hasReady = attachments.some((a) => a.status === 'ready');

	if (!hasText && !hasReady) {
		return { enabled: false, reasonKey: 'submit_disabled_reason_empty' };
	}
	if (attachments.some((a) => a.status === 'validating')) {
		return { enabled: false, reasonKey: 'submit_disabled_reason_attachment' };
	}
	if (attachments.some((a) => a.status === 'failed')) {
		return { enabled: false, reasonKey: 'attachment_failed_reason' };
	}
	if (authority !== 'allowed') {
		return { enabled: false, reasonKey: 'submit_disabled_reason_invalid' };
	}
	if (process === 'running' || process === 'offline') {
		return { enabled: false, reasonKey: 'submit_disabled_reason_running' };
	}
	return { enabled: true, reasonKey: null };
}

export type SubmitGuard = {
	/** Locks and returns the request id. Retained id while a request never completed. */
	begin(): string | null;
	/** Re-arms a retained id after offline/cancel, without minting a new one (race 4). */
	retry(): string | null;
	/** Request completed: the next `begin()` mints a fresh id. */
	end(): void;
	/** Request unaccepted and still retryable (offline): unlock but keep the id (race 4). */
	abandon(): void;
	currentId(): string | null;
	isLocked(): boolean;
};

/**
 * One in-flight request max (AC04). `begin()` atomically locks; `end()` closes the
 * request for good; `abandon()` releases the lock but keeps the id so a retry after
 * a connection loss resends the same identity instead of duplicating (AC05/race 4).
 */
export function createSubmitGuard(): SubmitGuard {
	let locked = false;
	let id: string | null = null;
	return {
		begin() {
			if (locked) return null;
			locked = true;
			id ??= crypto.randomUUID();
			return id;
		},
		retry() {
			if (locked || id === null) return null;
			locked = true;
			return id;
		},
		end() {
			locked = false;
			id = null;
		},
		abandon() {
			locked = false;
		},
		currentId() {
			return id;
		},
		isLocked() {
			return locked;
		}
	};
}

/** MVP accepts images only (local preview, no upload) up to 10 MiB. */
export function validateFile(file: {
	type: string;
	size: number;
}): { ok: true } | { ok: false; reasonKey: string } {
	if (!file.type.startsWith('image/') || file.size > MAX_ATTACHMENT_BYTES) {
		return { ok: false, reasonKey: 'attachment_failed_reason' };
	}
	return { ok: true };
}
