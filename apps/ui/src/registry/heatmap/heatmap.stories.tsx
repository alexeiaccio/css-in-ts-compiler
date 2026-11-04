// The heatmap's stories: a week of requests by hour — the article's own table — and a small one where every cell's share of
// the scale can be counted by eye. The colour is the value, so a different `max` recolours the whole map.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Heatmap, type HeatmapProps } from "./heatmap.tsx";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

const WEEK = [
  {
    label: "Mon",
    values: [
      8, 7, 8, 7, 8, 9, 9, 15, 19, 34, 46, 65, 94, 123, 105, 103, 100, 87, 63, 52, 54, 30, 22, 11,
    ],
  },
  {
    label: "Tue",
    values: [
      7, 7, 8, 9, 8, 9, 11, 14, 23, 30, 45, 68, 101, 110, 111, 115, 95, 72, 67, 57, 44, 35, 20, 13,
    ],
  },
  {
    label: "Wed",
    values: [
      9, 7, 9, 7, 8, 10, 10, 15, 19, 36, 57, 76, 106, 106, 125, 115, 98, 76, 68, 61, 47, 36, 17, 12,
    ],
  },
  {
    label: "Thu",
    values: [
      8, 9, 9, 8, 8, 10, 9, 15, 20, 31, 45, 80, 85, 103, 114, 124, 84, 76, 63, 60, 52, 38, 19, 11,
    ],
  },
  {
    label: "Fri",
    values: [
      8, 9, 9, 7, 8, 8, 10, 15, 23, 32, 45, 72, 92, 114, 134, 118, 97, 79, 65, 47, 53, 37, 22, 13,
    ],
  },
  {
    label: "Sat",
    values: [3, 3, 3, 4, 3, 4, 4, 6, 10, 14, 20, 30, 38, 48, 46, 56, 45, 31, 26, 23, 20, 14, 10, 6],
  },
  {
    label: "Sun",
    values: [4, 4, 3, 3, 4, 4, 5, 6, 9, 18, 24, 30, 44, 43, 54, 58, 48, 37, 26, 23, 19, 17, 9, 6],
  },
];

const meta = {
  title: "Heatmap",
  component: Heatmap,
  args: {
    rows: WEEK,
    columns: HOURS,
    label: "Requests by hour, last week",
    unit: "thousands of requests",
  },
  argTypes: {
    unit: { type: "text" },
    max: { type: "number", min: 1, step: 1 },
  },
} satisfies Meta<HeatmapProps>;
export default meta;

export const Week: Story<HeatmapProps> = {};

// The same numbers on a wider scale: every square is paler, which is what a `max` is for.
export const WiderScale: Story<HeatmapProps> = {
  name: "A wider scale",
  args: { max: 250 },
};

// Two days of four hours, so a reader can check a square against its value.
export const Small: Story<HeatmapProps> = {
  render: () => (
    <div class="demo-column">
      <Heatmap
        label="Deploys by hour"
        unit="deploys"
        columns={["08", "09", "10", "11"]}
        rows={[
          { label: "Monday", values: [0, 4, 8, 2] },
          { label: "Tuesday", values: [1, 2, 3, 4] },
        ]}
      />
      <p class="demo-text">
        `0` is the leftmost colour and `8` the rightmost: the mix is the share of the scale.
      </p>
    </div>
  ),
};

// A gap: a value the page does not have is an empty cell, not a zero.
export const WithGaps: Story<HeatmapProps> = {
  name: "With gaps",
  render: () => (
    <Heatmap
      label="Incidents by hour"
      unit="incidents"
      columns={["08", "09", "10", "11"]}
      rows={[
        { label: "Monday", values: [0, 1, 0, 2] },
        { label: "Tuesday", values: [0, 0, 0, 0] },
      ]}
    />
  ),
};
