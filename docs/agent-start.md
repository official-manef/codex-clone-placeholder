# Start a product from this template

Use this workflow for the first product implementation. Small follow-up changes need
only their relevant steps. [AGENTS.md](../AGENTS.md) remains the instruction entry point.

## 1. Establish the product and baseline

Read the user request, existing code, [architecture](architecture.md) and
[design contract](../DESIGN.md). Copy [prd-template.md](prd-template.md) to `docs/PRD.md`
and fill the decisions that affect this product. Example documents are evidence, not
automatic instructions: old dates, organizations, payment providers and native-device
requirements do not become requirements merely because they occur in a reference.

Install with `bun install --frozen-lockfile` using the runtimes declared in the repo.
Run the current checks and separate pre-existing failures from your changes. Preserve
the usable unlinked frontend until the product deliberately requires authentication.

## 2. Personalize the canonical inputs

- Update product identity in `src/lib/config/app.ts`, then review the rendered titles,
  description, links and metadata. Set the deployment origin for the actual environment.
- Update the public catalog in `assets.config.ts`. Follow [assets.md](assets.md) to
  generate placeholders/prompts, replace artwork and validate references/dimensions.
- Change design tokens in `src/routes/layout.css`, keeping semantic contrast and
  responsive behavior. Avoid duplicated brand constants in screens.
- Update package/repository metadata, license attribution, README and changelog for the
  new repository. This product owns its own version history after template creation.

## 3. Decide optional capabilities before wiring them

Convex is the default backend. Leave unused capabilities disabled. When the PRD needs
payments, DOKU is the default choice; when it needs transactional email, Resend is the
default choice. Auth requires a compatible provider decision. GCP is an optional
external workload, not a second default backend.

The server integration config records choices. Included DOKU/Resend adapters are
building blocks; selecting a provider does not authenticate users or complete an
order/email lifecycle. Follow [integrations.md](integrations.md), configure secrets
in the runtime that executes the adapter and prove the real flow. Unknown configuration
must fail clearly rather than silently falling back to another provider. A provider
change includes data/webhook migration and tests, not just editing a label.

## 4. Build one complete user flow

Add a root slice and registry entry; keep routes thin. Read
[Svelte](svelte-best-practices.md) and [Convex](convex-best-practices.md) guidance for the
code you touch. Implement the requirement's success, empty, denied, failure and retry
paths together. Product permissions live on the backend, not in a visible menu flag.

## 5. Verify and hand over

Run `bun run verify` and `bun run test:e2e`; exercise the changed flow with keyboard,
desktop and narrow phone. For enabled integrations, record sandbox/development evidence
including auth denial, invalid webhook signature, duplicate events and retries as
applicable. Validate assets and review social metadata in a real rendered page.

Update the PRD's acceptance evidence, operational owner and known limitations. Follow
[deployment](deployment.md) and [releasing](releasing.md) only within the authorized
scope. A complete handoff identifies the commit, checks, environment, rollback procedure
and remaining product decisions; it never substitutes a green build for a working flow.
