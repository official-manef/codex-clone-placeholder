# Project contract

This is the maintained map of shared invariants and their authoritative files. Read it
at the start of each session. It records the current template, not a hypothetical client
application. Detailed implementation guidance lives in [architecture](docs/architecture.md).

## Current baseline

- One SvelteKit app uses Svelte 5 Runes and Bun. `bun.lock` is the only package lockfile.
- Convex is the default backend; its frontend connection is optional. A clean clone
  starts without credentials. Status metadata is public; notes require backend ownership checks.
- Feature UI lives in root `slices/<slug>/`; cross-slice imports use `$features/<slug>`
  barrels. Routes are thin framework adapters; the existing app page family uses one registry.
- Payments and email are disabled transport building blocks, preferring DOKU and Resend
  when selected. Google auth/private notes, BYOK AI and remote MCP are implemented opt-ins. GCP service
  adapters and Cloudflare Workers remain recipes; Node hosting is implemented.
- Workspace and settings examples are local UI state. They provide no identity, ownership
  or tenancy guarantee. Google subjects own private notes. Payment/email lifecycle acceptance
  remains product work; provider credentials and product deployment need tenant-specific setup.

## Authoritative inputs

| Concern                             | Source of truth                                                         |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Runtime and dependencies            | `package.json`, `bun.lock`, `.node-version`                             |
| Release identity                    | `version.json`; synchronize with `bun run version:bump`                 |
| Public brand and metadata           | `src/lib/config/app.ts`, `src/lib/config/metadata.ts`                   |
| Feature definitions and navigation  | Slice definitions and `slices/app-shell/registry.ts`                    |
| Theme and reusable UI               | `src/routes/layout.css`, `src/lib/components/`                          |
| Assets and generation inputs        | `assets.config.ts`; outputs follow [assets.md](docs/assets.md)          |
| Backend schema and API              | `src/convex/`; `_generated/` is CLI-produced and committed              |
| Private integration selection       | `src/lib/server/integrations/config.ts`                                 |
| Authentication                      | `src/lib/server/auth/`, `src/convex/auth.config.ts`                     |
| AI/MCP selection and request access | `src/lib/server/ai/`, `src/lib/server/mcp/`, `src/lib/server/access.ts` |
| Environment requirements            | `.env.example`, [consumer matrix](docs/environment.md)                  |

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
The bounded burst limiter is a documented exception for hashed counters only, not a session
or credential store; multi-instance deployments need an external rate limit.
SvelteKit server modules and Convex actions use the environment of their executing runtime.
Convex imports cannot depend on SvelteKit aliases or environment modules. BYOK keys and
chat history stay in current request/tab memory. Tool output is untrusted data; MCP calls
require configured endpoint/tool allowlists and explicit review, never automatic model execution. See the focused
[Svelte](docs/svelte-best-practices.md) and [Convex](docs/convex-best-practices.md) rules.

## This product

This repository is the **placeholder workspace shell**: a Codex-style assistant workspace
rebuilt on the starter contract, with every visible string kept as a token so the
structure can be reviewed before product copy exists.

- Product scope and acceptance: [docs/PRD.md](docs/PRD.md)
- Execution order and slice map: [docs/implementation-plan.md](docs/implementation-plan.md)
- Visual and interaction contract: [docs/ui-spec.md](docs/ui-spec.md)
- State ownership, transitions, persistence, races: [docs/state-model.md](docs/state-model.md)
- Copy token contract: [docs/placeholder-copy.md](docs/placeholder-copy.md)
- Cloud start: [docs/cloud-handoff.md](docs/cloud-handoff.md)
- Reference prototype and classification sources: `docs/reference/`
- UI/UX pointer: [UIUX.md](UIUX.md)

Enabled capabilities: none. Auth, Convex persistence, AI, MCP, payments and email remain
available in the starter but are **not** part of this product's MVP. The shell must boot
and be reviewable without credentials.

Slices planned for the product: `app-shell`, `workspace`, `composer`, `workbench`,
`capabilities`, `settings-surface`, plus the shared `placeholders` resolver. The starter
demo slices (`dashboard`, `live-data`, `notes`, `assistant`, `settings`) are removed in the
first implementation step rather than left as fake features.

Product identity is intentionally unset in `src/lib/config/app.ts` beyond a neutral name.
Filling it in is a product decision recorded in the PRD's open decisions, not an
implementation detail.

## Maintenance and proof

Update this contract in the same change that moves an authoritative file, changes a
shared boundary/default, activates a capability or changes its ownership model. Update
the affected detailed guide too. Routine component edits need no contract rewrite.

Checks live in `package.json` and [CHECKLIST.md](CHECKLIST.md); evidence belongs to the
actual revision and environment tested. Keep transient progress in the task/PRD, not
as a second status ledger here. Use [agent-workflow.md](docs/agent-workflow.md) to resume
from current files and preserve clear, compact handoffs.
