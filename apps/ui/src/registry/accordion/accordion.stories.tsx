// The accordion's stories: `multiple` and `collapsible` are the primitive's, so one boolean control shows what each one
// actually does, and the count is a control because the triggers wrap at narrow widths.
import type { JSX } from "@solidjs/web";

import type { Meta, Story } from "../../stories/csf.ts";
import { Accordion } from "./accordion.tsx";

interface AccordionExampleProps {
  readonly count: number;
  readonly multiple: boolean;
  readonly collapsible: boolean;
}

const TRIGGERS = [
  "What is copied?",
  "What is a dependency?",
  "Why a test?",
  "Does it work without JavaScript?",
];

const PANELS = [
  "The component, its sheet, its fixture and its conformance test. Behaviour stays in npm.",
  "@cssints/headless: the APG state machine, so a fix arrives with npm update.",
  "The same scenarios the release passed, run against your markup.",
  "The styled components are Solid 2 and need the plugin; nothing in them runs on the server.",
];

const AccordionExample = (props: AccordionExampleProps): JSX.Element => (
  <Accordion
    items={props.count}
    defaultValue={[0]}
    multiple={props.multiple}
    collapsible={props.collapsible}
    trigger={(index) => TRIGGERS[index] ?? `Section ${index + 1}`}
    panel={(index) => PANELS[index] ?? `The panel of section ${index + 1}.`}
  />
);

const meta = {
  title: "Accordion",
  component: AccordionExample,
  args: { count: 3, multiple: false, collapsible: true },
  argTypes: {
    count: { type: "range", min: 1, max: 4, step: 1 },
    multiple: { type: "boolean" },
    collapsible: { type: "boolean" },
  },
} satisfies Meta<AccordionExampleProps>;
export default meta;

export const Single: Story<AccordionExampleProps> = {};

export const Multiple: Story<AccordionExampleProps> = { args: { multiple: true } };

// `collapsible: false` is the APG's variant where one panel is always open: the last open one cannot close.
export const AlwaysOpen: Story<AccordionExampleProps> = { args: { collapsible: false } };
