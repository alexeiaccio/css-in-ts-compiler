// `solid/specs/forecast.json`, written from the repository's own `CHANGELOG.md`: its 40 dated release headings are a
// daily series — one or two most days, nine on 2026-10-30, then a taper — and the next week is the trailing fortnight's
// mean. So the `forecast` kind's figure is our own release cadence, and not a sample: a date added or removed in the
// changelog is a rewrite here and a `cmp` in solid/figure-handoff.sh, never a hand-edited number.
//
//   bun native/solid/specs/from-releases.ts            rewrites forecast.json here in place
//   bun native/solid/specs/from-releases.ts <dir>      writes it into <dir> (the check's own way: it writes nothing else)
//
// What is computed, and here and not by hand:
//   — the days: every calendar day from the first release to the last, a count a day, a quiet day a zero (26 days,
//     2026-10-10 to 2026-11-04). A count is a count of headings, so a patch release counts as a release.
//   — the fit: the mean of the **last 14 days** (the window `window` in the data), and their population standard
//     deviation — the spread of the days themselves, not of the estimate.
//   — the projection: the next 7 days at that mean, each with the band `mean ± 1 sd`, its low clamped at zero because a
//     count cannot be negative. A projection of a count, not a promise; the kind prints the window and the fit beside
//     the drawing so a reader can argue with both.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { check } from "../src/figure/spec.ts";

/** The repository, from this file (native/solid/specs). */
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const CHANGELOG = resolve(REPO, "CHANGELOG.md");
/** The window the mean is taken over, in days; and how many days the projection looks ahead. */
const WINDOW = 14;
const HORIZON = 7;
const DAY = 86_400_000;

/** The day after `date` (or `n` days after it), in UTC: the span's gaps and the projection's dates, as `YYYY-MM-DD`. */
const dayAfter = (date: string, n = 1): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** Every `## <version> (<date>)` heading's date, oldest first: one date a release, which is all a count needs. */
function releasedOn(text: string): string[] {
  return [...text.matchAll(/^## \d+\.\d+\.\d+ \((\d{4}-\d{2}-\d{2})\)$/gm)]
    .map((match) => match[1]!)
    .sort();
}

/** The days from the first release to the last: a day a count, the quiet days filled with zeros. */
function dailySeries(dates: readonly string[]): { date: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const date of dates) counts.set(date, (counts.get(date) ?? 0) + 1);
  const days: { date: string; value: number }[] = [];
  const last = dates[dates.length - 1]!;
  for (let date = dates[0]!; date <= last; date = dayAfter(date)) days.push({ date, value: counts.get(date) ?? 0 });
  return days;
}

const dates = releasedOn(readFileSync(CHANGELOG, "utf8"));
if (!dates.length) {
  console.error(
    'CHANGELOG.md has no dated release headings ("## 0.33.0 (2026-11-04)"): a forecast needs the releases it projects.',
  );
  process.exit(1);
}

const samples = dailySeries(dates);
const window = samples.slice(-Math.min(WINDOW, samples.length));
const mean = window.reduce((sum, day) => sum + day.value, 0) / window.length;
const sd = Math.sqrt(window.reduce((sum, day) => sum + (day.value - mean) ** 2, 0) / window.length);
const last = samples[samples.length - 1]!.date;
const projection = Array.from({ length: HORIZON }, (_, i) => ({
  date: dayAfter(last, i + 1),
  value: mean,
  low: Math.max(0, mean - sd),
  high: mean + sd,
}));

const spec = {
  kind: "forecast" as const,
  title: "A release a day, and the next week projected",
  intent:
    "This repository's own release cadence from CHANGELOG.md: the days as columns, then the next 7 at the mean of the " +
    "last 14 with their band. A projection of a count, not a promise.",
  source: "CHANGELOG.md's dated releases; the next 7 at the mean of the last 14 ± 1 sd",
  data: {
    samples,
    projection,
    horizon: HORIZON,
    window: window.length,
    mean,
    sd,
    model: "the mean of the last 14 days, ± 1 population sd, clamped at zero, for the next 7 days",
  },
};

const problems = check(spec);
if (problems.length) throw new Error(`forecast.json would not draw: ${problems.join(" ")}`);

const out = process.argv[2] ? resolve(process.argv[2]) : dirname(fileURLToPath(import.meta.url));
mkdirSync(out, { recursive: true });
const file = resolve(out, "forecast.json");
writeFileSync(file, `${JSON.stringify(spec, null, 2)}\n`);
console.log(
  `from-releases: ${file} (${samples.length} days, ${dates.length} releases, ${spec.data.mean.toFixed(2)} a day over the ` +
    `last ${spec.data.window}, sd ${spec.data.sd}; the next ${HORIZON})`,
);
