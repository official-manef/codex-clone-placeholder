# Releasing and upgrading

`version.json` is the release manifest. `package.json.version` mirrors it for tooling.
Dashboard versions derive from package metadata; do not hardcode them in components.

## Maintainer release

1. Start from a clean tree and create a release branch.
2. Run `bun run version:bump <MAJOR.MINOR.PATCH>`.
3. Move notable Unreleased changes into a dated changelog entry; include migration steps.
4. Run `bun install` if metadata changed, then `bun run verify` and `bun run test:e2e`.
5. Complete [CHECKLIST.md](../CHECKLIST.md), commit and merge through a PR with green CI.
6. Tag the exact commit `v<version>` and publish a GitHub release using the changelog entry.

The version command never commits, tags, pushes or publishes. `bun run check` rejects
mismatched manifests. Runtime upgrades must update `packageManager` or `.node-version`,
engine ranges and the technology guide together. Regenerate the lockfile with the declared Bun.

Stable versions use MAJOR.MINOR.PATCH. During 0.x, minor releases may change structure;
patch releases are compatible fixes. Do not label prereleases stable.

## Upgrade a generated repository

GitHub templates create independent repositories, with no merge relationship to upstream history.
Read release notes, compare affected files, and port changes onto an application branch.
Do not force-merge unrelated histories or overwrite customized features with a fresh scaffold.
Update local release metadata when adopting a version and run all gates plus your app's auth/data tests.

The public initial release preserves the existing VPS starter history. The separate Next.js
`template-convex-starter` repository remains a separate project.
