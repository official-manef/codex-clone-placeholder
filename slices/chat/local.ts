/**
 * Local chat stub. Replaces Laya's Chat view behind the same `WorkspaceChatProps` /
 * `WorkspaceChatHandle` contract. No network, no provider key, no upload.
 *
 * ponytail: a send becomes a timeline entry after a short delay. When a real backend
 * exists it plugs into `send()` and nothing outside this file changes.
 */
export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
	id: string;
	role: ChatRole;
	text: string;
	createdAt: number;
	/** Assistant entries only: a cancelled turn keeps its partial text. */
	cancelled?: boolean;
};

const REPLIES = [
	'Local workspace. No provider is configured, so this reply is a stub.',
	'The draft stayed mounted while you navigated the workspace.',
	'Nothing left this machine. Attachments stay as local previews only.'
] as const;

let sequence = 0;

export function newMessage(role: ChatRole, text: string): ChatMessage {
	sequence += 1;
	return { id: `local-${sequence}`, role, text, createdAt: Date.now() };
}

/** Deterministic stub reply; the choice depends on turn index, not on the prompt. */
export function stubReply(turn: number): string {
	return REPLIES[turn % REPLIES.length];
}

export type SubmitDecision = { enabled: true } | { enabled: false; reason: string };

/**
 * One guard for the send control. The first failing predicate names the reason so the
 * UI can explain a disabled button instead of leaving it inert.
 */
export function submitDecision(input: {
	draft: string;
	attachments: number;
	busy: boolean;
}): SubmitDecision {
	if (input.busy) return { enabled: false, reason: 'Stop the current reply first' };
	if (!input.draft.trim() && input.attachments === 0)
		return { enabled: false, reason: 'Type a message or attach a file' };
	return { enabled: true };
}
