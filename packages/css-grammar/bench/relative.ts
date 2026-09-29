import { color } from "../src/api";
color("oklch(from var(--x) l c h)");
color("rgb(from red r g calc(b + 20))");
color("oklch(from #fff calc(l - 0.1) c h / 50%)");
color("contrast-color(red)");
color("if(style(--x: 1): red; else: blue)");
color("var(--x, red)");
