// The MCP server of cssints on effect/ai McpServer: the tools as a Toolkit with Schema-typed parameters, their handlers,
// and `layer`, which needs a Stdio (NodeStdio in bin.ts, a test Stdio in test/tools.mjs).
import { Effect, Layer, Logger, Schema } from "effect";
import { McpProtocol, McpServer, Tool, Toolkit } from "effect/ai";

import { checkDeclaration, checkSupport, ToolError } from "./check.ts";
import { checkContrast } from "./contrast.ts";
import { Compiler } from "./compile.ts";
import { listPlugins, searchDocs } from "./docs.ts";
import { Inspector } from "./browser.ts";
import { Live } from "./live.ts";

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

const Located = Schema.Struct({
  message: Schema.String,
  file: Schema.String,
  line: Maybe(Schema.Finite),
  column: Maybe(Schema.Finite.annotate({ description: "1-based" })),
  location: Schema.String.annotate({ description: "file:line:col" }),
});

const Compile = Tool.make("compile", {
  description: `Compiles one module of a project through the real cssints Vite plugin, as the dev server does, and answers what it made: the class strings in the transformed code, the CSS the module adds to the sheet, the transformed code, and the build errors (file:line:col of the css.* call) and warnings. Give a file path, or source text with a filename (the file need not exist; relative imports resolve from it). The Vite server of a project starts on the first call (a few seconds) and is reused; the project's vite.config is loaded when it has one.
Example: { "file": "src/Button.ts", "source": "import { css } from \\"cssints\\" with { type: \\"cssints\\" };\\nexport const b = css.padding(\\"1rem\\");" } -> { "ok": true, "classes": ["_1x2y3z"], "css": "@layer _.k, ...; @layer _.a{._1x2y3z{padding:1rem}}", ... }`,
  parameters: Schema.Struct({
    file: Text(
      "The module's path, absolute or relative to root; with source, the filename it is compiled as",
    ),
    source: Maybe(Text("The module's text, instead of the file on disk")),
    root: Maybe(
      Text(
        "The project root (where vite.config and package.json are); default: the server's working directory",
      ),
    ),
  }),
  success: Schema.Struct({
    ok: Schema.Boolean,
    file: Schema.String,
    classes: Schema.Array(Schema.String),
    css: Schema.String,
    code: Schema.String,
    errors: Schema.Array(Located),
    warnings: Schema.Array(Schema.Struct({ file: Schema.String, message: Schema.String })),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false);

const SearchDocs = Tool.make("search_docs", {
  description: `Searches the cssints documentation (docs/API.md, README.md and the plugin packages' READMEs; in a project, the READMEs installed in node_modules) and answers the matching sections, best first: the file and line, the heading and its trail of parent headings, and a short excerpt. Use it to find how an API works or what an error means before reading the whole file at that line.
Example: { "query": "firstThatWorks fallback" } -> { "results": [{ "heading": "Fallbacks: \`firstThatWorks\` (decided 2026-10-01, cssints-bogz)", "file": ".../docs/API.md", "line": 379, "excerpt": "…" }] }`,
  parameters: Schema.Struct({
    query: Text(
      'Words to look for, e.g. "check.contrast themes"; sections that hold more of them rank first',
    ),
    limit: Maybe(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 20 }))).annotate({
      description: "How many sections, 1 to 20 (default 5)",
    }),
  }),
  success: Schema.Struct({
    sources: Schema.Array(Schema.String),
    results: Schema.Array(
      Schema.Struct({
        file: Schema.String,
        line: Schema.Finite,
        heading: Schema.String,
        path: Schema.String,
        excerpt: Schema.String,
      }),
    ),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false);

const ListPlugins = Tool.make("list_plugins", {
  description: `Lists the cssints plugin packages (@cssints/fluid, layout, motion, ...): their members (what to import and call), what each does, and the README to read. Use it to find a ready-made plugin before writing a pattern by hand; import a plugin with the attribute, like cssints: import { fluid } from "@cssints/fluid" with { type: "cssints" }.
Example: {} -> { "plugins": [{ "name": "@cssints/fluid", "members": "\`fluid(min, max, { from?, to?, zoom? })\`, ...", "description": "A \`clamp()\` that grows between two widths...", "readme": ".../packages/fluid/README.md" }, ...] }`,
  success: Schema.Struct({
    source: Schema.String,
    plugins: Schema.Array(
      Schema.Struct({
        name: Schema.String,
        members: Schema.String,
        description: Schema.String,
        readme: Schema.String,
      }),
    ),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, false);

const Url = Maybe(
  Text(
    "The app's dev server, default http://localhost:5173; its vite.config needs cssints({ devtools: true })",
  ),
);
const Decl = Schema.Struct({
  prop: Schema.String,
  value: Schema.String,
  important: Schema.Boolean,
});
const ClassInfo = {
  class: Schema.String,
  kind: Schema.Literals(["class", "marker", "group"]),
  layer: Schema.String,
  plugin: Maybe(
    Schema.String.annotate({
      description: "a member's scope (frame), or the kernel of a marker (frame.core)",
    }),
  ),
  conditions: Schema.Array(Schema.String).annotate({
    description: "the at-rules around the rule, then the states of its selector",
  }),
  css: Schema.String,
  decls: Schema.Array(Decl),
  tokens: Schema.Array(
    Schema.Struct({ name: Schema.String, path: Maybe(Schema.String), value: Maybe(Schema.String) }),
  ),
};
const SiteFields = {
  file: Schema.String.annotate({ description: "relative to the app's root" }),
  line: Schema.Finite,
  column: Schema.Finite.annotate({ description: "1-based" }),
  location: Schema.String.annotate({ description: "file:line:col of the css.* call" }),
};

const ExplainClass = Tool.make("explain_class", {
  description: `Explains cssints class names of a running app (as seen in the DOM or the sheet): per class its declarations, the conditions it is under (@media, @container, @supports, @scope, :hover...), its layer, the plugin or kernel it belongs to, the tokens it reads with their values, and the css.* calls that made it (file:line). Asks the app's Vite dev server over its HMR websocket; the app needs cssints({ devtools: true }) in its vite.config. The first call fetches the modules the page reaches, so no browser has to be open.
Example: { "classes": "_1r802m6" } -> { "classes": [{ "class": "_1r802m6", "layer": "_.b", "conditions": [":hover"], "decls": [{ "prop": "background-color", "value": "color-mix(...)" }], "sites": [{ "location": "src/components/Showcase.tsx:72:18" }] }] }`,
  parameters: Schema.Struct({
    classes: Text('One class or several, as in the class attribute: "_1r802m6 _pb21ov"'),
    url: Url,
  }),
  success: Schema.Struct({
    root: Schema.String,
    classes: Schema.Array(
      Schema.Struct({
        ...ClassInfo,
        sites: Schema.Array(Schema.Struct({ ...SiteFields, classes: Schema.Array(Schema.String) })),
      }),
    ),
    unknown: Schema.Array(Schema.String).annotate({
      description: "names that are not cssints classes the server has served",
    }),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const ModuleStyles = Tool.make("module_styles", {
  description: `The styles of one source file of a running app, as its dev server compiled them: each css.* call (file:line:col) with its classes, their declarations, conditions, layer and CSS. Asks the app's Vite dev server over its HMR websocket (cssints({ devtools: true }) in its vite.config); an edit is seen once the server has the new module, which the tool fetches again. Use compile instead when there is no dev server.
Example: { "file": "src/components/Button.tsx" } -> { "sites": [{ "location": "src/components/Button.tsx:5:24", "classes": [{ "class": "_ijw0jd", "css": "._ijw0jd{background-color:var(--color-accent)}", ... }] }], "css": "..." }`,
  parameters: Schema.Struct({
    file: Text("The source file, absolute or relative to the app's root"),
    url: Url,
  }),
  success: Schema.Struct({
    file: Schema.String,
    sites: Schema.Array(
      Schema.Struct({ ...SiteFields, classes: Schema.Array(Schema.Struct(ClassInfo)) }),
    ),
    css: Schema.String,
    note: Maybe(Schema.String),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const DevErrors = Tool.make("dev_errors", {
  description: `The current build errors of a running app's dev server: the modules the page reaches are fetched again, and every transform error Vite sends over its HMR websocket is answered (message, file:line:col of the css.* call for a cssints error, the plugin, the code frame). Warnings and the page's runtime errors are not sent over that channel: notAvailable says so. Works on any Vite dev server, with or without cssints({ devtools: true }).
Example: {} -> { "errors": [{ "message": "padding: unexpected \\"-1rem\\" ...", "location": "/app/src/Card.tsx:4:22", "plugin": "cssints" }], "notAvailable": "warnings: ..." }`,
  parameters: Schema.Struct({ url: Url }),
  success: Schema.Struct({
    url: Schema.String,
    errors: Schema.Array(
      Schema.Struct({
        ...Located.fields,
        plugin: Maybe(Schema.String),
        frame: Maybe(Schema.String),
      }),
    ),
    notAvailable: Schema.String,
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const PageParams = {
  selector: Text(
    'A CSS selector; the first element that matches is inspected: "[data-case=hover-md]"',
  ),
  url: Maybe(Text("The page to open, default http://localhost:5173; kept open for later calls")),
  server: Maybe(
    Text(
      "The app's dev server, when it is not the page's origin + / (a base path: http://localhost:5173/app/)",
    ),
  ),
  width: Maybe(Schema.Int.check(Schema.isBetween({ minimum: 100, maximum: 4000 }))).annotate({
    description: "The viewport's width in px (default 1280; stays for the page)",
  }),
  height: Maybe(Schema.Int.check(Schema.isBetween({ minimum: 100, maximum: 4000 }))).annotate({
    description: "The viewport's height in px (default 800)",
  }),
  hover: Maybe(
    Schema.Boolean.annotate({ description: "Hover the element first (default: the pointer away)" }),
  ),
  focus: Maybe(
    Schema.Boolean.annotate({ description: "Focus the element first (default: nothing focused)" }),
  ),
};
const Cond = Schema.Struct({ text: Schema.String, holds: Schema.Boolean });
const RuleOut = {
  declaration: Schema.String,
  selector: Schema.String,
  layer: Schema.String,
  site: Maybe(Schema.String.annotate({ description: "file:line:col of the css.* call" })),
};
const Check = Schema.Struct({
  property: Schema.String,
  check: Schema.Literals(["✓", "✗", "?"]).annotate({
    description:
      "✓ the browser computes the winner's value; ✗ it does not (reason says why); ? depends on layout",
  }),
  computed: Schema.String,
  expected: Schema.String,
  reason: Maybe(Schema.String),
});
const Except = Maybe(
  Schema.Array(Schema.Struct({ longhand: Schema.String, by: Schema.Struct(RuleOut) })).annotate({
    description: "longhands of the winner's shorthand that another declaration wins",
  }),
);

const InspectElement = Tool.make("inspect_element", {
  description: `Inspects an element of a running app in a headless Chromium, as the cssints devtools overlay does: its cssints classes grouped by the css.* call that made them (file:line:col), and per property the winning declaration (by layer, then specificity, then the sheet's order, among the rules whose at-rules and states hold now, decided by the browser), the ones it overrides, the ones that do not apply now, and a check of the winner against getComputedStyle (✓, or ✗ with the reason: an inline style, an unlayered rule of another sheet, an animation). Needs the app's dev server with cssints({ devtools: true }) and Chromium (npx playwright-core install chromium). hover/focus put the element in that state; width/height size the viewport.
Example: { "selector": "[data-case=hover-md]", "hover": true } -> { "properties": [{ "property": "color", "winner": { "declaration": "color: #dc2626", "selector": "._1d608he:hover", "layer": "_.b", "site": "src/components/Inspect.tsx:25:14" }, "overridden": [{ "declaration": "color: #2563eb", "beatenBy": "specificity (0,2,0) over (0,1,0)" }], "verification": [{ "check": "✓", "computed": "rgb(220, 38, 38)" }] }] }`,
  parameters: Schema.Struct(PageParams),
  success: Schema.Struct({
    element: Schema.String,
    matches: Schema.Finite.annotate({ description: "how many elements the selector matches" }),
    groups: Schema.Array(
      Schema.Struct({
        site: Maybe(Schema.String),
        classes: Schema.Array(
          Schema.Struct({
            class: Schema.String,
            kind: Schema.String,
            plugin: Maybe(Schema.String),
            layer: Maybe(Schema.String),
            decls: Schema.Array(Schema.String),
            conditions: Schema.Array(Cond),
            active: Schema.Boolean,
          }),
        ),
      }),
    ),
    properties: Schema.Array(
      Schema.Struct({
        property: Schema.String,
        longhands: Maybe(Schema.Array(Schema.String)),
        winner: Maybe(Schema.Struct({ ...RuleOut, conditions: Schema.Array(Schema.String) })),
        note: Maybe(Schema.String),
        except: Except,
        overridden: Schema.Array(Schema.Struct({ ...RuleOut, beatenBy: Maybe(Schema.String) })),
        inactive: Schema.Array(Schema.Struct({ ...RuleOut, failing: Schema.Array(Schema.String) })),
        verification: Schema.Array(Check),
      }),
    ),
    tokens: Schema.Array(
      Schema.Struct({
        name: Schema.String,
        path: Maybe(Schema.String),
        computed: Schema.String,
        source: Maybe(Schema.String),
      }),
    ),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

const WhyProperty = Tool.make("why_property", {
  description: `Why an element of a running app has the value it has for one property, in a headless Chromium: the winning cssints declaration and its css.* call (file:line:col), its conditions and whether each holds now, what it beats and why (layer, specificity, order, !important), the declarations that do not apply now with the condition that fails, and the check against getComputedStyle (✓, or ✗ with the reason). Same page options as inspect_element (hover, focus, width, height).
Example: { "selector": "[data-case=unlayered]", "property": "color" } -> { "computed": "rgb(22, 163, 74)", "winner": { "declaration": "color: #dc2626", "layer": "_.a" }, "verification": { "check": "✗", "reason": ".mine { color: rgb(22, 163, 74) } in src/components/inspect.css beats it: a rule outside every layer beats every layer, cssints' too" } }`,
  parameters: Schema.Struct({
    ...PageParams,
    property: Text("The property, kebab-case or camelCase: background-color, paddingTop"),
  }),
  success: Schema.Struct({
    element: Schema.String,
    property: Schema.String,
    computed: Schema.String.annotate({ description: "getComputedStyle of the element" }),
    note: Maybe(Schema.String),
    winner: Maybe(Schema.Struct({ ...RuleOut, conditions: Schema.Array(Cond) })),
    beats: Maybe(Schema.Array(Schema.Struct({ ...RuleOut, why: Schema.String }))),
    except: Except,
    inactive: Maybe(Schema.Array(Schema.Struct({ ...RuleOut, conditions: Schema.Array(Cond) }))),
    verification: Maybe(Check),
  }),
  failure: Failure,
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.OpenWorld, true);

export const tools = Toolkit.make(
  CheckDeclaration,
  CheckSupport,
  CheckContrast,
  Compile,
  SearchDocs,
  ListPlugins,
  ExplainClass,
  ModuleStyles,
  DevErrors,
  InspectElement,
  WhyProperty,
);

const handlers = tools
  .toLayer(
    Effect.gen(function* () {
      const { compile } = yield* Compiler;
      const live = yield* Live;
      const inspector = yield* Inspector;
      return tools.of({
        check_declaration: ({ property, value }) => checkDeclaration(property, value),
        check_support: ({ property, value, query }) => checkSupport(property, value, query),
        check_contrast: ({ foreground, background, min }) =>
          checkContrast(foreground, background, min),
        compile: (input) => compile(input),
        search_docs: ({ query, limit }) => searchDocs(query, limit),
        list_plugins: () => listPlugins(),
        explain_class: ({ classes, url }) => live.explain(classes, url),
        module_styles: ({ file, url }) => live.moduleStyles(file, url),
        dev_errors: ({ url }) => live.errors(url),
        inspect_element: ({ selector, ...state }) => inspector.inspectElement(selector, state),
        why_property: ({ selector, property, ...state }) =>
          inspector.whyProperty(selector, property, state),
      });
    }),
  )
  .pipe(
    Layer.provide(
      Layer.mergeAll(Compiler.layer, Inspector.layer.pipe(Layer.provideMerge(Live.layer))),
    ),
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
