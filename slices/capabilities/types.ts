export type CapabilityType = 'a' | 'b';

export type CapabilityConnection = 'not_connected' | 'pending' | 'connected' | 'failed';

export type Capability = {
	id: string; // slug, e.g. 'capability_01'
	nameKey: string; // placeholder token key
	descriptionKey: string; // placeholder token key
	type: CapabilityType;
	icon: string; // lucide icon name
	color: string; // CSS token reference, e.g. 'var(--shell-accent)' — NEVER a hex
	group: 'installed' | 'available';
};
