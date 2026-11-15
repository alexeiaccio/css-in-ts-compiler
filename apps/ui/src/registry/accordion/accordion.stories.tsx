// The accordion's stories: `multiple` and `collapsible` are the primitive's, so one boolean control shows what each one
// actually does, and the count is a control because the triggers wrap at narrow widths.
import type { JSX } from "@solidjs/web";

import { For } from "solid-js";
import type { Meta, Story } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };
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

const nativeRoot = css.cn(
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.overflow("hidden"),
);
const nativeItem = css.cn(css.borderBottom("1px solid", t.color.border));
const nativeSummary = css.cn(
  css.padding(t.space._3, t.space._4),
  css.color(t.color.text),
  css.fontSize(t.font.size),
  css.fontWeight("500"),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);
const nativePanel = css.cn(
  css.padding(t.space._3, t.space._4),
  css.color(t.color.muted),
  css.fontSize(t.font.size),
  css.borderTop("1px solid", t.color.border),
);

const NativeAccordion = (props: AccordionExampleProps): JSX.Element => (
  <div class={nativeRoot}>
    <For each={Array.from({ length: props.count }, (_, index) => index)}>
      {(index) => (
        <details
          class={nativeItem}
          name={props.multiple ? `native-${index}` : "native-accordion"}
          open={index === 0}
        >
          <summary class={nativeSummary}>{TRIGGERS[index] ?? `Section ${index + 1}`}</summary>
          <div class={nativePanel}>{PANELS[index] ?? `The panel of section ${index + 1}.`}</div>
        </details>
      )}
    </For>
  </div>
);

// The recipe (docs/hosts.md): one `<details name>` group is the accordion. A shared `name` is the exclusivity (Baseline
// 2024-09-03); `multiple` is a name per section. No primitive. The gap the recipe keeps: `summary` is not heading
// content, so the heading list a screen reader gets is not the APG one.
export const Native: Story<AccordionExampleProps> = {
  render: (args) => <NativeAccordion {...args} />,
};
