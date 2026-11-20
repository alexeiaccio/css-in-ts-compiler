import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vite-plus/test";
import noTestSleep from "../rules/no-test-sleep.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run("flakes/no-test-sleep", noTestSleep, {
  valid: [
    // not a test file: a debounce is what the source is for
    { code: "setTimeout(() => {}, 10);", filename: "src/debounce.ts" },
    // the allowance covers the one delay the file is about
    {
      code: "await new Promise((r) => setTimeout(r, 200));",
      filename: "apps/ui/src/registry/carousel/carousel.browser.test.tsx",
      options: [{ allow: { "carousel/carousel.browser.test.tsx": 1 } }],
    },
  ],
  invalid: [
    {
      code: "await new Promise((r) => setTimeout(r, 20));",
      filename: "packages/headless/test/popover.browser.test.tsx",
      errors: [/No setTimeout is allowed in this file/],
    },
    {
      code: "await new Promise((r) => setTimeout(r, 20));\nawait new Promise((r) => setTimeout(r, 30));",
      filename: "packages/headless/test/popover.browser.test.tsx",
      options: [{ allow: { "popover.browser.test.tsx": 1 } }],
      errors: [/1 setTimeout is allowed in this file/],
    },
    {
      code: "const value = 1;",
      filename: "packages/headless/test/popover.browser.test.tsx",
      options: [{ allow: { "popover.browser.test.tsx": 1 } }],
      errors: [/The allowlist says 1 setTimeout in this file and it has 0/],
    },
  ],
});
