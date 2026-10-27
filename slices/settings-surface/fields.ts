import type { FieldValue, SettingField } from './types';

/**
 * Only the five row keys declared in `slices/placeholders/keys.ts` exist, so sections share
 * them: the value store is per key, so a repeated key keeps one value across categories.
 */
export const FIELDS: readonly SettingField[] = [
	{
		key: 'permission_field_01',
		type: 'toggle',
		labelKey: 'permission_field_01',
		descriptionKey: 'permission_field_01.description',
		defaultValue: false
	},
	{
		key: 'path_field_01',
		type: 'path',
		labelKey: 'path_field_01',
		descriptionKey: 'path_field_01.description',
		defaultValue: ''
	},
	{
		key: 'enum_field_01',
		type: 'select',
		labelKey: 'enum_field_01',
		descriptionKey: 'enum_field_01.description',
		defaultValue: 'mode_a',
		options: ['mode_a', 'mode_b']
	},
	{
		key: 'boolean_field_01',
		type: 'toggle',
		labelKey: 'boolean_field_01',
		descriptionKey: 'boolean_field_01.description',
		defaultValue: false
	},
	{
		key: 'action_field_01',
		type: 'action',
		labelKey: 'action_field_01',
		descriptionKey: 'action_field_01.description',
		defaultValue: false
	}
];

export const FIELDS_BY_KEY: Map<string, SettingField> = new Map(
	FIELDS.map((field) => [field.key, field])
);

export function getField(key: string): SettingField | undefined {
	return FIELDS_BY_KEY.get(key);
}

export function defaultValues(): Record<string, FieldValue> {
	return Object.fromEntries(FIELDS.map((field) => [field.key, field.defaultValue]));
}
