import "virtual:twoslash.css";
import "virtual:cssints.css";
import "./base.ts";
import "./prose.ts";
import "./landing-styles.ts";
import { render } from "@solidjs/web";
import { html, landing, pages } from "virtual:docs";

import App from "./App.tsx";
import { DocsContext } from "./docs.ts";
import { placeHovers } from "./hovers.ts";

placeHovers();
render(
  () => (
    <DocsContext value={{ pages, html, landing }}>
      <App />
    </DocsContext>
  ),
  document.getElementById("root")!,
);
