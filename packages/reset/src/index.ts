// @cssints/reset: a small modern reset (after Josh Comeau's and Jake Lazaroff's, with Andy Bell's `role="list"` and flow),
// as global rules of a call member of cssints/plugin `scope()`. The rules are in a layer `reset` nested in the engine's
// `_.k`: a nested layer ranks below the rules of its parent, so the reset sits below the kernels and token rules of `_.k`,
// the class layers and every top-level layer, and any style beats it. A top-level `@layer reset` cannot go there: the
// sheet declares the engine's layers first, and a declared top-level layer follows them.
import { arg, scope } from "cssints/plugin";

const HEADINGS = "h1, h2, h3, h4, h5, h6";
const FLOW = `${HEADINGS}, p, ul, ol, dl, blockquote, pre, figure, table, hr`;

// Each block is its own global, identified by its text, so `reset()` and `reset({ media: true })` share the base.
const layered = (rules: string) => ({ css: `@layer reset { ${rules} }` });

const BASE = layered(
  [
    "*, *::before, *::after { box-sizing: border-box }",
    "* { margin: 0 }",
    "html { -webkit-text-size-adjust: none; text-size-adjust: none; line-height: 1.5 }",
    ":where(input, button, textarea, select) { font: inherit; letter-spacing: inherit; word-spacing: inherit; color: inherit }",
    `:where(p, ${HEADINGS}) { overflow-wrap: break-word }`,
    `:where(${HEADINGS}) { text-wrap: balance }`,
    ":where(p) { text-wrap: pretty }",
    ':where(ul, ol)[role="list"] { list-style: none; padding: 0 }',
  ].join(" "),
);
const MEDIA = layered(
  [
    ":where(img, picture, video, canvas, svg) { display: block; max-inline-size: 100% }",
    ":where(img, video) { block-size: auto }",
  ].join(" "),
);
const PROSE = layered(
  [
    `:where(${FLOW}):not([class]) + :where(${FLOW}):not([class]) { margin-block-start: 1em }`,
    `:where(${HEADINGS}):not([class]) { line-height: 1.25 }`,
  ].join(" "),
);

const resetScope = scope("reset", {
  reset: { args: [{ "media?": arg<boolean>(), "prose?": arg<boolean>() }] },
}).build({
  reset: (options) => ({
    globals: [BASE, ...(options.media ? [MEDIA] : []), ...(options.prose ? [PROSE] : [])],
  }),
});

/**
 * `reset({ media?, prose? })`: the reset, in a layer below every other style of the sheet. The base sets `border-box`,
 * removes the margins, gives `html` a line height of 1.5 and stops mobile text inflation, makes form controls inherit the
 * font and colour, wraps long words in text and balances headings, and removes the markers of a list with
 * `role="list"`. `media: true` makes images, videos, canvases and SVGs blocks that do not overflow their container;
 * `prose: true` puts 1em between flow elements (headings, paragraphs, lists, ...) that have no class, as in rendered
 * Markdown. Call it at a module's top level; it prints no class.
 */
// The annotation is for the declaration file: the inferred type of this member is too long for the compiler to write out.
export const reset: ReturnType<typeof resetScope.export>["reset"] = resetScope.export().reset;
