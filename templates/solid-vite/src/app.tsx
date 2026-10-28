import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";

import { Switch } from "~/components/ui/switch.tsx";

import "./app.css";

/** The example: one copied starter, on the theme, driven by the page. */
export const App = (): JSX.Element => {
  const [checked, setChecked] = createSignal(true);
  return (
    <main class="page">
      <section class="card">
        <h1 class="title">cssints starter</h1>
        <Switch value={checked()} onValueChange={setChecked}>
          {checked() ? "On" : "Off"}
        </Switch>
      </section>
    </main>
  );
};
