---
# cssints-6tnn
title: 'Publishing to npm: changesets, first release 0.1.0 on next, trusted publishing from CI'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T15:48:39Z
updated_at: 2026-10-10T18:14:46Z
---

Asked by the user (2026-10-10): the npm organization cssints exists (https://www.npmjs.com/settings/cssints/packages). Decided: Changesets; all 22 packages (cssints + 21 @cssints/*) at 0.1.0 on the dist-tag next; the first release from the user's laptop (npm login), CI on trusted publishing (OIDC) afterwards. The repository is private: no provenance.
- [x] Packages ready to publish: drop private: true from the 22 packages (apps stay private), publishConfig.access public for scoped ones, repository (url exact: github.com/alexeiaccio/css-in-ts-compiler, directory), homepage https://cssints.accio.blue, license files present, files lists checked with npm pack --dry-run (no tests/fixtures, dist present, the dev 'development' export condition: say whether it should ship pointing at src that is in files or be stripped at publish), workspace:* replaced at publish (bun publish does it; npm does not: decide the publish command and verify the packed package.json).
- [x] Changesets: @changesets/cli config (fixed or independent: say which; access public; baseBranch master; ignore apps), a first changeset for 0.1.0, scripts (changeset, version, release), the prerelease mode for next or tag config, docs in AGENTS.md (how to add a changeset).
- [x] .github/workflows/release.yml: changesets/action on push to master (Version Packages PR; publish when versions change) with id-token: write and npm >= 11.5.1 for OIDC, the dist build/check before publish (dist is tracked: verify it is fresh), tag next.
- [x] A local release script and step-by-step for the first publish from the laptop (npm login, dry run, publish with tag next), then the trusted publisher config per package (org alexeiaccio, repo css-in-ts-compiler, workflow release.yml) — the user does the npmjs.com part; write the exact steps.
- [x] Verify: npm pack of each package installs into a fresh app (the smoke test does this for cssints) and builds.

## Summary of Changes

Decisions are in RELEASING.md ("Decisions"). Branch `npm-publish`.

- **Publish command:** `changeset publish --tag next` (`bun run release:publish`) on a staged copy of each package. For a bun workspace Changesets 3 calls npm, and `npm pack` / `npm publish` keep `workspace:*`, ignore `publishConfig.exports`, and ship `src/` and the `development` condition. `bun pm pack` replaces `workspace:*` with the exact version (`0.1.0`) but keeps `development`, `src/` and the source `exports`. So `scripts/stage.mjs` writes `packages/<name>/.publish` (publishConfig laid over the manifest, `workspace:` to `^version`, no scripts, only dist/docs/skills/README/LICENSE); each package has `publishConfig.directory: ".publish"`, which Changesets publishes. Proved on `@cssints/reveal`: npm keeps `"@cssints/motion": "workspace:*"`, bun gives `"0.1.0"`, the staged tarball gives `"^0.1.0"` and `types`/`default` exports only.
- **Versioning:** `fixed`, all 22 in one group (20 packages peer `cssints ^0.1.0`, they change together, every release then publishes all 22, which the 2-day rule of trusted publishing needs). Peer ranges move only when out of range.
- **Tag:** plain versions with `--tag next` in `release:publish`, not prerelease mode. No changeset is needed for 0.1.0: `changeset publish` publishes every version that is not on npm.
- **Packages:** `private` dropped from the 22, `repository` (exact trusted-publisher URL and directory), `homepage`, `publishConfig.access`, a `prepublishOnly` guard against a plain `npm publish`; tui got a LICENSE; css-grammar and cssints ship the repository README; devtools ships `dist` and `src/core` (its `model` and `inject` exports are TypeScript).
- **Found by the install check:** `@cssints/mcp` had `vite: "catalog:"` as a dependency (not a real range: now `^8.3.0`), npm looped on `@effect/platform-node-shared@4.0.3` (peer `effect ^4.0.3` against the pinned `effect 4.0.0`: now pinned `4.0.0` in mcp), and its bin imported `@cssints/devtools/model`, TypeScript that Node does not load from node_modules (now bundled by tsdown, `deps.alwaysBundle`).
- **Checks:** `scripts/release.mjs` (`bun run release:check`; `--install` installs all 22 tarballs together and starts `cssints-mcp`), and the real publish command was run as `NPM_CONFIG_DRY_RUN=true changeset publish --tag next --no-git-tag` (22 packages, nothing on npm afterwards). The smoke test passes (it now allows `skills/` in the cssints tarball). `.github/workflows/release.yml` is valid YAML and passes action-validator; it has not run on GitHub.
- **Docs:** RELEASING.md (decisions, first release, trusted publishers, CI flow, failures), AGENTS.md (layout and commands).

## What is left (only you can do it)

- Merge `npm-publish` into master; rebuild and commit `dist/` there if it differs (`bun run release:check` says).
- First release from the laptop: `npm login`, `bun run release:check`, `node scripts/release.mjs --install`, the dry run, `bun run release`, push the tags (RELEASING.md, "First release").
- On npmjs.com, or with `npm trust github`, add the trusted publisher to each of the 22 packages (alexeiaccio / css-in-ts-compiler / release.yml, allow `npm publish`); within 2 days of the first CI release.
- Repository settings: Actions, General, "Allow GitHub Actions to create and approve pull requests".
- After the first publish: change "Not on npm yet" in README.md; add the wayfinder entry (docs/wayfinder.md is the coordinator's).
- Optional: disallow tokens per package once the trusted publishers work; later `npm dist-tag add ... latest`.
