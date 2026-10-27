import type { ComposerProcess } from './types';

export type RunState = {
	process: ComposerProcess;
	/** Snapshot of the send that was not accepted yet; restored on connection loss (AC05). */
	draftText: string;
	/** Partial assistant output, kept when a run is cancelled (AC06). */
	partialText: string;
};

export type RunAction =
	{ type: 'submit'; text: string } | { type: 'offline' } | { type: 'retry' } | { type: 'cancel' };

export const initialRunState: RunState = { process: 'idle', draftText: '', partialText: '' };

/**
 * Pure run transitions (T4, T5, AC05, AC06). The pre-acceptance text is carried here,
 * so neither a connection loss nor a cancel can lose the user's words.
 */
export function reduceRun(state: RunState, action: RunAction): RunState {
	switch (action.type) {
		// ponytail: a local echo stands in for streaming output. Ceiling: no decoder, no
		// transport. Upgrade: append real deltas from the stream adapter here.
		case 'submit':
			return { process: 'running', draftText: action.text, partialText: action.text };
		case 'offline':
			return { ...state, process: 'offline' };
		case 'retry':
			return { ...state, process: 'running' };
		case 'cancel':
			return { ...state, process: 'cancelled' };
	}
}

/** AC06 gate: `cancel` is only a transition while a run is active. */
export function canCancel(state: RunState): boolean {
	return state.process === 'running';
}

/**
 * T5/AC06 as one pure step. Cancel keeps `partialText` and returns the draft text
 * untouched — only an accepted submit clears a draft, so cancel must never drop it.
 */
export function cancelRun(snapshot: { run: RunState; draftText: string }): {
	run: RunState;
	draftText: string;
} {
	if (!canCancel(snapshot.run)) return snapshot;
	return { draftText: snapshot.draftText, run: reduceRun(snapshot.run, { type: 'cancel' }) };
}
