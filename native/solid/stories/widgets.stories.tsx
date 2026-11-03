// The native stories: headless parts, drawn by the renderer, wired to the host's input. A story's `render` receives the
// storybook's own `input` (and `motion`) as args — the host's keyboard and pointer are the page's, and a story that needs
// them asks for them by name. The styles are literals rather than `createTokens`: one native process compiles every module
// it imports, and two token sets that declare `--color-surface` stop the build (the pages each declare their own).
import * as css from "cssints/clay" with { type: "cssints" };
import type { Meta, Story } from "../../../packages/stories/src/index.ts";

import { createDisclosure, createSwitch } from "../../headless/src/index.ts";
import { a11y } from "../a11y.ts";
import type { Input } from "../src/input.ts";
import type { Node } from "../src/renderer.ts";

const font = css.fonts("Roboto");
const ink = css.cn(font.Roboto, css.color("rgb(235 235 240)"), css.fontSize(15));
const muted = css.cn(font.Roboto, css.color("rgb(150 155 170)"), css.fontSize(13));
const track = css.cn(
  css.width(56),
  css.height(30),
  css.justifyContent("center"),
  css.alignItems("center"),
  css.borderRadius(15),
  css.bg("rgb(60 64 78)"),
  css.focus(css.border(2, "rgb(90 170 255)")),
);
const trackOn = css.cn(track, css.bg("rgb(240 140 50)"));
const thumb = css.cn(css.width(22), css.height(22), css.borderRadius(11), css.bg("rgb(255 255 255)"));
const trigger = css.cn(
  css.width("stretch"),
  css.p(10, 12),
  css.borderRadius(8),
  css.bg("rgb(36 40 52)"),
  css.hover(css.bg("rgb(48 53 68)")),
  css.focus(css.border(2, "rgb(90 170 255)")),
);
const panel = css.cn(
  css.width("stretch"),
  css.p(10, 12),
  css.borderRadius(8),
  css.bg("rgb(36 40 52)"),
);
const column = css.cn(css.width("stretch"), css.gap(8), css.flexDirection("column"));

const meta = { title: "Widgets" } satisfies Meta<Record<string, unknown>, Node>;
export default meta;

export const Switch: Story<Record<string, unknown>, Node> = {
  render: (args) => {
    const sw = createSwitch({ id: "story-switch" });
    const bind = (args["input"] as Input).add(sw.part);
    return (
      <box style={column}>
        <text style={ink}>A switch</text>
        <text style={muted}>Tab reaches it, Space and Enter flip it.</text>
        <box {...bind} {...a11y(sw.part)} style={sw.checked() ? trackOn : track}>
          <box style={thumb} />
        </box>
      </box>
    );
  },
};

export const Disclosure: Story<Record<string, unknown>, Node> = {
  render: (args) => {
    const more = createDisclosure({ id: "story-disclosure" });
    const bind = (args["input"] as Input).add(more.trigger);
    return (
      <box style={column}>
        <text style={ink}>A disclosure</text>
        <box {...bind} {...a11y(more.trigger)} style={trigger}>
          <text style={ink}>{more.expanded() ? "Close" : "Open"}</text>
        </box>
        {more.expanded() ? (
          <box style={panel}>
            <text style={muted}>The panel shows while the trigger is expanded.</text>
          </box>
        ) : null}
      </box>
    );
  },
};
