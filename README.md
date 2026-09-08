# Svelte Convex Starter

[![CI](https://github.com/rahmanef63/template-svelte-convex-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/rahmanef63/template-svelte-convex-starter/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/package-json/v/rahmanef63/template-svelte-convex-starter)](CHANGELOG.md)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A **Svelte 5 Runes + SvelteKit + Bun + Convex** template with typed feature slices,
an adaptive application shell, shared brand configuration and practical agent guidance.
Start without credentials; connect your own Convex deployment when the product needs data.

[Use this template](https://github.com/rahmanef63/template-svelte-convex-starter/generate)
· [Agent start](docs/agent-start.md) · [PRD template](docs/prd-template.md)
· [Deployment](docs/deployment.md) · [Changelog](CHANGELOG.md)

## What ships

- Svelte 5 Runes enforced by the compiler and a legacy-syntax guard.
- Root feature slices, thin routes and one typed registry for navigation and page metadata.
- Desktop rail, mobile dock, accessible menu and shared shadcn-svelte/app UI primitives.
- Public brand configuration, canonical/social metadata and eight replaceable asset placeholders.
- Asset generation/check commands and brand-aware prompts for final artwork.
- Optional Convex connection, committed generated types and a validated public status query.
- Disabled server transport adapters for basic DOKU Checkout/signature verification and Resend email.
- Prettier, ESLint, Vitest, Playwright, GitHub Actions, version checks and MIT licensing.

| Capability              | Included                                                               | Product work still required                                                                    |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Backend                 | Convex status query; empty schema; frontend works unlinked             | Product schema, authorized reads/writes and real deployment                                    |
| Payments                | DOKU transport and signature utility; mocked HTTP tests                | Orders, webhook route, deduplication, fulfillment, reconciliation and merchant sandbox testing |
| Email                   | Resend send transport with required idempotency key; mocked HTTP tests | Authorized triggers, sender setup, durable delivery/outbox handling and real delivery testing  |
| Auth / GCP / Cloudflare | Integration recipes and explicit unsupported resolver states           | Select and implement a compatible auth provider or a specific cloud service                    |

Payments, email, authentication, GCP and Cloudflare are **disabled by default**. Provider selection
is not feature activation. Auth/cloud resolvers reject enabled settings when called until
their application integration exists. Workspace switching and settings are local examples,
not accounts, tenancy or durable preferences. No complete provider sandbox lifecycle has
been exercised by this template. [Read the integration boundaries](docs/integrations.md).

## Quick start

Install [Bun](https://bun.sh/docs/installation), Node matching `.node-version`, and Git.
`package.json` declares the Bun version and supported Node ranges. Bun manages packages
and scripts; some tools and the default Vercel server runtime use Node.

1. Click **Use this template → Create a new repository**.
2. Clone the new repository and open its directory.
3. Run:

```sh
bun install --frozen-lockfile
bun run dev
```

Open [localhost:5173](http://localhost:5173). No environment file is required.

| Route             | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `/`               | Starter entry page                        |
| `/apps/dashboard` | Stack versions and interaction examples   |
| `/apps/live-data` | Convex setup state or live backend status |
| `/apps/settings`  | Local form state and template version     |
| `/apps/<unknown>` | Real HTTP 404                             |

## Make it yours

1. Adapt [the PRD template](docs/prd-template.md) to the actual product and acceptance criteria.
2. Edit `src/lib/config/app.ts` for name, copy, locale and public brand identity;
   use `src/routes/layout.css` for UI design tokens.
3. Edit `assets.config.ts`, then run:

```sh
bun run assets:generate
bun run assets:prompts
bun run assets:check
```

These commands create deterministic placeholders and a web manifest, generate
[agent prompts](docs/assets-prompts.md), and validate the committed files. They do not
call an AI service. Mark finished artwork `custom` before replacing a placeholder so
regeneration preserves it. [Follow the asset workflow](docs/assets.md).

4. Set `PUBLIC_SITE_URL` to the deployed HTTPS origin, without a path. It supplies
   canonical and absolute sharing URLs. With no origin, canonical tags are omitted and
   pages are `noindex`. Set `PUBLIC_SEO_INDEXABLE=true` only for public production indexing;
   keep previews false. App examples remain `noindex`. Google/Bing verification and Twitter/X
   attribution are optional. See the [environment consumer matrix](docs/environment.md).
5. Update package/repository links, README and attribution. Keep required MIT notices.
   Choose optional services only when the PRD needs them; follow [integrations.md](docs/integrations.md).

Public config and asset prompts must never contain credentials or private user data.
The web manifest supplies install metadata and icons; offline behavior is not included.

## Connect Convex

From a second terminal at the repository root:

```sh
bun run convex:dev
```

Select **this application's own development deployment** and keep the process running.
It writes local deployment settings and generates `src/convex/_generated/`. Set the
printed deployment URL as `PUBLIC_CONVEX_URL` in `.env.local` if the CLI did not add it:

```dotenv
PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Restart the web server and open `/apps/live-data`. The status query returns public
build metadata; it is not a database or authentication example. After changing backend
functions, run `bun run convex:codegen` and commit the generated types. Read
[Convex best practices](docs/convex-best-practices.md) before adding private data.

## Commands and checks

| Command                                           | Purpose                                                        |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `bun run dev`                                     | Start development server                                       |
| `bun run check`                                   | Svelte/backend types, version consistency and asset validation |
| `bun run lint` / `bun run format`                 | Check style and syntax / format files                          |
| `bun run test`                                    | Run Vitest unit tests                                          |
| `bun run test:e2e`                                | Build and exercise browser flows                               |
| `bun run build` / `bun run preview`               | Build production output / preview it locally                   |
| `bun run verify`                                  | Check → lint → unit tests → production build                   |
| `bun run assets:generate`                         | Generate placeholders/manifests while preserving custom assets |
| `bun run assets:prompts` / `bun run assets:check` | Generate artwork briefs / validate asset outputs               |
| `bun run convex:dev` / `bun run convex:codegen`   | Link/watch backend / regenerate API types                      |
| `bun run build:deploy`                            | Verify, then deploy Convex and build the web app               |
| `bun run version:bump <MAJOR.MINOR.PATCH>`        | Synchronize release metadata                                   |

Use `bun run test`, not bare `bun test`, because Vitest's Vite/Svelte configuration is
required. Before releasing:

```sh
bun run verify
bunx playwright install chromium
bun run test:e2e
```

On a new Linux CI machine use `bunx playwright install --with-deps chromium`. GitHub CI
tests the unlinked app without deployment credentials; live backend/provider checks are
separate. On Windows, Vercel output needs symlink permission: if builds fail with
`EPERM ... symlink`, use WSL/Linux or a Windows environment with symlink support.

## Project map

```text
├── assets.config.ts             # public asset catalog and generation briefs
├── slices/                      # app shell/registry and feature barrels
├── src/
│   ├── convex/                  # schema, functions and generated API
│   ├── lib/config/              # public app identity and metadata
│   ├── lib/server/integrations/ # private config and provider transports
│   ├── lib/components/          # UI and app layout primitives
│   └── routes/apps/[slug]/      # registry-backed route adapter
├── static/brand/                # committed placeholder/custom artwork
├── scripts/                     # asset, syntax, version and deploy checks
├── tests/                       # browser acceptance tests
├── docs/                        # product, agent and operational guides
└── .github/                     # CI and contributor templates
```

`$features/*` resolves to root `slices/*`. Add a slice, export its screen/definition,
then register it once. [Architecture](docs/architecture.md) explains the boundaries.

## Guides

| Task                                    | Guide                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Agent instructions / first product task | [AGENTS.md](AGENTS.md), [CONTRACT.md](CONTRACT.md), [agent start](docs/agent-start.md)      |
| Efficient implementation and context    | [Ponytail, Caveman and optional RTK](docs/agent-workflow.md)                                |
| Requirements and acceptance             | [PRD template](docs/prd-template.md)                                                        |
| UI, accessibility and interaction       | [DESIGN.md](DESIGN.md)                                                                      |
| Svelte / Convex implementation          | [Svelte](docs/svelte-best-practices.md), [Convex](docs/convex-best-practices.md)            |
| Branding and generated artwork          | [Assets](docs/assets.md), [prompts](docs/assets-prompts.md)                                 |
| Payment, email, auth and cloud          | [Optional integrations](docs/integrations.md), [environment](docs/environment.md)           |
| Hosting, release and upgrades           | [Deployment](docs/deployment.md), [releasing](docs/releasing.md), [checklist](CHECKLIST.md) |
| Contributions and security              | [Contributing](CONTRIBUTING.md), [security policy](SECURITY.md)                             |

The default adapter targets Vercel. Use `bun run verify` for a frontend build or
`bun run build:deploy` with correctly scoped Convex keys for a linked deployment.
Generated repositories have independent histories; review upstream release notes and
selectively port changes instead of replacing customized product code.

## References and license

Repository presentation and contributor tooling were informed by
[dzikrisyairozi/monorepo-fullstack-starter](https://github.com/dzikrisyairozi/monorepo-fullstack-starter).
This template uses one SvelteKit app and Convex; it does not reproduce that repository's stack.

Implementation references: [SvelteKit](https://svelte.dev/docs/kit),
[Convex Svelte](https://docs.convex.dev/client/svelte/overview),
[Bun](https://bun.sh/docs), [shadcn-svelte](https://www.shadcn-svelte.com/docs).
Licensed under [MIT](LICENSE).
