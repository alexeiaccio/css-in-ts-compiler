import type { RuleTester } from "oxlint/plugins-dev";
import noExplicitFunctionReturnType from "./rules/no-explicit-function-return-type.ts";
import noLet from "./rules/no-let.ts";
import noProseComments from "./rules/no-prose-comments.ts";

type Rule = Parameters<RuleTester["run"]>[1];

interface Plugin {
  readonly meta: {
    readonly name: string;
  };
  readonly rules: Readonly<Record<string, Rule>>;
}

const plugin: Plugin = {
  meta: {
    name: "diff-check",
  },
  rules: {
    "no-explicit-function-return-type": noExplicitFunctionReturnType,
    "no-let": noLet,
    "no-prose-comments": noProseComments,
  },
};

export default plugin;
