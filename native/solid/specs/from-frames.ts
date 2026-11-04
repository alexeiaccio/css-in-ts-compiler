// `solid/specs/before-after.json`, written from two frames of the Widgets page: the switch off (focused) and on (focused),
// captured the way solid/goldens stores a page's last frame (solid/dump.ts). The tree is the same in both frames, so a
// command's index is the same element, and the numbers a before/after is about are the commands whose fields differ: the
// track's colour and the thumb's x. Nothing in the spec is typed by hand but the two states' captions and the two parts'
// names, and `solid/figure-handoff.test.ts` recomputes the same difference to hold the spec to the frames.
//
//   bun solid/specs/from-frames.ts                  # write solid/specs/before-after.json
//   bun solid/specs/from-frames.ts "$TMPDIR/specs"  # ... or into another directory, for solid/test.sh's cmp
//
// Both frames are taken with the switch focused (`Tab,Tab`) and the second with Space after it, so the focus ring is the
// same command in both and the only fields that move are the two the figure is about.
import "../plugin.ts";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Command, FrameDump } from "../src/dump.ts";
import { check, type BeforeAfterData } from "../src/figure/spec.ts";

/** The keys the off frame is taken with: two Tabs reach the Wi-Fi switch and focus it. */
export const OFF_KEYS = ["Tab", "Tab"] as const;
/** ... and Space toggles it, so the on frame is the same page with one more key. */
export const ON_KEYS = ["Tab", "Tab", "Space"] as const;

/** The two states' captions: the page's own names for a switch's values. */
const CAPTIONS = ["off", "on"] as const;

/** One command that differs between two frames of one page, and the fields that differ. */
export interface Difference {
  index: number;
  fields: string[];
  before: Command;
  after: Command;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Every command whose fields differ, in the frame's order: the tree is the same, so an index is one element. */
export function differencesOf(off: FrameDump, on: FrameDump): Difference[] {
  if (off.commands.length !== on.commands.length)
    throw new Error(
      `the two frames have ${off.commands.length} and ${on.commands.length} commands: one tree is one command stream`,
    );
  return off.commands.flatMap((before, index) => {
    const after = on.commands[index]!;
    const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
      (field) => !same(before[field as keyof Command], after[field as keyof Command]),
    );
    return fields.length ? [{ index, fields, before, after }] : [];
  });
}

/** A colour's three channels as the figure prints them: `60,64,78`, the alpha dropped. */
const rgb = (colour: readonly number[] | undefined) => (colour ?? []).slice(0, 3).map(Math.round).join(",");

/**
 * The before/after data of two frames: the component's box (the command whose colour changed: the switch's track), the
 * colour the two states give it, and the thumb's own offset inside it (`box[0]` of the command whose x moved). Two changes
 * and no more — a page change that moves something else fails here rather than writing a figure about the wrong numbers.
 */
export function dataOf(off: FrameDump, on: FrameDump): BeforeAfterData {
  const differences = differencesOf(off, on);
  const coloured = differences.filter((difference) => difference.fields.includes("color"));
  const moved = differences.filter(
    (difference) => difference.fields.includes("box") && difference.before.box[0] !== difference.after.box[0],
  );
  if (differences.length !== 2 || coloured.length !== 1 || moved.length !== 1)
    throw new Error(
      `the frames differ in ${differences.length} command(s) (${differences
        .map((difference) => `#${difference.index} ${difference.fields.join("+")}`)
        .join(", ")}): the switch's two states are its track's colour and its thumb's x`,
    );
  const track = coloured[0]!;
  const thumb = moved[0]!;
  const width = Math.round(track.before.box[2]);
  const height = Math.round(track.before.box[3]);
  return {
    before: {
      caption: CAPTIONS[0],
      box: { width, height },
      measures: [
        { label: "the track", value: rgb(track.before.color) },
        { label: "the thumb", value: `${Math.round(thumb.before.box[0] - track.before.box[0])}px` },
      ],
    },
    after: {
      caption: CAPTIONS[1],
      box: { width, height },
      measures: [
        { label: "the track", value: rgb(track.after.color) },
        { label: "the thumb", value: `${Math.round(thumb.after.box[0] - track.before.box[0])}px` },
      ],
    },
  };
}

/** The spec, with the two states' numbers and the source of every one of them. */
export function specOf(data: BeforeAfterData) {
  return {
    kind: "beforeAfter" as const,
    title: "The Wi-Fi switch, off and on",
    intent:
      "One component, twice: the track's colour and the thumb's x are the commands that differ between the two stored frames, so the figure's numbers are the page's.",
    source: "solid/specs/from-frames.ts, two frames of the Widgets page's switch",
    data,
  };
}

if (import.meta.main) {
  const { capture } = await import("../dump.ts");
  const off = await capture("widgets", undefined, { keys: [...OFF_KEYS] });
  const on = await capture("widgets", undefined, { keys: [...ON_KEYS] });
  const spec = specOf(dataOf(off, on));
  const problems = check(spec);
  if (problems.length) throw new Error(`before-after.json would not draw: ${problems.join(" ")}`);
  const dir = process.argv[2] ?? new URL(".", import.meta.url).pathname;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "before-after.json"), `${JSON.stringify(spec, null, 2)}\n`);
  const before = spec.data.before;
  const after = spec.data.after;
  console.log(
    `before-after.json: ${before.caption} -> ${after.caption}, the box ${before.box.width}x${before.box.height}, ` +
      `${before.measures.map((measure, i) => `${measure.label} ${measure.value} -> ${after.measures[i]!.value}`).join(", ")}`,
  );
}
