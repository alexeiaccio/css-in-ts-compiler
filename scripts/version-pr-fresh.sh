#!/usr/bin/env bash
# A Version Packages PR is cut from master with `changeset version`, which deletes the changesets it consumed. Two ways
# it goes stale, and they fail differently — a stale PR publishes the older set, leaves the new changeset on master and
# the release workflow opens another version PR, which is how 0.40.0 and 0.42.0 were committed, tagged and never
# published. Both are checked here:
#
#   1. the PR's tree carries a changeset — it was cut before that one was consumed (or rebased onto a newer master and
#      not regenerated);
#   2. a changeset landed on the base **after** the PR was cut — the PR tree does not contain it at all, so only the
#      history can see it. This is the common case and the one that skipped two versions.
#
#   bash scripts/version-pr-fresh.sh [base] [head]     # default: origin/master, HEAD; both must be fetched refs
set -euo pipefail
base="${1:-origin/master}"
head="${2:-HEAD}"
stale=()

while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in .changeset/README.md) continue ;; esac
  stale+=("$file (in the PR's tree: it was not consumed)")
done < <(git ls-tree --name-only "$head" .changeset/ | grep -E '\.md$' || true)

merge_base="$(git merge-base "$head" "$base")"
while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in .changeset/README.md) continue ;; esac
  stale+=("$file (landed on $base after the PR was cut)")
done < <(git diff --name-only --diff-filter=A "$merge_base" "$base" -- '.changeset/*.md' || true)

if [ "${#stale[@]}" -gt 0 ]; then
  echo "this version PR is stale — merging it would publish the older set:" >&2
  printf '  %s\n' "${stale[@]}" >&2
  echo "wait for the release workflow to regenerate the PR, then merge it" >&2
  exit 1
fi
echo "the version PR consumed every changeset landed before it was cut, and carries none"
