import type { RuleTester } from "oxlint/plugins-dev";

type Rule = Parameters<RuleTester["run"]>[1];

const isTestFile = (filename: string) =>
  /\/test\//.test(filename) || /\.test\.(?:ts|tsx|mts|mjs)$/.test(filename);

const rule: Rule = {
  meta: {
    type: "suggestion" as const,
    docs: {
      description:
        "Disallow setTimeout in a test file, except where the delay is the subject and the file's allowance covers it.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = String(context.filename ?? "");
    if (!isTestFile(filename)) {
      return {};
    }
    const options = (context.options?.[0] ?? {}) as { readonly allow?: Record<string, number> };
    const allow = options.allow ?? {};
    const allowed = Object.entries(allow).find(([path]) => filename.endsWith(path))?.[1] ?? 0;
    const seen: unknown[] = [];
    let start: unknown;

    return {
      Program(node) {
        start = node;
      },
      CallExpression(node) {
        const callee = node.callee;
        const timer =
          (callee.type === "Identifier" && callee.name === "setTimeout") ||
          (callee.type === "MemberExpression" &&
            callee.property.type === "Identifier" &&
            callee.property.name === "setTimeout");
        if (timer) {
          seen.push(node);
        }
      },
      "Program:exit"() {
        for (const [index, node] of seen.entries()) {
          if (index < allowed) {
            continue;
          }
          context.report({
            node: node as never,
            message: `Await the operation or the signal it emits; a fixed delay passes on an idle machine and fails on a loaded one. ${allowed ? `${allowed} setTimeout ${allowed === 1 ? "is" : "are"} allowed in this file.` : "No setTimeout is allowed in this file."}`,
          });
        }
        if (seen.length < allowed) {
          context.report({
            node: (start ?? seen[0]) as never,
            message: `The allowlist says ${allowed} setTimeout in this file and it has ${seen.length}: remove the stale entry.`,
          });
        }
      },
    };
  },
};

export default rule;
