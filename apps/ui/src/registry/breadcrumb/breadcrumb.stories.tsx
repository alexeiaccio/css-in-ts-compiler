// The breadcrumb's stories: a navigation landmark of links, the last one the current page. The items are declared once, so
// the landmark, the list and the rows cannot disagree.
import type { Meta, Story } from "@cssints/stories";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "./breadcrumb.tsx";

const ITEMS = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Q3 report", href: "#report" },
];

const meta = { title: "Breadcrumb" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <Breadcrumb items={ITEMS} currentIndex={3}>
      <BreadcrumbList>
        {ITEMS.map((item, index) => (
          <BreadcrumbItem index={index}>
            <BreadcrumbLink index={index}>{item.label}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  ),
};
