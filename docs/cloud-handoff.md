# Cloud handoff

Everything an agent needs to start the MVP in the cloud without asking questions.
Read in this order:

1. [PRD.md](PRD.md) — scope, acceptance criteria, milestones
2. [implementation-plan.md](implementation-plan.md) — step order, exact paths
3. [ui-spec.md](ui-spec.md) — regions, tokens, responsive, controls
4. [state-model.md](state-model.md) — state ownership, transitions, persistence, races
5. [placeholder-copy.md](placeholder-copy.md) — token contract
6. [CONTRACT.md](../CONTRACT.md) — authoritative file map
7. `docs/reference/` — the prototype and the two classification JSON sources

## Repository facts

| Item            | Value                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Repo            | `rahmanef63/codex-clone-placeholder` (public)                                             |
| Base template   | `rahmanef63/template-svelte-convex-starter` @ `eead6b5`                                   |
| Package manager | Bun `1.4.2` — `bun.lock` only                                                             |
| Stack           | Svelte 5.57, SvelteKit 2.70, Tailwind 4.3, shadcn-svelte 1.5, TypeScript 6.0, Convex 1.45 |
| Feature alias   | `$features` → `./slices`                                                                  |
| Entry route     | `/` redirects to `/workspace`                                                             |

## Cloud environment setup

```bash
git clone git@github.com:rahmanef63/codex-clone-placeholder.git
cd codex-clone-placeholder
bun install --frozen-lockfile
bun run check          # baseline must be green before any change
bun run dev            # http://localhost:5173
```

No `.env` is required. `DEPLOY_TARGET` defaults to `vercel`; use `DEPLOY_TARGET=node` for
container targets. Convex connection stays unset in MVP — `PUBLIC_CONVEX_URL` absent means
the shell runs fully client-side.

If a container or CI runner lacks `zip` or a Docker sandbox image, note it in the PR
instead of weakening a test.

## Guardrails the cloud agent must not break

**P0**

- No credentials, tokens or per-user mutable state in a module singleton or shared server
  module. Request state is contextual.
- Optional capabilities (auth, AI, MCP, payments, email, cloud) stay disabled; the shell
  must boot without them.
- Provider/model/tool output is untrusted. MVP has none — do not add a demo that calls a
  provider.
- Never publish a package. Deploy evidence must come from the deployed revision, not an
  old alias response.

**P1**

- Runes/modern syntax only; `scripts/check-svelte5.mjs` is the gate.
- Consumer UI in root `slices/<slug>/`; routes stay thin; cross-slice import is the barrel.
- One dynamic route per repeated page family, backed by a typed registry.
- shadcn-svelte primitives, semantic theme tokens, no hex in components.
- Mobile-first responsive; workspace surfaces are full-bleed `h-dvh`.
- One outer chrome. `app-shell` owns it; areas mount inside.
- Tests co-located per slice; app-level Playwright stays in `tests/`.
- Conventional commits plus `Co-Authored-By: Claude <noreply@anthropic.com>`.

Any P1 that truly cannot be honored needs `// TODO(rr): <why + compliant shape>` at the
site and a line in the commit body. A P0 conflict means stop and report.

## First three commits (suggested)

```text
docs(product): add workspace shell PRD, state model, UI spec and handoff
chore(slices): retire starter demo slices and rewrite destination registry
feat(app-shell): add rail, sidebar host, overlay host and workspace routes
```

## Verification before handing back

```bash
bun install --frozen-lockfile
bun run verify
bunx playwright test
bun run test:dev
bun run assets:check
```

Then state, in the handoff message: commit SHA, which ACs are covered with which test,
which compositions were checked at which widths, and every deviation with its
`TODO(rr)` marker. Typecheck alone is not evidence.

## What is deliberately absent

Auth, database writes, streaming, upload, search, usage history, analytics, i18n switching,
marketing pages, and any real product copy. Do not fill these gaps to "make it feel
complete" — the empty slots are the deliverable.
