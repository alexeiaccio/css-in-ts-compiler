import "virtual:cssints.css";
import "./assets/base.css";
import "./assets/fonts.css";
import { render } from "@solidjs/web";

import App from "./App.tsx";

render(() => <App />, document.getElementById("root")!);
