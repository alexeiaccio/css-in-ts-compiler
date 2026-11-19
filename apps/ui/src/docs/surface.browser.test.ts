// The screen's rules, without a page: what a hash may name, and what the catalog refuses. The whole point of the closed
// catalog is that a typo comes back as a problem and not as a silently missing prop, so the cases are the typos.
import { describe, expect, it } from "vite-plus/test";

import { catalogOf, checkScreen, parseScreen, routeOf, screenHash } from "./surface.ts";
import type { Entry } from "@cssints/stories";

const story = (
  id: string,
  args: Record<string, unknown>,
  controls: Record<string, unknown> = {},
): Entry => ({
  id,
  item: id.split("--")[0] ?? "",
  title: "Bars",
  name: "By region",
  args,
  argTypes: controls as Entry["argTypes"],
  view: () => undefined,
});

const ITEMS = [
  { name: "bars", title: "Bars", description: "A bar chart." },
  { name: "card", title: "Card", description: "A frame." },
];

const ENTRIES: ReadonlyArray<Entry> = [
  story(
    "bars--by-region",
    { label: "By region", values: [1, 2], format: (v: number) => `${v}` },
    {
      max: { type: "number" },
    },
  ),
  story("bars--empty", { label: "Nothing" }),
];

describe("catalogOf", () => {
  it("lists every item, the stories it ships, and what each story takes", () => {
    const catalog = catalogOf(ITEMS, ENTRIES);
    expect(catalog.map((entry) => entry.name)).toEqual(["bars", "card"]);
    expect(catalog[1]?.stories).toEqual([]);
    const byRegion = catalog[0]?.stories[0];
    expect(byRegion?.id).toBe("bars--by-region");
    // a function is an arg, not data: the catalog carries the JSON ones and still declares the function's name
    expect(byRegion?.args).toEqual({ label: "By region", values: [1, 2] });
    expect(byRegion?.declares).toContain("format");
    expect(byRegion?.declares).toContain("max");
  });
});

describe("parseScreen", () => {
  it("reads a title and its blocks, and leaves a nameless story to the first", () => {
    const parsed = parseScreen(
      JSON.stringify({
        title: "Health",
        blocks: [{ starter: "bars" }, { starter: "card", story: "card--x" }],
      }),
    );
    expect(parsed.problems).toEqual([]);
    expect(parsed.screen).toEqual({
      title: "Health",
      blocks: [{ starter: "bars" }, { starter: "card", story: "card--x" }],
    });
  });

  it("says why text is not a screen", () => {
    expect(parseScreen("{").problems[0]?.message).toMatch(/^not JSON/);
    expect(parseScreen("[]").problems[0]?.message).toBe("a screen is an object with blocks");
    expect(parseScreen('{"blocks":[]}').problems[0]?.message).toBe("`blocks` is a non-empty array");
    expect(parseScreen('{"blocks":[{"args":{}}]}').problems[0]?.message).toBe(
      "`starter` is a name from the catalog",
    );
    expect(parseScreen('{"blocks":[{"starter":"bars","args":[1]}]}').problems[0]?.message).toBe(
      "`args` is an object",
    );
    expect(parseScreen('{"title":1,"blocks":[{"starter":"bars"}]}').problems[0]?.message).toBe(
      "`title` is a string",
    );
  });
});

describe("checkScreen", () => {
  const catalog = catalogOf(ITEMS, ENTRIES);
  const check = (blocks: ReadonlyArray<unknown>): ReadonlyArray<string> =>
    checkScreen({ blocks: blocks as never }, catalog).map((problem) => problem.message);

  it("accepts what the catalog declares", () => {
    expect(check([{ starter: "bars" }, { starter: "bars", story: "bars--by-region" }])).toEqual([]);
    expect(check([{ starter: "bars", args: { label: "Mine", max: 10 } }])).toEqual([]);
  });

  it("refuses a starter that is not there, and says how many there are", () => {
    expect(check([{ starter: "chart" }])).toEqual(["no starter `chart`: the catalog has 2"]);
  });

  it("refuses a story its starter does not ship", () => {
    expect(check([{ starter: "bars", story: "bars--nope" }])).toEqual([
      "`bars` has no story `bars--nope`: `bars--by-region`, `bars--empty`",
    ]);
    expect(check([{ starter: "card" }])).toEqual(["`card` has no story to draw"]);
  });

  it("refuses an arg the story does not declare, and names the ones it does", () => {
    expect(check([{ starter: "bars", args: { colour: "red" } }])).toEqual([
      "`bars` does not declare `colour`: `label`, `values`, `format`, `max`",
    ]);
  });
});

describe("routeOf and screenHash", () => {
  it("splits the three kinds of hash", () => {
    expect(routeOf("#catalog")).toEqual({ kind: "catalog" });
    expect(routeOf("#sink")).toEqual({ kind: "sink" });
    expect(routeOf("#button--accent")).toEqual({
      kind: "item",
      name: "button",
      story: "button--accent",
    });
    expect(routeOf("#button")).toEqual({ kind: "item", name: "button", story: undefined });
    const screen = { blocks: [{ starter: "bars" }] };
    expect(routeOf(screenHash(screen))).toEqual({
      kind: "screen",
      text: JSON.stringify(screen),
    });
  });
});
