---
# cssints-6tnn
title: 'Publishing to npm: changesets, first release 0.1.0 on next, trusted publishing from CI'
status: in-progress
type: feature
created_at: 2026-10-10T15:48:39Z
updated_at: 2026-10-10T15:48:39Z
---

Asked by the user (2026-10-10): the npm organization cssints exists (https://www.npmjs.com/settings/cssints/packages). Decided: Changesets; all 22 packages (cssints + 21 @cssints/*) at 0.1.0 on the dist-tag next; the first release from the user's laptop (npm login), CI on trusted publishing (OIDC) afterwards. The repository is private: no provenance.
- [ ] Packages ready to publish: drop private: true from the 22 packages (apps stay private), publishConfig.access public for scoped ones, repository (url exact: github.com/alexeiaccio/css-in-ts-compiler, directory), homepage https://cssints.accio.blue, license files present, files lists checked with npm pack --dry-run (no tests/fixtures, dist present, the dev 'development' export condition: say whether it should ship pointing at src that is in files or be stripped at publish), workspace:* replaced at publish (bun publish does it; npm does not: decide the publish command and verify the packed package.json).
- [ ] Changesets: @changesets/cli config (fixed or independent: say which; access public; baseBranch master; ignore apps), a first changeset for 0.1.0, scripts (changeset, version, release), the prerelease mode for next or tag config, docs in AGENTS.md (how to add a changeset).
- [ ] .github/workflows/release.yml: changesets/action on push to master (Version Packages PR; publish when versions change) with id-token: write and npm >= 11.5.1 for OIDC, the dist build/check before publish (dist is tracked: verify it is fresh), tag next.
- [ ] A local release script and step-by-step for the first publish from the laptop (npm login, dry run, publish with tag next), then the trusted publisher config per package (org alexeiaccio, repo css-in-ts-compiler, workflow release.yml) — the user does the npmjs.com part; write the exact steps.
- [ ] Verify: npm pack of each package installs into a fresh app (the smoke test does this for cssints) and builds.
