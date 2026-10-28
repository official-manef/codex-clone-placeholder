/** A product-owned mode description. It grants no authority by itself. */
export type ApprovalMode = {
	id: string;
	label: string;
	description?: string;
	disabled?: boolean;
};

export type ApprovalModeSelection = (id: string) => void | Promise<void>;

/** Presentation configuration only; authority remains with the host runtime. */
export type ApprovalControlConfig = {
	modes: readonly ApprovalMode[];
	value?: string | null;
	label?: string;
	onSelect?: ApprovalModeSelection;
};
