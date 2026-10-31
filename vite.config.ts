import { defineConfig } from "vite-plus";

import { allRules, profiles } from "./tools/ai-automation/src/profiles.ts";

// Out of scope: docs/archive is old; a research prototype is throwaway code that reruns a finding; native/ is its own
// toolchain (C targets, Solid 2 over bun:ffi, headless widgets in single quotes) and is checked by native/test.sh.
const outOfScope = [
  "native/**",
  "docs/archive/**",
  "docs/research/sublayers-proto/**",
  "docs/research/plugin-api-proto/**",
];

// Not linted: inputs of the plugin tests (import build-time members that only exist after the plugin rewrote the
// import, and some are invalid on purpose), the bench files whose type errors budget.mjs expects, and the example projects of the
// docs' playground (files the playground compiles: its editor type-checks them, with a JSX of its own).
const inputs = [
  "apps/docs/examples/**",
  "packages/cssints/test/fixtures/**",
  "packages/icons/test/fixtures/**",
  "packages/mise-en-mode/test/fixtures/**",
  "packages/{fluid,layout,fonts,reset,tokens,gradient,gradient-2d,color-names,motion,squircle,reveal,stuck,balance,masonry,placeholder,ramp,rybitten,skeleton,reactive,devtools,mcp,tui}/test/fixtures/**",
  "packages/cssints/test/pkg/**",
  "packages/css-grammar/bench/err.ts",
  "packages/cssints/bench/errors.ts",
  // The starter kit: a standalone project (its own package.json and tsconfig, outside the workspace), so nothing
  // here resolves its imports. CI runs it end to end instead (scripts/starter-smoke.mjs).
  "templates/**",
  // The starters' six Solid components: the linter's type-check resolves these exact paths under React's JSX
  // runtime (TS7026/TS2875 on every element, whatever tsconfig the app carries) while a copy of the same file
  // lints clean. `bun run typecheck` and the conformance test a copy ships cover them.
  "apps/ui/src/registry/**/*.tsx",
  // The starters ship a copy of the headless driver and its scenario test; both are linted where
  // they come from (packages/headless/test), and a copy here is the file a consumer receives.
  "apps/ui/src/registry/*/dom-driver.ts",
  "apps/ui/src/registry/*/*.browser.test.tsx",
];

// The type-aware no-unsafe-* family: on untyped `.mjs` scripts every import and JSON value is `any`, so it flags all
// of it and nothing that typing would fix.
const noUnsafe = [
  "typescript/no-unsafe-argument",
  "typescript/no-unsafe-assignment",
  "typescript/no-unsafe-call",
  "typescript/no-unsafe-member-access",
  "typescript/no-unsafe-return",
];

// The automation rules of tools/ai-automation, as errors: the whole effect profile (spread into `rules` below), the Effect
// tagged-value rules of anti-slop, and the anti-slop rules that have no violation left or took a cheap fix. The others stay
// off, with their counts, in tools/ai-automation/README.md.
const errors = [
  "no-manual-effect-error-tag",
  "no-manual-tag-comparison",
  "no-manual-tagged-construction",
  "no-service-constructor-imports",
  "no-array-filter-map",
  "no-module-mocking",
  "no-object-parameters",
  "no-reduce-accumulator-copy",
  "no-reflect-apply",
  "no-reflect-get",
  "no-unknown-type-aliases",
  "no-widen-then-assert",
];
const automationErrors: Record<string, "error"> = Object.fromEntries(
  errors.map((r) => [`automation/${r}`, "error"]),
);
const automationOff: Record<string, "off"> = Object.fromEntries(
  Object.keys(allRules).map((r) => [r, "off"]),
);

// Plain code by design (AGENTS.md "The one exception, and the hot paths"): no Effect rule applies.
const plainCode = [
  // Browser runtimes, shipped to the client: no imports, no Effect.
  "packages/cssints/src/runtime.ts",
  "packages/cssints/src/parent-vars.ts",
  "packages/cssints/src/frame.ts",
  "packages/cssints/src/surface.ts",
  "packages/cssints/src/derived.ts",
  // The Typed OM values (`CSS.rem()`, `new CSSColorValue()`) that user code calls in expressions.
  "packages/css-grammar/src/values.ts",
  // The sync css.* builders (`node`, `toDecls`, `chainDecl`, `isNode`), which user code calls in expressions, and the class hash.
  "packages/cssints/src/lib.ts",
  "packages/cssints/src/node.ts",
  // The css functions (`css.calc(...)`): sync builders that user code calls in expressions, built from the generated list.
  "packages/cssints/src/functions.ts",
  // The members of cssints/tui: sync builders that user code calls in expressions, like lib.ts's.
  "packages/cssints/src/tui.ts",
  // The members of cssints/clay and its C printer: sync builders, like tui.ts.
  "packages/cssints/src/clay.ts",
  // @cssints/tui: the runtime of a terminal app (states, themes) and its OpenTUI adapter, called from renderables' events.
  "packages/tui/src/**",
  // The front of cssints/plugin: signatures with generics and one-line bodies (the engine is scope-engine.ts).
  "packages/cssints/src/scope.ts",
  // scope() and the members it makes (chain, call, value): sync builders that user code calls in expressions, like lib.ts's.
  "packages/cssints/src/scope-engine.ts",
  // The members of an export group (cssints/widely-available, ...): the css.* members, checked for the tokens the group bans.
  "packages/cssints/src/group.ts",
  // The twin's lexer and recognizer, per declaration.
  "packages/css-grammar/src/twin-core.ts",
  // @cssints/icons and @cssints/mise-en-mode: sync scope() members, which user code calls in an expression.
  "packages/icons/src/**",
  "packages/mise-en-mode/src/**",
  // The tier-1 plugin packages (cssints-dk1q): sync scope() members, like icons' and mise-en-mode's.
  "packages/fluid/src/**",
  "packages/layout/src/**",
  "packages/fonts/src/**",
  "packages/reset/src/**",
  "packages/tokens/src/**",
  "packages/gradient/src/**",
  // @cssints/color-names: sync scope() members, like icons' and mise-en-mode's.
  "packages/color-names/src/**",
  "packages/motion/src/**",
  // tier 2: scope() members plus the browser runtimes they ship when a target lacks the native feature
  "packages/squircle/src/**",
  "packages/reveal/src/**",
  "packages/stuck/src/**",
  "packages/balance/src/**",
  // tier 2: the DOM runtime of CSS-first interactions (state, events, bindings), shipped to every browser
  "packages/reactive/src/**",
  // its maths (grid.ts) is shared with the runtime, which draws on a canvas: plain code, no Effect
  "packages/gradient-2d/src/**",
  "packages/masonry/src/**",
  // tier 3: build-time assets and generators on scope()
  "packages/placeholder/src/**",
  "packages/ramp/src/**",
  "packages/rybitten/src/**",
  "packages/skeleton/src/**",
  // @cssints/devtools: the Solid UI of the dev inspector (its core is Effect code)
  "packages/devtools/src/ui/**",
  // The files both sides of `/cssints-devtools` share, and the OpenCode plugin: plain Node fs at a tiny boundary, run by OpenCode
  // (no Effect runtime there) and called through Effect.sync by the dev server.
  "packages/cssints/src/devtools-link.ts",
  "packages/devtools/src/opencode.ts",
  // @cssints/headless: plain Solid signals and attribute objects, in the browser (no Effect runtime in a widget); @cssints/apg-specs:
  // the Quint specs' bridges, generator scripts and spec-only tests (the test oracle of the widgets, not published).
  "packages/headless/**",
  "packages/apg-specs/**",
  // The apps are plain Solid and React; the tests, benches and generator scripts are node scripts.
  "apps/**",
  "**/test/**",
  "**/bench/**",
  "packages/*/scripts/**",
  "**/*.mjs",
  "**/vite.config.ts",
  // The linter implementation mirrors AST shapes and parses JSON: exempt from the rules it implements.
  "tools/ai-automation/**",
];

export default defineConfig({
  lint: {
    ignorePatterns: [...outOfScope, ...inputs, "tools/ai-automation/vendor/**", "**/dist/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      "eslint-plugin-playwright",
      { name: "automation", specifier: "./tools/ai-automation/src/plugin.ts" },
    ],
    plugins: ["oxc", "typescript", "vitest", "import", "jsdoc", "promise"],
    categories: {
      correctness: "off",
    },
    overrides: [
      { files: ["**/*.mjs"], rules: Object.fromEntries(noUnsafe.map((r) => [r, "off"])) },
      // Type tests call what does not exist on purpose (`@ts-expect-error`), and that call is `any`.
      {
        files: ["packages/cssints/test/types/**", "packages/tui/test/types/**"],
        rules: {
          ...Object.fromEntries(noUnsafe.map((r) => [r, "off"])),
          "import/namespace": "off",
        },
      },
      // The type-level recognizer: `any` in conditional types is the idiom (unchanged by the port).
      {
        files: ["packages/css-grammar/src/css.ts", "packages/css-grammar/test/probe-typed.ts"],
        rules: { "typescript/no-explicit-any": "off" },
      },
      // Two imports of "cssints", one with `with { type: "cssints" }`, are two modules to the plugin;
      // the rule does not see import attributes.
      {
        files: [
          "apps/demo/**",
          "apps/csssky/**",
          "packages/cssints/test/**",
          "packages/cssints/bench/**",
        ],
        rules: { "import/no-duplicates": "off" },
      },
      { files: plainCode, rules: automationOff },
      // The AST walk is plain code inside the `instrument` boundary; the rest of instrument.ts stays Effect code.
      {
        files: ["packages/cssints/src/instrument.ts"],
        rules: { "automation/no-in-operator": "off", "automation/prefer-effect-match": "off" },
      },
      // supportOf and `get` run per declaration, inside check.ts's one boundary.
      {
        files: ["packages/css-grammar/src/support.ts"],
        rules: { "automation/no-array-filter-map": "off" },
      },
      // The signatures of cssints/plugin are documented by prose: the types carry the parameters and the result.
      {
        files: ["packages/cssints/src/author.ts", "packages/cssints/src/scope.ts"],
        rules: { "jsdoc/require-param": "off", "jsdoc/require-returns": "off" },
      },
      // The widget tests are vitest (browser mode) and the spec tests vitest (node), not Playwright Test: the Playwright rules do not
      // apply. The code is documented by prose (the READMEs), not by JSDoc tags; the tests wait a frame with `new Promise`, and the
      // fixtures print scenario values that are `unknown` on purpose.
      {
        // `apps/ui/src/registry/**` is the same code shipped: the starters' fixtures, drivers and tests
        // are copies of packages/headless/test, so they keep the rules of where they come from.
        files: ["packages/headless/**", "packages/apg-specs/**", "apps/ui/src/registry/**"],
        rules: {
          "playwright/consistent-spacing-between-blocks": "off",
          "playwright/no-force-option": "off",
          "playwright/no-standalone-expect": "off",
          "playwright/prefer-web-first-assertions": "off",
          "jsdoc/require-param": "off",
          "jsdoc/require-returns": "off",
          "promise/avoid-new": "off",
          "typescript/no-base-to-string": "off",
          "typescript/require-await": "off",
        },
      },
      // The bridges and tests read scenario and model JSON: `Array.isArray` on a `Json` value is `any[]`.
      {
        files: ["packages/apg-specs/**", "packages/headless/test/canvas.driver.ts"],
        rules: {
          ...Object.fromEntries(noUnsafe.map((r) => [r, "off"])),
          "typescript/no-redundant-type-constituents": "off",
          "typescript/no-unnecessary-type-assertion": "off",
        },
      },
      // The tool is checked by its own tests and tsgo; its rules read AST nodes typed `any`, its tests are vitest (not Playwright).
      {
        files: ["tools/ai-automation/**"],
        rules: {
          ...Object.fromEntries(noUnsafe.map((r) => [r, "off"])),
          "jsdoc/require-param": "off",
          "jsdoc/require-returns": "off",
          "typescript/no-duplicate-type-constituents": "off",
          "playwright/no-standalone-expect": "off",
        },
      },
    ],
    rules: {
      ...profiles.effect,
      ...automationErrors,
      "eslint/constructor-super": "error",
      "eslint/for-direction": "error",
      "eslint/no-async-promise-executor": "error",
      "eslint/no-caller": "error",
      "eslint/no-class-assign": "error",
      "eslint/no-compare-neg-zero": "error",
      "eslint/no-cond-assign": "error",
      "eslint/no-const-assign": "error",
      "eslint/no-constant-binary-expression": "error",
      "eslint/no-constant-condition": "error",
      "eslint/no-control-regex": "error",
      "eslint/no-debugger": "error",
      "eslint/no-delete-var": "error",
      "eslint/no-dupe-class-members": "error",
      "eslint/no-dupe-else-if": "error",
      "eslint/no-dupe-keys": "error",
      "eslint/no-duplicate-case": "error",
      "eslint/no-empty-character-class": "error",
      "eslint/no-empty-pattern": "error",
      "eslint/no-empty-static-block": "error",
      "eslint/no-eval": "error",
      "eslint/no-ex-assign": "error",
      "eslint/no-extra-boolean-cast": "error",
      "eslint/no-func-assign": "error",
      "eslint/no-global-assign": "error",
      "eslint/no-import-assign": "error",
      "eslint/no-invalid-regexp": "error",
      "eslint/no-irregular-whitespace": "error",
      "eslint/no-iterator": "error",
      "eslint/no-loss-of-precision": "error",
      "eslint/no-misleading-character-class": "error",
      "eslint/no-new-native-nonconstructor": "error",
      "eslint/no-nonoctal-decimal-escape": "error",
      "eslint/no-obj-calls": "error",
      "eslint/no-self-assign": "error",
      "eslint/no-setter-return": "error",
      "eslint/no-shadow-restricted-names": "error",
      "eslint/no-sparse-arrays": "error",
      "eslint/no-this-before-super": "error",
      "eslint/no-unassigned-vars": "error",
      "eslint/no-unsafe-finally": "error",
      "eslint/no-unsafe-negation": "error",
      "eslint/no-unsafe-optional-chaining": "error",
      "eslint/no-unused-expressions": "error",
      "eslint/no-unused-labels": "error",
      "eslint/no-unused-private-class-members": "error",
      "eslint/no-unused-vars": "error",
      "eslint/no-useless-backreference": "error",
      "eslint/no-useless-catch": "error",
      "eslint/no-useless-escape": "error",
      "eslint/no-useless-rename": "error",
      "eslint/no-with": "error",
      "eslint/require-yield": "error",
      "eslint/use-isnan": "error",
      "eslint/valid-typeof": "error",
      "import/default": "error",
      "import/namespace": "error",
      "import/no-duplicates": "error",
      "import/no-named-as-default": "error",
      "import/no-named-as-default-member": "error",
      "import/no-self-import": "error",
      "jsdoc/check-access": "error",
      "jsdoc/check-property-names": "error",
      "jsdoc/check-tag-names": "error",
      "jsdoc/empty-tags": "error",
      "jsdoc/implements-on-classes": "error",
      "jsdoc/no-defaults": "error",
      "jsdoc/require-param": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-name": "error",
      "jsdoc/require-param-type": "error",
      "jsdoc/require-property": "error",
      "jsdoc/require-property-description": "error",
      "jsdoc/require-property-name": "error",
      "jsdoc/require-property-type": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-type": "error",
      "jsdoc/require-yields": "error",
      "oxc/bad-array-method-on-arguments": "error",
      "oxc/bad-char-at-comparison": "error",
      "oxc/bad-comparison-sequence": "error",
      "oxc/bad-min-max-func": "error",
      "oxc/bad-object-literal-comparison": "error",
      "oxc/bad-replace-all-arg": "error",
      "oxc/const-comparisons": "error",
      "oxc/double-comparisons": "error",
      "oxc/erasing-op": "error",
      "oxc/missing-throw": "error",
      "oxc/no-accumulating-spread": "error",
      "oxc/number-arg-out-of-range": "error",
      "oxc/only-used-in-recursion": "error",
      "oxc/uninvoked-array-callback": "error",
      "promise/always-return": "error",
      "promise/avoid-new": "error",
      "promise/catch-or-return": "error",
      "promise/no-callback-in-promise": "error",
      "promise/no-nesting": "error",
      "promise/no-new-statics": "error",
      "promise/no-promise-in-callback": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/valid-params": "error",
      "typescript/await-thenable": "error",
      "typescript/ban-ts-comment": "error",
      "typescript/no-array-delete": "error",
      "typescript/no-base-to-string": "error",
      "typescript/no-duplicate-enum-values": "error",
      "typescript/no-duplicate-type-constituents": "error",
      "typescript/no-empty-object-type": "error",
      "typescript/no-explicit-any": "error",
      "typescript/no-extra-non-null-assertion": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-for-in-array": "error",
      "typescript/no-implied-eval": "error",
      "typescript/no-misused-new": "error",
      "typescript/no-misused-promises": "error",
      "typescript/no-namespace": "error",
      "typescript/no-non-null-asserted-optional-chain": "error",
      "typescript/no-redundant-type-constituents": "error",
      "typescript/no-require-imports": "error",
      "typescript/no-this-alias": "error",
      "typescript/no-unnecessary-type-assertion": "error",
      "typescript/no-unnecessary-type-constraint": "error",
      "typescript/no-unsafe-argument": "error",
      "typescript/no-unsafe-assignment": "error",
      "typescript/no-unsafe-call": "error",
      "typescript/no-unsafe-declaration-merging": "error",
      "typescript/no-unsafe-enum-comparison": "error",
      "typescript/no-unsafe-function-type": "error",
      "typescript/no-unsafe-member-access": "error",
      "typescript/no-unsafe-return": "error",
      "typescript/no-unsafe-unary-minus": "error",
      "typescript/no-wrapper-object-types": "error",
      "typescript/only-throw-error": "error",
      "typescript/prefer-as-const": "error",
      "typescript/prefer-namespace-keyword": "error",
      "typescript/prefer-promise-reject-errors": "error",
      "typescript/require-await": "error",
      "typescript/restrict-plus-operands": "error",
      "typescript/restrict-template-expressions": "error",
      "typescript/triple-slash-reference": "error",
      "typescript/unbound-method": "error",
      "vitest/no-import-node-test": "error",
      "vitest/require-local-test-context-for-concurrent-snapshots": "error",
      "playwright/consistent-spacing-between-blocks": "error",
      "playwright/expect-expect": "error",
      "playwright/max-nested-describe": "error",
      "playwright/missing-playwright-await": "error",
      "playwright/no-commented-out-tests": "error",
      "playwright/no-conditional-expect": "error",
      "playwright/no-conditional-in-test": "error",
      "playwright/no-element-handle": "error",
      "playwright/no-eval": "error",
      "playwright/no-focused-test": "error",
      "playwright/no-force-option": "error",
      "playwright/no-nested-step": "error",
      "playwright/no-networkidle": "error",
      "playwright/no-nth-methods": "error",
      "playwright/no-page-pause": "error",
      "playwright/no-skipped-test": "error",
      "playwright/no-standalone-expect": "error",
      "playwright/no-unsafe-references": "error",
      "playwright/no-unused-locators": "error",
      "playwright/no-useless-await": "error",
      "playwright/no-useless-not": "error",
      "playwright/no-wait-for-navigation": "error",
      "playwright/no-wait-for-selector": "error",
      "playwright/no-wait-for-timeout": "error",
      "playwright/prefer-web-first-assertions": "error",
      "playwright/valid-describe-callback": "error",
      "playwright/valid-expect": "error",
      "playwright/valid-expect-in-promise": "error",
      "playwright/valid-test-tags": "error",
      "playwright/valid-title": "error",
    },
  },
  fmt: {
    // What `vp fmt` applies today. vite-plus 1.0.0 does not read this block (checked on a bare project: `useTabs: true`
    // here changes nothing, the same key in .oxfmtrc.json does), so oxfmt runs with its defaults; the values below are
    // those defaults, written out so the config tells the truth. Tabs, 120 columns and import sorting were the old intent;
    // switching to them is a mass reformat, to be done in a commit of its own if wanted (cssints-uhu6).
    // What the formatter skips is in .prettierignore, which `vp fmt` reads.
    ignorePatterns: ["**/node_modules/**", "**/dist/**", ".beans/**"],
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    singleQuote: false,
    semi: true,
    trailingComma: "all",
    arrowParens: "always",
  },
});
