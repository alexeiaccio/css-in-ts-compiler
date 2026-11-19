#!/usr/bin/env bash
# Merge a "Version Packages" pull request, but only while it is current.
#
# The staleness check is not a CI gate, and cannot be one: the version branch is pushed by
# `changesets/action` with `GITHUB_TOKEN`, and GitHub suppresses the events a token's push would
# raise — so no `pull_request`/`pull_request_target` run is ever created for an updated version
# PR (measured: the branch moved at 16:45 and the workflow's last run for it was two days old).
# The one moment a stale version PR can be caught is the merge, so the merge is the gate.
#
#   bash scripts/merge-version-pr.sh <pr-number>
set -euo pipefail
pr="${1:-}"
if [ -z "$pr" ]; then
  echo "usage: scripts/merge-version-pr.sh <pr-number>" >&2
  exit 2
fi
gh pr view "$pr" --json headRefName -q .headRefName | grep -q '^changeset-release/' || {
  echo "#$pr is not a Version Packages pull request" >&2
  exit 2
}
git fetch -q origin master "+refs/pull/$pr/head:refs/remotes/pr/version-$pr"
bash "$(dirname "$0")/version-pr-fresh.sh" origin/master "refs/remotes/pr/version-$pr"
gh pr merge "$pr" --merge
