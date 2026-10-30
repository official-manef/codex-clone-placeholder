# ChatGPT desktop parity — handoff brief

Status: **scoping only, no product code.** Owner of next step: an agent on a Windows host
with ChatGPT desktop installed. This document exists because the comparison below could
not be grounded in a real target on the Linux host that wrote it.

## Why this document is a brief and not an implementation

`docs/` already records what this template is: a Svelte workspace shell with a
consumer-owned chat surface, three engines (`local`, `device`, `cloud`), and a deliberately
local-first runtime. That baseline is not being reopened here.

The ask was to compare this template against **ChatGPT desktop** and describe how to apply
its features. That comparison has one hard prerequisite: an installed, inspectable copy of
the application. On the Linux host that produced this brief:

| Check                         | Result                                     |
| ----------------------------- | ------------------------------------------ |
| `which chatgpt`               | empty                                      |
| `dpkg -l \| grep -i chatgpt`  | empty                                      |
| `~/.local/share/applications` | only `claude-code-url-handler.desktop`     |
| `https://chatgpt.com`         | HTTP 403 (edge protection, not a download) |

So the feature list below is **documented behaviour from OpenAI's public material**, not
evidence from the binary. Anything marked _unverified_ must be confirmed on the Windows
host before it becomes an acceptance criterion. Do not turn this table into a task list
without that confirmation.

## Reference behaviour, from OpenAI's public documentation (Oct 2026)

Grouped by surface, because these are three products in one window, not one feature list.

| Surface    | Capability                                                                                       | Confidence |
| ---------- | ------------------------------------------------------------------------------------------------ | ---------- |
| Shell      | Chat, Work and Codex in one app; one window family                                               | documented |
| Shell      | Codex Micro: up to six chats with per-chat reasoning effort                                      | documented |
| Projects   | Project folders with instructions, files and per-project context                                 | documented |
| Projects   | Chat/Work conversations and Projects share one desktop view                                      | documented |
| Code       | Inline diff editing in the conversation                                                          | documented |
| Code       | Pull-request review in the side panel                                                            | documented |
| Code       | Worktrees and multi-repository projects                                                          | documented |
| Code       | Scheduled tasks / automations continuing in the same thread                                      | documented |
| Memory     | Memories that span chats                                                                         | documented |
| Voice      | Voice dictation into the composer                                                                | documented |
| Extensions | Plugin Extensions: sidebar app, side panel, file editor, native forms (`@openai/mcp-extensions`) | documented |
| Extensions | MCP 2.0: events and webhook delivery                                                             | documented |
| Agents     | Computer Use, including Windows desktop applications                                             | documented |
| Remote     | Continue desktop work from the mobile app through a connected host                               | documented |

Everything above is _unverified against the application itself_. Exact control names,
shortcut sets, animation timings, empty-state copy and error strings are unknown and must
not be invented.

## Where this template actually stands

Verified by reading the repository at `1195928`, not by guessing.

| Capability                                                        | Template state                                                                                                              | Gap                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Three-region shell, right-hand canvas, lazy feature screens       | present (`slices/workspace-shell`, 2098 lines)                                                                              | none                                     |
| Chat surface with `/` and `@` composer commands                   | present (`src/lib/views/Chat.svelte`, `src/lib/composer_commands.ts`)                                                       | none                                     |
| Drafts, attachments, recording                                    | present                                                                                                                     | none                                     |
| Tabbed outputs: Files, Browser, Terminal, launcher                | present (`CHAT_OUTPUTS` in `src/lib/registry.ts`)                                                                           | none                                     |
| BYOK provider keys, encrypted on Convex                           | present and documented (`docs/byok.md`)                                                                                     | none                                     |
| Outbound MCP client with explicit allowlists                      | present                                                                                                                     | none                                     |
| Inbound MCP server                                                | present, read-only (`/api/mcp/server`)                                                                                      | none                                     |
| Device pairing and a terminal panel that refuses to fake a prompt | present (`docs/terminal.md`)                                                                                                | none                                     |
| Chat/Work/Compare mode labels                                     | present in `src/lib/workspace_routes.ts`                                                                                    | labels only; behaviour differs           |
| Projects                                                          | **absent**: `move-project` and `remove-project` exist with `disabledReason: 'This runtime has no chat project membership.'` | schema, storage, sidebar grouping        |
| Git: diff, commit, PR review                                      | **absent**: no git reference in `src/lib` outside `registry.ts`'s own repo URL                                              | a bridge to a local repository           |
| Worktrees, multi-repository projects                              | absent                                                                                                                      | git bridge plus per-worktree state       |
| Parallel chats with per-chat reasoning effort                     | absent                                                                                                                      | a run model that supports concurrency    |
| Memories across chats                                             | absent                                                                                                                      | a table, a retention policy, a read path |
| Automations / scheduled tasks                                     | absent                                                                                                                      | a scheduler and a queue                  |
| Voice dictation into the composer                                 | partial: local Whisper transcription of a file, not dictation                                                               | different job, different pipeline        |
| Plugin Extensions, sidebar/panel/file entrypoints                 | absent: this app hosts MCP tools, it is not an MCP App host                                                                 | `@openai/mcp-extensions` integration     |
| MCP 2.0 events                                                    | absent: MCP 1.x client                                                                                                      | protocol upgrade                         |
| Computer Use                                                      | absent                                                                                                                      | OS-level control and permissions         |
| Remote from mobile                                                | absent                                                                                                                      | relay plus authentication                |

Two of these absences are deliberate and should stay that way unless a product decision
says otherwise: the app has no shared identity, and it has no server-side session store.
A feature that needs either is a product change, not a parity fix.

## What the Windows agent should do first

The point of this handoff is that the Windows host can ground the comparison in evidence.
Do the investigation before writing product code.

### 1. Install REA and confirm it works there

REA (`morluto/rea`, MIT, npm `rea-agents`) is the tool designed for exactly this: it drives
Ghidra, Hopper, IDA, Chrome DevTools and Electron inspection from one MCP server, and it
requires evidence for every claim instead of accepting a guess.

```powershell
npx rea-agents@latest setup
rea doctor
```

`rea doctor` prints a capability inventory. Record it. On the Linux host that wrote this
brief the inventory was 175 CLI commands and 229 MCP tools, with the macOS-only providers
unavailable; expect a different, and probably richer, set on Windows.

### 2. Inspect ChatGPT desktop statically

REA's Electron path is static reconstruction, so it does not require executing the app:

```powershell
rea analyze-javascript-application "C:\path\to\ChatGPT" --detail summary --evidence_output evidence/chatgpt-desktop.json
rea analyze-web-bundle --help
```

Useful follow-ups once an application graph exists:

```powershell
rea compare-application-versions --help   # after a ChatGPT update
rea build-reconstruction-obligation-ledger --help
```

Rules for this step:

- Do not redistribute ChatGPT assets, bundle contents or strings into this repository.
  Keep evidence bundles outside the checkout and record only derived findings.
- Do not claim a capability from a minified symbol name. Record the file, the symbol and
  what it provably does, or mark it unknown.
- Reverse engineering for interoperability is legally sensitive. This repository's
  `DISCLAIMER`-style caution applies: findings inform our own original implementation;
  they do not license copying another vendor's code, copy or design.

### 3. Confirm or reject each row of the reference table

Produce a short evidence note that either confirms a row, corrects it, or marks it
unverifiable. Anything still unverified stays out of `docs/PRD.md`.

### 4. Only then pick implementation order

The order below is a proposal for that discussion, not an instruction. It is sorted by
cost, cheapest first, and it stops well before the expensive items.

| Step | Item                                     | Why it is in this position                                                                 | What it needs                                                                                     |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1    | Projects                                 | The menu entries and their `disabledReason` already exist, so the contract is half-written | a local project store on the existing draft-store pattern; sidebar grouping; no new dependency    |
| 2    | Git surface: status, diff, stage, commit | This is what makes a Codex-style shell actually useful                                     | a server route calling `git` against an allowlisted repository; a token never reaches the browser |
| 3    | Plugin Extension entrypoints             | Cheap only after 1 and 2 exist; keeps the host portable                                    | `@openai/mcp-extensions`; graceful degradation where the host has no `openai/*` capability        |
| 4    | Memories                                 | Needs a database, and Convex is already optional here                                      | one table and one query on `src/convex/`, plus a retention rule                                   |

Explicitly out of scope unless a product decision changes: parallel chat orchestration,
Computer Use, mobile remote, MCP 2.0 events. Each is a subsystem, not a feature.

## Acceptance for this handoff

This brief is done when the Windows agent has produced:

1. a REA capability inventory from `rea doctor`;
2. an application graph of ChatGPT desktop, kept outside the repository;
3. a confirmation table that resolves each row of the reference behaviour list;
4. a recommendation for step 1 with the exact files it would touch.

No product code is expected in this pull request. Adding the code before the evidence is
what the repository's own `AGENTS.md` warns against.
