# Svelte Convex Starter

A production-oriented **Svelte 5 Runes + SvelteKit + Bun + optional Convex** starter with a full-width adaptive app shell, shadcn-svelte primitives, root vertical slices, and registry-driven dynamic pages.

## Start

```sh
bun install
bun run dev
```

Open `/` or `/apps/dashboard`.

## Architecture

```text
slices/
  app-shell/        # registry + adaptive shell
  dashboard/        # feature slice
  live-data/        # optional convex-svelte demo
  settings/         # feature slice
src/routes/
  apps/[slug]/      # one dynamic page family; thin adapter only
src/convex/         # Convex backend
```

`$features/*` maps to root `slices/*`. `slices/app-shell/registry.ts` is the SSOT for pages and navigation. Add a new app by creating its root slice and registering its barrel export once; do not create a copied route page.

## Svelte 5 only

New app code uses Runes and modern events/snippets. `bun run lint:svelte5` rejects the common legacy forms (`$:`, `export let`, `on:click`, `createEventDispatcher`, `<slot>`).

## Convex is optional at boot

A fresh clone is buildable without credentials. To activate realtime data:

```sh
bunx convex dev
# then set PUBLIC_CONVEX_URL in .env.local
```

The starter uses `convex.json` to keep functions under `src/convex/`. Once a deployment is linked, run `bun run convex:codegen` and migrate client references to generated `api` types as features become real.

## Verify

```sh
bun run verify
bun run test:e2e   # after Playwright browsers are installed
```

See `AGENTS.md` for the coding contract and `TECHSTACK.md` for version decisions.

## Dynamic app UI kit

The starter ships a Svelte 5-native app UI layer under `src/lib/components/app-ui/`. It uses content-aware `auto-fit/minmax` grids, overflow-aware horizontal rails and segmented controls, semantic breadcrumbs with workspace actions kept outside navigation context, and viewport-aware proximity snap for genuinely full-screen sections. See [`UIUX.md`](./UIUX.md).

The shell is intentionally app-first below `lg`: one scroll owner, safe-area-aware compact header, registry-driven dock, and feature content that chooses carousel/grid/tabs/disclosure based on the task rather than shrinking desktop composition.
