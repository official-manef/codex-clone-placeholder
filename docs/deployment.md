# Deployment

The checked-in adapter targets Vercel. Bun manages packages and scripts; deployed
server functions use the adapter's supported Node runtime. Other hosts require their
own compatible adapter and verification; the template does not deploy a Bun HTTP server.

## Frontend or separately managed backend

Import the generated repository into Vercel:

| Setting         | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Framework       | SvelteKit                                                                    |
| Root directory  | Repository root                                                              |
| Install command | `bun install --frozen-lockfile`                                              |
| Build command   | `bun run verify`                                                             |
| Node runtime    | Supported Node major, with minimum patch in `.node-version` / `engines.node` |

Install devDependencies: verification and asset tooling need them. Leave
`PUBLIC_CONVEX_URL` unset for the unlinked scaffold or select an already-deployed backend.
This build command does not deploy Convex. No credentials are needed for the unlinked app.

Set `PUBLIC_SITE_URL` in **Production** to the final HTTPS origin, without path, query,
fragment or credentials. It produces canonical and absolute social-image URLs. Leave it
unset on previews to omit canonical tags. `PUBLIC_SEO_INDEXABLE` defaults false;
set it true only in Production when the public site should be indexed. Keep it false
on previews even if they have a canonical origin. The `/apps/*` examples
remain noindex even with an origin; a public product page must make its own deliberate
indexability decision. Metadata directives are not access control.

Commit regenerated artwork, prompts and manifests before building. `bun run verify`
validates asset freshness; it does not generate final artwork or repair stale config.
See [the asset workflow](assets.md).

## Deploy web and Convex together

1. Create the application's own Convex project with development and production deployments.
2. Set `CONVEX_DEPLOY_KEY` in Vercel **Production only** to that deployment's production key.
3. Set the Build Command to `bun run build:deploy`.
4. Deploy and verify the intended frontend/backend revision and real configured flow.

The command runs the full offline gate, including a frontend build, before contacting
Convex. Then `convex deploy` runs the linked web build with `PUBLIC_CONVEX_URL` injected.
Remove a manually configured URL pointing at a different deployment; the CLI supplies
the URL for this build. A passing build does not validate auth or provider configuration.

## Preview isolation

Use a Convex **preview** deploy key in Vercel **Preview** only for isolated preview
backends. The deploy guard requires a preview key in Vercel Preview and a production
key in Production, rejecting mismatches before checks or remote changes. If isolated
preview backends are unavailable, use a separate frontend-only preview project.

GitHub Actions receives no deployment credentials and runs checks only. Keep production
provider keys, backend keys and private data out of preview environments. Apply the
repository's review/branch policy before production updates.

## Environment ownership

| Values                              | Configure in                                   | Visibility / behavior                              |
| ----------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| `PUBLIC_SITE_URL`                   | Frontend host; optionally local `.env.local`   | Public HTTPS canonical origin; empty means noindex |
| `PUBLIC_CONVEX_URL`                 | Local `.env.local` or injected linked build    | Public deployment URL                              |
| `CONVEX_DEPLOYMENT`                 | Local `.env.local`, written by CLI             | Local CLI deployment selection                     |
| `CONVEX_DEPLOY_KEY`                 | Scoped hosting secret environment              | Deployment secret; never `PUBLIC_*`                |
| Payment/email flags and credentials | Runtime executing the adapter                  | Private; disabled by default                       |
| Auth/GCP/Cloudflare settings        | Runtime of the implemented product integration | Flags alone do not implement these capabilities    |

For SvelteKit server execution, configure the frontend host's private environment. For
Convex actions, set secrets on the intended Convex deployment; frontend host variables
do not automatically transfer there. Consult `.env.example` for names and
[the environment consumer matrix](environment.md) and [integrations](integrations.md)
for provider settings, optional SEO metadata and activation requirements.
Never commit live values or expose resolved private config through page data.

DOKU/Resend transports are not safe public endpoints by themselves. Complete authorization,
durable operation records, callback handling and sandbox lifecycle checks before enabling
them for product users. Auth and GCP require implementation before their resolver accepts
enabled use. No live provider lifecycle is established by the template's mock tests.

## Verify and recover

Verify that the host reports the expected commit as ready. Exercise the landing, main
app routes, unknown routes, keyboard/mobile behavior and metadata on the actual domain.
Confirm that all sharing images resolve and that previews remain noindex.

For changed Convex functions, invoke them against the intended development/local
deployment and inspect real results before releasing. After deployment, verify the
frontend is connected to the intended backend and both expose the expected version.
Product auth/data/provider flows need their own acceptance evidence.

Redeploy a known-good commit for frontend rollback. Check backend compatibility before
rolling back functions or schema. Data migrations need a separate recovery plan;
frontend rollback does not restore data or undo external payments/emails. Preserve
operation IDs and reconcile uncertain provider outcomes during incidents.

References: [SvelteKit Vercel adapter](https://svelte.dev/docs/kit/adapter-vercel),
[Convex on Vercel](https://docs.convex.dev/production/hosting/vercel).
