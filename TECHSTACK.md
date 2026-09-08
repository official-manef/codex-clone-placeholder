# Technology contract

Versions were checked against registry metadata and official docs on 2026-09-08.
`package.json` defines compatibility; `bun.lock` records exact installed versions.

| Layer           | Choice                                                 |
| --------------- | ------------------------------------------------------ |
| Package manager | Bun 1.4.2                                              |
| Tooling runtime | Node 22.23.2; supported alternatives in `engines.node` |
| Framework       | Svelte 5.57.0 + SvelteKit 2.70.3                       |
| Language        | TypeScript 6.0.3                                       |
| Build           | Vite 8.2.2                                             |
| UI              | Tailwind 4.3.3 + shadcn-svelte 1.5.1 + Bits UI 2.19.0  |
| Backend         | Convex 1.45.0 + convex-svelte 0.14.0                   |
| Deploy          | @sveltejs/adapter-vercel 6.3.4                         |
| Tests           | Vitest 4.1.11 + Playwright 1.62.1                      |

## Compatibility over indiscriminate upgrades

SvelteKit 2.70.3 supports TypeScript `^5.3.3 || ^6.0.0`; TypeScript 6.0.3 stays within
that range. Core framework dependencies stay pinned. Dependabot opens reviewed minor/patch
updates and separate major updates; unsupported TypeScript/Node-type major updates are excluded.

Bun is the package manager and script launcher. Some CLIs still use Node, and Vercel server
functions run on Node. Installing Bun alone does not satisfy those toolchain requirements.

## Backend and UI boundaries

Convex linking is optional for frontend startup. Generated API types are committed.
Auth remains a deliberate product integration. See [architecture](docs/architecture.md).

shadcn-svelte and Bits UI own accessible controls. Shared `app-ui` components own layout
patterns; feature slices compose them; SvelteKit routes adapt them.
See [UIUX.md](UIUX.md) for the existing responsive interaction contract.

Official references: [SvelteKit](https://svelte.dev/docs/kit),
[Convex Svelte](https://docs.convex.dev/client/svelte/overview),
[Bun](https://bun.sh/docs), [shadcn-svelte](https://www.shadcn-svelte.com/docs).
