// The bar chart's stories: three series over a day, and the same chart with one series hidden before it is drawn (the
// legend's boxes keep working: the component owns that state when the story does not).
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Bars, type BarsProps } from "./bars.tsx";

const SERIES = [
  { key: "eu", label: "eu-west" },
  { key: "us", label: "us-east" },
  { key: "ap", label: "ap-south" },
];

const CATEGORIES = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

const VALUES = [
  [412, 980, 310],
  [388, 1024, 292],
  [1204, 2410, 866],
  [1480, 3120, 1042],
  [1390, 2870, 1180],
  [820, 1640, 640],
];

const meta = {
  title: "Bars",
  component: Bars,
  args: {
    series: SERIES,
    categories: CATEGORIES,
    values: VALUES,
    label: "Requests by region, last day",
    format: (value: number) => value.toLocaleString("en"),
  },
  argTypes: {
    max: { type: "number", min: 1, step: 100 },
  },
} satisfies Meta<BarsProps>;
export default meta;

export const ByRegion: Story<BarsProps> = {};

// One series starts hidden: its header and its cells are not in the table, so a reader is not given a column of empty cells.
export const HiddenSeries: Story<BarsProps> = {
  name: "Hidden series",
  render: () => (
    <Bars
      label="Requests by region, last day (us-east hidden)"
      series={SERIES}
      categories={CATEGORIES}
      values={VALUES}
      hidden={["us"]}
    />
  ),
};
