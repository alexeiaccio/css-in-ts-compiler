import "virtual:cssints.css";

// The theme of the components and of this page: typed tokens, the dark scope and the contrast gate. (The registry's
// `theme.css` is the same theme compiled for a project without cssints.)
import "./registry/theme.ts";

import { Docs } from "./docs/app.tsx";
import { render } from "@solidjs/web";

// The build runs this module to collect its classes, and there it is the server build of Solid,
// which has no render: only the page mounts.
if (!import.meta.env.SSR) {
  render(() => <Docs />, document.getElementById("root")!);
}
