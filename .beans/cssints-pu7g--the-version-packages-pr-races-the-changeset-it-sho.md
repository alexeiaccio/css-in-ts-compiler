---
# cssints-pu7g
title: The Version Packages PR races the changeset it should carry, so versions skip
status: todo
type: bug
priority: normal
created_at: 2026-11-17T09:43:30Z
updated_at: 2026-11-17T09:43:30Z
---

Seen three times now (0.40.0 and 0.42.0 were **committed but never published**, and a duplicate Version PR was opened and closed in the 0.33.0 release):

1. a Version Packages PR is generated from master at some commit;
2. another PR carrying a changeset merges before anyone merges the Version PR;
3. merging the Version PR publishes the *older* set, leaves the new changeset on master, and the release workflow immediately opens the **next** Version PR;
4. the version of the skipped release exists in git and in tags, never on npm — harmless in itself, but "what is the latest" now has two answers, and each step costs a release run.

**Fix direction**: do not merge a Version Packages PR whose head is behind master. `gh pr view --json mergeable` is not enough (a stale-but-clean branch says MERGEABLE); compare `git merge-base --is-ancestor <pr-head> origin/master` after the action's last push, or wait until the PR's body lists the changeset you expect. A bot check ("this version PR predates changesets present on master") would turn the race into a sentence.

Not a bug in the packages — a release-process bug, and the one that has bitten most often.
