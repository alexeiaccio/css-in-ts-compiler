import { balance, pretty } from "../../src/index.ts";

export const a: string = balance();
export const b: string = pretty();
// @ts-expect-error takes no arguments
export const e1 = balance("auto");
// @ts-expect-error takes no arguments
export const e2 = pretty(true);
