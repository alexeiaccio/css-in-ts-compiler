// @cssints/reset: a small modern reset (after Josh Comeau's and Jake Lazaroff's, with Andy Bell's `role="list"` and flow),
// as global rules of a call member of cssints/plugin `scope()`. The rules are in a top-level layer `reset` declared before
// the engine's layers, so it ranks below `_.k`, the class layers and every layer declared after, and any style beats it.
// `make(group)` is the reset of an export group (`@cssints/reset/widely-available`): the declarations that `inGroup` of
// cssints/plugin refuses are left out, and a rule left with none goes. The selectors are kept: the group data has no
// functional pseudo-classes, pseudo-elements, attribute selectors or combinators.
import { arg, inGroup, scope } from "cssints/plugin";

const HEADINGS = "h1, h2, h3, h4, h5, h6";
const FLOW = `${HEADINGS}, p, ul, ol, dl, blockquote, pre, figure, table, hr`;

type Rule = readonly [selector: string, declarations: readonly (readonly [string, string])[]];

const BASE: Rule[] = [
  ["*, *::before, *::after", [["box-sizing", "border-box"]]],
  ["*", [["margin", "0"]]],
  [
    "html",
    [
      ["-webkit-text-size-adjust", "none"],
      ["text-size-adjust", "none"],
      ["line-height", "1.5"],
    ],
  ],
  [
    ":where(input, button, textarea, select)",
    [
      ["font", "inherit"],
      ["letter-spacing", "inherit"],
      ["word-spacing", "inherit"],
      ["color", "inherit"],
    ],
  ],
  [`:where(p, ${HEADINGS})`, [["overflow-wrap", "break-word"]]],
  [`:where(${HEADINGS})`, [["text-wrap", "balance"]]],
  [":where(p)", [["text-wrap", "pretty"]]],
  [
    ':where(ul, ol)[role="list"]',
    [
      ["list-style", "none"],
      ["padding", "0"],
    ],
  ],
];
const MEDIA: Rule[] = [
  [
    ":where(img, picture, video, canvas, svg)",
    [
      ["display", "block"],
      ["max-inline-size", "100%"],
    ],
  ],
  [":where(img, video)", [["block-size", "auto"]]],
];
const PROSE: Rule[] = [
  [`:where(${FLOW}):not([class]) + :where(${FLOW}):not([class])`, [["margin-block-start", "1em"]]],
  [`:where(${HEADINGS}):not([class])`, [["line-height", "1.25"]]],
];

// Each block is its own global, identified by its text, so `reset()` and `reset({ media: true })` share the base.
const layered = (rules: Rule[], group?: string) => {
  const css = rules
    .flatMap(([selector, declarations]) => {
      const kept = declarations.filter(([p, v]) => !group || inGroup(group, p, v));
      return kept.length
        ? [`${selector} { ${kept.map(([p, v]) => `${p}: ${v}`).join("; ")} }`]
        : [];
    })
    .join(" ");
  return css ? [{ css, layer: "reset" }] : [];
};

const define = (group?: string) =>
  scope("reset", {
    reset: { args: [{ "media?": arg<boolean>(), "prose?": arg<boolean>() }] },
  }).build({
    reset: (options) => ({
      layers: { layers: ["reset"], before: true },
      globals: [
        ...layered(BASE, group),
        ...(options.media ? layered(MEDIA, group) : []),
        ...(options.prose ? layered(PROSE, group) : []),
      ],
    }),
  });

// The annotation is for the declaration file: the inferred type of this member is too long for the compiler to write out.
export type Reset = ReturnType<ReturnType<typeof define>["export"]>["reset"];
export const make: (group?: string) => Reset = (group) => define(group).export().reset;
