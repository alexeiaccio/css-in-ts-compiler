import { supports } from "../src/api-query";
supports("(display: grid)");
supports("not (display: grid)");
supports("(display: grid) and (gap: 1rem)");
supports("((display: flex) or (display: grid))");
supports("(width: 100px)");
supports("(color: red) or (opacity: 0.5)");
// @ts-expect-error no such value
supports("(display: grdi)");
