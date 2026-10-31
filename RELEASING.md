# Releasing

Twenty-eight packages go to npm: `cssints` and the 27 `@cssints/*` packages in `packages/` (the published versions: <https://npmx.dev/package/cssints>, and `/package/@cssints/reset` and so on; the trusted publisher settings are on npmjs.com). They share one version (Changesets `fixed` group) and go out under the dist-tag `latest` (0.1.0 went out under `next`; from 0.2.0 on, `latest`). The apps and `tools/` stay private. The first release (0.1.0) is run by hand on a laptop. Every later release is run by CI (`.github/workflows/release.yml`) with npm trusted publishing: no token.

## Decisions (cssints-6tnn, 2026-10-10)

- **The publish command is `changeset publish`, on a staged copy of each package.** Changesets calls `npm` for a bun workspace. `npm pack` and `npm publish` keep `workspace:*` in the manifest, ignore `publishConfig.exports`, and ship `src/` and the `development` export condition. `bun pm pack` replaces `workspace:*` (with the exact version, `0.1.0`, not `^0.1.0`) but also keeps `development`, `src/` and the top-level `exports`. So `scripts/stage.mjs` builds the published copy into `packages/<name>/.publish` (git-ignored): the manifest with `publishConfig` laid over it, `workspace:` turned into `^<version>`, no scripts, no `devDependencies`, only `dist/`, `docs/`, `skills/`, README and LICENSE. Each package says `publishConfig.directory: ".publish"`, and `changeset publish` sends that directory (`npm publish <dir> --access public`).
- **One version for all 28 (`fixed`).** Twenty-three packages have `cssints` as a peer (`^0.1.0`, and on 0.x a caret stops at the next minor), `cssints` depends on `css-grammar`, and they change together (a new engine member, a new plugin API). With one number, "which plugin works with which cssints" has one answer, and every release publishes all 28, which is also what the 2-day rule of trusted publishing needs (below). The cost: a package without changes gets a version with an empty entry. Independent versions would need a compatibility table.
- **The tag is `latest` (since 0.2.0, 2026-10-11).** 0.1.0 went out under `next`, and npm put `latest` on it too (the first publish of a package always does). With 0.2.0 removing `cx`, `npm install cssints` without a tag would have kept the old API, so releases publish to `latest` (`release:publish` is `changeset publish`) and the alpha is said by the 0.x version and the docs. `scripts/trust.sh` also drops the stale `next` tags. `release:publish` is `node scripts/publish.mjs`, which runs `changeset publish` and verifies every version against the registry first and after a failure: two pushes in a row both run the workflow, the second one can read the registry a few seconds after the first published, and npm then answers `E409: Cannot publish over previously staged version` — a stage of the same version from the run before, not a broken release. A package whose exact version is on the registry counts as published. Changesets' prerelease mode (`0.2.0-next.0`) was not wanted.
- **Peer ranges stay loose.** `onlyUpdatePeerDependentsWhenOutOfRange` in `.changeset/config.json`: a patch does not change `cssints: ^0.1.0` in the plugins, a minor (0.2.0) does.
- **Every package has a `prepublishOnly` guard** that fails: a plain `npm publish` in a package directory would send the repository manifest (`workspace:*`, `src`). Staged copies have no scripts, so the guard does not touch the real publish.
- **Provenance.** The repository is public (2026-10-29), so `release.yml` publishes with `NPM_CONFIG_PROVENANCE=true` and
  npm links every tarball to the run and the commit it came from. While the repository was private npm made none, even with
  trusted publishing.

## Check at any time

```bash
bun run release:check                  # build the 28 packages, stage them, check manifests and files; nothing is published
node scripts/release.mjs --install     # the same, then install all 28 tarballs into a fresh project (needs the network) and start cssints-mcp
cd packages/cssints && bun run test:smoke   # a Vite app built from the tarballs
```

`scripts/release.mjs` fails when, in a package: `private`, `workspace:` or `catalog:` is left; the `development` condition is left; `repository` is not exactly `git+https://github.com/alexeiaccio/css-in-ts-compiler.git` with its directory (the trusted publisher compares it); a file named by `exports` or `bin` is missing; a sibling's range is not met by the sibling's version; the tarball holds a test, a fixture or TypeScript source (except `src/core` of devtools); there is no README or LICENSE.

## New packages: `@cssints/headless` and `@cssints/apg-specs` (0.5.1)

`@cssints/headless` and `@cssints/apg-specs` joined the `fixed` group before they existed on npm. Trusted publishing cannot publish a package that does not exist yet (a trusted publisher is added to an existing package only), so the first version of each goes out by hand, before the "Version Packages" pull request that carries them is merged:

```bash
bun run release:check                                  # stages packages/headless/.publish and packages/apg-specs/.publish
cd packages/headless/.publish && npm publish --access public --tag latest   # 0.5.0, from the laptop (npm login first)
cd ../../apg-specs/.publish && npm publish --access public --tag latest     # 0.5.1: the version in its manifest
```

Then add their trusted publishers (the table below) and merge the version pull request: CI publishes 0.5.1 (headless) and 0.5.2 (apg-specs, and the rest of the group) with the others.

## The newest package: `@cssints/reactive` (2026-10-31, cssints-zrt2)

`@cssints/reactive` is the 28th of the group, and trusted publishing cannot create it either: publish its first version by hand before the "Version Packages" pull request that carries it is merged, then add its trusted publisher and merge.

```bash
bun run release:check                                  # stages packages/reactive/.publish
cd packages/reactive/.publish && npm publish --access public --tag latest
```

`packages/apg-specs` (`@cssints/apg-specs`) is the test oracle of the widgets and of `native/headless`, and it is published for consumers outside the repository that replay its scenarios against their own widgets. Its tarball carries data on purpose, which `release.mjs` allows by name (`shippedData`) and for this package only: `specs/` and `shared/` (the `.qnt` sources), `scenarios/` (the ported scenario JSON) and, in `dist/`, the generated models as `.json` (copied by `vp pack` from `src/*/*.model.generated.json`, published as `*.model.json`). The generated scaffolding (`*.scaffolding.generated.ts`) and the spec tests stay out. The subpath exports: `/scenario`, `/apg/<pattern>.bridge`, `/apg/<pattern>.model.json`, `/canvas/<machine>.bridge`, `/canvas/<machine>.model.json`, `/scenarios/{apg,canvas}/*.json`, `/specs/{apg,canvas}/*.qnt`, `/shared/*.qnt`. `effect` is a peer (`^4.0.0`), `@quint-machine/core` a dependency. In the repository `development` (vite, tsc) and `bun` (`bun test` of `native/headless`, which cannot take `development`: it would switch `solid-js` to its dev build) point at `src/`.

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

## Trusted publishers (npmjs.com, once per package, 28 times)

A trusted publisher can be added only to a package that exists, so this comes after the first release. A new configuration expires if no publish goes through it within 2 days: do this right before the first CI release (open the "Version Packages" pull request first, below, then configure, then merge it). The first CI release publishes all 25 (fixed group), so every configuration is used at once.

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

The list of names: `cssints`, `@cssints/balance`, `color-names`, `css-grammar`, `devtools`, `fluid`, `fonts`, `gradient`, `gradient-2d`, `icons`, `layout`, `masonry`, `mcp`, `mise-en-mode`, `motion`, `placeholder`, `ramp`, `reset`, `reveal`, `rybitten`, `skeleton`, `squircle`, `stuck`, `tokens`, `tui`, `reactive`, `headless`, `apg-specs` (all but the first under `@cssints/`).

The same thing from a terminal, where the values above are already written down: `sh scripts/trust.sh` adds the connection
to all 27 (`--dry-run` prints the commands). npm cannot **edit** a connection, so a package whose connection was created
after 2026-09-03 — those allow `npm stage publish` only, and every publish of theirs waits for a person with 2FA —
is fixed by `sh scripts/trust.sh --recreate <package>`: it revokes the connections `npm trust list <package> --json` reports
(`scripts/trust.mjs ids`) and creates one again with **npm publish** allowed. `scripts/publish.mjs` keeps a release green while
one of those stages is pending; `--recreate` is what removes the cause.

Then, per package, Settings, Publishing access: "Require two-factor authentication and disallow tokens". Trusted publishers keep working; a stolen token does not. Also in the repository: Settings, Actions, General, tick "Allow GitHub Actions to create and approve pull requests" (the version pull request).

## Later releases, from CI

1. In a branch that changes a package, run `bun run changeset`: pick the packages (any one bumps all 28), the bump (`patch` or `minor`; on 0.x a breaking change is a `minor`) and write one line for the changelog. Commit the file in `.changeset/` with the change. `bunx changeset --empty` is for a change that releases nothing.
2. Merge to master. The `release` workflow opens or updates the pull request "Version Packages": `changeset version` (versions, `CHANGELOG.md` files, peer ranges), the release's entry at the top of the root `CHANGELOG.md` (`scripts/changelog.mjs`, from the changesets' summaries: for a breaking change, add the migration in that pull request before merging it) and `bun install --lockfile-only` (bun.lock records the workspace versions).
3. Merge that pull request. The workflow runs on master with no changesets left: `bun install --frozen-lockfile`, `bun run release:check` (build, stage, check, dist freshness), then `changeset publish` through trusted publishing, then pushes the tags.

Checks run with the token of the Actions bot do not start on the version pull request; start them by hand if you want them.

## When something fails

- `ENEEDAUTH` in CI: the workflow file name or case differs from the trusted publisher, `id-token: write` is missing, the npm version is under 11.5.1, or the package has no trusted publisher yet.
- `E404` on the package when adding a trusted publisher: it was never published.
- A package published, the rest did not: run the publish again, `changeset publish` skips the ones on npm.

## After a CI release (from 0.4.0, 2026-10-21)

`changeset publish` can report a package under "Successfully published" while the registry does not have it: in 0.4.0,
`@cssints/fluid@0.4.0` sat in that list with no error in the log and appeared on npm only about ten minutes later. So
check the registry, and not with `npm view`: the CLI keeps a packument in its cache for minutes and answered `0.3.1` for
packages that were already published.

```bash
for p in cssints $(node -p "require('fs').readdirSync('packages').filter(d => require('fs').existsSync('./packages/'+d+'/package.json')).map(d => require('./packages/'+d+'/package.json').name).filter(n => n !== 'cssints').join(' ')"); do
  printf '%-26s %s\n' "$p" "$(curl -sL "https://registry.npmjs.org/${p//\//%2F}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["dist-tags"]["latest"])')"
done
```

If one is missing, re-run the workflow (`gh run rerun <id>`): changesets reads the registry and publishes what is not
there. A package that still does not appear either has a staged version pending or a trusted publisher whose "Allowed
actions" miss `npm publish` (a configuration allows only `npm stage publish` by default); both are visible on npmjs.com.
A staged publish leaves a `0.0.0-stage` version on the package: harmless once `latest` is the real version, and
`npm deprecate @cssints/<name>@0.0.0-stage "placeholder of a staged publish"` clears it from the listing.

## Deprecating a package (2026-10-21, `@cssints/tui`)

A deprecation is registry metadata on a version range, and only `npm deprecate` writes it: Changesets does not, and
`npm publish` cannot (a `deprecated` field in `package.json` is ignored by npm). So the release ships the notice and a
person marks the range afterwards. `@cssints/tui` is the first: it is deprecated in favour of the `terminal/` target of
`cssints-native`, and 0.4.1 (the `fixed` group bumps all 25) is the version that carries the notice.

```bash
npm login                                                     # the account that owns the cssints org
npm deprecate "@cssints/tui@*" "Deprecated: the terminal/ target of cssints-native replaces it (cssints/clay styles, Clay layout, cells on termbox2). See packages/tui/README.md"
npm view @cssints/tui deprecated                              # reads it back
```

`@*` marks every version already on npm and every one published later; a single version is `@cssints/tui@0.4.1`. To undo
it, `npm deprecate "@cssints/tui@*" ""` (an empty message clears it).
