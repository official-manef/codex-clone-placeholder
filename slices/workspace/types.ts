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
/**
 * Handed to the composer host snippet so the screen can append the send as a timeline entry.
 * The composer's `requestId` is the entry id, so a retry re-sends the same identity and the
 * entry store appends it once (AC04/AC05).
 */
export type ComposerSlot = {
	appendDraft: (payload: { requestId: string; text: string }) => void;
};
