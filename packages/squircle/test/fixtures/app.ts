import "virtual:cssints.css";
import { bg, cn, height, width } from "cssints" with { type: "cssints" };

import { squircle } from "../../src/index.ts" with { type: "cssints" };

const box = cn(squircle().radius("40px"), bg("#000"), width("240px"), height("160px"));
document.body.innerHTML = `<div id=box class="${box}"></div>`;
