import type { RuleTester } from "oxlint/plugins-dev";

/** The rule shape expected by `RuleTester.run`. */
type TestableRule = Parameters<RuleTester["run"]>[1];

/**
 * Bridge helper for tests.
 *
 * Hand-written rules and the vendored anti-slop rules are typed against
 * different Oxlint package releases (`oxlint/plugins-dev` versus
 * `@oxlint/plugins`), so their structurally similar `Rule` declarations are not
 * mutually assignable. This is the single, deliberate boundary cast; the
 * runtime rule shapes are identical. Keep all such bridging here.
 */
export const asTestableRule = (rule: unknown): TestableRule => rule as TestableRule;
