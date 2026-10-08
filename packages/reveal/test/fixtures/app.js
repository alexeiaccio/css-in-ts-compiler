import "virtual:cssints.css";
// an app imports "@cssints/reveal/runtime"; the package cannot import itself by name from here
import "../../src/runtime.ts";
import { box } from "./page.ts";

document.body.style.margin = "0";
document.body.innerHTML = `<div style="height:1000px"></div><div id=box class="${box}" style="height:100px;background:red"></div><div style="height:1000px"></div>`;
