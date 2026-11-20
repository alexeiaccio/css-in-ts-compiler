import type { RuleTester } from "oxlint/plugins-dev";

type Rule = Parameters<RuleTester["run"]>[1];

// A comment that says why, rather than what a tool must read. The repo's decisions live in docs/wayfinder.md and the commit
// message; a line of prose in the code is a second copy that drifts. This runs on added lines only (the diff check), so the
// reasoning already written stays where it is and the rule applies to what is being written now.
const DIRECTIVE = [
  "oxlint-",
  "eslint-",
  "@ts-",
  "@effect-diagnostics",
  "@vitest-",
  "@jsxImportSource",
  "@__PURE__",
  "SPDX-",
  "@license",
  "@preserve",
  "@ts-check",
  "@ts-nocheck",
];

// The one-line prefixes a comment may keep: a footgun that will bite again, a declaration of safety an assertion needs, and
// the marker of a deliberate shortcut.
const ALLOWED_PREFIX = ["WARNING", "SAFETY", "ponytail:"];

const isDirective = (text: string) => DIRECTIVE.some((marker) => text.includes(marker));
const isAllowed = (text: string) => ALLOWED_PREFIX.some((prefix) => text.startsWith(prefix));

const rule: Rule = {
  meta: {
    type: "suggestion" as const,
    docs: {
      description:
        "Disallow prose comments in newly added code; a directive or a WARNING line is kept.",
    },
  },
  create(context) {
    const comments = context.sourceCode?.getAllComments?.() ?? [];
    return {
      Program() {
        for (const comment of comments) {
          // `/** */` is the public API's TSDoc and a licence banner; a `/* */` block or a `//` line is prose
          if (comment.type === "Block" && comment.value.startsWith("*")) {
            continue;
          }
          const text = comment.value.trim();
          if (text === "" || isDirective(text) || isAllowed(text)) {
            continue;
          }
          context.report({
            loc: comment.loc ?? undefined,
            message:
              "Do not explain code in a comment: name the thing so the code says it, or put the reason in the commit and docs/wayfinder.md. A directive, a `// WARNING:` line or TSDoc on public API is kept.",
          });
        }
      },
    };
  },
};

export default rule;
