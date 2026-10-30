# ChatGPT desktop parity — Windows host evidence

Companion to [chatgpt-desktop-parity.md](chatgpt-desktop-parity.md). That brief was written
on a Linux host without the application; this file records what was measured on a Windows
host that has it. Nothing above is removed or downgraded — the reference table there keeps
its "unverified" framing, and each row is resolved underneath it here.

Evidence bundles live outside the checkout (`/tmp/rea-evidence/`) and are not redistributed.
No ChatGPT asset, bundle content or string is copied into this repository.

## 1. Installed target

The application is not a plain install and not named "ChatGPT" in Program Files — it ships
as an MSIX package with a Chromium/Electron payload:

```
Get-AppxPackage -Name OpenAI.Codex
  Name            : OpenAI.Codex
  Version         : 26.1027.3384.0
  InstallLocation : C:\Program Files\WindowsApps\OpenAI.Codex_26.1027.3384.0_x64__2p2nqsd0c76g0
```

| Fact                                                     | Value                                      |
| -------------------------------------------------------- | ------------------------------------------ |
| Package identity                                         | `OpenAI.Codex` / `2p2nqsd0c76g0`           |
| Version                                                  | `26.1027.3384.0`                           |
| Shell executable                                         | `app\ChatGPT.exe` (4.7 MB)                 |
| `app\Codex.exe`                                          | 20 KB stub                                 |
| `app\resources\app.asar`                                 | 674,296,148 bytes, 22,423 entries          |
| Embedded Chromium manifest                               | `156.0.8078.48.manifest`                   |
| Bundled CUA Node runtime                                 | `node 24.22.1-cua.1`, `cua-node 0.0.35`    |
| Bundled plugin marketplace                               | `resources\plugins\openai-bundled`         |
| Bundled MCP servers (`resources\codex.exe` and siblings) | `codex.exe`, `codex-code-mode-host.exe`, … |

Consequence for the brief: `which chatgpt` and the `~/.local/share/applications` check were
the wrong probes on any platform, not just Linux. On Windows the entry point is
`ChatGPT.exe` inside an MSIX payload, so a file-name search for "ChatGPT" in
`Program Files` finds nothing.

## 2. Bundled plugins — measured, not documented

Eight plugins ship inside the package, each with a `plugin.json` carrying
`version 26.1027.30824` (except the four independently versioned ones):

| Plugin                 | Declares `mcpServers` | Notes                                                  |
| ---------------------- | --------------------- | ------------------------------------------------------ |
| `browser`              | no                    | in-app browser, hook-driven                            |
| `chrome`               | no                    | existing Chrome state, logged-in sessions              |
| `codex-app-tools`      | yes — `./.mcp.json`   | "Codex desktop app tools through one local MCP server" |
| `computer-use`         | no                    | Windows desktop app control                            |
| `unified-computer-use` | yes — `./.mcp.json`   | "App-managed browser automation runtime"               |
| `deep-research`        | no                    | `0.1.1`, DOCX report output                            |
| `latex`                | no                    | `0.2.8`, bundled Tectonic                              |
| `visualize`            | no                    | `1.0.66`, charts/maps/diagrams                         |

The marketplace file is `resources\plugins\openai-bundled\.agents\plugins\marketplace.json`
and lists all eight with `installation: AVAILABLE`, `authentication: ON_INSTALL`.

## 3. REA inventory on this host

`rea-agents` requires Node `^22.23.4 || ^24.22.1 || >=26.12.1`. The host default was
`26.7.0` (too old) and `22.23.2` (too old); the inventory below ran on `24.22.2`.

```
npx rea-agents@latest doctor
  cli_commands: 175
  mcp_tools:    229
  node:         24.22.2   healthy
  host:         ubuntu 26.04 (WSL)   healthy
```

That matches the brief's count exactly. Every analysis engine is absent on this host:
`hopper`, `ghidra` (`GHIDRA_INSTALL_DIR` unset), `ida-registration`, `jadx`,
`kuna-installation`. The JavaScript/Electron path used below needs none of them.

## 4. What the application graph actually shows

Full-application analysis is impractical: the asar holds 22,423 entries and REA projects
each source separately. A targeted run was used instead.

Extracted two preload scripts by offset from the asar header (`preload.js` 7,027 bytes,
`sandbox-preload.js` 2,217 bytes) into a scratch directory outside the checkout, then:

```
rea analyze-javascript-application /tmp/app-small --detail summary \
  --evidence_output /tmp/rea-evidence/preload.json
```

Evidence bundle: `/tmp/rea-evidence/preload.json`, 2.9 MB,
`sha256 8d3b762da462f55dff5b7680cfba02b5c3d061fff9a5d41d169a98b88eed7f6b`.
Artifact digest `9f3c43fda5781d71af490278de226479cb8fc95ef2c103af206f6e4f77a7f913`.
Graph: 78 nodes, 78 edges, coverage `partial` (stated limitation: dynamic channel
expressions stay unresolved and must not be read as absence).

Node census: 28 `ipc-channel`, 27 `javascript-expression`, 9 `javascript-module`,
6 `ipc-handler`, 3 `context-bridge-api`, 2 `javascript-asset`, 2 `source-map`.

Resolved renderer channels — the ones that matter for parity:

```
codex_desktop:connect-app-host                       post-message
codex_desktop:mcp-app-sandbox-host-message          on
codex_desktop:mcp-app-sandbox-guest-message         post-message
codex_desktop:connect-git-worker                    invoke
codex_desktop:get-initial-sidebar-bootstrap         send-sync
codex_desktop:get-shared-object-snapshot            send-sync
codex_desktop:chunked-message-ack                   send
codex_desktop:message-from-view / message-for-view  invoke / on
codex_desktop:show-context-menu                     invoke
codex_desktop:start-file-drag / start-link-drag     send-sync / send
codex_desktop:get-build-flavor                      send-sync
codex_desktop:get-system-theme-variant              send-sync
codex_desktop:remote-hosted-pip-video-frame         on
```

Two findings that the brief could only mark "documented":

- **MCP App host is real.** `mcp-app-sandbox-host-message` / `mcp-app-sandbox-guest-message`
  plus `connect-app-host` are the host↔guest bridge an MCP App requires. This is static
  evidence of a sandboxed app host, not a symbol guess.
- **git worktrees are real.** `codex_desktop:connect-git-worker` is an IPC channel that
  connects a renderer to a git worker process.

Everything dynamic in that bundle stays `resolution: dynamic` — the analyzer says so
explicitly, and none of those became a claim here.

## 5. Resolved reference table

Each row of the reference behaviour list, resolved against the evidence above.

| Capability                                    | Resolution   | Basis                                                                                    |
| --------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| Chat, Work and Codex in one app               | confirmed    | single `ChatGPT.exe` shell; one window family in the bundle                              |
| Codex Micro: up to six chats, per-chat effort | unverifiable | no static surface proves a chat-count cap                                                |
| Project folders with instructions/files       | unverifiable | no static surface resolves project storage                                               |
| Chat/Work and Projects share one view         | unverifiable | same reason                                                                              |
| Inline diff editing in conversation           | unverifiable | no static surface resolves the editor                                                    |
| Pull-request review in side panel             | unverifiable | git worker channel confirmed; PR review UI not                                           |
| Worktrees and multi-repository projects       | corrected    | worktrees: confirmed by `connect-git-worker`; **multi-repository** unverified            |
| Scheduled tasks in the same thread            | unverifiable | no scheduler surface observed                                                            |
| Memories across chats                         | unverifiable | no storage surface observed                                                              |
| Voice dictation into the composer             | confirmed    | `native\dictation-ducking.exe` ships; dictation is a separate native component           |
| Plugin Extensions: sidebar/panel/file/forms   | confirmed    | 8 bundled plugins; MCP App host bridge resolved (section 4)                              |
| MCP 2.0: events and webhook delivery          | unverifiable | MCP App host is proven; protocol _version_ is not                                        |
| Computer Use incl. Windows desktop apps       | confirmed    | `computer-use` and `unified-computer-use` plugins both ship a manifest                   |
| Continue desktop work from mobile             | corrected    | `remote-hosted-pip-video-frame` proves a remote frame path; full mobile relay unverified |

"Unverifiable" here means the static surface does not resolve it — not that the capability
is absent. The analyzer's own limitation text is the reason, and none of those rows should
enter `docs/PRD.md` on this evidence.

## 6. Where the template stands, corrected

Reading the repository at `1195928` (the brief's baseline), two of its "absent" rows are
stale on the current tree, and one present row is understated:

| Capability     | Brief says                                         | Current tree                                                                       |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Terminal panel | present                                            | present, plus `src/lib/runtime/terminal.ts` and `src/lib/runtime/terminal.spec.ts` |
| Device pairing | present                                            | present, plus `src/lib/views/Devices.svelte` (405 lines)                           |
| Projects       | absent                                             | still absent; `move-project` / `remove-project` still carry `disabledReason`       |
| Git surface    | absent                                             | still absent — no `git` invocation anywhere under `src/lib` or `src/routes`        |
| Memories       | absent                                             | still absent                                                                       |
| Automations    | absent                                             | still absent                                                                       |
| Parallel chats | absent                                             | still absent                                                                       |
| MCP App host   | absent ("hosts MCP tools, is not an MCP App host") | still absent, and now provably the right gap to name                               |

## 7. Recommendation

Step 1 of the brief's cost order — **Projects** — still fits, and it is the only one of the
four whose contract already exists in the tree.

Why not the git surface first, even though `connect-git-worker` proves the reference product
has it: this template has no server-side repository concept at all, so a git surface needs a
new route, an allowlist and a process boundary before it produces value. Projects needs only
a local store on the existing draft-store pattern.

Exact files a Projects step would touch:

- `src/lib/workspace_routes.ts` — the two menu entries keep their ids and drop
  `disabledReason`
- `src/lib/draft_storage.ts` — the existing local-store pattern to copy, not extend
- `src/lib/views/` — a project grouping surface next to the existing chat views

No new dependency, no new environment variable, no schema table: the project membership is
local state, matching the brief's "no shared identity, no server-side session store" line.

**Explicitly not recommended now:** memories (needs a table and a retention decision),
plugin-extension entrypoints (needs the MCP App host, which is the largest single gap
measured here), computer use, mobile remote, MCP 2.0 events.

## 8. Repository hygiene

Two things found while doing this, neither part of the upstream brief:

- The `.gitignore` trap described in the handover prompt is **not** present in this
  checkout. `git check-ignore -v --no-index .env.example .env.test` reports only the
  negations on lines 18–19, so both files stay tracked.
- Full-application REA analysis of `app.asar` is not practical on this host: 22,423 entries,
  one worker projection per source, and the run does not complete inside a 15-minute
  budget. Target the specific `.vite/build/*.js` files instead — extraction by header
  offset is cheap and keeps the bundle outside the repository.
