import { expect, test } from 'vitest';
import { authCopy, isSignInError } from './auth_state';

const configured = { configured: true, signedIn: false, isLoading: false };

test('authCopy names the configuration when sign-in does not exist', () => {
	const copy = authCopy({ ...configured, configured: false });
	expect(copy.tone).toBe('unavailable');
	expect(copy.title).toBe('Sign-in is not configured on this deployment');
	expect(copy.detail).toContain('AUTH_ENABLED');
	expect(copy.detail).toContain('AUTH_CLIENT_ID');
	expect(copy.detail).toContain('AUTH_CLIENT_SECRET');
	expect(copy.detail).toContain('AUTH_SESSION_SECRET');
	expect(copy.detail).toContain('PUBLIC_SITE_URL');
	expect(copy.detail).toContain('signed-in owner');
	expect(copy.action).toBeNull();
});

test('authCopy reports the loading state without an action', () => {
	const copy = authCopy({ ...configured, isLoading: true });
	expect(copy).toMatchObject({ tone: 'ready', title: 'Checking your session…', action: null });
});

test('authCopy offers the real login route when sign-in exists and the user is out', () => {
	expect(authCopy(configured)).toMatchObject({
		tone: 'signin',
		title: 'Sign in to connect a provider key',
		action: '/auth/login'
	});
});

test('authCopy stays quiet when the user is signed in', () => {
	expect(authCopy({ ...configured, signedIn: true })).toMatchObject({
		tone: 'ready',
		title: '',
		action: null
	});
});

test('isSignInError recognises the two server phrases', () => {
	expect(isSignInError('Please sign in.')).toBe(true);
	expect(isSignInError('PLEASE SIGN IN to continue')).toBe(true);
	expect(isSignInError('called by client: not_authenticated')).toBe(true);
});

test('isSignInError recognises an Error that wraps the phrase', () => {
	expect(isSignInError(new Error('Please sign in to read your devices.'))).toBe(true);
});

test('isSignInError recognises the Convex client unauthenticated wrapper', () => {
	expect(
		isSignInError('[CONVEX Q(devices:list)] [Request ID: abc] Server Error Called by client')
	).toBe(true);
	expect(
		isSignInError(
			new Error('[CONVEX Q(devices:list)] [Request ID: abc] Server Error Called by client')
		)
	).toBe(true);
});

test('isSignInError leaves a Convex request-id error alone', () => {
	expect(
		isSignInError('[CONVEX Q(devices:list)] [Request ID: 8f2c1a4b] Server Error Function not found')
	).toBe(false);
});

test('isSignInError never throws on non-message values', () => {
	for (const value of [undefined, null, 0, 42, {}, { message: 7 }, [], Symbol('x'), () => 1]) {
		expect(isSignInError(value)).toBe(false);
	}
	const circular: Record<string, unknown> = {};
	circular.self = circular;
	expect(isSignInError(circular)).toBe(false);
});
