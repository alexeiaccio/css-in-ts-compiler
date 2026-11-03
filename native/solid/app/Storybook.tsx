// The storybook page: a rail of the stories `@cssints/stories` reads and the picked one in the canvas. The rail is a
// vertical tablist (the native headless tabs, the Widgets page's part): one Tab stop, Up and Down move the roving focus
// and (automatic activation) pick the story the canvas draws — the same loader the web site reads.
//
//   bun solid/main.ts storybook                 a window, the first story picked
//   bun solid/main.ts storybook --story widgets--switch  one story, for a frame or a stored golden
import * as css from "cssints/clay" with { type: "cssints" };

import { entries } from "../../../packages/stories/src/index.ts";

import { createTabs } from "../../headless/src/index.ts";
import { a11y } from "../a11y.ts";
import { pageEntry, type Motion } from "../src/entry.ts";
import type { Input } from "../src/input.ts";
import type { Node } from "../src/renderer.ts";
import { modules } from "../stories/index.ts";

// no registry: the item is the file's own name, so `pages.stories.tsx` gives `pages--inline`
const stories = entries<Node>(modules, (path) =>
  path.slice("./".length, -".stories.tsx".length),
);

/** The page's own size: a rail and a canvas wide enough for a 360 page. */
export const size = { width: 720, height: 560 };

const t = css.createTokens({
  color: {
    $type: "color",
    page: { $value: "rgb(16 18 24)" },
    surface: { $value: "rgb(36 40 52)" },
    ink: { $value: "rgb(235 235 240)" },
    muted: { $value: "rgb(150 155 170)" },
    accent: { $value: "rgb(240 140 50)" },
    hover: { $value: "rgb(48 53 68)" },
    ring: { $value: "rgb(90 170 255)" },
  },
});
css.createGlobalTheme(t, "light", {
  color: {
    page: "rgb(244 245 248)",
    surface: "rgb(255 255 255)",
    ink: "rgb(25 27 34)",
    muted: "rgb(95 100 115)",
    accent: "rgb(190 90 10)",
    hover: "rgb(232 235 241)",
    ring: "rgb(20 100 220)",
  },
});
const font = css.fonts("Roboto");

const root = css.cn(
  css.width("stretch"),
  css.height("stretch"),
  css.gap(12),
  css.p(16),
  css.bg(t.color.page),
);
const rail = css.cn(
  css.width(220),
  css.height("stretch"),
  css.gap(4),
  css.p(8),
  css.flexDirection("column"),
  css.borderRadius(10),
  css.bg(t.color.surface),
);
const row = css.cn(
  css.width("stretch"),
  css.p(8, 10),
  css.borderRadius(8),
  css.hover(css.bg(t.color.hover)),
  css.focus(css.border(2, t.color.ring)),
);
const rowOn = css.cn(row, css.bg(t.color.hover));
const label = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(13));
const labelOn = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(13));
const caption = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(12));
const canvas = css.cn(
  css.width("stretch"),
  css.height("stretch"),
  css.p(8),
  css.gap(8),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.bg(t.color.page),
);

/**
 * The storybook: the rail, the picked story and its id.
 *
 * @param {{ input: Input, motion?: Motion, start?: string }} props the host's input, its frame hook and the story to open
 * @returns the page's element tree
 */
export function Storybook(props: { input: Input; motion?: Motion; start?: string }) {
  // the root is this page's own id: a story that is a page declares "Root" itself, and Clay refuses a repeated id
  pageEntry(props.motion, "Storybook");
  const open = Math.max(
    0,
    stories.findIndex((story) => story.id === props.start),
  );
  // the rail is one tablist: the tabs register in the page's focus manager themselves (`focus`), so the rail is one Tab
  // stop, entered on the selected row. The canvas is the picked story's box rather than a panel, so every panel is
  // declared focusable: Tab goes on from the rail to the story's own first control, not to an invisible panel.
  const tabs = createTabs({
    id: "stories",
    items: stories.length,
    orientation: "vertical",
    activation: "automatic",
    defaultSelected: open,
    focusablePanels: stories.map((_story, at) => at),
    focus: props.input.focus,
  });
  const bind = stories.map((_story, at) => props.input.bind(tabs.tabs[at]!));
  const picked = () => stories[tabs.selected()] ?? stories[0]!;

  return (
    <box id="Storybook" style={root}>
      <box {...a11y(tabs.tablist)} style={rail}>
        <text style={caption}>Stories</text>
        {stories.map((story, at) => (
          <box {...bind[at]!} {...a11y(tabs.tabs[at]!)} style={story.id === picked().id ? rowOn : row}>
            <text style={story.id === picked().id ? labelOn : label}>
              {`${story.title} · ${story.name}`}
            </text>
          </box>
        ))}
      </box>
      <box style={canvas}>
        <text style={caption}>{picked().id}</text>
        {picked().view({ ...picked().args, input: props.input, motion: props.motion })}
      </box>
    </box>
  );
}
