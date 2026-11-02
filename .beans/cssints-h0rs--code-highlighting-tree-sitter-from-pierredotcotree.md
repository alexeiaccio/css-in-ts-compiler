---
# cssints-h0rs
title: 'Code highlighting: tree-sitter, from pierredotco/tree-sitter-languages'
status: completed
type: task
priority: deferred
created_at: 2026-11-02T13:57:46Z
updated_at: 2026-11-02T14:58:33Z
---

Recorded 2026-11-02, no code yet.

**The choice**: code highlighting (the docs' Files view, and the terminal/desktop code pane) reads grammars and highlight queries from `pierredotco/tree-sitter-languages` (MIT), not from Shiki and not from TextMate grammars.

**What the repo is**: Go bindings for vendored grammars. Its `typescript/`, `tsx/`, `javascript/` directories ship **only queries**: `highlights.scm`, generated from a pinned grammar with every token classified (`queries/tokens.json` fails the build on an unclassified token), from `zed-industries/tree-sitter-typescript@e2c53597d6a5` and `tree-sitter/tree-sitter-javascript@v0.25.0`. GraphQL, YAML, Dockerfile, Make, Nix, Svelte and Vue vendor the grammar's C `src/`. Versions `v0.1.0`-`v0.2.0` are retracted; use `v0.3.0` or later.

**What we take**: the `.scm` queries (ours is a TSX codebase) and, when a language is outside TS, the vendored C grammar. **What we do not take**: the Go bindings — there is no Go in this repository.

**Two consumers**:
- `native/terminal` and `native/desktop`: the only highlighter that fits C. Tree-sitter's `parser.c` + these queries produce spans; the renderer maps spans to theme tokens (truecolour cells, ThorVG runs).
- `apps/docs`: the Files pane and source blocks, highlighted at build time. Shiki stays for the API blocks: twoslash needs types, and a second pipeline for no hover is not worth it.

**First step when this is picked**: the TSX parser + `tsx/queries/highlights.scm` into the terminal's cell renderer, with the docs' Files pane as the second reader of the same spans.

See the note in `native/docs/map.md` ("Highlighting: tree-sitter").

## The packaged highlighter (2026-11-02)

`@pierre/highlights` 0.3.0 (Apache-2.0) is the reader for the TypeScript side: lexers written in WAT (no syntax tree), 152 languages including `tsx`, `css`, `bash` and `json`, 65 Shiki-catalog and 10 Pierre themes with `toCSS` for CSS variables, `codeToHtml` / `codeToTokens` / streaming / document edits, synchronous after import in Node, browsers and workerd. The docs' Files pane and example blocks use it with a theme built from our tokens; Shiki stays only for the API blocks, where twoslash needs types.

The package is 333 kB of wasm (147 kB gzipped). That is the line to native: the terminal and the desktop do not carry a wasm runtime for this, so they use tree-sitter's C parser with the same `.scm` queries from `pierredotco/tree-sitter-languages` (`tsx/queries/highlights.scm`, pinned grammar, every token classified; vendored C grammars for Dockerfile, GraphQL, Make, Nix, Svelte, Vue, YAML).

## Summary of Changes

**Native: done (2026-11-02).** `terminal/code.c` parses TSX with tree-sitter and paints the query's captures into the terminal's cell grid; `terminal/test_code.c` is the check and the pane (`code file.tsx`, `--ansi` for escapes), `terminal/expected-code.txt` is the stored fixture dump, and `check.sh` runs it. Vendored under `native/vendor/`: tree-sitter v0.25.10 (MIT), the tsx grammar `parser.c`/`scanner.c` from zed-industries/tree-sitter-typescript@e2c53597d6a5 (MIT), and the v0.3.0 TSX `highlights.scm` (MIT). The Go bindings are not taken.

The query is embedded by `generator/highlights-header.ts` (the terminal has no file system) and compiled once; its four predicate spellings (`#match?`, `#not-match?`, `#eq?` and their patterns) are evaluated in C, and any other predicate or unclassified capture fails `test_code.c` rather than painting nothing. Where two captures cover the same text a fixed kind ranking decides (a variable naming a component is a tag, `css.cn` is a function though it is also a property); the innermost span wins over an outer one. Tabs are the next multiple of 4, a wide line is clipped, a file that does not parse is still drawn. The one theme is dark and every colour is asserted at 4.5:1 on its background.

Cost: 9.3 MB of vendored C, 6 s of `cc` in `check.sh`, about a second of start-up for `ts_query_new` over the 283k-line grammar (1080 lines drawn on top cost nothing measurable). Not yet wired into `demo`: a live file pane needs keys and scrolling first, and every `demo` build would carry the grammar.

**Docs side: not started.** The Files pane and the example blocks are to read `@pierre/highlights` with a theme from our tokens, Shiki staying where twoslash needs types; tracked in `cssints-sbce`.
