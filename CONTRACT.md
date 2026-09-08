# Project contract

This is the maintained map of shared invariants and their authoritative files. Read it
at the start of each session. It records the current template, not a hypothetical client
application. Detailed implementation guidance lives in [architecture](docs/architecture.md).

## Current baseline

- One SvelteKit app uses Svelte 5 Runes and Bun. `bun.lock` is the only package lockfile.
- Convex is the default backend; its frontend connection is optional. A clean clone
  starts without credentials. The base schema is empty and status metadata is public.
- Feature UI lives in root `slices/<slug>/`; cross-slice imports use `$features/<slug>`
  barrels. Routes are thin framework adapters; the existing app page family uses one registry.
- Payments and email are disabled transport building blocks, preferring DOKU and Resend
  when selected. Auth/GCP/Cloudflare are implementation recipes; flags do not create those features.
- Workspace and settings examples are local UI state. They provide no identity, ownership
  or tenancy guarantee. Provider lifecycle acceptance remains product work.

## Authoritative inputs

| Concern                            | Source of truth                                                |
| ---------------------------------- | -------------------------------------------------------------- |
| Runtime and dependencies           | `package.json`, `bun.lock`, `.node-version`                    |
| Release identity                   | `version.json`; synchronize with `bun run version:bump`        |
| Public brand and metadata          | `src/lib/config/app.ts`, `src/lib/config/metadata.ts`          |
| Feature definitions and navigation | Slice definitions and `slices/app-shell/registry.ts`           |
| Theme and reusable UI              | `src/routes/layout.css`, `src/lib/components/`                 |
| Assets and generation inputs       | `assets.config.ts`; outputs follow [assets.md](docs/assets.md) |
| Backend schema and API             | `src/convex/`; `_generated/` is CLI-produced and committed     |
| Private integration selection      | `src/lib/server/integrations/config.ts`                        |
| Environment requirements           | `.env.example`, [consumer matrix](docs/environment.md)         |

Do not duplicate version pins, menus, brand constants or provider checks in other files.
Ordinary feature-local copy stays local; sharing configuration does not require turning
every value into a global option. Indexing needs `PUBLIC_SEO_INDEXABLE=true` and an
explicit origin; preview sites and demo app routes remain noindex. Metadata and crawler
documents share the SEO settings in `src/lib/config/metadata.ts`.

## Trust and runtime boundaries

Private reads, writes and actions authenticate and authorize ownership/tenant membership
on the backend. Validate arguments, results and business limits; bound growing reads.
Public metadata is an explicit exception, never a private-feature auth pattern.

Public config, assets, prompts and browser data contain no secrets. Immutable shared
configuration is allowed; mutable user/session state shared across server requests is not.
SvelteKit server modules and Convex actions use the environment of their executing runtime.
Convex imports cannot depend on SvelteKit aliases or environment modules. See the focused
[Svelte](docs/svelte-best-practices.md) and [Convex](docs/convex-best-practices.md) rules.

## Adapting this contract to a product

The base has no product PRD or client-specific deployment commitment. When creating a
product, add `docs/PRD.md` from [the template](docs/prd-template.md), then replace this
paragraph with its link and current scope. Record the product owner, deployment/operations
owner, enabled capabilities and acceptance evidence there; never invent names or credentials.
Keep product identity in its code config and runtime values in their environment.

## Maintenance and proof

Update this contract in the same change that moves an authoritative file, changes a
shared boundary/default, activates a capability or changes its ownership model. Update
the affected detailed guide too. Routine component edits need no contract rewrite.

Checks live in `package.json` and [CHECKLIST.md](CHECKLIST.md); evidence belongs to the
actual revision and environment tested. Keep transient progress in the task/PRD, not
as a second status ledger here. Use [agent-workflow.md](docs/agent-workflow.md) to resume
from current files and preserve clear, compact handoffs.
