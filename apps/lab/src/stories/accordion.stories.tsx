import { Accordion, type AccordionItem, type AccordionProps } from "../components/Accordion.tsx";
import type { Meta, Story } from "../csf.ts";

const PANELS: ReadonlyArray<AccordionItem> = [
  {
    title: "What headless means here",
    body: "createAccordion returns state and attribute objects: no elements, no classes. The buttons, the headings and the hidden panels are the host's.",
  },
  {
    title: "Why the trigger knows its state",
    body: "aria-expanded is on the trigger, so the styled class reads it with attr() instead of keeping a second copy of the state.",
  },
  {
    title: "One panel at a time",
    body: "Without multiple, opening a panel closes the other: a request the widget settles, not a rule the styles repeat.",
  },
];

const meta = {
  title: "Accordion",
  component: Accordion,
  args: { items: PANELS, open: [0] },
} satisfies Meta<AccordionProps>;

export default meta;

export const Single: Story<AccordionProps> = {};

export const Multiple: Story<AccordionProps> = { args: { multiple: true, open: [0, 2] } };

export const Collapsed: Story<AccordionProps> = { args: { open: [] } };
