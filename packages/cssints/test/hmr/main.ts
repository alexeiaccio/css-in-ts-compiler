import "cssints/layers.css";

import { button } from "./button";
import { card } from "./card";

document.querySelector("#app")!.innerHTML = `<div class="${card}"><button class="${button}">ok</button></div>`;
