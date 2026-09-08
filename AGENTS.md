# AGENTS.md — Svelte 5 + Bun + Convex starter

This is the single source of truth for AI-assisted coding in this repository.

## Active stack

Reviewed against official docs and registry releases on 2026-09-08. Exact versions live in `package.json` and `bun.lock`; compatibility decisions live in `TECHSTACK.md`:

- Svelte 5.57.0 — **Runes only for new code**
- SvelteKit 2.70.3
- Bun — only package manager / lockfile; Node CLI/runtime support is pinned in `.node-version`
- TypeScript 6.0.3 — latest version compatible with SvelteKit 2.70.3
- Vite 8.2.2
- Tailwind CSS 4.3.3
- shadcn-svelte 1.5.1 + Bits UI + Lucide Svelte
- Convex 1.45.0 + convex-svelte 0.14.0
- Vercel adapter 6.3.4

Official references:

- https://svelte.dev/docs/ai/overview
- https://svelte.dev/docs/svelte/what-are-runes
- https://svelte.dev/docs/kit
- https://docs.convex.dev/quickstart/svelte
- https://www.shadcn-svelte.com/docs/installation/sveltekit

## Non-negotiable architecture

1. Consumer feature UI lives at root `slices/<slug>/`.
2. Cross-slice imports go through the target slice barrel (`$features/<slug>`), never another slice's internals.
3. `src/routes/**` is a thin framework adapter. Shared UI/business logic does not migrate into routes.
4. Repeated pages use one dynamic route. This starter uses `src/routes/apps/[slug]` + `slices/app-shell/registry.ts`.
5. The registry is SSOT for app slug, label, description, icon, screen, navigation, and dynamic lookup. Do not create parallel nav/page arrays.
6. Convex functions live in `src/convex/` via root `convex.json`.
7. Reuse before adding. Delete obsolete imports/files instead of creating compatibility placeholders.

## Svelte 5 rules

Use `$state`, `$derived` / `$derived.by`, `$props`, and `$bindable` only when two-way binding is intentional. `$effect` is for real external side effects, not state synchronization that can be derived or handled in an event.

New code must not use `$:`, `export let`, `on:click` / other `on:` event directives, `createEventDispatcher`, or `<slot>`. Use event attributes/callback props and snippets + `{@render}`. `bun run lint:svelte5` is a fail-closed regression guard.

When an API may have changed, consult the official Svelte docs and use Svelte's AI/MCP/code-writer/autofixer tooling when available. Do not rely on remembered pre-Runes syntax.

## Convex rules

The clone must boot without Convex credentials. Once linked, use `convex-svelte` directly. `useQuery()` is already reactive; do not wrap it in `$derived` merely to make it reactive.

Every registered Convex function validates args and returns. User-owned reads and writes authenticate and authorize ownership server-side. Growing reads are indexed and bounded/paginated. Use generated `api`/data-model types; regenerate with the official CLI and commit them. Never edit `_generated` by hand. The public `starter.status` query exposes build metadata only; do not copy its public access policy into private features.

Do not transplant React auth providers into Svelte. `convex-svelte` exposes `setupAuth`/`useAuth`; choose an auth adapter only after verifying its current Svelte support and label community-maintained adapters honestly.

## UI / mobile

Use shadcn-svelte primitives and shared tokens before hand-rolling another primitive. Screen roots are full-width. Text content may have a readable inner measure; application shells must not be arbitrarily constrained with `max-w-*`.

Mobile shell layers: full `dvh` app → sticky safe-area app bar → full-width content → fixed full-width bottom dock → Sheet/Dialog top layer. Primary touch controls should be ~44px or larger. No document-level horizontal overflow.

## Verification

Before shipping run:

```sh
bun run verify
```

Then run `bun run test:e2e` and drive `/`, `/apps/dashboard`, `/apps/live-data`, `/apps/settings`, an invalid `/apps/...`, the workspace menu, and bottom navigation at mobile and desktop widths. A green typecheck is not browser proof. See `CHECKLIST.md` before release.

## Repository and releases

`version.json` is the template version source. Use `bun run version:bump <MAJOR.MINOR.PATCH>` to synchronize `package.json`, and update `CHANGELOG.md`. `bun run check` verifies consistency. UI versions derive from `src/lib/version.ts`. Keep environment examples empty by default so copying them preserves the unlinked demo. Follow `docs/releasing.md`; generated repositories have independent Git histories.

## Dynamic UI kit contract

Shared spatial/app-first primitives live in `src/lib/components/app-ui/`; reuse them instead of rebuilding layout rules in feature slices. `FeatureGrid` must remain content-aware (`auto-fit/minmax`) rather than using one fixed breakpoint column count. `HorizontalRail` and `SegmentedControl` may overflow horizontally with scroll snap rather than compressing peer content until it becomes unreadable.

Breadcrumbs are navigation context only. Keep workspace switching and other utilities outside the breadcrumb `<nav>`. The shell owns one `[data-app-scroll]` vertical scroll region; `ViewportSnapSection` may opt a section into proximity snap only after runtime measurement shows it occupies roughly one content viewport. Do not apply vertical snap to short forms/cards.

When a feature adds spatial drag-and-drop, require a dedicated ~44px grip, mouse/touch/stylus pointer support, keyboard movement, full destination hit areas, server-authoritative persistence, optimistic feedback/rollback, and assistive announcements. Do not add a global DnD dependency until a real feature needs it.
