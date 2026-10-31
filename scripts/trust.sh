#!/bin/sh
# The GitHub Actions trusted publisher (release.yml) of every package of the fixed group, in two jobs:
#
#   sh scripts/trust.sh                       # the first setup: add the connection to every package. Run once, right before
#                                             # the first CI release (a configuration expires if no publish goes through it
#                                             # within 2 days). npm asks for 2FA on every call; RELEASING.md "Trusted
#                                             # publishers".
#   sh scripts/trust.sh --recreate [package…] # a connection created after 2026-09-03 allows `npm stage publish` only, and npm
#                                             # cannot edit a connection: revoke it and create it again with `npm publish`
#                                             # allowed. With no package named, the whole group; the ones that have gone to
#                                             # stage so far are @cssints/{color-names,fluid,fonts,motion,tui}.
#   …either with --dry-run                    # print what would happen; runs nothing
#
# A stage-only connection is why a release can wait for a person: npm stages every publish and `npm stage approve` needs
# 2FA, which CI does not have. scripts/publish.mjs keeps such a run green; this script is what removes the cause.
set -e

GROUP=$(node -e 'console.log(require("./.changeset/config.json").fixed[0].join(" "))')

MODE=setup
DRY=""
PACKAGES=""
for arg in "$@"; do
  case "$arg" in
    --recreate) MODE=recreate ;;
    --dry-run) DRY=1 ;;
    -*) echo "usage: sh scripts/trust.sh [--recreate [package…]] [--dry-run]" >&2; exit 2 ;;
    *) PACKAGES="$PACKAGES $arg" ;;
  esac
done

if [ "$MODE" = setup ]; then
  for p in $GROUP; do
    echo "$p"
    if [ -n "$DRY" ]; then
      echo "  npm trust github $p --file release.yml --repo alexeiaccio/css-in-ts-compiler --allow-publish --yes"
      continue
    fi
    npm trust github "$p" --file release.yml --repo alexeiaccio/css-in-ts-compiler --allow-publish --yes
    # releases go to latest since 0.2.0: the next tag of 0.1.0 would point at the old API
    npm dist-tag rm "$p" next 2>/dev/null || true
  done
  exit 0
fi

[ -n "$PACKAGES" ] || PACKAGES=$GROUP
for p in $PACKAGES; do
  echo "$p"
  if [ -n "$DRY" ]; then
    echo "  npm trust list $p --json | node scripts/trust.mjs ids   # then revoke each id"
    echo "  npm trust github $p --file release.yml --repo alexeiaccio/css-in-ts-compiler --allow-publish --yes"
    continue
  fi
  for id in $(npm trust list "$p" --json | node scripts/trust.mjs ids); do
    echo "  revoking $id"
    npm trust revoke "$p" --id="$id"
  done
  npm trust github "$p" --file release.yml --repo alexeiaccio/css-in-ts-compiler --allow-publish --yes
done
