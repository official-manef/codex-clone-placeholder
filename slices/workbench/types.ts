export type WorkbenchLayout = 'closed' | 'split' | 'focused';

export type Tab = {
	id: string;
	kind: 'browser' | 'document' | 'file_preview' | 'tool' | 'review';
	titleKey: string; // placeholder token key
	resourceId: string | null;
	status: 'idle' | 'loading' | 'ready' | 'error';
	dirty: boolean;
	ownerChatId: string | null;
	lastFocusedAt: number;
	error: { code: string; messageKey: string } | null;
};

export type CloseDecision = 'keep' | 'discard' | 'cancel';
