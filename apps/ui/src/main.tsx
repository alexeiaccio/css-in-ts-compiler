import "virtual:cssints.css";

// The registry theme, compiled: plain custom properties, so a copied component reads the same
// values the demo page does.
import "./registry/theme.css";

import { render } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Switch } from "./registry/switch/switch.tsx";
import { card, page, row } from "./page.ts";

const Page = () => {
  const [checked, setChecked] = createSignal(true);
  return (
    <div class={page}>
      <div class={card}>
        <div class={row}>
          <Switch value={checked()} onValueChange={setChecked}>
            {checked() ? "On" : "Off"}
          </Switch>
        </div>
      </div>
    </div>
  );
};

// The build runs this module to collect its classes, and there it is the server build of Solid, which has no render: only the
// page mounts.
if (!import.meta.env.SSR) {
  render(() => <Page />, document.getElementById("root")!);
}
