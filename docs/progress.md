# Progress tracker

Living status for this repository. Correct only when a command below was run on the
commit named at the top. If a line here disagrees with the code, the code wins — fix the line.

Baseline: `cc33ef0` (squash of #2), `main`, 2026-10-30.

## Where we are

| Area                       | State                       | Evidence                                                       |
| -------------------------- | --------------------------- | -------------------------------------------------------------- |
| Shell + workspace routes   | shipped                     | `slices/workspace-shell`, `/` mounts the workspace             |
| Chat surface + composer    | shipped                     | `slices/chat`, local runtime adapter                           |
| Terminal panel             | shipped                     | `src/lib/runtime/terminal.ts`, `src/lib/views/Terminal.svelte` |
| Device pairing             | shipped                     | `src/lib/views/Devices.svelte`, `src/lib/auth_state.ts`        |
| BYOK providers (cloud)     | shipped, 4 providers        | `src/convex/providers.ts`; `nine-router` added in `cc33ef0`    |
| BYOK chat (SvelteKit path) | shipped                     | `src/lib/server/ai/{chat,config}.ts`                           |
| Outbound MCP client        | shipped                     | `src/lib/cloud/mcp.ts`, allowlist + manual confirm             |
| Inbound MCP server         | shipped, read-only          | `/api/mcp/server`, one `starter_status` tool                   |
| MANEF AI hub bridge        | shipped, loopback allowlist | `src/routes/api/manef/[...path]`, three paths only             |
| Feature access + toggles   | shipped                     | `src/lib/feature_access.ts`, `src/lib/config/surface.ts`       |
| ChatGPT parity evidence    | shipped                     | `docs/chatgpt-desktop-parity-windows.md`                       |

## Gates, measured on this commit

```
vitest run          27 files / 138 tests passed
prettier --check    clean
eslint .            clean
svelte-check        0 errors, 0 warnings
```

Playwright is **not** green and cannot be claimed: see the correction below.

## Correction — the AC test suites do not exist

`docs/PRD.md` §7 and `docs/implementation-plan.md` §10 both state that
`tests/workspace.e2e.ts` and `tests/acceptance.e2e.ts` cover AC01–AC18. They do not exist
in this tree, and nothing in `src/` or `slices/` references an AC id:

```
find . -name '*e2e.ts' -not -path './node_modules/*'
  ./tests/dev-smoke.e2e.ts          # 4 tests, hydration + navigation only
grep -rn 'AC[0-9][0-9]' src slices   # no matches
```

They were deleted deliberately by `6ed1f3e` ("rebuild on the Laya NPU workspace template"),
which removed the `/workspace`, `/capabilities`, `/settings` route family and their
acceptance suites. The PRD and the implementation plan were not updated in that commit.

So: **zero of AC01–AC18 have a browser test right now.** The 138 unit tests cover schema,
guards, transport, auth and config — not the acceptance scenarios. Both documents are stale
and are corrected here rather than quietly satisfied.

What `tests/dev-smoke.e2e.ts` actually proves, over three viewports: a clean clone boots
without credentials and hydrates, a local send appends a timeline entry with a stub reply,
a settings destination opens the settings window, and rail navigation reaches a lazily
loaded screen.

## Not started

Ordered by the reasoning in `docs/chatgpt-desktop-parity-windows.md` §7, cheapest first.

| #   | Item                                        | Blocker                                                              | Status      |
| --- | ------------------------------------------- | -------------------------------------------------------------------- | ----------- |
| 1   | Projects                                    | none; `move-project`/`remove-project` already carry `disabledReason` | not started |
| 2   | Git surface: status, diff, stage, commit    | needs a server route + repo allowlist + process boundary             | not started |
| 3   | Plugin-extension entrypoints (MCP App host) | needs `@openai/mcp-extensions`; measured as the largest single gap   | not started |
| 4   | Memories                                    | needs a table and a retention decision                               | not started |

Out of scope unless a product decision changes it: parallel chat orchestration, Computer
Use, mobile remote relay, MCP 2.0 events.

## Restoring AC coverage

If AC01–AC18 are still the acceptance bar, the cheapest recovery is to read the deleted
suites out of history rather than rewrite them:

```
git log --all --oneline --diff-filter=D -- tests/workspace.e2e.ts tests/acceptance.e2e.ts
git show ad4a909:tests/acceptance.e2e.ts | head -40
```

They target the pre-`6ed1f3e` route family (`/workspace`, `/capabilities`, `/settings`), so
they will not run as-is: the shell now owns navigation and `/` mounts the workspace. Treat
them as the scenario list, not as runnable tests, and re-point each at the current
selectors before claiming the AC. Do not restore the files and call the gate green.

## How to update this file

Run the commands, paste the numbers, change the state word. Do not mark "shipped" from a
typecheck — the PRD says it plainly: a green typecheck is not browser proof.
