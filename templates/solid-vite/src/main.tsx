// The theme arrives with the first component: `add` writes `theme.css` beside it. One import
// here, once, and every copied component reads the same custom properties.
import "./components/ui/theme.css";

import { render } from "@solidjs/web";

import { App } from "./app.tsx";

render(() => <App />, document.getElementById("root")!);
