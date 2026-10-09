import { pad } from "../button.ts";
import { gap } from "./edit.ts";

// a lazy route: no browser would fetch it before navigating there
export const later = () => import("../bad.ts");
export { gap, pad };
