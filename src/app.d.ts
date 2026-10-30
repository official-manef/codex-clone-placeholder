// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			id?: string;
		}
		interface Locals {
			requestId: string;
		}
		interface PageData {
			meta?: { title?: string; description?: string; indexable?: boolean };
			// Returned by `src/routes/+layout.server.ts`; `enabled` is whether `/auth/login` exists.
			auth?: {
				enabled: boolean;
				session: {
					subject: string;
					tokenIdentifier: string;
					email?: string;
					expiresAt: number;
				} | null;
			};
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
