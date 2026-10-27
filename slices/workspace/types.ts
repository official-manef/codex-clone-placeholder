export type Mode = 'chat' | 'work';
export type TimelineEntryKind = 'user' | 'assistant' | 'activity' | 'notice';
export type TimelineEntry = {
	id: string;
	kind: TimelineEntryKind;
	/** placeholder token keys, resolved with t() at render time */
	contentKeys: readonly string[];
	/** data, not copy — formatted with Intl at render time */
	createdAt: number;
	durationMs: number | null;
	status: 'pending' | 'running' | 'complete' | 'failed' | 'cancelled';
};
export type SummaryGroup = {
	id: 'related_records' | 'outputs' | 'processes' | 'sources';
	itemKeys: readonly string[];
};
export type WorkspaceScreenProps = { chatId: string | null };
/** Handed to the composer host snippet so the screen can append the send as a timeline entry. */
export type ComposerSlot = { appendDraft: (text: string) => void };
