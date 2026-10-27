/**
 * Declared placeholder key families. SSOT for coverage tests and the dev-only
 * unknown-key warning in `index.ts`.
 */

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

function family(root: string, count: number): string[] {
	return Array.from({ length: count }, (_, i) => `${root}_${pad(i + 1)}`);
}

/** Numbered families. Every other key is a fixed literal below. */
export const PLACEHOLDER_FAMILIES: readonly { root: string; count: number }[] = [
	{ root: 'rail_overflow_item', count: 3 },
	{ root: 'recent_object', count: 24 },
	{ root: 'related_records_item', count: 4 },
	{ root: 'outputs_item', count: 4 },
	{ root: 'processes_item', count: 4 },
	{ root: 'sources_item', count: 4 },
	{ root: 'suggested_resource', count: 4 },
	{ root: 'recent_resource', count: 4 },
	{ root: 'capability', count: 16 },
	{ root: 'configuration_category', count: 16 },
	{ root: 'integration_category', count: 6 },
	{ root: 'advanced_category', count: 5 }
];

const FIXED_KEYS: readonly string[] = [
	// Title bar
	'menu_a',
	'menu_b',
	'menu_c',
	'menu_d',
	// Rail
	'rail_primary_destination',
	'rail_secondary_destination',
	'rail_tertiary_destination',
	'rail_overflow',
	// Sidebar
	'workspace_name',
	'create_object',
	'priority_group',
	'context_group',
	'recent_group',
	'object_title_01',
	'object_title_02',
	'context_name',
	'empty_context',
	// Unstarted surface
	'mode_a',
	'mode_b',
	'entry_heading',
	'draft_input_placeholder',
	// Composer controls
	'access_scope',
	'access_scope_field_01',
	'access_scope_field_02',
	'execution_option',
	'execution_option_field_01',
	'execution_option_field_02',
	'level',
	// Support bar
	'context_selector',
	'resources',
	'capabilities',
	// Timeline
	'input_content_01',
	'input_content_02',
	'primary_content_01',
	'primary_content_02',
	'result_content.title',
	'result_content.description',
	// Activity
	'activity_summary',
	'process_duration',
	'completed_activity_summary',
	'completed_process_duration',
	// Inline notice
	'constraint_notice.message',
	'constraint_notice.recovery',
	// Summary card groups
	'related_records',
	'outputs',
	'processes',
	'sources',
	// Workbench
	'resource_start_title',
	'resource_history',
	'resource_location',
	'resource_reload',
	'resource_overflow',
	'resource_hide',
	'resource_show',
	// Capabilities
	'capability_type_a',
	'capability_type_b',
	'capability_description',
	'capability_connection_none',
	'capability_connection_pending',
	'capability_connection_ready',
	'capability_connection_failed',
	// Settings rows
	'permission_field_01',
	'permission_field_01.description',
	'path_field_01',
	'path_field_01.description',
	'enum_field_01',
	'enum_field_01.description',
	'boolean_field_01',
	'boolean_field_01.description',
	'action_field_01',
	'action_field_01.description',
	// Row / entry metadata
	'status',
	'time',
	// Composer submit guard
	'submit_disabled_reason_empty',
	'submit_disabled_reason_invalid',
	'submit_disabled_reason_running',
	'submit_disabled_reason_attachment',
	'attachment_failed_reason',
	'cancel_running',
	// Feedback states
	'empty_state',
	'loading_state',
	'unknown_state',
	'error_state',
	'partial_state',
	'restricted_state',
	'no_match_state',
	// Dirty tab close
	'tab_close_dirty_prompt',
	'tab_close_dirty_keep',
	'tab_close_dirty_discard',
	'tab_close_dirty_cancel',
	// Settings persistence
	'settings_search_placeholder',
	'settings_saved',
	'settings_saving',
	'settings_save_error'
];

export const PLACEHOLDER_KEYS: readonly string[] = [
	...FIXED_KEYS,
	...PLACEHOLDER_FAMILIES.flatMap(({ root, count }) => family(root, count))
];

/** Generic control words a screen reader needs; the only literal copy allowed. */
export const GENERIC_LABELS = ['Close', 'Remove', 'Add'] as const;
