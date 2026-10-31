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
  # the listing first, and nothing is revoked or created unless it parses: a stale session answers 401 with an error body,
  # and creating a connection on top of the one that failed to list would leave two for the same workflow. Where the listing
  # goes to a file and its errors stay on the terminal, so the one-time-password link npm prints is readable: capturing both
  # would hide it and the run would look hung.
  echo "  (npm may ask for a one-time password: open the link it prints, and the run continues)" >&2
  listing=$(mktemp)
  if ! npm trust list "$p" --json >"$listing"; then
    rm -f "$listing"
    echo "  cannot read the connections of $p — run \`npm login\` first, and approve the one-time password" >&2
    exit 1
  fi
  if ! ids=$(node scripts/trust.mjs ids <"$listing"); then
    rm -f "$listing"
    echo "  $p: the listing carries no connection id, nothing was revoked or created" >&2
    exit 1
  fi
  rm -f "$listing"
  for id in $ids; do
    echo "  revoking $id"
    npm trust revoke "$p" --id="$id"
  done
  npm trust github "$p" --file release.yml --repo alexeiaccio/css-in-ts-compiler --allow-publish --yes
done
