# Deployment

The checked-in adapter targets Vercel. Bun manages packages; deployed server functions use
the adapter's supported Node runtime. This template does not configure a Bun HTTP server.

## Frontend scaffold or separately managed backend

Import your repository into Vercel:

| Setting         | Value                                     |
| --------------- | ----------------------------------------- |
| Framework       | SvelteKit                                 |
| Root directory  | repository root                           |
| Install command | `bun install --frozen-lockfile`           |
| Build command   | `bun run verify`                          |
| Node runtime    | Node 22, minimum patch in `.node-version` |

Leave `PUBLIC_CONVEX_URL` unset for the unlinked scaffold, or set it to an already-deployed
backend. This command does not deploy Convex. Install devDependencies: the gate needs them.

## Deploy web and Convex together

1. Create this application's Convex project and development/production deployments.
2. In Vercel **Production only**, set `CONVEX_DEPLOY_KEY` to its production deploy key.
3. Change Build Command to `bun run build:deploy`.
4. Deploy and verify `/apps/live-data` shows the expected backend version.

The command first runs the full offline gate, including a frontend build. Only after it
passes does `convex deploy` build the web app with `PUBLIC_CONVEX_URL` injected and deploy
the backend. The preliminary build catches frontend failures before remote changes.

Remove a manually configured public URL pointing to another deployment; the CLI supplies
the URL for the linked build. Function secrets belong on Convex (`bunx convex env set NAME value`).

## Preview isolation

Use a Convex **preview** deploy key in Vercel's **Preview** environment only for isolated
preview backends. Never expose production keys to previews or pull-request CI.
If isolated preview backends are unavailable, use a separate frontend-only preview project.

GitHub Actions receives no deployment credentials. It runs checks, not deployments.
Enable branch protection requiring CI before production merges.

## Environment map

| Variable              | Location                                         | Visibility                 |
| --------------------- | ------------------------------------------------ | -------------------------- |
| `PUBLIC_CONVEX_URL`   | Local `.env.local` or injected by Convex deploy  | Public browser URL         |
| `CONVEX_DEPLOYMENT`   | Local `.env.local`, written by CLI               | Local deployment selection |
| `CONVEX_DEPLOY_KEY`   | Scoped hosting secret environment                | Secret; never `PUBLIC_*`   |
| App API/provider keys | Convex for actions; server env for server routes | Secret                     |

## Verify and recover

Verify the provider reports the expected Git commit as ready. Visit the landing, dashboard,
settings and unknown routes. After linking, run `bunx convex run starter:status` against the
intended development deployment and verify its status panel in a browser. Confirm frontend
and backend versions match. Test auth/data writes separately when you add them.

Redeploy a known-good commit for frontend rollback. Review backend compatibility before
rolling back functions or schema. Data migrations need their own recovery plan; frontend
rollback does not restore database contents.

References: [SvelteKit adapter](https://svelte.dev/docs/kit/adapter-vercel),
[Convex on Vercel](https://docs.convex.dev/production/hosting/vercel).
