// The landing page (/) as one html string. plugin/landing.ts calls landing(data) on a Vite server of its own for the document of
// "/", and the virtual module virtual:docs/landing calls it with the same data for the app, so the two strings are equal. The
// classes are css.cn of the cssints plugin, atomic and hashed from their content: the same module gives the same names in both.
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };

import { gtSidebar } from "../layout.ts" with { type: "cssints" };
import { mono } from "../prose.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };

export interface LandingData {
  /** the base path of the site, with a trailing slash */
  base: string;
  /** Shiki's html of the install line, the source of button.ts, the module and the sheet it makes */
  install: string;
  source: string;
  code: string;
  css: string;
  /** the message of a misspelt value, plain text */
  error: string;
}

const ring = css.focusVisible(css.outline("2px solid", t.color.accent), css.outlineOffset("2px"));

const root: Style = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.lineHeight(t.lineHeight.relaxed),
);
// the hero spans the page, right under the header; what follows is a column of 1120 px
const column = css.cn(css.maxWidth("1120px"), css.marginInline("auto"), css.minWidth("0"));
const rest = css.cn(
  column,
  css.padding("clamp(48px, 10vw, 96px)", t.space.lg, t.space._3xl),
  css.display("flex"),
  css.flexDirection("column"),
  css.gap("clamp(48px, 10vw, 96px)"),
);
const heading = css.cn(css.margin("0"), css.lineHeight(t.lineHeight.tight));
const h2 = css.cn(heading, css.fontSize(t.fontSize._2xl), css.letterSpacing("-0.01em"));
const h3 = css.cn(heading, css.fontSize(t.fontSize.lg), css.fontWeight(t.fontWeight.semiBold));
const text = css.cn(css.margin("0"), css.color(t.color.textMedium));
const inlineCode = css.cn(
  css.fontFamily(mono),
  css.fontSize("0.875em"),
  css.bg(t.color.bgMuted),
  css.padding("0.15em 0.4em"),
  css.borderRadius(t.radius.xs),
);

// the hero: its glow fills the width; the logo, pitch, install line and two ways in sit in a column
const hero = css.cn(
  css.position("relative"),
  css.isolation("isolate"),
  css.paddingBlock(t.space._2xl),
  css.paddingInline(t.space.lg),
  css.backgroundImage(
    "radial-gradient(ellipse 60% 70% at 50% 0%, var(--color-accent-soft), transparent)",
  ),
);
const heroColumn = css.cn(
  column,
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.gap(t.space.lg),
  css.textAlign("center"),
);
const logo = css.cn(css.borderRadius(t.radius.lg), css.boxShadow("0 8px 32px var(--color-shadow)"));
const h1 = css.cn(
  heading,
  css.fontSize("clamp(32px, 7vw, 56px)"),
  css.fontWeight(t.fontWeight.bold),
  css.letterSpacing("-0.025em"),
  css.textWrap("balance"),
);
const lead = css.cn(
  text,
  css.maxWidth("40rem"),
  css.fontSize(t.fontSize.lg),
  css.textWrap("balance"),
);
// the alpha notice: a pill above the headline
const status = css.cn(
  css.display("inline-flex"),
  css.alignItems("center"),
  css.gap(t.space.sm),
  css.margin("0"),
  css.padding(t.space.xs, t.space.md, t.space.xs, t.space.xs),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius("999px"),
  css.bg(t.color.bg),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.textMedium),
);
const tag = css.cn(
  css.padding("2px", t.space.sm),
  css.borderRadius("999px"),
  css.bg(t.color.accent),
  css.color(t.color.onAccent),
  css.fontSize(t.fontSize.xs),
  css.fontWeight(t.fontWeight.semiBold),
  css.textTransform("uppercase"),
  css.letterSpacing("0.06em"),
);
const install = css.cn(css.maxWidth("100%"), css.textAlign("left"));

const actions = css.cn(
  css.margin("0"),
  css.display("flex"),
  css.flexWrap("wrap"),
  css.justifyContent("center"),
  css.gap(t.space.md),
);
const action = css.cn(
  css.padding(t.space.sm, t.space.xl),
  css.borderRadius(t.radius.md),
  css.fontWeight(t.fontWeight.semiBold),
  css.textDecoration("none"),
  ring,
);
const secondary = css.cn(
  action,
  css.border(t.border.width, "solid", t.color.borderStrong),
  css.bg(t.color.bgSubtle),
  css.color(t.color.text),
  css.hover(css.borderColor(t.color.accent), css.bg(t.color.accentSoft)),
);
const primary = css.cn(
  action,
  css.border(t.border.width, "solid", t.color.accent),
  css.bg(t.color.accent),
  css.color(t.color.onAccent),
  css.hover(css.borderColor(t.color.accent), css.bg(t.color.accentStrong), css.color("white")),
);

// code blocks, Shiki's <pre>: the source on one side, what it compiled to on the other (stacked on a narrow screen)
const pre = css.cn(
  css.margin("0"),
  css.overflowX("auto"),
  css.fontFamily(mono),
  css.lineHeight(t.lineHeight.relaxed),
  css.tabSize(2),
);
const installPre = css.cn(
  pre,
  css.paddingBlock(t.space.md),
  css.paddingInline(t.space.xl),
  css.bg(t.color.bgSubtle),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.fontSize(t.fontSize.sm),
);
const figurePre = css.cn(
  pre,
  css.padding(t.space.lg),
  css.border("0", "none"),
  css.borderRadius("0"),
  css.bg("transparent"),
  css.fontSize(t.fontSize.sm),
);
// the long class strings of the compiled module wrap instead of scrolling
const outputPre = css.cn(figurePre, css.whiteSpace("pre-wrap"), css.overflowWrap("anywhere"));
const errorPre = css.cn(
  pre,
  css.padding(t.space.md),
  css.bg(t.color.errorSoft),
  css.border(t.border.width, "solid", t.color.error),
  css.borderRadius(t.radius.md),
  css.color(t.color.error),
  css.fontSize(t.fontSize.xs),
  css.whiteSpace("pre-wrap"),
);

const showcase = css.cn(
  css.minWidth("0"),
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.lg),
  css.textAlign("center"),
);
const panels = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("minmax(0, 1fr)"),
  css.gap(t.space.lg),
  css.alignItems("start"),
  css.marginTop(t.space.md),
  css.textAlign("left"),
  gtSidebar(css.gridTemplateColumns("minmax(0, 1.2fr) minmax(0, 1fr)")),
);
const outputs = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.lg),
  css.minWidth("0"),
);
const figure = css.cn(
  css.margin("0"),
  css.minWidth("0"),
  css.bg(t.color.bgSubtle),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.overflow("hidden"),
);
const figcaption = css.cn(
  css.padding(t.space.sm, t.space.lg),
  css.bg(t.color.bgMuted),
  css.borderBottom(t.border.width, "solid", t.color.border),
  css.fontFamily(mono),
  css.fontSize(t.fontSize.xs),
  css.color(t.color.textMedium),
);

// the features: a card each, the link at its foot
const features = css.cn(
  css.minWidth("0"),
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.xl),
  css.textAlign("center"),
);
const list = css.cn(
  css.listStyle("none"),
  css.margin("0"),
  css.padding("0"),
  css.display("grid"),
  css.gridTemplateColumns("repeat(auto-fit, minmax(min(100%, 18rem), 1fr))"),
  css.gap(t.space.lg),
  css.textAlign("left"),
);
const card = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.sm),
  css.padding(t.space.xl),
  css.bg(t.color.bgSubtle),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.transition("border-color 0.15s"),
  css.hover(css.borderColor(t.color.accent)),
);
const cardLink = css.cn(
  css.marginTop("auto"),
  css.paddingTop(t.space.sm),
  css.color(t.color.link),
  css.fontWeight(t.fontWeight.medium),
  ring,
);

const closing = css.cn(
  css.minWidth("0"),
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.gap(t.space.xl),
  css.paddingBlock(t.space._2xl),
  css.borderTop(t.border.width, "solid", t.color.border),
  css.textAlign("center"),
);

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// Shiki's <pre class="shiki ..."> gets the class of its place
const block = (html: string, cls: string) => html.replace('<pre class="', `<pre class="${cls} `);

export function landing(d: LandingData): string {
  const panel = (name: string, body: string) =>
    `<figure class="${figure}"><figcaption class="${figcaption}">${name}</figcaption>${body}</figure>`;
  const feature = (title: string, body: string, href: string, link: string, extra = "") =>
    `<li class="${card}"><h3 class="${h3}">${title}</h3><p class="${text}">${body}</p>${extra}<a class="${cardLink}" href="${d.base}${href}">${link}</a></li>`;
  const code = (s: string) => `<code class="${inlineCode}">${s}</code>`;
  return `<div class="${root}" data-landing>
<section class="${hero}" data-hero>
<div class="${heroColumn}">
<img class="${logo}" src="${d.base}logo.svg" alt="" width="96" height="96">
<p class="${status}"><span class="${tag}">Alpha</span> 0.x on npm; the API can still change between minor versions</p>
<h1 class="${h1}">CSS in TypeScript, compiled away</h1>
<p class="${lead}">cssints turns typed style calls into atomic, content-hashed classes in one stylesheet when you build. The browser gets class names, not a styling library.</p>
<div class="${install}">${block(d.install, installPre)}</div>
<p class="${actions}"><a class="${primary}" href="${d.base}install/" data-primary>Get started</a><a class="${secondary}" href="${d.base}playground/">Try the playground</a><a class="${secondary}" href="${d.base}overview/">Read the docs</a></p>
</div>
</section>
<div class="${rest}">
<section class="${showcase}" aria-labelledby="showcase">
<h2 class="${h2}" id="showcase">What you write, what you get</h2>
<p class="${text}">This is the compiler's output, made when this site was built: the file on the left went through the same plugin as your code.</p>
<div class="${panels}" data-panels>
${panel("button.ts", block(d.source, figurePre))}
<div class="${outputs}">
${panel("The module in the bundle", block(d.code, outputPre))}
${panel("The stylesheet", block(d.css, outputPre))}
</div>
</div>
</section>
<section class="${features}" aria-labelledby="features" data-features>
<h2 class="${h2}" id="features">Why cssints</h2>
<ul class="${list}">
${feature(
  "Typed values, checked twice",
  "Every value is checked against the spec grammars of mdn-data: in the editor through the types, and again in the build. A typo is an error, with the file and the line.",
  "errors/",
  "The errors you can get",
  `<pre class="${errorPre}" data-error><code>${escape(d.error)}</code></pre>`,
)}
${feature(
  "Nothing of it at runtime",
  `Each call is replaced by a class string. Only the few lines behind ${code("cn")} with runtime arguments and ${code("cv")} ship, and they just join class names.`,
  "without-runtime/",
  "Without runtime",
)}
${feature(
  "Tokens, themes, contrast",
  `Typed design tokens, themes on a class or a media query, and ${code("check.contrast")}, which fails the build when text is hard to read.`,
  "tokens/",
  "Tokens and themes",
)}
${feature(
  "Plugins on one small API",
  "Fluid type, layout, fonts, reset, gradients, motion, masonry, icons and more: plugin packages that run at build time too.",
  "plugin-packages/",
  "Plugin packages",
)}
${feature(
  "Devtools and agents",
  "An overlay in the dev server shows the cascade of any element, and an MCP server lets your coding agent check a value or compile a module.",
  "cssints-devtools/",
  "The devtools",
)}
${feature(
  "A playground in the page",
  "The real engine in a web worker, over wasm builds of oxc and LightningCSS, beside Monaco with the types of cssints. Nothing to install.",
  "playground/",
  "Open the playground",
)}
</ul>
</section>
<section class="${closing}">
<h2 class="${h2}">Try it on your own styles</h2>
<p class="${actions}"><a class="${primary}" href="${d.base}install/">Install</a><a class="${secondary}" href="${d.base}api-reference/">API reference</a><a class="${secondary}" href="${d.base}authoring-surface/">Write styles</a></p>
</section>
</div>
</div>`;
}
