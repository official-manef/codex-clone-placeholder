# Changelog

Notable template changes follow [Semantic Versioning](https://semver.org/).
During 0.x, minor releases may change template structure; patch releases are compatible fixes.

## Unreleased

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
