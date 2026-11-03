// The pagination's stories: the page is the host's, so the example owns a signal and writes it from `onPageChange`. A
// control remounts the story, which is what lets `page` arrive: the primitive reads it once, at creation.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import { Pagination, PaginationContent, PaginationStatus } from "./pagination.tsx";

interface PaginationExampleProps {
  readonly page: number;
  readonly pageCount: number;
}

const PaginationExample = (props: PaginationExampleProps): JSX.Element => {
  const [page, setPage] = createSignal(props.page);
  return (
    <Pagination
      page={page()}
      pageCount={props.pageCount}
      labels={{ nav: "Issue pages" }}
      onPageChange={setPage}
    >
      <PaginationContent />
      <PaginationStatus />
    </Pagination>
  );
};

const meta = {
  title: "Pagination",
  component: PaginationExample,
  args: { page: 12, pageCount: 24 },
  argTypes: {
    page: { type: "range", min: 1, max: 24, step: 1 },
    pageCount: { type: "range", min: 3, max: 60, step: 1 },
  },
} satisfies Meta<PaginationExampleProps>;
export default meta;

export const Default: Story<PaginationExampleProps> = {};

// At the first page "Previous" stays in place, painted disabled: the primitive keeps it in the tab order.
export const FirstPage: Story<PaginationExampleProps> = {
  name: "First page",
  args: { page: 1 },
};

export const LastPage: Story<PaginationExampleProps> = {
  name: "Last page",
  args: { page: 24 },
};
