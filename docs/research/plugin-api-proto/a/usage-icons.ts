import { icons } from "./examples/icons.ts";
declare const mdi: { icons: { home: 1; star: 2 }; aliases: { house: 3 } };
const i = icons<typeof mdi>({ provider: "iconify-json", collection: "mdi" });
export const a: string = i("home");
export const b = i("house");
// @ts-expect-error not a name of the collection
i("hom");
const any = icons({ provider: "fs", dir: "./svg" });
export const c = any("whatever");
