// The table's stories: a sortable, selectable table of issues, the header cells announcing the sort and the body a window
// of rows. The primitive owns the sort cycle, the selection and the roving focus; the kit draws the scrollport.
import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { TableColumn, TableSort } from "@cssints/headless";
import type { Meta, Story } from "@cssints/stories";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableScroll,
} from "./table.tsx";

const COLUMNS: ReadonlyArray<TableColumn> = [
  { key: "title", abbr: "Title" },
  { key: "owner", sortable: false },
  { key: "open", numeric: true },
];

const ROWS = ["auth-1", "auth-2", "billing-1", "billing-2", "billing-3", "docs-1"];

const meta = { title: "Table" } satisfies Meta;
export default meta;

export const Issues: Story = {
  render: () => {
    const [sort, setSort] = createSignal<TableSort | null>(null);
    return (
      <TableScroll>
        <Table
          columns={COLUMNS}
          rows={ROWS}
          selection="multiple"
          sort={sort()}
          onSortChange={(next) => setSort(next ?? null)}
          caption="Issues"
          labels={{ selectRow: (id) => `Choose ${id}` }}
        >
          <TableHead>
            {COLUMNS.map((column) => (
              <TableHeaderCell column={column.key}>{column.key}</TableHeaderCell>
            ))}
          </TableHead>
          <TableBody>
            {ROWS.map((id) => (
              <TableRow row={id}>
                {COLUMNS.map((column) => (
                  <TableCell column={column.key}>{`${id} · ${column.key}`}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
    );
  },
};

// A single choice: one row at a time, and the header's own box is not there.
export const SingleChoice: Story = {
  render: () => (
    <TableScroll>
      <Table columns={COLUMNS} rows={ROWS.slice(0, 3)} selection="single" caption="One issue">
        <TableHead>
          {COLUMNS.map((column) => (
            <TableHeaderCell column={column.key}>{column.key}</TableHeaderCell>
          ))}
        </TableHead>
        <TableBody>
          {ROWS.slice(0, 3).map((id) => (
            <TableRow row={id}>
              {COLUMNS.map((column) => (
                <TableCell column={column.key}>{`${id} · ${column.key}`}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScroll>
  ),
};
