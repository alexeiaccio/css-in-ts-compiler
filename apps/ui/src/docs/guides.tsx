// The two guide pages a reader needs before any component page: what a project has to look like for an
// item to land in it, and the theme the components — and this page — are written against. They are
// long-form, so they read like the template's README: short sections, the code a reader pastes, and a
// live example where the kit can show the point without a word of prose.
import type { JSX } from "@solidjs/web";

import { Button } from "../registry/button/button.tsx";
import { Card, CardBody, CardFooter, CardHeader } from "../registry/card/card.tsx";
import { Toolbar } from "../registry/toolbar/toolbar.tsx";

export interface Guide {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly Page: () => JSX.Element;
}

/** A code block: the page's own box, without a file name above it. */
const Code = (props: { readonly code: string }): JSX.Element => (
  <div class="docs__file">
    <pre class="docs__code">
      <code>{props.code}</code>
    </pre>
  </div>
);

const Section = (props: {
  readonly title: string;
  readonly children: JSX.Element;
}): JSX.Element => (
  <section class="docs__section">
    <h2 class="docs__heading">{props.title}</h2>
    {props.children}
  </section>
);

const GET_TEMPLATE = `git clone --depth=1 https://github.com/alexeiaccio/css-in-ts-compiler /tmp/cssints
cp -R /tmp/cssints/templates/solid-vite my-app
cd my-app
npm install`;

const COMPONENTS_JSON = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/components/ui/theme.css",
    "baseColor": "",
    "cssVariables": false
  },
  "aliases": {
    "components": "~/components",
    "ui": "~/components/ui",
    "lib": "~/lib",
    "utils": "~/lib/utils"
  },
  "registries": {
    "@cssints": "https://packages.cssints.dev/r/{name}.json"
  }
}`;

const ADD = `npx shadcn@latest add @cssints/switch
npx shadcn@latest add @cssints/theme`;

const VITE_CONFIG = `import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";
import { defineConfig } from "vite-plus";
import { fileURLToPath } from "node:url";

// \`~\` is the alias \`components.json\` names for the registry: a copied component keeps the
// relative imports it was authored with, and the page reaches it through \`~/components/ui\`.
export default defineConfig({
  plugins: [cssints(), solid()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: { cssMinify: "lightningcss", cssTarget },
});`;

const LANDS = `src/components/ui/
  switch.tsx             the component: one .tsx that styles itself
  theme.ts               createTokens(tokens.ts), the dark look, the contrast gate
  tokens.ts              the token data, DTCG-shaped
  theme.css              the same theme as plain custom properties
  render.tsx             the part renderer, when the component has parts
  switch.fixture.tsx     the scenarios the test walks
  dom-driver.ts          the walk over the styled markup
  switch.browser.test.tsx  the conformance test
src/vitest.browser.config.ts  the browser test's config
src/sheet.ts                  the sheet that test loads`;

const SHEET = `// The engine's sheet for a browser test: its content is the CSS of the modules transformed so far,
// so it is loaded once the test file's imports are in. A component's conformance test clicks its
// parts, so the sheet has to be there.
import { beforeAll } from "vite-plus/test";

beforeAll(async () => {
  await import("virtual:cssints.css");
});`;

const TOKENS = `// tokens.ts: DTCG data, kept apart so scripts/theme-css.ts can read it without the plugin.
export const lightTokens = {
  lightness: { $type: "number", "100": { $value: "0.981187" } /* … 1600 */ },
  hue: { $type: "number", tint: { $value: 0 }, invalid: { $value: 27.0726 } },
  chroma: {
    $type: "number",
    tint: { $value: 0 },
    // A chroma that reads well at 55% clips to white near the top of the scale.
    "100": { $value: "calc({chroma.tint} * 0.5)" },
    "200": { $value: "calc({chroma.tint} * 0.6)" },
  },
  color: {
    $type: "color",
    page: { $value: "#f8f8f8" },
    text: { $value: "{color.gray.1200}" },
    highlight: { $value: "oklch(55% {chroma.tint} {hue.tint})" },
  },
  space: {
    $type: "dimension",
    base: { $value: "4px" },
    "2": { $value: "calc({space.base} * 2)" },
  },
  radius: { $type: "dimension", md: { $value: "8px" } },
} as const;`;

const CREATE_TOKENS = `import * as css from "cssints" with { type: "cssints" };
import { lightTokens } from "./tokens.ts";

const t = css.createTokens(lightTokens);

// every leaf is a token, and a token is its var(): t.color.text is var(--color-text)
export const box = css.cn(
  css.color(t.color.text),
  css.bg(t.color.page),
  css.padding(t.space._2), // a key that starts with a digit is read as _2: --space-2
  css.borderRadius(t.radius.md),
);`;

const THEMES = `import { createGlobalTheme, media } from "cssints" with { type: "cssints" };

// the system preference is a global theme: it is not a data-mode scope, so it is not a look
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), darkTheme);

// dense screens grow the spacing steps and the text with them
createGlobalTheme(t, media("(min-resolution: 200dpi)"), {
  space: { base: "calc(0.25rem * 1.25)" },
  font: { sizeSm: "0.9375rem", size: "1.0625rem", sizeLg: "1.25rem" },
});

// a preset is the tint's two numbers, not a colour: every step made of them follows
createGlobalTheme(t, '[data-tint="indigo"]', {
  hue: { tint: "284.23" },
  chroma: { tint: "0.25049" },
});

// windows high contrast mode paints the system's own colours
createGlobalTheme(t, media("(forced-colors: active)"), forcedColorsTheme);`;

const LOOK = `import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

// the dark look is a theme on the data-mode scope, in the \`app\` layer: a host's \`author\` or
// \`viewer\` look over the same marker wins without a specificity trick
look(t, "dark", "app", darkTheme);

// a host's own value fills over the kit's: a viewer look that sets only --color-bg keeps the app's
// --color-fg
look(t, "dark", "viewer", { color: { bg: "#101018" } });`;

const TINT = `// the site's picker is the two numbers on the preview, in whatever the theme calls them:
// --hue-tint and --chroma-tint, from hue.tint and chroma.tint
const TINTS = [
  { name: "neutral", hue: "0", chroma: "0" },
  { name: "indigo", hue: "284.23", chroma: "0.25049" },
  { name: "blue", hue: "266.315", chroma: "0.22049" },
  { name: "red", hue: "27.0726", chroma: "0.181447" },
];

<section style={\`--hue-tint: \${tint().hue}; --chroma-tint: \${tint().chroma}\`}>…</section>`;

const THEME_CSS = `/* Generated from tokens.ts by scripts/theme-css.ts. Do not edit. */
:root {
  --hue-tint: 0;
  --chroma-tint: 0;
  --color-gray-1200: oklch(0.410821 0 0);
  --color-text: var(--color-gray-1200);
  --color-page: #f8f8f8;
  /* …every token the theme declares */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-1200: oklch(0.791773 0 0);
    --color-tint-1200: oklch(0.791773 var(--chroma-tint) var(--hue-tint));
  }
}`;

const CONTRAST = `// the pairs a reader meets on every page; a ratio under the floor fails the build
check.contrast(t.color.text, t.color.page, { min: 7 }); // WCAG 2.x AAA for text
check.contrast(t.color.muted, t.color.page, { min: 4.5 });
check.contrast(t.color.link, t.color.surface, { min: 4.5 });
check.contrast(t.color.focusRing, t.color.page, { min: 3 }); // a graphic: WCAG 1.4.11`;

const CONTEXT = `// Button: the container is the context, not a prop on each control
css.within(css.attr("data-size", "sm"))(
  css.padding(t.space._1, t.space._2),
  css.fontSize(t.font.sizeSm),
)

// Card: surface() for the colour, frame() for the radius, padding and border
const card = css.cn(
  frame().radius(t.radius.xl).padding(t.space._3).border("1px"),
  surface().color(t.color.surface),
  css.borderColor(t.color.border),
  css.color(t.color.text),
);`;

const MODE = `<div data-mode="dark">
  <Card>
    <CardBody>The card is dark without a prop: the mode is the context.</CardBody>
  </Card>
</div>`;

const InstallationPage = (): JSX.Element => (
  <>
    <h1 class="docs__title">Installation</h1>
    <p class="docs__description">
      A starter is one component, its theme and — for some items — its own conformance test. This
      page is the project around them: the template, the registry entry, the plugin, and what a copy
      really runs.
    </p>

    <Section title="The template">
      <p class="docs__note">
        The kit needs Solid 2 (<code>2.0.0-rc.13</code>) and its Vite plugin (<code>3.x</code>):
        <code>@cssints/headless</code> is built on Solid 2's reactivity, so{" "}
        <code>vite-plugin-solid</code> 2.x will not run it. The repository ships a starter project;
        there is no <code>npm create</code> package yet.
      </p>
      <Code code={GET_TEMPLATE} />
      <p class="docs__note">
        <code>src/app.tsx</code> already renders the switch, so <code>npm run dev</code> shows a
        component on the theme as soon as the first item lands.
      </p>
    </Section>

    <Section title="components.json">
      <p class="docs__note">
        The file points the CLI at the registry and tells it where a copy lands.{" "}
        <code>@cssints</code> is a URL template, not a package: <code>add</code> reads{" "}
        <code>r/&lt;name&gt;.json</code> from it.
      </p>
      <Code code={COMPONENTS_JSON} />
    </Section>

    <Section title="Add an item">
      <p class="docs__note">
        An item is the component and the theme files it imports. Every starter also depends on{" "}
        <code>@cssints/theme</code>, so <code>theme.css</code> lands with the first one; adding the
        theme alone is for a project that only wants the custom properties.
      </p>
      <Code code={ADD} />
      <p class="docs__note">
        The CLI also installs the dependencies the item names: <code>@cssints/headless</code> (the
        behaviour, from npm), <code>@cssints/mise-en-mode</code> (the dark scope) and{" "}
        <code>cssints</code> (the plugin and the typed tokens).
      </p>
    </Section>

    <Section title="The plugin in the build">
      <p class="docs__note">
        A component is one <code>.tsx</code> that styles itself, so a copy needs{" "}
        <code>cssints</code> in the Vite config. <code>targets</code> is the project's browserslist
        query as LightningCSS targets, and the support warnings read it; <code>cssTarget</code> is
        the same query in Vite's <code>build.cssTarget</code> names, so a minified build keeps the{" "}
        <code>firstThatWorks</code> fallbacks.
      </p>
      <Code code={VITE_CONFIG} />
    </Section>

    <Section title="What lands">
      <p class="docs__note">
        A copy is flat in <code>src/components/ui/</code>: the component, <code>theme.ts</code> with{" "}
        <code>tokens.ts</code>, <code>render.tsx</code> when the component has parts, and the
        conformance test with its fixture and driver for the items that ship one (the switch,
        disclosure, checkbox, radio, tabs and accordion today).
      </p>
      <Code code={LANDS} />
      <p class="docs__note">
        With the plugin,{" "}
        <strong>
          <code>theme.css</code> is not needed
        </strong>
        : the copied <code>theme.ts</code> already puts the tokens in the sheet. It is needed
        without the plugin (the component's classes would have nothing to read), and it is the file
        to import when your own plain CSS reads a token no class reads: the engine writes a token
        only when a class uses it, while <code>theme.css</code> carries the whole theme. The
        template imports it in <code>src/main.tsx</code>.
      </p>
    </Section>

    <Section title="The copied test">
      <p class="docs__note">
        Each of those items carries the scenarios its primitive is checked against, driven through
        your styled markup rather than the bare controller: the same check the release passed.{" "}
        <code>npm test</code> is <code>vp test run --config vitest.browser.config.ts</code>, in a
        real Chromium. The item ships the config and the sheet; the runner itself (Vite+ with its
        browser provider, the Solid 2 plugin, Playwright) is the project's, because its versions
        have to agree with the project's <code>solid-js</code> rc.
      </p>
      <Code code={SHEET} />
      <p class="docs__note">
        The item's devDependencies are what the copied test imports: <code>@cssints/apg-specs</code>{" "}
        (the scenarios) and <code>@quint-machine/core</code>. An edit that changes what the pattern
        does fails the test; an item without a test is at least in the project's <code>tsc</code>.
      </p>
      <p class="docs__note">
        <code>scripts/starter-smoke.mjs</code> is the proof of the whole chain: it copies the
        template into a temporary directory, installs it, adds <em>every</em> item of the registry
        from a local server, runs the copied tests in one browser run and{" "}
        <code>npx tsc --noEmit</code> over the copy, then adds the published{" "}
        <code>@cssints/switch</code> from the live registry. The template's <code>README.md</code>{" "}
        is the reader's version of the same two commands.
      </p>
    </Section>
  </>
);

const ThemingPage = (): JSX.Element => (
  <>
    <h1 class="docs__title">Theming</h1>
    <p class="docs__description">
      The theme is data, a set of themes over it, and one look for the dark scope. The components
      read tokens; this page is the same theme, so the previews below are the kit on its own tokens.
    </p>

    <Section title="The tokens are data">
      <p class="docs__note">
        <code>tokens.ts</code> is DTCG-shaped data: a leaf is a token, <code>$type</code> is
        inherited through a group, and <code>{"{path}"}</code> is a reference that stays live.{" "}
        <code>createTokens</code> turns it into <code>t</code>, where every leaf is the token's{" "}
        <code>var()</code>.
      </p>
      <Code code={TOKENS} />
      <Code code={CREATE_TOKENS} />
      <p class="docs__note">
        The whole colour system is one lightness scale and two numbers: <code>hue.tint</code> and{" "}
        <code>chroma.tint</code>. Every step of the tint is an <code>oklch()</code> of the same
        lightness with that hue and a share of that chroma, so a preset is two values and not a
        palette. The light steps hold the chroma back (<code>0.5</code> to <code>0.9</code> of it),
        because a chroma that reads well at 55% clips to white near the top.
      </p>
    </Section>

    <Section title="Global themes">
      <p class="docs__note">
        <code>createGlobalTheme</code> re-declares the tokens an override names, under a media
        condition on <code>:root</code> or under a selector. The dark theme is the lightness scale
        turned over, so every colour built from a step follows; the page, the surface and the
        popover shadow are the reference's own dark values.
      </p>
      <Code code={THEMES} />
    </Section>

    <Section title="The dark scope is a look">
      <p class="docs__note">
        The same dark theme is also a <code>data-mode</code> scope, and that is a look of{" "}
        <code>@cssints/mise-en-mode</code>: <code>look(tokens, expression, source, overrides)</code>
        . A look sits in one of the layers <code>app &lt; author &lt; viewer</code>, declared after
        the engine's own, so a host's look beats the kit's by layer rather than by sheet order. Each
        variable fills from the most preferred source that sets it.
      </p>
      <Code code={LOOK} />
      <p class="docs__note">
        <code>data-mode="dark"</code> moves every token of the subtree;{" "}
        <code>data-mode="dark/color"</code> moves the colour aspect alone. A look matches its
        fragment because an aspect is a top-level group of the token set, and <code>data-mode</code>{" "}
        is a space-separated list. The media-query theme above stays a global theme: the system
        preference is not a scope, so there is nothing to write as a look there.
      </p>
    </Section>

    <Section title="The tint preset">
      <p class="docs__note">
        The page's tint picker is these two numbers on the preview, in the names the theme gives
        them: <code>--hue-tint</code> and <code>--chroma-tint</code>. A preset that ships as CSS is
        a theme over the same tokens (<code>[data-tint="indigo"]</code>); the site's picker writes
        the inline properties instead, and every class under the preview inherits them.
      </p>
      <Code code={TINT} />
    </Section>

    <Section title="theme.css, the plain twin">
      <p class="docs__note">
        The kit compiles it from the same data:{" "}
        <code>node scripts/theme-css.ts &gt; src/registry/theme.css</code>, with{" "}
        <code>bun run theme:check</code> comparing the file with the data in CI. It is for a project
        without the plugin, and for plain CSS that reads a token the components do not.
      </p>
      <Code code={THEME_CSS} />
      <p class="docs__note">
        Its honest limit: the generator writes the leaves spelled <code>{"{ $value }"}</code>, so
        the dark block carries the scales (the gray and tint steps) and the flat values stay on{" "}
        <code>:root</code> — <code>--color-page</code>, <code>--color-surface</code> and the popover
        shadow do not follow the mode there, and the forced-colors block is empty for the same
        reason. The plugin's <code>theme.ts</code> writes all of them.
      </p>
    </Section>

    <Section title="check.contrast">
      <p class="docs__note">
        Every pair a reader meets is checked at build time, in the default theme and in every theme
        that sets either token or one they alias — the look included, with the layers laid over each
        other. A ratio under <code>min</code> fails the build and names the theme; a value the check
        cannot evaluate warns.
      </p>
      <Code code={CONTRAST} />
    </Section>

    <Section title="Contexts, not props">
      <p class="docs__note">
        A control reads the things around it instead of taking a prop for them.{" "}
        <code>Toolbar size="sm"</code> writes <code>data-size="sm"</code>, and the button's own
        class reads it with <code>within()</code>; <code>Card</code> is a <code>surface()</code>{" "}
        (colour relative to its parent) and a <code>frame()</code> (its inner radius less its
        padding and border), so a card in a card is concentric with no wiring.
      </p>
      <Code code={CONTEXT} />
      <div class="docs__preview">
        <div class="demo-column">
          <Toolbar label="Default">
            <Button>Undo</Button>
            <Button tone="quiet">Redo</Button>
            <Button tone="quiet">Share</Button>
          </Toolbar>
          {/* size="sm" is the context: the buttons inside are compact without a prop of their own */}
          <Toolbar label="Compact" size="sm">
            <Button>Undo</Button>
            <Button tone="quiet">Redo</Button>
            <Button tone="quiet">Share</Button>
          </Toolbar>
          <Card>
            <CardHeader>
              <strong>Monthly report</strong>
              <Button size="sm" tone="quiet">
                Open
              </Button>
            </CardHeader>
            <CardBody>
              A card is a frame: a card inside one keeps its inner corners concentric.
            </CardBody>
            <CardFooter>
              <Button size="sm" tone="accent">
                Download
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Section>

    <Section title="A card in a dark region">
      <p class="docs__note">
        <code>data-mode</code> nests: the scope moves every token of its subtree, so a card, a field
        and a button under it are dark with no prop of their own, and the rest of the page is
        untouched.
      </p>
      <Code code={MODE} />
      <div class="docs__preview" data-mode="dark">
        <Card>
          <CardHeader>
            <strong>In a dark region</strong>
            <Button size="sm" tone="quiet">
              Open
            </Button>
          </CardHeader>
          <CardBody>
            The same card on the same theme: <code>data-mode="dark"</code> is the context.
          </CardBody>
        </Card>
      </div>
    </Section>
  </>
);

/** The guides, in the rail's order: before the widgets, because a reader needs them first. */
export const GUIDES: ReadonlyArray<Guide> = [
  {
    name: "installation",
    title: "Installation",
    description: "The template, the registry, the plugin, and what a copy really runs.",
    Page: InstallationPage,
  },
  {
    name: "theming",
    title: "Theming",
    description: "tokens, themes, the dark look and the contexts a control reads.",
    Page: ThemingPage,
  },
];
