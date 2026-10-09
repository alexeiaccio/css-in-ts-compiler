// The MCP server of cssints on effect/ai McpServer: the tools as a Toolkit with Schema-typed parameters, their handlers,
// and `layer`, which needs a Stdio (NodeStdio in bin.ts, a test Stdio in test/tools.mjs).
import { Effect, Layer, Logger, Schema } from "effect";
import { McpProtocol, McpServer, Tool, Toolkit } from "effect/ai";

import { checkDeclaration, checkSupport, ToolError } from "./check.ts";
import { checkContrast } from "./contrast.ts";

const Failure = Schema.instanceOf(ToolError);
const Text = (description: string) => Schema.String.annotate({ description });
const Maybe = <S extends Schema.Top>(s: S) => Schema.optional(s);

const CheckDeclaration = Tool.make("check_declaration", {
  description: `Checks one CSS declaration the way a cssints build does (the grammar of the property, value ranges such as <length [0,∞]>, and the validity rules the specs state in prose). Answers ok, or the exact error message the build would print. Use it before writing a css.* call whose value you are not sure of.
Example: { "property": "padding", "value": "-1rem" } -> { "ok": false, "message": "padding: unexpected \\"-1rem\\" in \\"-1rem\\", expected <length-percentage [0,∞]>" }`,
  parameters: Schema.Struct({
    property: Text(
      "The property, camelCase as the cssints member (fontSize) or kebab-case (font-size)",
    ),
    value: Text('The value text, as in css.fontSize("1rem"): "1rem"'),
  }),
  success: Schema.Struct({
    ok: Schema.Boolean,
    property: Schema.String,
    value: Schema.String,
    message: Maybe(Schema.String),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false);

const CheckSupport = Tool.make("check_support", {
  description: `Which target browsers lack a CSS property, or the features in a value (keywords, functions), by MDN browser-compat-data: the support warnings of a cssints build, with the BCD key of each. Targets: a browserslist query, else the project's browserslist config (package.json "browserslist" or .browserslistrc from the working directory), as the plugin reads it. Use it to decide whether a feature needs a fallback (firstThatWorks).
Example: { "property": "textWrap", "value": "balance", "query": "chrome 109" } -> { "supported": false, "lacking": [{ "feature": "text-wrap", "key": "css.properties.text-wrap", "targets": "chrome 109", ... }] }`,
  parameters: Schema.Struct({
    property: Text("The property, camelCase or kebab-case"),
    value: Maybe(Text("A value: its keywords and functions are looked up too")),
    query: Maybe(Text('A browserslist query, e.g. "defaults" or "safari >= 16"')),
  }),
  success: Schema.Struct({
    property: Schema.String,
    value: Maybe(Schema.String),
    query: Schema.String,
    targets: Schema.String,
    known: Schema.Boolean.annotate({ description: "BCD has the property" }),
    supported: Schema.Boolean,
    lacking: Schema.Array(
      Schema.Struct({
        feature: Schema.String,
        key: Schema.String,
        targets: Schema.String,
        message: Schema.String,
      }),
    ),
    rule: Schema.String,
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false);

const CheckContrast = Tool.make("check_contrast", {
  description: `The WCAG 2.x contrast ratio of two CSS colours, computed as css.check.contrast does in a build (any CSS colour syntax culori reads; outside sRGB is clipped; translucent colours are refused). The ratio is cut, not rounded, at two places, so 4.499 is "4.49". With min, says whether it passes (4.5 is WCAG AA for body text, 3 for large text).
Example: { "foreground": "#777", "background": "white", "min": 4.5 } -> { "ok": false, "ratio": "4.47", "min": 4.5, "message": "contrast 4.47 is below 4.5" }`,
  parameters: Schema.Struct({
    foreground: Text("The text colour, e.g. oklch(40% 0.1 250)"),
    background: Text("The background colour"),
    min: Maybe(Schema.Finite.check(Schema.isBetween({ minimum: 1, maximum: 21 }))).annotate({
      description: "The minimum ratio, 1 to 21",
    }),
  }),
  success: Schema.Struct({
    ok: Schema.Boolean,
    ratio: Maybe(Schema.String),
    min: Maybe(Schema.Finite),
    message: Maybe(Schema.String),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false);

export const tools = Toolkit.make(CheckDeclaration, CheckSupport, CheckContrast);

const handlers = tools.toLayer(
  Effect.gen(function* () {
    return tools.of({
      check_declaration: ({ property, value }) => checkDeclaration(property, value),
      check_support: ({ property, value, query }) => checkSupport(property, value, query),
      check_contrast: ({ foreground, background, min }) =>
        checkContrast(foreground, background, min),
    });
  }),
);

const stdio = McpServer.layerStdio({
  name: "cssints",
  version: "0.1.0",
  protocols: [
    McpProtocol.v2025_11_25,
    McpProtocol.v2025_06_18,
    McpProtocol.v2025_03_26,
    McpProtocol.v2024_11_05,
  ],
}).pipe(Layer.provide(Layer.succeed(Logger.LogToStderr, true)));

/** The server over stdio: provide a Stdio. Logs go to stderr; stdout is the protocol. */
export const layer = Layer.mergeAll(McpServer.toolkit(tools).pipe(Layer.provide(handlers)), stdio);
