import "virtual:cssints.css";
import { across, down } from "./page.ts";

document.body.style.margin = "0";
// the harness waits for #box on every page: the pointer page keeps one, out of the way
document.body.innerHTML = `
<div id=box style="position:absolute;left:0;top:0;width:1px;height:1px"></div>
<div id=across class="${across}" style="position:absolute;left:100px;top:100px;width:200px;height:100px;background:#3b82f6"></div>
<div id=down class="${down}" style="position:absolute;left:400px;top:100px;width:100px;height:200px;background:#16a34a"></div>`;
