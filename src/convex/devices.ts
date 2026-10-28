import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './_shared/auth';

/**
 * Device pairing, so a user's own machine (a local runtime, an NPU box, a laptop) can stream to
 * this workspace instead of the cloud.
 *
 * The pairing token is generated in the browser and only its SHA-256 hash is stored here. A row
 * is therefore useless if the database leaks: the hash cannot be replayed.
 *
 * The template does not run the device side. `src/lib/http.local.ts` documents the local
 * transport; a product that ships device streaming verifies the token at its own endpoint.
 */

const MAX_DEVICES = 20;

const device = v.object({
	_id: v.id('devices'),
	name: v.string(),
	kind: v.string(),
	lastSeenAt: v.number(),
	revokedAt: v.optional(v.number())
});

export const list = query({
	args: {},
	returns: v.array(device),
	handler: async (ctx) => {
		const owner = await requireUser(ctx);
		const rows = await ctx.db
			.query('devices')
			.withIndex('by_owner', (q) => q.eq('owner', owner))
			.take(MAX_DEVICES);
		return rows.map(({ _id, name, kind, lastSeenAt, revokedAt }) => ({
			_id,
			name,
			kind,
			lastSeenAt,
			revokedAt
		}));
	}
});

/**
 * Register a device. The caller sends the SHA-256 of a token it generated; the plaintext token
 * never reaches this function.
 */
export const register = mutation({
	args: { name: v.string(), kind: v.string(), tokenHash: v.string() },
	returns: v.id('devices'),
	handler: async (ctx, args) => {
		const owner = await requireUser(ctx);
		if (!/^[a-f0-9]{64}$/.test(args.tokenHash))
			throw new Error('The device token hash must be a SHA-256 hex digest.');
		const existing = await ctx.db
			.query('devices')
			.withIndex('by_owner', (q) => q.eq('owner', owner))
			.take(MAX_DEVICES);
		if (existing.length >= MAX_DEVICES)
			throw new Error('This account already has the maximum devices.');
		return await ctx.db.insert('devices', {
			owner,
			name: args.name.trim().slice(0, 80) || 'This device',
			kind: args.kind === 'npu' || args.kind === 'runtime' ? args.kind : 'runtime',
			tokenHash: args.tokenHash,
			lastSeenAt: Date.now()
		});
	}
});

/** A device heartbeat. Ownership is checked before the write. */
export const touch = mutation({
	args: { id: v.id('devices') },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const owner = await requireUser(ctx);
		const row = await ctx.db.get('devices', args.id);
		if (!row || row.owner !== owner || row.revokedAt) return false;
		await ctx.db.patch('devices', args.id, { lastSeenAt: Date.now() });
		return true;
	}
});

export const revoke = mutation({
	args: { id: v.id('devices') },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const owner = await requireUser(ctx);
		const row = await ctx.db.get('devices', args.id);
		if (!row || row.owner !== owner) return false;
		await ctx.db.patch('devices', args.id, { revokedAt: Date.now() });
		return true;
	}
});
