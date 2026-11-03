// The timeline's stories: a request's spans as bars on a shared time axis, one row per depth and the error in red. The rows
// are a tree — Left and Right fold a span's children, Enter selects it — and the ruler reads the unit the page passes.
import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Timeline } from "./timeline.tsx";

const SPANS = [
  { id: "request", label: "GET /checkout", start: 0, end: 1, depth: 0, status: "ok" as const },
  {
    id: "auth",
    label: "auth: verify session",
    start: 0.03,
    end: 0.26,
    depth: 1,
    status: "ok" as const,
  },
  {
    id: "db",
    label: "db: SELECT cart",
    start: 0.08,
    end: 0.22,
    depth: 2,
    status: "error" as const,
  },
  {
    id: "render",
    label: "render: checkout page",
    start: 0.55,
    end: 0.97,
    depth: 1,
    status: "unset" as const,
  },
];

const meta = { title: "Timeline" } satisfies Meta;
export default meta;

export const Request: Story = {
  render: () => {
    const [selected, setSelected] = createSignal("request");
    return (
      <Timeline
        spans={SPANS}
        unit="s"
        label="Checkout request"
        selected={selected()}
        onSelect={setSelected}
        hint="The trace is normalised: 1 is the whole request, so the ruler reads seconds of it."
      />
    );
  },
};
