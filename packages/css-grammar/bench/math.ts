import { fontSize, margin, padding, width } from "../src/api";
width("calc(100% - 2rem)");
width("min(100%, 40rem)");
width("clamp(10rem, 50%, 40rem)");
width("calc((100% - 2 * var(--gap)) / 3)");
padding("calc(1rem + 2px) max(1rem, 2vw)");
margin("calc(-1 * var(--x)) round(up, 1.5px, 1px)");
fontSize("clamp(1rem, 2.5vw, 2rem)");
