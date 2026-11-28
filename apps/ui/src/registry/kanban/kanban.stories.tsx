import type { Meta, Story } from "@cssints/stories";

import { Kanban } from "./kanban.tsx";
import {
  KANBAN_CARDS,
  KANBAN_COLUMNS,
  KANBAN_LABEL,
  PAIR_CARDS,
  PAIR_COLUMNS,
} from "./kanban.fixture.tsx";

const meta = { title: "Kanban board" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <Kanban cards={KANBAN_CARDS} columns={KANBAN_COLUMNS} label={KANBAN_LABEL} />,
};

export const TwoColumns: Story = {
  name: "Two columns",
  render: () => (
    <Kanban
      cards={PAIR_CARDS}
      columns={PAIR_COLUMNS}
      label="Reading list"
      hint="Drag a card between the two lists, or Space, the arrows and Enter on a focused card."
    />
  ),
};
