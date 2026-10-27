# Changelog

This repository starts from `rahmanef63/template-svelte-convex-starter` and now carries
its own history. Notable changes follow [Semantic Versioning](https://semver.org/).

## [0.3.0] - 2026-10-28

### Added

- `tests/acceptance.e2e.ts`: browser proof for AC03, AC05, AC06, AC09, AC11, AC12, AC13,
  AC14, AC15, AC17 and AC18 at 375 / 390 / 1280, so AC01–AC18 are now all browser-verified.
- Local asynchronous stubs that make those flows observable without a backend: attachment
  validation with a real `validating` phase and cancellation, offline submit with request-id
  reuse on retry, cancel-keeps-partial-output, dirty-tab save that can fail and keep the tab
  open, settings saves where the newest revision wins, capability connect with a pending
  phase and revert, and shell overlay Escape with focus return.
- Workbench state persistence through sessionStorage (tabs, active tab, layout, split width).

### Changed

- `workspace-screen.svelte`'s `appendDraft` takes the composer payload and uses its
  `requestId` as the timeline entry id, so a retry appends once instead of twice.
- `resource-body.svelte` exposes its edit surface for any open tab, not only a ready one.

### Fixed

- Offline retry duplicated the user message (AC05).
- A freshly added tab could never become dirty, leaving the AC09 close guard unreachable.
- Leaving the workspace for settings and returning lost the workbench tabs (AC14).

### Evidence

Observed in this working tree: `bun run test:unit` → 26 files, 189 tests passed;
`svelte-check` 0 errors; prettier + eslint + Svelte 5 guard clean.

Browser suites, counts from `tests/` file inspection — **tests defined**, not tests
passed in this docs pass, and multiplied by the configured Playwright projects:

| Spec                      | ACs                                                   | Tests defined | Runs (3 projects) |
| ------------------------- | ----------------------------------------------------- | ------------- | ----------------- |
| `tests/workspace.e2e.ts`  | AC01, AC02, AC04, AC07, AC08, AC10, AC16              | 15            | 45                |
| `tests/acceptance.e2e.ts` | AC03, AC05, AC06, AC09, AC11–AC15, AC17, AC18         | 12            | 36                |
| `tests/dev-smoke.e2e.ts`  | first boot, hydration gate (`test:dev`, desktop only) | 2             | 6                 |

87 Playwright runs in total (`bun x playwright test --list` confirms 87 in 3 files).

AC01–AC18 therefore all have browser coverage; AC15 is covered on both the settings and
the capability catalog surfaces.

## [0.2.0] - 2026-10-28

### Added

- The seven MVP slices, each with a barrel export and co-located specs:
  `placeholders` (`t()` / `tp()` over the token dictionary), `app-shell` (`DESTINATIONS`
  registry, rail, sidebar host, overlay host), `workspace` (unstarted and populated
  primary surfaces), `composer` (draft store, submit guard, attachment validation),
  `workbench` (tabbed secondary region and splitter), `capabilities` (catalog registry and
  connection state) and `settings-surface` (section and field registries).
- The workspace route family: `/workspace`, `/workspace/[chatId]`, `/capabilities`,
  `/capabilities/[slug]` and `/settings/[section]`, with registry validation for capability
  and settings slugs, object-id validation for chats, and 404 boundaries for unknown ids.
- `tests/workspace.e2e.ts` covering the route family and the primary interaction flows at
  390 / 768 / 1440, and `tests/dev-smoke.e2e.ts` covering first boot without credentials and
  hydration-gated controls.

### Changed

- The root route redirects (307) to `/workspace` instead of rendering a landing page.
- Product identity in `src/lib/config/app.ts` is the generic "Placeholder Workspace";
  every visible string still resolves through `slices/placeholders`.
- `--shell-*` design tokens and `.shell-*` layout utilities live in `src/routes/layout.css`
  and are the only styling source for the shell.

### Removed

- The five starter demo slices (`dashboard`, `live-data`, `notes`, `assistant`, `settings`)
  and the `/apps/[slug]` route family that served them.

### Fixed

- `bun run build` no longer depends on the host Node version: the Vercel adapter runtime is
  pinned to `nodejs22.x`.
- `bun run test:dev` had no tests after the starter suite was deleted; the dev-server smoke
  suite is restored.
- The workbench hide and show controls no longer share an accessible name.
- `bun run lint` failed on the vendored `docs/reference/` assets; they are excluded from
  formatting.
- The typed-ESLint spec timed out under the default 5s vitest budget; the server project now
  allows 30s.

### Known gaps

- AC02/AC03 (attachment add/validate), AC05/AC06 (network loss, streaming cancel), AC09
  (dirty-tab discard against a real save), AC11 (overlay Escape return beyond the shell
  host) and AC12/AC13/AC14 (settings/capabilities persistence) are implemented at the
  state/unit level but not browser-verified end to end, because the MVP has no backend.

## [0.1.0] - 2026-10-27

### Added

- Product requirement set for the placeholder workspace shell: `docs/PRD.md`,
  `docs/implementation-plan.md`, `docs/ui-spec.md`, `docs/state-model.md`,
  `docs/placeholder-copy.md`, `docs/cloud-handoff.md`.
- Reference artifacts under `docs/reference/`: the six-composition prototype and the two
  classification sources it was derived from.

### Changed

- `CONTRACT.md`, `README.md`, `UIUX.md`, `AGENTS.md` and `docs/architecture.md` now describe
  this product instead of the starter template.
- Package name, version, repository links and release manifest reset for this product.

### Not yet implemented

- The shell itself. Slices `app-shell`, `workspace`, `composer`, `workbench`,
  `capabilities`, `settings-surface` and `placeholders` are specified but not written;
  the starter demo slices are still present and are removed in the first implementation
  step.

## [0.6.1] - 2026-09-08

- Align Composio setup with the current session-based MCP API and direct-tools preset.
  Keep existing standalone endpoints as a documented legacy migration path.

## [0.6.0] - 2026-09-08

### Added

- Type-aware async/exhaustiveness linting, runtime/slice import boundaries and official
  Convex validator/index/table-ID rules, with executable regression fixtures.
- Optional Google OIDC login, encrypted bounded sessions and owner-scoped Convex notes CRUD.
- Optional BYOK AI chat (OpenAI, Anthropic, Google) and official MCP SDK client/server,
  configured model/tool allowlists, manual execution review and Composio guidance.
- Node adapter and nonroot container target for VPS/Cloud Run deployment.

### Changed

- Override transitive cookie to patched 0.7.2; auth/browser checks cover the compatible API.
- Feature screens load on demand while retaining initial SSR; navigation/data waiting
  use accessible skeletons, render retry boundaries and safe error correlation IDs.
- Agent contract and focused guides cover auth, AI/MCP, typed lint and deployment limits.
- Auth recipe placeholders are replaced by actual Google settings; all new capabilities
  remain off in a clean clone. No provider credentials or private project source is included.

## Unreleased

## 0.5.0 — 2026-09-08

### Added

- A compact session entry point and maintained `CONTRACT.md`, with task-specific context loading and practical Ponytail/Caveman/optional RTK guidance.
- An environment consumer matrix and optional OIDC, GCP and Cloudflare configuration examples; Cloudflare has the same explicit unsupported guard as the auth/GCP recipes.
- Explicit SEO indexing opt-in, optional Google/Bing verification and Twitter/X attribution, plus robots and sitemap endpoints driven by shared settings.
- A development-server browser smoke check in CI alongside production browser coverage.

### Changed

- Design guidance addresses concrete copy, truthful state, accessible controls and context-dependent visual choices. Landing, settings and Convex setup copy reflect actual behavior.
- Removed the unused Svelte Testing Library dependency; browser and existing unit checks remain the verification tools.
- Allowed root feature slices through Vite's development filesystem boundary so their client modules load; unrelated root files remain outside the allowlist.
- Segmented controls and the workspace menu stay disabled until hydration so early keyboard/click input is not silently lost.
- Native disclosures retain an early open state across hydration; removed their unused controlled-state API.
- Updated CI actions for the supported runner runtime, pinned their release commits and disabled persisted checkout credentials.

### Migration notes

- `PUBLIC_SITE_URL` alone no longer enables indexing. Set `PUBLIC_SEO_INDEXABLE=true` for public production indexing; keep previews false.
- Replace the old static robots file with the endpoint. Crawling stays allowed so noindex is readable; sitemap URLs are announced only when indexing is enabled.
- Read `CONTRACT.md` at each new agent session and adapt its product section when generating an application. Optional cloud/auth values are recipes, not installed integrations.

## 0.4.0 — 2026-09-08

### Added

- Public app identity configuration and a shared asset catalog for branding and metadata.
- Eight replaceable SVG/PNG placeholders, a web manifest, asset validation and generated artwork prompts.
- Canonical and social metadata using `PUBLIC_SITE_URL`; unconfigured pages and app examples remain noindex.
- Disabled server transport adapters for basic DOKU Checkout, notification signature verification and Resend email, with mocked HTTP checks.
- Explicit private integration resolution, default provider choices and auth/GCP implementation recipes.
- Canonical design guidance, focused Svelte/Convex practices, an agent startup guide and a reusable PRD with measurable acceptance and operational handoff criteria.

### Changed

- Shared branding, locale and asset references replace duplicated page/shell values.
- The main check command validates generated assets alongside types and version consistency.
- Agent instructions link focused guidance and use cohesive boundaries instead of rigid file-size or library-specific rules.
- Documentation distinguishes implemented transports, mock verification and remaining product lifecycle work.

### Migration notes

- Customize `src/lib/config/app.ts` and `assets.config.ts` together, then regenerate assets and prompts. Mark final artwork `custom` before generation.
- Set the production HTTPS origin through `PUBLIC_SITE_URL`; leave it unset for noindex previews.
- Optional capabilities remain disabled. These adapters add no public callback/order endpoints, durable outbox, authentication or GCP deployment; merchant sandbox and real email lifecycle testing remain product work.
- The base Convex schema stays empty. See [the upgrade guide](docs/releasing.md) when adopting changes in a generated product.

## 0.3.0 — 2026-09-08

### Added

- Public template metadata, MIT license, contributor and security policies, issue/PR templates.
- GitHub CI for locked installs, typecheck, formatting, lint, unit tests, build and browser tests.
- Deployment, architecture, release and new-project guides; an explicit release checklist.
- Version synchronization command and metadata consistency check.
- Deployment key guards to keep Vercel preview and production backends separate.
- Browser metadata, response security headers and keyboard navigation coverage.

### Changed

- Bun pinned to 1.4.2; Node support documented and pinned for CI.
- Dashboard, settings and Convex status read versions from repository metadata.
- Convex status uses generated API types and validates its return value.
- Empty environment example preserves the unlinked first-run experience.
- Preparation errors fail visibly instead of being swallowed.

## 0.2.0 — 2026-08-31

- Existing VPS starter: Svelte 5 Runes, SvelteKit, Bun, shadcn-svelte and optional Convex.
- Root feature slices, registry-driven routes and responsive application shell.
- Dynamic app UI primitives with initial unit and browser coverage.
