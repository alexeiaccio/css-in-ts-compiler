import { parseSelector } from "./src/parser/index.js";

console.log(JSON.stringify(parseSelector("::before"), null, 2));
