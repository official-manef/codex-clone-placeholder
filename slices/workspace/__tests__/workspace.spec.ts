import { describe, expect, it } from 'vitest';
import { t } from '$features/placeholders';
import {
	createWorkspaceState,
	derivePopulated,
	firstVisibleAnchor,
	type TimelineEntry
} from '../index';

function entry(id: string, overrides: Partial<TimelineEntry> = {}): TimelineEntry {
	return {
		id,
		kind: 'assistant',
		contentKeys: ['primary_content_01'],
		createdAt: 1_700_000_000_000,
		durationMs: null,
		status: 'complete',
		...overrides
	};
}

const BRACE = /^\{[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?\}$/;

describe('derivePopulated', () => {
	it('stays unpopulated without a chat, populated with one', () => {
		expect(derivePopulated(null, 0)).toBe(false);
		expect(derivePopulated('chat-1', 0)).toBe(true);
	});
});

describe('workspace state', () => {
	it('keeps unstarted until the region is marked populated', () => {
		const state = createWorkspaceState(null);
		state.appendEntry(entry('m1'));
		expect(state.entries).toHaveLength(1);
		expect(state.populated).toBe(false);
		state.setPopulated(true);
		expect(state.populated).toBe(true);
	});

	it('appends an entry once per id (AC04 parity)', () => {
		const state = createWorkspaceState('chat-1');
		state.appendEntry(entry('m1'));
		state.appendEntry(entry('m1'));
		expect(state.entries.map((item) => item.id)).toEqual(['m1']);
	});

	it('switches mode without clearing the selected object (T3)', () => {
		const state = createWorkspaceState('chat-1');
		state.setMode('work');
		expect(state.mode).toBe('work');
		state.setMode('chat');
		expect(state.mode).toBe('chat');
		expect(state.activeObjectId).toBe('chat-1');
	});

	it('toggles the context summary independently of the mode', () => {
		const state = createWorkspaceState('chat-1');
		expect(state.contextSummary).toBe('hidden');
		state.toggleContextSummary();
		expect(state.contextSummary).toBe('shown');
		state.toggleContextSummary();
		expect(state.contextSummary).toBe('hidden');
	});

	it('keeps the scroll anchor across appends (AC17)', () => {
		const state = createWorkspaceState('chat-1');
		state.setScrollAnchor(720);
		state.appendEntry(entry('m1'));
		state.appendEntry(entry('m2'));
		expect(state.scrollAnchor).toBe(720);
		expect(state.entries).toHaveLength(2);
	});
});

describe('firstVisibleAnchor (AC17)', () => {
	it('keeps a scrolled reading anchor and clamps the top', () => {
		expect(firstVisibleAnchor(900, 100)).toBe(900);
		expect(firstVisibleAnchor(40, 100)).toBe(0);
	});
});

describe('placeholder coverage', () => {
	const contentKeys = [
		'input_content_01',
		'primary_content_01',
		'activity_summary',
		'constraint_notice.message',
		'constraint_notice.recovery',
		'empty_state',
		'error_state',
		'status',
		'mode_a',
		'mode_b',
		'entry_heading',
		'context_selector',
		'resources',
		'capabilities',
		'object_title_01',
		'context_name',
		'menu_b',
		'menu_c',
		'menu_d',
		'related_records',
		'outputs',
		'processes',
		'sources'
	];

	it.each(contentKeys)('resolves %s to a brace token', (key) => {
		expect(t(key)).toMatch(BRACE);
	});
});
