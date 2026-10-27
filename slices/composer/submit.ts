import type { Attachment, Authority, SubmitState } from './types';

type Process = 'idle' | 'running' | 'queued' | 'waiting' | 'success' | 'failed' | 'cancelled';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * First failing predicate wins; its key is the visible reason.
 * Order matters (AC01, AC03, AC16): empty → validating → failed → authority → running.
 */
export function deriveSubmit(input: {
	draftText: string;
	attachments: readonly Attachment[];
	authority: Authority;
	process: Process;
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
	if (process === 'running') {
		return { enabled: false, reasonKey: 'submit_disabled_reason_running' };
	}
	return { enabled: true, reasonKey: null };
}

/** One in-flight request max (AC04). `begin()` atomically locks, `end()` releases. */
export function createSubmitGuard(): { begin(): string | null; end(): void; isLocked(): boolean } {
	let locked = false;
	return {
		begin() {
			if (locked) return null;
			locked = true;
			return crypto.randomUUID();
		},
		end() {
			locked = false;
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
