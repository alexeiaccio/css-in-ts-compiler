import type { RuleTester } from "oxlint/plugins-dev";
import noTestSleep from "./rules/no-test-sleep.ts";

type Rule = Parameters<RuleTester["run"]>[1];

interface Plugin {
  readonly meta: { readonly name: string };
  readonly rules: Readonly<Record<string, Rule>>;
}

const plugin: Plugin = {
  meta: { name: "flakes" },
  rules: { "no-test-sleep": noTestSleep },
};

export default plugin;
