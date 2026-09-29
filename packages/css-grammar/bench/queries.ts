import { container, media } from "../src/api-query";
media("(width >= 40rem)");
media("(min-width: 40rem)");
media("(prefers-color-scheme: dark)");
media("screen and (min-width: 40rem)");
media("(hover: hover) and (pointer: fine)");
media("(400px <= width <= 700px)");
media("(aspect-ratio: 16/9)");
media("not print");
media("(width >= 40rem)", "(width >= 60rem)");
media({ md: "(width >= 40rem)", lg: "(width >= 60rem)" });
container("sidebar (width < 30rem)");
container("(min-width: 400px) and (max-width: 700px)");
container("style(display: grid)");
container("not (width < 30rem)");
// @ts-expect-error min-width needs parentheses
media("screen and min-width > 40rem");
// @ts-expect-error a range needs its value
media("(width >= )");
