#!/usr/bin/env bash
# A Version Packages PR is cut from master with `changeset version`, which deletes every changeset it consumed. So the
# invariant is simple and absolute: **a version PR carries no changeset**. One left in its tree means the PR was cut
# before that changeset landed (or was rebased onto a newer master without being regenerated); merging it publishes the
# older set, leaves the new changeset on master, and the release workflow opens another version PR — which is how
# 0.40.0 and 0.42.0 were committed and never published.
#
#   bash scripts/version-pr-fresh.sh [head]     # default: HEAD
set -euo pipefail
head="${1:-HEAD}"
unconsumed=()
while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in .changeset/README.md) continue ;; esac
  unconsumed+=("$file")
done < <(git ls-tree --name-only "$head" .changeset/ | grep -E '\.md$' || true)
if [ "${#unconsumed[@]}" -gt 0 ]; then
  echo "this version PR still carries changesets, so it was cut before they landed:" >&2
  printf '  %s\n' "${unconsumed[@]}" >&2
  echo "wait for the release workflow to regenerate the PR, then merge it — merging now skips a published version" >&2
  exit 1
fi
echo "the version PR carries no changeset: it consumed everything that landed before it was cut"
