export type AttachmentStatus = 'validating' | 'ready' | 'failed';

export type Attachment = {
	id: string;
	name: string; // real file name, never a token
	mimeType: string;
	sizeBytes: number;
	status: AttachmentStatus;
	previewUrl: string | null; // object URL, revoked on remove/unmount
	reasonKey: string | null; // token key for failure reason
};

export type Authority = 'unknown' | 'allowed' | 'restricted' | 'expired';

export type ExecutionOption = 'standard' | 'extended';

export type SubmitState = {
	enabled: boolean;
	reasonKey: string | null; // token key explaining why disabled
};

export type ComposerProps = {
	draftKey: string;
	authority?: Authority;
	onsubmit?: (payload: {
		draftKey: string;
		text: string;
		attachments: Attachment[];
		execution: ExecutionOption;
	}) => void;
};
