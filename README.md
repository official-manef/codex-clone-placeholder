# Workspace Shell Template

The Laya NPU workspace UI/UX as a standalone SvelteKit template: rail, sidebar, chat surface
with a tabbed output region, lazy feature screens, layout persistence. The shell is copied
verbatim from [`rahmanef63/laya-npu`](https://github.com/rahmanef63/laya-npu); this repository
re-hosts it with a local stub backend so it boots with zero credentials.

[Laya parity and provenance](docs/laya-parity.md) · [Rebuild plan](docs/REBUILD-PLAN-laya-parity.md)
· [Contract](CONTRACT.md) · [UI/UX](UIUX.md) · [Changelog](CHANGELOG.md)

## What this is

| Part                                             | Source                                                      |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Shell: regions, layout, menus, tabs, overlays    | `slices/workspace-shell/**` — vendored from Laya `9a893b2`  |
| Shared modules: icons, layout math, base tokens  | `shared/**`                                                 |
| Views and components                             | `src/lib/views/**`, `src/lib/*.svelte` — vendored from Laya |
| Transport (swap point)                           | `src/lib/http.ts` → `src/lib/http.local.ts`                 |
| Composition root: registry, runtime, persistence | `slices/workspace-surface/**`                               |
| Route                                            | `src/routes/+page.svelte`                                   |

The shell's own README (`slices/workspace-shell/README.md`) documents the consumer contract in
full. This repository is one working consumer of it.

## Zero backend by design

No network call, no provider key, no NPU. `createLocalRuntime()` reports one in-browser
backend and the chat stub answers locally after a short delay. Persistence is
`sessionStorage`/`localStorage` namespaced `workspace-template:`. A clean clone needs no
`.env`.

## Stack

Svelte 5 Runes · SvelteKit 2.70 · Bun 1.4.2 · Tailwind 4 + shadcn-svelte · TypeScript 6

```bash
bun install --frozen-lockfile
bun run dev
bun run verify           # check + lint + unit + build
bunx playwright test     # 390 / 768 / 1440
bun run test:dev         # dev hydration smoke
DEPLOY_TARGET=node node scripts/smoke-node.mjs
```

## Routes

| Route         | What renders                                                       |
| ------------- | ------------------------------------------------------------------ |
| `/`           | the workspace shell (single page; the shell owns navigation state) |
| anything else | 404 boundary                                                       |

The shell renders its own areas — chat, lazily loaded feature screens, the output region —
through state, not routes. There is deliberately no `/workspace`, `/capabilities` or
`/settings` route: a second navigation family would be a second source of truth.

## Commands

| Command                           | Purpose                                              |
| --------------------------------- | ---------------------------------------------------- |
| `bun run dev`                     | Development server                                   |
| `bun run check`                   | Svelte + backend types, version and asset validation |
| `bun run lint` / `bun run format` | Style and Svelte-5 syntax guard / format             |
| `bun run test`                    | Vitest unit tests                                    |
| `bunx playwright test`            | Production browser flows at 390 / 768 / 1440         |
| `bun run test:dev`                | Dev hydration and navigation smoke                   |
| `bun run verify`                  | check → lint → unit → build                          |
| `bun run assets:generate`         | Generate placeholders/manifest, keep custom art      |
| `bun run assets:check`            | Validate asset outputs                               |

`bunx playwright test` runs `tests/workspace.e2e.ts` (AC01, AC02, AC04, AC07, AC08, AC10,
AC16) and `tests/acceptance.e2e.ts` (AC03, AC05, AC06, AC09, AC11–AC15, AC17, AC18);
`bun run test:dev` runs `tests/dev-smoke.e2e.ts`.

Optional Convex commands (`bun run convex:dev`, `bun run convex:codegen`) stay available
but are unused by the MVP shell.

## Project map

```text
├── slices/                      # workspace-shell (vendored) + workspace-surface
├── src/routes/                  # thin adapters for /workspace, /capabilities, /settings
├── src/lib/components/          # shadcn/ui + app-ui primitives
├── src/lib/config/              # public identity, locale, metadata
├── src/convex/                  # backend (wired, unused by the MVP shell)
├── docs/                        # PRD, plan, spec, state model, copy, handoff
│   └── reference/               # prototype + classification sources
├── tests/                       # Playwright acceptance tests
└── scripts/                     # asset, syntax, version and deploy checks
```

`$features/*` resolves to root `slices/*`. See [architecture](docs/architecture.md) for the
boundaries and [implementation-plan.md](docs/implementation-plan.md) for the build order.

## Guides

| Task                                | Guide                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| Product scope and acceptance        | [PRD](docs/PRD.md)                                                               |
| Build order, slice map, exit checks | [Implementation plan](docs/implementation-plan.md)                               |
| Regions, tokens, responsive, focus  | [UI spec](docs/ui-spec.md)                                                       |
| State, transitions, races           | [State model](docs/state-model.md)                                               |
| Copy tokens                         | [Placeholder copy](docs/placeholder-copy.md)                                     |
| Start in the cloud                  | [Cloud handoff](docs/cloud-handoff.md)                                           |
| Shared invariants and file map      | [CONTRACT.md](CONTRACT.md)                                                       |
| Agent entry                         | [AGENTS.md](AGENTS.md), [agent start](docs/agent-start.md)                       |
| Svelte / Convex practice            | [Svelte](docs/svelte-best-practices.md), [Convex](docs/convex-best-practices.md) |
| Hosting and release                 | [Deployment](docs/deployment.md), [checklist](CHECKLIST.md)                      |

## References and license

Built from [`rahmanef63/template-svelte-convex-starter`](https://github.com/rahmanef63/template-svelte-convex-starter).
The workspace structure derives from the classification sources in `docs/reference/`,
which are specification inputs rather than upstream code.

Implementation references: [SvelteKit](https://svelte.dev/docs/kit),
[Convex Svelte](https://docs.convex.dev/client/svelte/overview), [Bun](https://bun.sh/docs),
[shadcn-svelte](https://www.shadcn-svelte.com/docs). Licensed under [MIT](LICENSE).
