export type AttachmentStatus = 'validating' | 'ready' | 'failed';

export type Attachment = {
	id: string;
	name: string; // real file name, never a token
	mimeType: string;
	sizeBytes: number;
	status: AttachmentStatus;
	progress: number | null; // null unless a real upload reports progress
	previewUrl: string | null; // object URL, revoked on remove/unmount
	reasonKey: string | null; // token key for failure reason
};

export type Authority = 'unknown' | 'allowed' | 'restricted' | 'expired';

export type ExecutionOption = 'standard' | 'extended';

/** D07 process axis, narrowed to the states this local stub can reach. */
export type ComposerProcess = 'idle' | 'running' | 'offline' | 'cancelled';

export type SubmitState = {
	enabled: boolean;
	reasonKey: string | null; // token key explaining why disabled
};

export type ComposerProps = {
	draftKey: string;
	authority?: Authority;
	onsubmit?: (payload: {
		draftKey: string;
		/** Stable across an offline retry, so the host appends one entry (AC04/AC05). */
		requestId: string;
		text: string;
		attachments: Attachment[];
		execution: ExecutionOption;
	}) => void;
	oncancel?: (payload: { draftKey: string; partialText: string }) => void;
};
