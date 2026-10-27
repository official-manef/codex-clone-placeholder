export type FieldValue = boolean | string;
export type SettingFieldType = 'toggle' | 'select' | 'path' | 'action';
export type SettingStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'invalid' | 'save_error';
export type SettingField = {
	key: string; // placeholder token root, e.g. 'boolean_field_01'
	type: SettingFieldType;
	labelKey: string;
	descriptionKey: string | null;
	defaultValue: FieldValue;
	options?: readonly string[]; // select only, values are token roots too
};
export type SettingSection = {
	id: string; // e.g. 'configuration_category_03'
	labelKey: string;
	group: 'configuration' | 'integration' | 'advanced';
	fieldKeys: readonly string[];
};
