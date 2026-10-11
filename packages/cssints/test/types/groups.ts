// The export groups (docs/research/groups.md): what user code sees of cssints/widely-available and of the spec groups.
// `tsgo -p tsconfig.json` checks this file (`bun run typecheck`); the lines with @ts-expect-error must fail.
import { cn as anyCn } from "cssints/css-color-4" with { type: "cssints" };
import * as color4 from "cssints/css-color-4" with { type: "cssints" };
import * as grid2 from "cssints/css-grid-2" with { type: "cssints" };
import * as mq4 from "cssints/mediaqueries-4" with { type: "cssints" };
import * as limited from "cssints/limited-availability" with { type: "cssints" };
import * as not from "cssints/not-discouraged" with { type: "cssints" };
import * as wide from "cssints/widely-available" with { type: "cssints" };
import * as newly from "cssints/newly-available" with { type: "cssints" };

// what a group has works as in "cssints"
export const ok: string[] = [
  wide.display("grid"),
  wide.color("rebeccapurple"),
  wide.color(wide.rgb(1, 2, 3)),
  wide.width("calc(100% - 2rem)"),
  wide.width("100dvh"),
  wide.padding(4),
  wide.p(2),
  wide.gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
  wide.flex().gap("1rem").direction("column"),
  wide.flex(1),
  wide.cn(wide.hover(wide.color("red")), wide.media("(width >= 40rem)")(wide.padding(1))),
  wide.alignItems(wide.firstThatWorks("center", "start")),
  wide.cv({ base: wide.display("flex"), variants: { size: { sm: wide.padding(1) } } })({
    size: "sm",
  }),
  wide.container("sidebar (width >= 20rem)")(wide.padding(1)),
  wide.supports("(display: grid)")(wide.display("grid")),
  color4.color("oklch(0.5 0.1 200)"),
  color4.color(color4.oklch(0.5, 0.1, 200)),
  grid2.gridTemplateColumns("subgrid"),
  mq4.media("(hover: hover) and (width >= 40rem)")(anyCn()),
  limited.display("grid-lanes"),
  anyCn(),
];

// a keyword of the property that is out of the group
// @ts-expect-error grid-lanes is limited availability
wide.display("grid-lanes");
// @ts-expect-error anchor-center is limited availability
wide.alignSelf("anchor-center");
// @ts-expect-error a bad part is named, the others stay as they are
wide.alignSelf("start", "anchor-center");
// a function that is out of the group, as text or as a call
// @ts-expect-error light-dark() is newly available
wide.color("light-dark(white, black)");
// @ts-expect-error contrast-color() is limited availability
wide.color("contrast-color(red)");
// @ts-expect-error in a fallback too
wide.color(wide.firstThatWorks("red", "contrast-color(red)"));
// @ts-expect-error in the arguments of a function
wide.rgb(1, 2, 3, "/", "round(1, 2)");
// a unit
// @ts-expect-error rch is limited availability
wide.width("10rch");
// @ts-expect-error in a calc too
wide.width("calc(100% - 4rch)");
// a media feature, and a query function
// @ts-expect-error prefers-reduced-data is limited availability
wide.media("(prefers-reduced-data: reduce)");
// @ts-expect-error style() queries are newly available
wide.container("style(--x: 1)");
// @ts-expect-error a bad query is still a bad query
wide.media("(width >= )");
// the chain methods of a layout
// @ts-expect-error a keyword of a chain method
wide.flex().alignItems("anchor-center");
// a spec group bans what only the later levels of its series define
// @ts-expect-error color-mix() is CSS Color 5
color4.color("color-mix(in srgb, red, blue)");
// @ts-expect-error prefers-color-scheme is Media Queries 5
mq4.media("(prefers-color-scheme: dark)");
// a member the group does not have
// @ts-expect-error animation-timeline is not widely available
wide.animationTimeline("scroll()");
// @ts-expect-error opacity is not in CSS Grid 2
grid2.opacity(0);
// @ts-expect-error oklch() is not a member of Media Queries 4
void mq4.oklch;
// the grammar is checked first
// @ts-expect-error not a display
wide.display("flexx");
// @ts-expect-error not a width
wide.width("red");

// the other Baseline groups
export const more: string[] = [newly.display("grid"), newly.anchorName("--a"), not.display("grid")];
// @ts-expect-error element() is limited availability
newly.backgroundImage("element(#a)");
// @ts-expect-error blink is discouraged
not.textDecorationLine("blink");
