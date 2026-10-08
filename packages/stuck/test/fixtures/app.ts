// The page of test/browsers.mjs: a sticky header in the document and one in a scroll container, each with a title that
// is red while the header is stuck. main.js imports the observer and this module.
import "virtual:cssints.css";
import { cn, color, height, overflow } from "cssints" with { type: "cssints" };
import { sticky, stuck } from "@cssints/stuck" with { type: "cssints" };

const header = sticky().top("0");
const title = cn(color("rgb(0, 0, 255)"), stuck(color("rgb(255, 0, 0)")));
const box = cn(height("300px"), overflow("auto"));
const tall = height("2000px");

document.body.innerHTML = `
<div style="height:100px"></div>
<header id="page" class="${header}"><b class="${title}">page</b></header>
<div style="height:100px"></div>
<div id="box" class="${box}">
  <div style="height:50px"></div>
  <header id="inner" class="${header}"><b class="${title}">inner</b></header>
  <div class="${tall}"></div>
</div>
<div class="${tall}"></div>`;
