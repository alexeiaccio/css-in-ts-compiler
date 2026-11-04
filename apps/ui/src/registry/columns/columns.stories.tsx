// The column chart's stories: the article's own latency distribution, a small one whose numbers are short, and a flat one
// (where the scale has to be invented, or every bar would divide by nothing).
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Columns, type ColumnsProps } from "./columns.tsx";

const BUCKETS = [
  { label: "0 ms", value: 120 },
  { label: "25", value: 840 },
  { label: "50", value: 2310 },
  { label: "75", value: 3120 },
  { label: "100", value: 2480 },
  { label: "125", value: 1520 },
  { label: "150", value: 830 },
  { label: "175", value: 410 },
  { label: "200", value: 220 },
  { label: "225", value: 130 },
  { label: "250", value: 70 },
  { label: "300+", value: 60 },
];

const meta = {
  title: "Columns",
  component: Columns,
  args: { points: BUCKETS, label: "Requests per 25 ms bucket, last hour" },
  argTypes: {
    max: { type: "number", min: 1, step: 100 },
    height: { type: "text" },
  },
} satisfies Meta<ColumnsProps>;
export default meta;

export const Latency: Story<ColumnsProps> = {};

// A short chart with the numbers spelled out: the value is text above the bar, and `format` is the page's.
export const FewCategories: Story<ColumnsProps> = {
  name: "Few categories",
  render: () => (
    <Columns
      label="Issues by team"
      height="6rem"
      points={[
        { label: "Web", value: 42 },
        { label: "iOS", value: 18 },
        { label: "Android", value: 7 },
        { label: "API", value: 31 },
      ]}
      format={(value) => `${value} open`}
    />
  ),
};

// Every value the same: the scale is one, and the bars stand at the same height instead of collapsing.
export const Flat: Story<ColumnsProps> = {
  render: () => (
    <Columns
      label="Pods per region (all healthy)"
      points={[
        { label: "eu", value: 3 },
        { label: "us", value: 3 },
        { label: "ap", value: 3 },
      ]}
    />
  ),
};
