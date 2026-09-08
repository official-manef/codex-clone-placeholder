# Technology contract

`package.json` declares supported dependencies and runtime ranges; `bun.lock` records
the exact installation and `.node-version` selects the tooling runtime. Read those files
for version numbers rather than maintaining another version list here.

| Layer               | Choice / responsibility                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| Package manager     | Bun; one committed `bun.lock`                                                     |
| Framework           | Svelte 5 Runes and SvelteKit                                                      |
| Language / build    | Strict TypeScript, Vite                                                           |
| UI                  | Tailwind CSS 4, source-owned shadcn-svelte, Bits UI and Lucide                    |
| Backend             | Convex with `convex-svelte`; frontend connection optional                         |
| Deploy              | Vercel adapter; server functions use its supported Node runtime                   |
| Asset tooling       | Development-only resvg renders SVG placeholders to PNG; files are committed       |
| Verification        | Svelte/TypeScript checks, Prettier, ESLint, Vitest, Playwright and GitHub Actions |
| Optional transports | DOKU Checkout and Resend using server-side fetch and Node crypto where needed     |

## Compatibility and updates

Core framework dependencies remain pinned. Review official compatibility before a
major upgrade, including TypeScript, Vite, the Svelte plugin, adapter and Node runtime.
Regenerate the lockfile with the declared Bun version and verify the complete build.
Dependabot proposes minor/patch updates and separate majors; unsupported TypeScript
and Node-type major updates are excluded by the checked-in policy.

Bun is the package manager and script launcher. Some CLIs still execute through Node,
and Vercel functions are not a Bun HTTP server. Installing Bun alone does not satisfy
the documented toolchain. Adding another package manager or lockfile is not required.

## Boundaries

The app starts without credentials. Convex generated types are committed; its base
schema is empty. Private data, authentication and tenant permissions are product work.
Payment/email transports are disabled building blocks verified with mocked HTTP,
not complete business flows. Auth and GCP are recipes with explicit unsupported
resolver states. See [integrations](docs/integrations.md).

shadcn-svelte/Bits UI own accessible controls; shared `app-ui` components own layout;
feature slices compose them; routes adapt SvelteKit. Public app config and the asset
catalog drive branding. Private integration config never belongs in browser data.
See [architecture](docs/architecture.md) and [design](DESIGN.md).

Official references: [SvelteKit](https://svelte.dev/docs/kit),
[Convex Svelte](https://docs.convex.dev/client/svelte/overview),
[Bun](https://bun.sh/docs), [shadcn-svelte](https://www.shadcn-svelte.com/docs).
