import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './_shared/auth';

/**
 * Decision-model log (Jev / Laya).
 *
 * The template never runs the decision model server-side: inference is either on the user's
 * paired NPU device or through an OpenAI-compatible endpoint the user configured. This module
 * only records what a device returned, so a session can show the verdict and its probability.
 *
 * `probability` is the gate value: `probabilities[choice]` for a choice question, `noul` for a
 * yes/no question. It is never `confidence`, which is a normalized entropy and drops as the
 * option count grows.
 *
 * Hard rules carried from the model's own contract:
 *  - English-only input. A non-Latin prompt can score 0.000 with confidence 0.95.
 *  - One question per request.
 *  - At most 8 options.
 *  - At most 512 tokens of state.
 */

const MAX_DECISIONS = 200;
const MAX_OPTIONS = 8;
const MAX_STATE_TOKENS = 512;

const decision = v.object({
	_id: v.id('decisions'),
	sessionId: v.optional(v.id('sessions')),
	kind: v.string(),
	question: v.string(),
	choice: v.string(),
	probability: v.number(),
	engine: v.string(),
	at: v.number()
});

export const listForSession = query({
	args: { sessionId: v.id('sessions') },
	returns: v.array(decision),
	handler: async (ctx, args) => {
		const owner = await requireUser(ctx);
		const parent = await ctx.db.get('sessions', args.sessionId);
		if (!parent || parent.owner !== owner) return [];
		const rows = await ctx.db
			.query('decisions')
			.withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
			.order('desc')
			.take(MAX_DECISIONS);
		return rows.map(({ _id, sessionId, kind, question, choice, probability, engine, at }) => ({
			_id,
			sessionId,
			kind,
			question,
			choice,
			probability,
			engine,
			at
		}));
	}
});

/**
 * Record a verdict a device produced. Bounded and validated here; the model itself is not called.
 *
 * `stateTokens` is a coarse word count, not a real tokenizer. It exists to reject an obviously
 * oversized state before it reaches a 512-token window.
 */
export const record = mutation({
	args: {
		sessionId: v.optional(v.id('sessions')),
		kind: v.union(v.literal('choice'), v.literal('score'), v.literal('noul')),
		question: v.string(),
		choice: v.string(),
		probability: v.number(),
		engine: v.union(v.literal('npu'), v.literal('host'), v.literal('local')),
		stateTokens: v.number(),
		answerCount: v.number()
	},
	returns: v.id('decisions'),
	handler: async (ctx, args) => {
		const owner = await requireUser(ctx);

		if (args.stateTokens > MAX_STATE_TOKENS)
			throw new Error(
				`The state exceeds ${MAX_STATE_TOKENS} tokens; the model truncates silently.`
			);
		if (args.answerCount < 1 || args.answerCount > MAX_OPTIONS)
			throw new Error(`A decision carries between 1 and ${MAX_OPTIONS} options.`);
		if (!(args.probability >= 0 && args.probability <= 1))
			throw new Error('The gate probability must be between 0 and 1.');
		if (!/^[\x20-\x7e\n]*$/.test(args.question))
			throw new Error('The question must be ASCII/English; the model is English-only.');

		if (args.sessionId) {
			const parent = await ctx.db.get('sessions', args.sessionId);
			if (!parent || parent.owner !== owner) throw new Error('That chat is not available.');
		}

		return await ctx.db.insert('decisions', {
			owner,
			sessionId: args.sessionId,
			kind: args.kind,
			question: args.question.slice(0, 500),
			choice: args.choice.slice(0, 120),
			probability: args.probability,
			engine: args.engine,
			at: Date.now()
		});
	}
});
