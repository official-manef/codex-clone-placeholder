import { PLACEHOLDER_FAMILIES } from './keys';

/**
 * Fixed-key copy: one human-readable label per declared non-family key in `keys.ts`.
 * Sentence case, no trailing period on labels, periods on sentences.
 */
const FIXED: Readonly<Record<string, string>> = {
	// Title bar
	menu_a: 'Toggle sidebar',
	menu_b: 'Location',
	menu_c: 'Menu',
	menu_d: 'More menu',
	// Rail
	rail_primary_destination: 'Workspace',
	rail_secondary_destination: 'Capabilities',
	rail_tertiary_destination: 'Settings',
	rail_overflow: 'More destinations',
	// Sidebar
	workspace_name: 'Workspace',
	create_object: 'New object',
	priority_group: 'Priority',
	context_group: 'Context',
	recent_group: 'Recent',
	object_title_01: 'Object 1',
	object_title_02: 'Object 2',
	context_name: 'Context name',
	empty_context: 'No objects in this context.',
	// Unstarted surface
	mode_a: 'Chat',
	mode_b: 'Work',
	entry_heading: 'Open local chat',
	draft_input_placeholder: 'Type a message',
	// Composer controls
	access_scope: 'Access scope',
	access_scope_field_01: 'This workspace',
	access_scope_field_02: 'This context',
	execution_option: 'Execution',
	execution_option_field_01: 'Standard',
	execution_option_field_02: 'Extended',
	level: 'Level',
	// Support bar
	context_selector: 'Context',
	resources: 'Resources',
	capabilities: 'Capabilities',
	// Timeline
	input_content_01: 'First user message.',
	input_content_02: 'Second user message.',
	primary_content_01: 'First response.',
	primary_content_02: 'Second response.',
	'result_content.title': 'Result',
	'result_content.description': 'Result details appear here.',
	// Activity
	activity_summary: 'Worked for',
	process_duration: 'Process duration',
	completed_activity_summary: 'Completed in',
	completed_process_duration: 'Completed process duration',
	// Inline notice
	'constraint_notice.message': 'This action could not be completed.',
	'constraint_notice.recovery': 'Try again',
	// Summary card groups
	related_records: 'Related records',
	outputs: 'Outputs',
	processes: 'Processes',
	sources: 'Sources',
	// Workbench
	resource_start_title: 'Start a resource',
	resource_history: 'History',
	resource_location: 'Resource location',
	resource_reload: 'Reload',
	resource_overflow: 'More options',
	resource_hide: 'Hide panel',
	resource_show: 'Show panel',
	// Capabilities
	capability_type_a: 'Type A',
	capability_type_b: 'Type B',
	capability_description: 'Capability description text.',
	capability_connection_none: 'Connect',
	capability_connection_pending: 'Connecting',
	capability_connection_ready: 'Connected',
	capability_connection_failed: 'Connection failed',
	// Settings rows
	permission_field_01: 'Permissions',
	'permission_field_01.description': 'Controls which actions this workspace can ask for.',
	path_field_01: 'Path',
	'path_field_01.description': 'Filesystem path this workspace uses.',
	enum_field_01: 'Mode',
	'enum_field_01.description': 'Selects one of the available modes.',
	boolean_field_01: 'Enabled',
	'boolean_field_01.description': 'Turns this option on or off.',
	action_field_01: 'Action',
	'action_field_01.description': 'Runs the configured action once.',
	// Row / entry metadata
	status: 'Status update',
	time: 'Time',
	// Composer submit guard
	submit_disabled_reason_empty: 'Submit is disabled because the draft is empty.',
	submit_disabled_reason_invalid: 'Submit is disabled because sending is not allowed here.',
	submit_disabled_reason_running: 'Submit is disabled while a request is running.',
	submit_disabled_reason_attachment:
		'Submit is disabled while an attachment is still being checked.',
	attachment_failed_reason: 'File type is not supported.',
	cancel_running: 'Stop',
	// Feedback states
	empty_state: 'Nothing to show yet.',
	loading_state: 'Loading',
	unknown_state: 'State not recognised.',
	error_state: 'Something went wrong.',
	partial_state: 'Partial result',
	restricted_state: 'Restricted',
	no_match_state: 'No results match your search.',
	// Dirty tab close
	tab_close_dirty_prompt: 'This tab has unsaved changes.',
	tab_close_dirty_keep: 'Keep open',
	tab_close_dirty_discard: 'Discard changes',
	tab_close_dirty_cancel: 'Cancel',
	// Settings persistence
	settings_search_placeholder: 'Search',
	settings_saved: 'Saved',
	settings_saving: 'Saving',
	settings_save_error: 'Could not save the change.'
};

/** Numbered family roots keep short numbered labels: `capability_03` → `Capability 3`. */
const FAMILY_LABELS: Readonly<Record<string, string>> = {
	rail_overflow_item: 'Overflow item',
	recent_object: 'Recent object',
	related_records_item: 'Related record',
	outputs_item: 'Output',
	processes_item: 'Process',
	sources_item: 'Source',
	suggested_resource: 'Suggested resource',
	recent_resource: 'Recent resource',
	capability: 'Capability',
	configuration_category: 'Configuration',
	integration_category: 'Integration',
	advanced_category: 'Advanced'
};

/** `Capability 1` … `Capability 16`, padded to match the generated keys. */
function familyCopy(root: string, count: number, label: string): Record<string, string> {
	const entries: Record<string, string> = {};
	for (let n = 1; n <= count; n++) {
		entries[`${root}_${String(n).padStart(2, '0')}`] = `${label} ${n}`;
	}
	return entries;
}

const FAMILY: Record<string, string> = {};
for (const { root, count } of PLACEHOLDER_FAMILIES) {
	Object.assign(FAMILY, familyCopy(root, count, FAMILY_LABELS[root] ?? root));
}

/** Human-readable placeholder copy. One entry per declared key; families resolve by range. */
export const COPY: Readonly<Record<string, string>> = { ...FIXED, ...FAMILY };
