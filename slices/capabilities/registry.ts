import type { Capability } from './types';

const ICONS = ['Blocks', 'Globe', 'FileText', 'Terminal', 'GitBranch', 'Database'] as const;

function slug(n: number): string {
	return `capability_${String(n).padStart(2, '0')}`;
}

// Static, registry-driven catalog. 16 installed capabilities with alternating type/color.
export const CAPABILITIES: readonly Capability[] = Array.from({ length: 16 }, (_, i) => {
	const id = slug(i + 1);
	const type = i % 2 === 0 ? 'a' : 'b';
	return {
		id,
		nameKey: id,
		descriptionKey: 'capability_description',
		type,
		icon: ICONS[i % ICONS.length],
		color: type === 'a' ? 'var(--shell-accent)' : 'var(--shell-warn)',
		group: 'installed'
	} satisfies Capability;
});

export function getCapability(id: string): Capability | undefined {
	return CAPABILITIES.find((item) => item.id === id);
}

export function isCapabilityId(id: string): boolean {
	return CAPABILITIES.some((item) => item.id === id);
}

export function groupCapabilities(): { installed: Capability[]; available: Capability[] } {
	return {
		installed: CAPABILITIES.filter((item) => item.group === 'installed'),
		available: CAPABILITIES.filter((item) => item.group === 'available')
	};
}
