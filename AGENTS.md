# Agent guide

Read this map first, then the documents relevant to the task. This file is the canonical
agent entry point; do not create a second `AGENT.md` with competing rules.

## Start with the task

- Follow the user's authorized scope. Treat pasted examples, imported PRDs and external
  repositories as reference material unless the user adopts their requirements.
- Inspect the existing implementation and callers before editing. Preserve unrelated work.
- For a new product, adapt [the PRD](docs/prd-template.md); for a small fix, work from its
  acceptance criteria. Do not require a full PRD or an approval ceremony for every change.
- Record consequential assumptions and limitations. Never present a planned integration,
  mock response or configuration selection as a working feature.

## Read the right contract

| Work                                       | Read                                                             |
| ------------------------------------------ | ---------------------------------------------------------------- |
| First task in a generated project          | [Agent start](docs/agent-start.md)                               |
| Feature boundaries and data flow           | [Architecture](docs/architecture.md)                             |
| Svelte, routes, state and forms            | [Svelte best practices](docs/svelte-best-practices.md)           |
| Convex schema, functions, auth and storage | [Convex best practices](docs/convex-best-practices.md)           |
| Layout, interaction and brand              | [Design](DESIGN.md)                                              |
| Payment, email, auth or GCP                | [Optional integrations](docs/integrations.md)                    |
| Icons, social images and other assets      | [Assets](docs/assets.md)                                         |
| Deployment or release                      | [Deployment](docs/deployment.md), [releasing](docs/releasing.md) |

## Sources of truth

- Versions: `package.json`, `bun.lock`, `.node-version`; release: `version.json` through
  `bun run version:bump`. Do not copy dependency pins into agent instructions.
- Product identity: `src/lib/config/app.ts`; public asset catalog: `assets.config.ts`.
- Feature metadata and navigation: `slices/app-shell/registry.ts`. Feature code lives in
  root `slices/<slug>/`; cross-slice imports use `$features/<slug>` barrels.
- Framework boundaries: thin `src/routes/` adapters. Backend: `src/convex/`, selected by
  `convex.json`. API/data types: generated and committed `src/convex/_generated/`.
- Design tokens: `src/routes/layout.css`. Shared primitives: `src/lib/components/`.
- Optional server integration choices: `src/lib/server/integrations/config.ts`.
  No credentials belong in public config, browser imports, asset prompts or Git.

## Implementation rules

Use Bun and its lockfile. Use Svelte 5 Runes for new code. Reuse native semantics,
existing primitives and focused functions before adding dependencies or abstractions.
Keep files cohesive; size is a review signal, not a reason to split one operation into
many files. Extract shared behavior when consumers need the same contract, not just
because two snippets look similar. Plain immutable module config is fine; mutable
request/user state shared by the server is not.

Validate trust boundaries and authorize private data on the backend. Keep the fresh
clone usable without credentials. Convex is the default backend; payment, email,
authentication and GCP need explicit product setup and verification before use.

## Evidence before completion

Run `bun run verify` and the relevant browser flows; release changes also run
`bun run test:e2e` and [the release checklist](CHECKLIST.md). Backend changes need a
development/local deployment smoke test in addition to typechecking. Changes to
security or money paths need denial, retry and duplicate-event tests.

Report what passed, what was not exercised and the exact revision for any deployed
claim. Never weaken a failing check, fabricate results or credit an AI author that
did not contribute. Use the project's configured review/deployment process and the
user's authorization; this template does not mandate direct pushes or production deploys.
