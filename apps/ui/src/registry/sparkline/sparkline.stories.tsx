// The sparkline's stories: the same samples at two scales, and the quiet tone. The line is drawn by the items' own
// segments (no SVG, no canvas), so a different scale changes the angle of every segment and nothing else.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Sparkline, type SparklineProps } from "./sparkline.tsx";

const SAMPLES = [
  1310, 1342, 1330, 1385, 1371, 1420, 1452, 1440, 1498, 1510, 1495, 1530, 1502, 1488, 1515, 1470,
  1462, 1420, 1377, 1350,
];

const meta = {
  title: "Sparkline",
  component: Sparkline,
  args: { label: "Requests per second, the last 20 samples", values: SAMPLES },
  argTypes: {
    tone: { type: "select", options: ["accent", "muted"] },
    height: { type: "text" },
  },
} satisfies Meta<SparklineProps>;
export default meta;

export const Default: Story<SparklineProps> = {};

// The same numbers against a wider axis: the line sits lower and flatter, which is what a shared scale is for.
export const AgainstAWiderAxis: Story<SparklineProps> = {
  name: "Against a wider axis",
  render: () => (
    <div class="demo-column">
      <Sparkline label="Requests per second, one hour" values={SAMPLES} min={0} max={2000} />
      <p class="demo-text">`min: 0, max: 2000` — the same samples, read against the whole range.</p>
    </div>
  ),
};

export const Muted: Story<SparklineProps> = { args: { tone: "muted" } };
