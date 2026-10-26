import "virtual:cssints.css";

// The registry theme, compiled: plain custom properties, so a copied component reads the same
// values the docs page does.
import "./registry/theme.css";

import { Docs } from "./docs/app.tsx";
import { render } from "@solidjs/web";

// The build runs this module to collect its classes, and there it is the server build of Solid,
// which has no render: only the page mounts.
if (!import.meta.env.SSR) {
  render(() => <Docs />, document.getElementById("root")!);
}
