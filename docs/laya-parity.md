# Laya parity — shipped template shape

This repository is now the shared workspace template. Its UI comes from
`rahmanef63/laya-npu` at commit **9a893b2** (`feat(chat): scope modes to sessions and add
configurable resource picker`), copied, not reimplemented. `docs/REBUILD-PLAN-laya-parity.md`
is the plan this executed.

## 1. Provenance

| Item              | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Source repository | `rahmanef63/laya-npu`                                 |
| Source commit     | `9a893b2`                                             |
| Copied paths      | `slices/workspace-shell/**`, `shared/**`              |
| Copied verbatim   | Yes — byte-identical apart from import alias rewrites |
| Re-copy procedure | see §6                                                |

Only two rewrites were applied to the copy:

1. `../../ shared/...` → `$shared/...` (an alias, because this repo keeps `shared/` at the
   repository root and SvelteKit resolves `$shared`).
2. Nothing else. No formatting, no rename, no logic change.

Laya was not modified. It keeps building product features on its own side; it pulls the
shell back from here when it wants the template's state.

## 2. What the copy contains

```text
slices/workspace-shell/          the shell (2106 lines) + 10 sub-slices
  workspace-shell.svelte         regions, layout, tabs, menus, overlays
  feature-host.svelte            lazy feature screen host with error boundary
  labels.ts                      passive presentation labels
  shared/
    chat-ui/                     composer, message frame, mode switch, list rows
    feature-registry/            validated immutable registry (fails closed)
    menu/                        menubar, shortcuts, edit commands
    launcher/                    rail/launcher id selection
    navigation/                  back/forward trail
    output-tabs/                 working vs kept tabs, v1→v2 restore
    runtime/                     chat/runtime/persistence/component contracts
    approval-mode/               consumer-supplied modes
    effort/                      consumer-supplied effort options
    browser-toolbar/             optional view toolbar
shared/
  icons/                         name→glyph map the registry speaks
  workspace-layout/              split math, resize bounds, persistence adapter
  workspace-styles/base.css      token source (merged into layout.css)
```

Consumer-side code that this repository owns:

```text
slices/chat/                     local chat stub behind WorkspaceChatProps/Handle
slices/workspace-surface/        composition root: registry, runtime, persistence, screens
src/routes/+page.svelte          12-line adapter that mounts WorkspaceApp
```

`src/routes/` has no `/workspace`, `/capabilities` or `/settings` route. The shell owns
navigation through its own state, exactly as Laya does. Adding those routes back would create
a second navigation source of truth.

## 3. Consumer contracts the shell expects

| Contract                                    | Where it is satisfied here                                  |
| ------------------------------------------- | ----------------------------------------------------------- |
| `chat` component                            | `slices/chat/components/chat-view.svelte`                   |
| `runtime` adapter                           | `slices/workspace-surface/runtime.ts` (one local backend)   |
| `persistence`                               | `slices/chat/persistence.ts` (`workspace-template:` prefix) |
| `sections` / `auxiliaryViews` / `railViews` | `slices/workspace-surface/registry.ts`                      |
| `launcher` preferences                      | same registry                                               |
| `menuContributions`                         | `WorkspaceApp`                                              |

Nothing in this repo calls a network endpoint, reads a credential, or claims NPU/GPU. The
runtime adapter reports one in-browser backend and says so.

## 4. Zero-backend guarantees

- `createLocalRuntime().listBackends()` resolves a static in-memory backend list.
- `slices/chat` turns a send into a timeline entry after 450 ms and keeps partial text on
  cancel. There is no HTTP client in the tree.
- Persistence is `sessionStorage`/`localStorage` under `workspace-template:`. Drafts are
  namespaced per key; attachments are object URLs and never persist.
- A clean clone boots with no `.env`. The starter's optional Convex/auth/AI/MCP transports
  still exist and are still disabled by default; nothing in the product path calls them.

## 5. Deliberate deviations from Laya

| Area             | Here                                   | Laya                                     | Why                                                                              |
| ---------------- | -------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| Chat surface     | Local stub with 3 rotating replies     | Real model/runtime bridge                | No backend in the template                                                       |
| Settings surface | Lazy feature screen named `settings`   | Full grouped SettingsWindow component    | The template has no settings model to show; a second surface would be fake depth |
| Rail             | 4 destinations from the registry       | 8+ including models, transcribe, explore | Product-specific destinations stay in the product                                |
| Launcher         | `LAUNCHER` in the registry             | Laya's `LAUNCHER_CONFIG`                 | Same shape, different catalogue                                                  |
| Runtime controls | Omitted (`runtimeControls` not passed) | Laya passes its NPU controls             | Nothing to control locally                                                       |
| Hosted gate      | Omitted                                | Laya gates hosted pairing                | No hosted mode exists here                                                       |

Omitted props are not mounted by the shell — that is the shell's documented behaviour, so
these omissions cost nothing and add no dead branches.

## 6. Re-syncing with Laya later

```bash
# 1. Record the current source commit in this file.
git -C ~/projects/laya-npu-clean log --oneline -1

# 2. Copy, then re-apply ONLY the alias rewrite.
rm -rf slices/workspace-shell shared
cp -r ~/projects/laya-npu-clean/slices/workspace-shell slices/
cp -r ~/projects/laya-npu-clean/shared .
grep -rl '\.\./\.\./\.\./\.\./shared' slices/workspace-shell shared \
  | xargs sed -i 's|\.\./\.\./\.\./\.\./shared|$shared|g'

# 3. Re-check the consumer contracts and the browser evidence.
bun run verify && bunx playwright test && DEPLOY_TARGET=node node scripts/smoke-node.mjs
```

If a re-copy breaks the consumer, fix it in `slices/chat` / `slices/workspace-surface`, not in
the copied shell. Patching the copy forks it and turns the next sync into a merge.

## 7. Lint posture for the vendored trees

`eslint.config.js` disables a bounded rule set for `slices/workspace-shell/**` and
`shared/**`, with a `TODO(rr)` marker. Reason: the copy must stay diffable against upstream.
Fixing those findings here would fork the source. The compliant shape (fix upstream in
`laya-npu`, re-copy, delete the override) is written at the marker.

Consumer slices are **not** covered by that override and pass the full rule set.

## 8. Evidence

Recorded 2026-10-29 on this repository:

| Check         | Command                                          | Result                                                 |
| ------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Types         | `bun run check`                                  | 0 errors, 0 warnings                                   |
| Lint          | `bun run lint`                                   | prettier + eslint + Svelte-5 guard clean               |
| Unit          | `bun run test:unit`                              | 59 passed                                              |
| Build         | `bun run build`                                  | ok (Vercel adapter, `nodejs22.x` pinned)               |
| Browser       | `bunx playwright test`                           | 6 passed (narrow-mobile/mobile/desktop)                |
| Dev hydration | `bun run test:dev`                               | 2 passed                                               |
| Node smoke    | `DEPLOY_TARGET=node node scripts/smoke-node.mjs` | routes, noindex, disabled capabilities ok              |
| Manual        | 1440×900 / 768×1024 / 390×844                    | renders, zero console errors, zero horizontal overflow |

Not yet verified: keyboard journeys beyond Escape/focus return, every resize bound,
approval/effort selectors (not mounted here), and real backend behaviour (out of scope).
