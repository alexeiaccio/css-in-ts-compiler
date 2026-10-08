import "virtual:cssints.css";
import { box } from "./page.ts";

document.body.style.margin = "0";
document.body.innerHTML = `<div style="height:1000px"></div><div id=box class="${box}" style="height:100px;background:red"></div><div style="height:1000px"></div>`;
