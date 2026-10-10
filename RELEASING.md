# Releasing

Twenty-two packages go to npm: `cssints` and the 21 `@cssints/*` packages in `packages/`. They share one version (Changesets `fixed` group) and go out under the dist-tag `next`. The apps and `tools/` stay private. The first release (0.1.0) is run by hand on a laptop. Every later release is run by CI (`.github/workflows/release.yml`) with npm trusted publishing: no token.

## Decisions (cssints-6tnn, 2026-10-10)

- **The publish command is `changeset publish`, on a staged copy of each package.** Changesets calls `npm` for a bun workspace. `npm pack` and `npm publish` keep `workspace:*` in the manifest, ignore `publishConfig.exports`, and ship `src/` and the `development` export condition. `bun pm pack` replaces `workspace:*` (with the exact version, `0.1.0`, not `^0.1.0`) but also keeps `development`, `src/` and the top-level `exports`. So `scripts/stage.mjs` builds the published copy into `packages/<name>/.publish` (git-ignored): the manifest with `publishConfig` laid over it, `workspace:` turned into `^<version>`, no scripts, no `devDependencies`, only `dist/`, `docs/`, `skills/`, README and LICENSE. Each package says `publishConfig.directory: ".publish"`, and `changeset publish` sends that directory (`npm publish <dir> --access public --tag next`).
- **One version for all 23 (`fixed`).** Twenty-one packages have `cssints` as a peer (`^0.1.0`, and on 0.x a caret stops at the next minor), `cssints` depends on `css-grammar`, and they change together (a new engine member, a new plugin API). With one number, "which plugin works with which cssints" has one answer, and every release publishes all 23, which is also what the 2-day rule of trusted publishing needs (below). The cost: a package without changes gets a version with an empty entry. Independent versions would need a compatibility table.
- **The tag is `next`, not a prerelease version.** The versions are plain (`0.1.0`, `0.1.1`) and `release:publish` passes `--tag next`. Changesets' prerelease mode would make `0.1.1-next.0` and cannot publish plain versions under `next`. To move to `latest` later, see "Moving to latest".
- **Peer ranges stay loose.** `onlyUpdatePeerDependentsWhenOutOfRange` in `.changeset/config.json`: a patch does not change `cssints: ^0.1.0` in the plugins, a minor (0.2.0) does.
- **Every package has a `prepublishOnly` guard** that fails: a plain `npm publish` in a package directory would send the repository manifest (`workspace:*`, `src`). Staged copies have no scripts, so the guard does not touch the real publish.
- **No provenance.** The repository is private, and npm makes no provenance for a private repository, even with trusted publishing.

## Check at any time

```bash
bun run release:check                  # build the 23 packages, stage them, check manifests and files; nothing is published
node scripts/release.mjs --install     # the same, then install all 23 tarballs into a fresh project (needs the network) and start cssints-mcp
cd packages/cssints && bun run test:smoke   # a Vite app built from the tarballs
```

`scripts/release.mjs` fails when, in a package: `private`, `workspace:` or `catalog:` is left; the `development` condition is left; `repository` is not exactly `git+https://github.com/alexeiaccio/css-in-ts-compiler.git` with its directory (the trusted publisher compares it); a file named by `exports` or `bin` is missing; a sibling's range is not met by the sibling's version; the tarball holds a test, a fixture or TypeScript source (except `src/core` of devtools); there is no README or LICENSE. And for the repository: a tracked `dist/` folder differs from a fresh build (commit the rebuilt `dist/` on master first).

## First release, from the laptop

You need an npm account that owns the organization `cssints` (it creates `@cssints/*`) and can publish the unscoped `cssints` (both names were free on 2026-10-10). Nothing below runs without you.

```bash
git switch master && git pull
bun install --frozen-lockfile
npm login                                # a browser or a one-time password; then:
npm whoami && npm org ls cssints         # you are listed

bun run release:check                    # 1. build, stage, check: "release check passed"
node scripts/release.mjs --install       # 2. all tarballs install together, cssints-mcp answers
NPM_CONFIG_DRY_RUN=true bunx changeset publish --tag next --no-git-tag   # 3. the real publish command, as npm's dry run
npm view cssints version                 # still 404 after the dry run: nothing is on npm

bun run release                          # 4. release:check, then changeset publish --tag next; asks for a one-time password
                                         #    (choose "skip 2FA for 5 minutes" so it asks once)
git push origin master --follow-tags     # 5. Changesets made one tag per package (cssints@0.1.0, @cssints/balance@0.1.0, ...)
git push origin --tags                   #    if --follow-tags left some behind
```

Check the result:

```bash
for p in cssints $(node -p "require('fs').readdirSync('packages').map(d => require('./packages/'+d+'/package.json').name).filter(n => n !== 'cssints').join(' ')"); do
  echo "$p $(npm view $p dist-tags --json | tr -d '\n ')"
done
```

Every package shows `next: 0.1.0`. The npm registry also sets `latest` on the first publish of a package, so expect `latest: 0.1.0` as well. If step 4 stops half way, run `bun run release` again: `changeset publish` skips what is on npm.

After that: change "Not on npm yet" in `README.md` ("Install" and "Status") to the install command.

## Trusted publishers (npmjs.com, once per package, 23 times)

A trusted publisher can be added only to a package that exists, so this comes after the first release. A new configuration expires if no publish goes through it within 2 days: do this right before the first CI release (open the "Version Packages" pull request first, below, then configure, then merge it). The first CI release publishes all 23 (fixed group), so every configuration is used at once.

For each package: npmjs.com, Packages, the package, Settings, Trusted Publisher, GitHub Actions:

| Field                | Value                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Organization or user | `alexeiaccio`                                                                                                                   |
| Repository           | `css-in-ts-compiler`                                                                                                            |
| Workflow filename    | `release.yml` (the file name with the extension, case-sensitive)                                                                |
| Environment name     | empty                                                                                                                           |
| Allowed actions      | tick **npm publish** (a new configuration allows only `npm stage publish` by default; the Changesets action runs `npm publish`) |

The same from the terminal, after `npm login` (each call may ask for a one-time password):

```bash
for p in cssints $(node -p "require('fs').readdirSync('packages').map(d => require('./packages/'+d+'/package.json').name).filter(n => n !== 'cssints').join(' ')"); do
  npm trust github "$p" --file release.yml --repo alexeiaccio/css-in-ts-compiler --allow-publish --yes
done
npm trust list cssints
```

The list of names: `cssints`, `@cssints/balance`, `css-grammar`, `devtools`, `fluid`, `fonts`, `gradient`, `icons`, `layout`, `masonry`, `mcp`, `mise-en-mode`, `motion`, `placeholder`, `ramp`, `reset`, `reveal`, `skeleton`, `squircle`, `stuck`, `tokens`, `tui` (all but the first under `@cssints/`).

Then, per package, Settings, Publishing access: "Require two-factor authentication and disallow tokens". Trusted publishers keep working; a stolen token does not. Also in the repository: Settings, Actions, General, tick "Allow GitHub Actions to create and approve pull requests" (the version pull request).

## Later releases, from CI

1. In a branch that changes a package, run `bun run changeset`: pick the packages (any one bumps all 23), the bump (`patch` or `minor`; on 0.x a breaking change is a `minor`) and write one line for the changelog. Commit the file in `.changeset/` with the change. `bunx changeset --empty` is for a change that releases nothing.
2. Merge to master. The `release` workflow opens or updates the pull request "Version Packages": `changeset version` (versions, `CHANGELOG.md` files, peer ranges) and `bun install --lockfile-only` (bun.lock records the workspace versions).
3. Merge that pull request. The workflow runs on master with no changesets left: `bun install --frozen-lockfile`, `bun run release:check` (build, stage, check, dist freshness), then `changeset publish --tag next` through trusted publishing, then pushes the tags.

Checks run with the token of the Actions bot do not start on the version pull request; start them by hand if you want them.

## Moving to latest

When the line is ready for `latest`: from the laptop (or, with "Allow npm dist-tag" on the trusted publisher, from CI), `npm dist-tag add cssints@<version> latest` for each package, and change `release:publish` in `package.json` to `changeset publish` (no `--tag`).

## When something fails

- `ENEEDAUTH` in CI: the workflow file name or case differs from the trusted publisher, `id-token: write` is missing, the npm version is under 11.5.1, or the package has no trusted publisher yet.
- `E404` on the package when adding a trusted publisher: it was never published.
- "the tracked dist/ differs from a fresh build": on master run `bun run build:packages`, commit `dist/`.
- A package published, the rest did not: run the publish again, `changeset publish` skips the ones on npm.
