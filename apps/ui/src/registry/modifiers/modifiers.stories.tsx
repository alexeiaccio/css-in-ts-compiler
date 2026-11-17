// The modifiers' stories: the paper's own example — nine films, two ratings and a gross — so a reader can add a `Color`,
// brush it onto the second column, lock one as the input and join the two units into one sequence.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import {
  Modifiers,
  type ModifiersColumn,
  type ModifiersProps,
  type ModifiersRow,
} from "./modifiers.tsx";

const COLUMNS: ReadonlyArray<ModifiersColumn> = [
  { key: "title", label: "Film" },
  { key: "audience", label: "Audience", numeric: true },
  { key: "critics", label: "Critics", numeric: true },
  { key: "gross", label: "Gross, $m", numeric: true },
];

// The nine most-nominated films of a fictional 2026 season: the shape of the paper's Figure 1, with numbers a reader can
// check against the bars.
const FILMS: ReadonlyArray<ModifiersRow> = [
  { id: "anora", cells: { title: "Anora", audience: 91, critics: 88, gross: 41 } },
  { id: "brutalist", cells: { title: "The Brutalist", audience: 78, critics: 87, gross: 15 } },
  { id: "conclave", cells: { title: "Conclave", audience: 84, critics: 82, gross: 33 } },
  { id: "dune", cells: { title: "Dune: Part Two", audience: 95, critics: 92, gross: 282 } },
  { id: "emilia", cells: { title: "Emilia Pérez", audience: 66, critics: 74, gross: 13 } },
  { id: "nickel", cells: { title: "Nickel Boys", audience: 71, critics: 91, gross: 3 } },
  {
    id: "seed",
    cells: { title: "The Seed of the Sacred Fig", audience: 74, critics: 89, gross: 4 },
  },
  { id: "substance", cells: { title: "The Substance", audience: 68, critics: 79, gross: 16 } },
  { id: "wicked", cells: { title: "Wicked", audience: 88, critics: 73, gross: 472 } },
];

const meta = {
  title: "Modifiers",
  component: Modifiers,
  args: {
    rows: FILMS,
    columns: COLUMNS,
    caption: "Oscar hopefuls, 2026: the audience's score, the critics', and the gross",
  },
} satisfies Meta<ModifiersProps>;
export default meta;

export const Films: Story<ModifiersProps> = {};

// One column alone, so the scale is the only thing on screen: the bar is the share, and the number is still the number.
export const OneColumn: Story<ModifiersProps> = {
  name: "One column",
  render: () => (
    <Modifiers
      caption="Gross, in millions of dollars"
      columns={COLUMNS.filter((column) => column.key !== "audience" && column.key !== "critics")}
      rows={FILMS}
    />
  ),
};
