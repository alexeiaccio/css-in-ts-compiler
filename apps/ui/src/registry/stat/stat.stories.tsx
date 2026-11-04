// The stat tile's stories: the article's own requests tile, a latency tile whose rise is bad news, and a tile with no
// previous value (so no change line). The sign is the component's text, not a `@counter-style` — tried both ways: the browser
// takes the counter (a probe printed "−±+"), but `@counter-style` is an at-rule with no selector and `css.global()` takes a
// selector, so the engine cannot write it. And a pseudo-element's content is not text a reader hears, so the tile would need
// the same sentence in the markup anyway. The chip's tone is `data-tone` and two theme tokens rather than a `color-mix()`:
// a token is in the sheet only when a class uses it, so a mix over `var(--color-…)` strings left both signal colours out.
// The percentage stays CSS — `--pct` is `round((--value / --previous - 1) * 100)` on the element — for a host that prints
// it; the words say it too. The samples are the kit's `Sparkline`, whose caption gives their range in words, so the line is
// not the only place the numbers live: a keyboard reader is told where the series started, ended and turned.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Stat, type StatProps } from "./stat.tsx";

const SAMPLES = [
  1310, 1342, 1330, 1385, 1371, 1420, 1452, 1440, 1498, 1510, 1495, 1530, 1502, 1488, 1515, 1470,
  1462, 1420, 1377, 1350,
];

const LATENCY = [
  150, 152, 149, 160, 155, 175, 153, 152, 158, 170, 165, 180, 185, 172, 160, 154, 162, 158, 171,
  197,
];

const meta = {
  title: "Stat",
  component: Stat,
  args: {
    label: "Requests per second",
    value: 1350,
    previous: 1310,
    unit: "req/s",
    samples: SAMPLES,
    // the article's own formatting: a thousands separator, and the number a reader expects
    format: (value: number) => value.toLocaleString("en"),
  },
  argTypes: {
    value: { type: "number", step: 1 },
    previous: { type: "number", step: 1 },
    unit: { type: "text" },
  },
} satisfies Meta<StatProps>;
export default meta;

export const Default: Story<StatProps> = {
  // a tile is as wide as the cell it is put in; the story gives it a dashboard's
  render: (args) => (
    <div style={{ width: "20rem" }}>
      <Stat {...args} />
    </div>
  ),
};

// The same arithmetic with lower-is-better: 197 against 171 is up 15%, which the tile calls worse.
export const Worse: Story<StatProps> = {
  render: () => (
    <div style={{ width: "20rem" }}>
      <Stat
        label="p95 latency"
        value={197}
        previous={171}
        better={-1}
        unit="ms"
        samples={LATENCY}
      />
    </div>
  ),
};

// No previous value: there is nothing to compare, so there is no change line and no chip.
export const NoPrevious: Story<StatProps> = {
  name: "No previous value",
  render: () => (
    <div class="demo-column" style={{ width: "20rem" }}>
      <Stat label="Deploys today" value={12} unit="deploys" samples={[2, 1, 3, 0, 2, 1, 3, 12]} />
      <p class="demo-text">
        `previous` is left out: the tile says what it is and what it is now, and claims nothing
        about a change.
      </p>
    </div>
  ),
};

// The three tiles side by side, the way a dashboard reads them.
export const Row: Story<StatProps> = {
  render: () => (
    <div class="demo-row">
      <div style={{ width: "20rem" }}>
        <Stat
          label="Requests per second"
          value={1350}
          previous={1310}
          unit="req/s"
          samples={SAMPLES}
          format={(value) => value.toLocaleString("en")}
        />
      </div>
      <div style={{ width: "20rem" }}>
        <Stat
          label="p95 latency"
          value={197}
          previous={171}
          better={-1}
          unit="ms"
          samples={LATENCY}
        />
      </div>
      <div style={{ width: "20rem" }}>
        <Stat label="Healthy services" value={11} previous={11} samples={[12, 12, 8, 12, 11]} />
      </div>
    </div>
  ),
};
