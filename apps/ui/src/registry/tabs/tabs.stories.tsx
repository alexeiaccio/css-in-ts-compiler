// The tabs' stories: the count is a control, because the skin wraps a long tablist instead of clipping it. The wrapper
// exists because the component takes a render function per tab and per panel, not a list of children.
import type { JSX } from "@solidjs/web";

import type { Meta, Story } from "@cssints/stories";
import { Tabs } from "./tabs.tsx";

interface TabsExampleProps {
  readonly count: number;
  readonly disabledTab: boolean;
  readonly narrow: boolean;
}

const LABELS = ["Overview", "Activity", "Settings", "Billing", "Members"];

const TabsExample = (props: TabsExampleProps): JSX.Element => (
  <Tabs
    items={props.count}
    disabled={props.disabledTab ? [props.count - 1] : []}
    narrow={props.narrow}
    tab={(index) => LABELS[index] ?? `Tab ${index + 1}`}
    panel={(index) => (
      <p class="demo-text">
        The panel of <code>{LABELS[index] ?? `tab ${index + 1}`}</code>. Below the host's narrow
        breakpoint the same selection renders as an accordion — that is the tetra logical pattern,
        not a second component.
      </p>
    )}
  />
);

const meta = {
  title: "Tabs",
  component: TabsExample,
  args: { count: 3, disabledTab: false, narrow: false },
  argTypes: {
    count: { type: "range", min: 1, max: 5, step: 1 },
    disabledTab: { type: "boolean" },
    narrow: { type: "boolean" },
  },
} satisfies Meta<TabsExampleProps>;
export default meta;

export const Three: Story<TabsExampleProps> = {};

export const WithDisabled: Story<TabsExampleProps> = { args: { disabledTab: true } };

// The host measures and passes the breakpoint: here it is the arg, so the narrow rendering is a story of its own.
export const Narrow: Story<TabsExampleProps> = { args: { narrow: true } };
