# Technology contract

| Layer                     | Choice                                                      |
| ------------------------- | ----------------------------------------------------------- |
| Runtime / package manager | Bun 1.4.0                                                   |
| Framework                 | Svelte 5.57.0 + SvelteKit 2.70.3                            |
| Language                  | TypeScript 6.0.3 (latest SvelteKit-compatible)              |
| Build                     | Vite 8.2.2                                                  |
| UI                        | Tailwind CSS 4.3.3 + shadcn-svelte 1.5.1 + Bits UI + Lucide |
| Backend                   | Convex 1.45.0 + convex-svelte 0.14.0                        |
| Deploy                    | @sveltejs/adapter-vercel 6.3.4                              |
| Tests                     | Vitest 4.1.11 + Playwright 1.62.1                           |

## Why TypeScript 6 instead of 7?

TypeScript 7.0.2 is newer globally, but SvelteKit 2.70.3 declares support for TypeScript `^5.3.3 || ^6.0.0`. This starter chooses the latest compatible release, 6.0.3, instead of shipping an invalid "latest everything" combination.

## Convex linking

The repository deliberately builds before a Convex project exists. Link it later:

```sh
bunx convex dev
```

That writes the deployment config and enables codegen. Expose the public client URL as `PUBLIC_CONVEX_URL`. The demo live-data slice activates automatically when the variable exists.

The working copy could not provision a dedicated cloud project during initial creation because the team was already at its Convex deployment quota; no existing project was reused or mutated as a workaround.

## UI interaction layer

The Svelte starter keeps framework primitives and product-layout primitives separate:

- shadcn-svelte + Bits UI own low-level accessible controls;
- `src/lib/components/app-ui/` owns reusable app composition such as adaptive grids, snap rails, segmented local modes, signal banners, disclosures, and measured viewport snap;
- `slices/*` compose those primitives around feature tasks;
- routes remain adapters only.

This avoids a second breakpoint/layout system inside each feature and keeps the same structural contract portable across future Svelte slices without copying page markup.
