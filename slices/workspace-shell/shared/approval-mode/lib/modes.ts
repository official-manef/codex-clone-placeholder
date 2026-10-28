import type { ApprovalMode } from '../types.js';

/** Invalid or ambiguous configurations fail closed instead of choosing a mode. */
export function validatedApprovalModes(modes: readonly ApprovalMode[]): readonly ApprovalMode[] {
	if (!Array.isArray(modes)) return [];
	const seen = new Set<string>();
	for (const mode of modes) {
		if (
			!mode ||
			typeof mode.id !== 'string' ||
			!/^[a-z][a-z0-9-]{0,63}$/.test(mode.id) ||
			seen.has(mode.id) ||
			typeof mode.label !== 'string' ||
			!mode.label.trim() ||
			(mode.description !== undefined && typeof mode.description !== 'string') ||
			(mode.disabled !== undefined && typeof mode.disabled !== 'boolean')
		)
			return [];
		seen.add(mode.id);
	}
	return modes;
}
