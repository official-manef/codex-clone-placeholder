# Placeholder Workspace Shell

Codex-style assistant workspace rebuilt as a real SvelteKit application on the
`template-svelte-convex-starter` contract. Every visible string is a placeholder token, so
the shell can be reviewed on structure alone before product copy exists.

[Product requirements](docs/PRD.md) · [Implementation plan](docs/implementation-plan.md)
· [UI spec](docs/ui-spec.md) · [State model](docs/state-model.md)
· [Placeholder copy](docs/placeholder-copy.md) · [Cloud handoff](docs/cloud-handoff.md)
· [Contract](CONTRACT.md) · [Changelog](CHANGELOG.md)

## What this is

Six compositions rendered from one state object: unstarted workspace, populated
conversation with a tabbed work region, anchored destination overflow, capability catalog
and categorized configuration. Desktop, tablet and phone are all first-class.

The reference prototype lives at `docs/reference/workspace-prototype.html`; the two
classification sources it was derived from sit beside it. They are specification inputs,
not code to port.

## Scope

In scope: shell, rail, sidebar, primary and secondary regions, composer mechanics, tab
handling, capability catalog, configuration surface, responsive composition, and the
placeholder resolver.

Not in scope: auth, backend persistence, AI calls, upload, search, payments, email,
analytics, marketing pages, and any real product copy.

## Stack

Svelte 5 Runes · SvelteKit 2.70 · Bun 1.4.2 · Tailwind 4 + shadcn-svelte · TypeScript 6 ·
Convex 1.45 (wired, unused by the MVP shell)

```bash
bun install --frozen-lockfile
bun run dev        # http://localhost:5173
bun run verify     # check + lint + unit + build
bunx playwright test
```

No `.env` is required. The clean clone boots without credentials and with every optional
capability disabled.

## Slices

| Slice              | Owns                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `app-shell`        | Outer chrome, global rail, sidebar host, overlay host, composition |
| `workspace`        | Unstarted and populated primary surfaces, timeline, context header |
| `composer`         | Draft, attachments, submit guard, access and execution controls    |
| `workbench`        | Secondary region, tabs, resource toolbar, splitter                 |
| `capabilities`     | Installed list, detail pane, connection state                      |
| `settings-surface` | Category sidebar, search, typed field rows                         |
| `placeholders`     | Token dictionary and `t()` resolver                                |

Cross-slice imports go through the slice barrel (`$features/<slug>`). Routes only adapt
params and render.

## Routes

| Route                  | Composition                                       |
| ---------------------- | ------------------------------------------------- |
| `/`                    | redirects to `/workspace`                         |
| `/workspace`           | C2/C1 — unstarted or populated primary region     |
| `/workspace/[chatId]`  | populated conversation, validated by the shell    |
| `/capabilities`        | C5 — catalog list                                 |
| `/capabilities/[slug]` | C5 — capability detail, validated by registry     |
| `/settings/[section]`  | C6 — configuration surface, validated by registry |
| unknown slug or id     | 404 boundary with a recovery link                 |

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

Optional Convex commands (`bun run convex:dev`, `bun run convex:codegen`) stay available
but are unused by the MVP shell.

## Project map

```text
├── slices/                      # app-shell, workspace, composer, workbench,
│                                # capabilities, settings-surface, placeholders
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
