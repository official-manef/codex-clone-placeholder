# Svelte Convex Starter

[![CI](https://github.com/rahmanef63/template-svelte-convex-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/rahmanef63/template-svelte-convex-starter/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/package-json/v/rahmanef63/template-svelte-convex-starter)](CHANGELOG.md)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A **Svelte 5 Runes + SvelteKit + Bun + Convex** template with an adaptive application
shell, typed feature slices, shadcn-svelte components, and automated quality checks.
Start locally without an account or secrets. Connect your own Convex deployment when ready.

[Use this template](https://github.com/rahmanef63/template-svelte-convex-starter/generate)
· [Architecture](docs/architecture.md) · [Deployment](docs/deployment.md)
· [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

## Included

- Svelte 5 Runes enforced by the compiler and a legacy-syntax guard.
- TypeScript with one registry for app routes, labels, icons and screens.
- Root feature slices with thin SvelteKit routes and explicit import boundaries.
- Desktop navigation, mobile bottom dock, accessible workspace menu and safe-area layout.
- Tailwind CSS 4, source-owned shadcn-svelte components and content-aware layout primitives.
- Optional Convex connection with generated API types and a validated public status query.
- Prettier, ESLint, Vitest, Playwright and GitHub Actions; one Bun lockfile.
- Release metadata, contributor guidance, security policy and MIT license.

**Scope:** this is a foundation for building an application. Workspace switching and settings
are local UI examples. Authentication, user-owned CRUD, durable settings, billing and email
are not implemented. The backend schema starts empty; its status endpoint returns public
template metadata. See [architecture and auth boundaries](docs/architecture.md).

## Quick start

Install [Bun](https://bun.sh/docs/installation), Node.js matching `.node-version`, and Git.
`package.json` pins Bun and supported Node ranges. Bun manages packages and scripts;
Node supports tools with a Node entry point and the Vercel server runtime.

1. Click **Use this template → Create a new repository**.
2. Clone your new repository and open its directory.
3. Run:

```sh
bun install --frozen-lockfile
bun run dev
```

Open [localhost:5173](http://localhost:5173). No environment file is required.

To try this repository directly:

```sh
git clone https://github.com/rahmanef63/template-svelte-convex-starter.git
cd template-svelte-convex-starter
bun install --frozen-lockfile
bun run dev
```

| Route             | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `/`               | Starter entry page                        |
| `/apps/dashboard` | Stack versions and interaction examples   |
| `/apps/live-data` | Convex setup state or live backend status |
| `/apps/settings`  | Local form state and template version     |
| `/apps/<unknown>` | Real HTTP 404                             |

## Connect Convex

In a separate terminal, from the repository root:

```sh
bun run convex:dev
```

Follow the CLI prompts to select **this application's own development deployment**.
Keep the process running to synchronize backend changes. It writes local deployment
settings and generates `src/convex/_generated/`.

Set `PUBLIC_CONVEX_URL` in `.env.local` to the deployment URL printed by the CLI if it
was not added automatically. Restart the web server and open `/apps/live-data`.

```dotenv
PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

The status panel uses `api.starter.status`. Regenerate and commit generated files
after adding or renaming Convex functions:

```sh
bun run convex:codegen
```

Status is cached public build metadata, not a ticking clock or a database example.
Choose authentication before adding private data.

## Commands

| Command                      | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `bun run dev`                | Start the development server                             |
| `bun run check`              | Svelte/TypeScript, backend types and version consistency |
| `bun run lint`               | Formatting, ESLint and Svelte 5 syntax guard             |
| `bun run format`             | Format source and documentation                          |
| `bun run test`               | Run Vitest unit tests                                    |
| `bun run test:e2e`           | Build and exercise browser flows                         |
| `bun run build`              | Create Vercel-compatible production output               |
| `bun run preview`            | Preview the build locally                                |
| `bun run verify`             | Check → lint → unit tests → production build             |
| `bun run convex:dev`         | Link/watch the development backend                       |
| `bun run convex:codegen`     | Regenerate Convex API/data types                         |
| `bun run build:deploy`       | Verify, then deploy Convex and build the web app         |
| `bun run version:bump 0.4.0` | Update release metadata                                  |

Use `bun run test`, not bare `bun test`: Vitest's Vite/Svelte configuration is required.
`preview` is a local verification server, not the production hosting command.

## Project layout

```text
├── slices/
│   ├── app-shell/              # registry, shell and tests
│   ├── dashboard/              # feature with a public barrel
│   ├── live-data/
│   └── settings/
├── src/
│   ├── convex/                # schema, functions, generated API
│   ├── lib/components/ui/     # shadcn-svelte primitives
│   ├── lib/components/app-ui/ # shared layout/interaction components
│   └── routes/apps/[slug]/    # one dynamic route adapting the registry
├── tests/                     # browser acceptance tests
├── scripts/                   # Svelte syntax and version checks
├── docs/                      # architecture, deployment, releases
└── .github/                   # CI and contributor templates
```

`$features/*` resolves to `slices/*`. Add a feature slice, export its screen and
definition, then register it once in `slices/app-shell/registry.ts`.
[Read the architecture guide](docs/architecture.md).

## Verification

```sh
bun run verify
bunx playwright install chromium
bun run test:e2e
```

On a new Linux CI machine, use `bunx playwright install --with-deps chromium` for browser
system dependencies too. CI runs unlinked unit/browser checks without deployment credentials.
A live backend check is a separate validation after linking Convex.

## Deploy

The default adapter is **Vercel**. Import your generated repository, select SvelteKit,
use `bun install --frozen-lockfile` and `bun run verify`, and select the documented
Node runtime. No secrets are required to publish the unlinked scaffold.

For an application with Convex, use `bun run build:deploy`, a production deploy key
in Vercel's **Production** environment and a separate preview key for **Preview**.
[Follow the deployment guide](docs/deployment.md).

## Make it yours

- Change the package name, repository/homepage/issue links, branding and metadata.
- Keep the MIT notice when redistributing; review third-party dependency licenses.
- Add your auth provider before storing private data.
- Replace local settings with authenticated Convex data when persistence is needed.
- Enable branch protection requiring CI and GitHub private vulnerability reporting.
- Review [AGENTS.md](AGENTS.md), [UIUX.md](UIUX.md) and [CHECKLIST.md](CHECKLIST.md).

Generated repositories do not automatically receive template commits. Review upstream
releases and selectively apply changes on a branch.
See [releasing and upgrading](docs/releasing.md).

## References

Repository presentation and contributor tooling were informed by
[dzikrisyairozi/monorepo-fullstack-starter](https://github.com/dzikrisyairozi/monorepo-fullstack-starter).
This starter keeps one SvelteKit application and a Convex backend.

Implementation references: [SvelteKit](https://svelte.dev/docs/kit),
[Convex Svelte](https://docs.convex.dev/client/svelte/overview),
[Bun](https://bun.sh/docs), [shadcn-svelte](https://www.shadcn-svelte.com/docs).

Licensed under [MIT](LICENSE).
