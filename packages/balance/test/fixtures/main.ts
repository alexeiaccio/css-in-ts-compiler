// the entry: the runtime once, beside the modules with styles (which the engine evaluates in Node)
import "virtual:cssints.css";
import "../../src/runtime.ts";
import { render } from "./app.ts";

render();
