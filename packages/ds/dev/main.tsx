import { render } from "@solidjs/web";
import "virtual:cssints.css";

import { Storybook } from "../src/storybook.tsx";

const root = document.getElementById("root") ?? document.body;
render(() => <Storybook />, root);
