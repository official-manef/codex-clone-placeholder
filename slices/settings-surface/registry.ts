import { FIELDS } from './fields';
import type { SettingSection } from './types';

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

function build(prefix: string, count: number, group: SettingSection['group']): SettingSection[] {
	return Array.from({ length: count }, (_, i) => {
		const id = `${prefix}_${pad(i + 1)}`;
		const size = 2 + (i % 3); // 2-4 rows per category
		const fieldKeys = Array.from({ length: size }, (_, j) => FIELDS[(i + j) % FIELDS.length].key);
		return { id, labelKey: id, group, fieldKeys };
	});
}

export const SECTIONS: readonly SettingSection[] = [
	...build('configuration_category', 16, 'configuration'),
	...build('integration_category', 6, 'integration'),
	...build('advanced_category', 5, 'advanced')
];

export const FIRST_SECTION_ID = 'configuration_category_01';

export function getSection(id: string): SettingSection | undefined {
	return SECTIONS.find((section) => section.id === id);
}

export function isSectionId(id: string): boolean {
	return SECTIONS.some((section) => section.id === id);
}

export function groupSections(): {
	configuration: SettingSection[];
	integration: SettingSection[];
	advanced: SettingSection[];
} {
	return {
		configuration: SECTIONS.filter((section) => section.group === 'configuration'),
		integration: SECTIONS.filter((section) => section.group === 'integration'),
		advanced: SECTIONS.filter((section) => section.group === 'advanced')
	};
}
