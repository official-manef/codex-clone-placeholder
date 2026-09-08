# Release checklist

Run this on the exact commit being released; these boxes are review prompts, not claims of completion.

- [ ] `bun install --frozen-lockfile` succeeds using the documented runtimes.
- [ ] `bun run verify` passes; no swallowed errors or ignored type failures.
- [ ] `bun run test:e2e` passes on phone, narrow phone and desktop viewports.
- [ ] Landing, dashboard, live-data, settings and unknown routes behave correctly.
- [ ] Keyboard navigation, menus, focus restoration and contained horizontal scrolling work.
- [ ] A clean clone builds without secrets; configured Convex status has been exercised separately.
- [ ] Convex generated files are current and committed; backend typecheck passes.
- [ ] User-owned functions authenticate, authorize, validate and use indexed, bounded reads.
- [ ] New environment values document where they live; no private values are committed.
- [ ] Package version, version manifest and changelog agree.
- [ ] README commands work; docs distinguish implemented features from product setup.
- [ ] CI on GitHub passes for the release commit.
- [ ] Release tag matches that commit and its version.

For a deployed product also verify the exact deployed revision, its real auth/data flow,
the production domain, backend deployment selection and recovery procedure.
