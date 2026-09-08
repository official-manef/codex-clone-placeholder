# Architecture

One SvelteKit application owns the web experience. Convex owns backend functions and data.
Root feature slices remain independent of the route directory; no monorepo runner is needed.

```text
/apps/[slug] → route load validates slug → registry resolves screen
            → shell renders feature → convex-svelte subscription
            → generated api reference → validated Convex function
```

| Concern                              | Source of truth                                               |
| ------------------------------------ | ------------------------------------------------------------- |
| Feature definitions and navigation   | `slices/app-shell/registry.ts`                                |
| Feature UI and local state           | `slices/<slug>/`                                              |
| Route loading, HTTP status, metadata | `src/routes/`                                                 |
| Schema and backend authorization     | `src/convex/`                                                 |
| Backend API/data types               | `src/convex/_generated/` (generated, committed)               |
| UI primitives and layout             | `src/lib/components/`                                         |
| Design tokens                        | `src/routes/layout.css`                                       |
| Dependency/runtime versions          | `package.json`, `bun.lock`, `.node-version`                   |
| Release version                      | `version.json`; version command synchronizes package metadata |

## Add a feature

1. Create `slices/<slug>/components/<slug>-screen.svelte` using Svelte 5 Runes.
2. Export its screen and definition from `slices/<slug>/index.ts`; use an existing slice as an example.
3. Add one entry to `APP_REGISTRY`; do not duplicate navigation or create a copied route.
4. For persisted data, add the Convex schema/functions and regenerate types.
5. Test behavior, error states and keyboard/mobile access. Run the repository gates.

Cross-slice imports use `$features/<slug>` barrels. Framework-only server work belongs
in server routes or `$lib/server`; never import secrets into browser modules.
Prefer local state until a second real consumer needs shared state.

## Convex boundary

`convex.json` selects `src/convex/`. The root layout initializes Convex only when
`PUBLIC_CONVEX_URL` is set. Subscriptions are already reactive.
Commit generated code so a new clone can typecheck before linking a deployment.

`starter.status` intentionally reads no user data. It returns public version metadata
with argument and return validators. There are no mutations or user tables in the base.

For every user-owned function you add:

- Authenticate and verify ownership on the backend.
- Validate arguments and results with `v.*`; bound user input.
- Derive IDs/documents from codegen; avoid duplicate frontend data interfaces.
- Index read paths and paginate or bound growing results.
- Use internal functions for callbacks browsers should not invoke.
- Return safe errors and keep external service calls inside actions.

## Authentication is a product choice

No auth provider is preconfigured. The workspace menu and settings are local examples,
not a multi-tenant access model. Select auth before implementing private CRUD.
`convex-svelte` provides `setupAuth` and `useAuth`; provider adapters may be community-maintained.
Review [Convex Svelte auth guidance](https://docs.convex.dev/client/svelte/authentication)
and test sign-in, refresh, sign-out, unauthenticated rejection and cross-user isolation.

For authenticated SSR, use the documented integration with request-scoped credentials.
Never put a user's token in a shared server singleton.
