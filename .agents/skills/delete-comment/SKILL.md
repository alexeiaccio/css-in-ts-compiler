---
name: delete-comment
description: Audit the comments in this repository, delete the ones that earn nothing, file the hacks they excuse, and lower the comment budget. Use when the user asks to clean up comments, audit comment quality, or run the delete-comment pass.
---

# delete-comment

A comment is a claim about code that the compiler does not check. Four kinds exist, and only one of them is worth keeping in
the file:

| kind                | what it looks like                                             | what to do                                                                         |
| ------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Tautology**       | renames the next line ("Info section" above `infoSection`)     | delete                                                                             |
| **Stale**           | names a file, symbol or behaviour that no longer exists        | delete                                                                             |
| **Excuse**          | "for now", "good enough", "until we", "works because"          | delete, and open a bean for the hack                                               |
| **Decision record** | why this and not the other thing, what breaks if you change it | move the _repository-wide_ part to `docs/wayfinder.md`, keep the local consequence |

This repository is the far end of that scale: an audit on 2026-11-20 found **6846 prose `//` lines in 933 files**, of which
2 were tautologies, 0 stale, 0 excuses and the rest decision records. Deleting everything the table says to delete shed 3
lines. Do not run this pass expecting a cleanup; run it to find the handful that lie, and to keep the budget from growing.

## The pass

1. **Classify.** `node .agents/skills/delete-comment/classify.mjs` walks `packages/*` and `apps/*` (skipping generated files,
   tests, fixtures and vendored code), joins a `//` block into one comment, and prints the four buckets with counts and
   samples. The classifier is a heuristic: read the samples of each bucket before deleting anything.
2. **Delete tautologies and stale comments.** They earn nothing at the point of use. A comment that survives is one whose
   deletion would make the next reader ask a question.
3. **File a bean for every excuse.** A `// for now` is a debt the repository is pretending not to have: `beans create
"<what the shortcut costs>" --type bug --body "<the comment, the file, and what the honest version looks like>"`. The
   `ponytail:` marker is the same thing already named: harvest those with the `ponytail-debt` skill rather than deleting
   them.
4. **Duplicated decisions.** A block whose six-word shingle already appears in `docs/wayfinder.md` is a second copy of an
   ADR: the decision is recorded, so the code copy can go. Measure them, then delete by hand in a slice — 586 blocks carried
   1761 lines on 2026-11-20, and the local sentence is often the only one a reader of the function ever sees.
5. **Lower the budget.** `node scripts/comment-budget.mjs --update`, then commit `comment-budget.json` with the change. A
   budget that is not lowered after a deletion fails the pass (that is the ratchet, and it is why the numbers only move
   down).
6. **Verify.** `bun run lint:comments`, `bun run lint:flakes`, `bun run typecheck`, and the tests of every package whose comments
   changed. Comments do not change behaviour; the diff should show nothing else.

## What this repository already enforces

- `diff:check` runs `no-prose-comments` on the lines added since master: a new `//` line is a violation unless it is a
  directive, a `// WARNING:`/`// SAFETY:`/`// ponytail:` marker, TSDoc or a licence banner. The reason belongs in the commit
  message and `docs/wayfinder.md`.
- `bun run lint:comments` holds the per-package budget (`comment-budget.json`): a package over its number fails, and a
  package under it fails until the entry is lowered.
- TSDoc (`/** */`) is not counted: it is the published API's contract, not prose about it.

## Not worth doing

- **Deleting the file headers of the primitives.** They state the accessibility contract the code cannot express: a
  `role="treeitem"` says nothing about Tab leaving the tree, a `data-state` says nothing about the platform owning the focus.
- **Rewriting decision records as naming.** A name can say _what_; the reason a `<dialog>` is not used here, or why the
  buffer wraps at the report, has nowhere else to live.
