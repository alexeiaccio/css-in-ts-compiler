import { assert, describe, expect, it } from "vite-plus/test";
import {
  collectChangedFileViolations,
  collectViolations,
  parseAddedLineRanges,
  renderReport,
} from "../src/diff-check.ts";
import { parseArguments, parseConfig } from "../src/main.ts";
import { RuleTester } from "oxlint/plugins-dev";
import { changedFileRules } from "../src/changed-file-rules.ts";
import noExplicitFunctionReturnType from "../src/rules/no-explicit-function-return-type.ts";
import noLet from "../src/rules/no-let.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: {
      lang: "ts",
    },
  },
});

tester.run("diff-check/no-let", noLet, {
  valid: ["const value = 1;", "var legacyValue = 1;"],
  invalid: [
    {
      code: "let value = 1;",
      errors: [/Do not use let/],
    },
  ],
});

tester.run("diff-check/no-explicit-function-return-type", noExplicitFunctionReturnType, {
  valid: [
    "function value() { return 1; }",
    "const value = () => 1;",
    "const object = { value() { return 1; } };",
  ],
  invalid: [
    {
      code: "function value(): number { return 1; }",
      errors: [/Do not explicitly declare a function return type/],
    },
    {
      code: "const value = (): number => 1;",
      errors: [/Do not explicitly declare a function return type/],
    },
    {
      code: "const object = { value(): number { return 1; } };",
      errors: [/Do not explicitly declare a function return type/],
    },
  ],
});

describe("diff check", () => {
  it("loads neutral configuration and applies defaults", () => {
    assert.deepStrictEqual(parseConfig({}), {
      baseRef: "HEAD",
      changedFileRules: [],
      excludePathPrefixes: ["dist/", "coverage/", "vendor/"],
      oxlintConfigPath: "./diff-check.oxlintrc.json",
      sourceExtensions: [".ts", ".tsx"],
    });
  });

  it("rejects malformed configuration", () => {
    assert.throws(
      () => parseConfig({ sourceExtensions: "*.ts" }),
      /sourceExtensions must be an array of strings/,
    );
    assert.throws(() => parseConfig({ baseRef: "" }), /baseRef must be a non-empty string/);
  });

  it("parses CLI overrides and rejects unknown arguments", () => {
    expect(parseArguments(["--config", "review.json", "--base", "origin/main"])).toEqual({
      baseRef: "origin/main",
      configPath: "review.json",
      help: false,
    });
    assert.throws(() => parseArguments(["--unknown"]), /Unknown argument: --unknown/);
  });

  it("parses added line ranges and excludes deleted hunks", () => {
    assert.deepStrictEqual(
      parseAddedLineRanges("@@ -4,2 +4,3 @@\n context\n@@ -12 +13,0 @@\n-deleted"),
      [{ start: 4, end: 6 }],
    );
  });

  it("reports only diagnostics on added lines", () => {
    const violations = collectViolations({
      addedLines: new Map([["src/example.ts", [{ start: 4, end: 6 }]]]),
      diagnostics: [
        {
          code: "diff-check(no-let)",
          filename: "src/example.ts",
          message: "Do not use let.",
          severity: "warning",
          labels: [{ span: { line: 5, column: 3 } }],
        },
        {
          code: "diff-check(no-let)",
          filename: "src/example.ts",
          message: "Do not use let.",
          severity: "warning",
          labels: [{ span: { line: 9, column: 3 } }],
        },
      ],
    });

    assert.strictEqual(
      renderReport({ useColor: false, violations }),
      [
        "Diff check",
        "",
        "WARNINGS (1)",
        "",
        "  ⚠ diff-check/no-let (1)",
        "",
        "    src/example.ts:5:3",
        "      Do not use let.",
        "",
        "1 warning",
        "Found 1 violation across 1 rule in 1 file.",
      ].join("\n"),
    );
  });

  it("flags configured key files, directories, and non-TypeScript files", () => {
    const violations = collectChangedFileViolations({
      files: [
        "database/migrations/schema.ts",
        "config/runtime.ts",
        "styles/globals.css",
        "src/page.tsx",
      ],
      rules: changedFileRules,
    });

    assert.deepStrictEqual(
      violations.map(({ filename, message }) => ({ filename, message })),
      [
        {
          filename: "database/migrations/schema.ts",
          message: "A database migration changed.",
        },
        {
          filename: "config/runtime.ts",
          message: "A runtime configuration file changed.",
        },
        {
          filename: "styles/globals.css",
          message: "A non-TypeScript file changed.",
        },
      ],
    );
  });

  it("groups diagnostics by severity and rule", () => {
    const report = renderReport({
      useColor: false,
      violations: [
        {
          rule: "diff-check/no-let",
          message: "Do not use let.",
          severity: "warning",
          filename: "src/example.ts",
          line: 2,
          column: 1,
        },
        {
          rule: "diff/key-file-change",
          message: "A non-TypeScript file changed.",
          severity: "error",
          filename: "config.json",
          line: null,
          column: null,
        },
        {
          rule: "diff-check/no-let",
          message: "Do not use let.",
          severity: "warning",
          filename: "src/other.ts",
          line: 4,
          column: 3,
        },
      ],
    });

    assert.match(report, /ERRORS \(1\)[\s\S]*WARNINGS \(2\)/);
    assert.match(report, /diff-check\/no-let \(2\)/);
    assert.match(report, /1 error · 2 warnings/);
  });

  it("adds terminal colors only when enabled", () => {
    const violations = [
      {
        rule: "diff-check/no-let",
        message: "Do not use let.",
        severity: "warning" as const,
        filename: "src/example.ts",
        line: 2,
        column: 1,
      },
    ];

    assert.strictEqual(renderReport({ useColor: false, violations }).includes("\u001B["), false);
    assert.strictEqual(renderReport({ useColor: true, violations }).includes("\u001B["), true);
  });
});
