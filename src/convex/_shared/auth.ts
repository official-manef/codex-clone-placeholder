import type { QueryCtx, MutationCtx, ActionCtx } from '../_generated/server';
import { ConvexError } from 'convex/values';

/**
 * The single identity derivation for this app. Mirrors the SvelteKit Google OIDC session:
 * `tokenIdentifier` is the stable per-user key Convex sees, and it is server-assigned, so a
 * client can never claim another tenant.
 *
 * Every protected handler calls one of these; no handler inlines getUserIdentity + a throw.
 */
export type Ctx = QueryCtx | MutationCtx | ActionCtx;

export async function identityOf(ctx: Ctx): Promise<string | null> {
	const identity = await ctx.auth.getUserIdentity();
	return identity?.tokenIdentifier ?? null;
}

export async function requireUser(ctx: Ctx): Promise<string> {
	const identity = await identityOf(ctx);
	if (!identity) throw new ConvexError('Please sign in.');
	return identity;
}

/** Local-only mode: the workspace still works, it just has no server-side data. */
export async function optionalUser(ctx: Ctx): Promise<string | null> {
	return identityOf(ctx);
}

/** Typed, non-leaking error. Never surfaces a provider payload to the client. */
export type ErrorCode =
	| 'not_authenticated'
	| 'not_found'
	| 'invalid_request'
	| 'no_credential'
	| 'rate_limited'
	| 'quota_exceeded'
	| 'provider_error'
	| 'unsupported';

export function fail(code: ErrorCode, message: string): never {
	throw new ConvexError({ code, message });
}
